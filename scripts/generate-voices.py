"""Build prerecorded Polish dialogue. Runtime browsers need neither Python nor TTS.

python -m pip install sherpa-onnx==1.12.26
python scripts/generate-voices.py --model-root /path/to/extracted/models
Models: see voice/LICENSE.md. ffmpeg/ffprobe must be installed.
"""
import argparse
import array
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import wave

import sherpa_onnx

ROOT = Path(__file__).resolve().parents[1]
PROFILES = {
    "hero": ("darkman", 1.03, "highpass=f=100,equalizer=f=1300:t=q:w=1:g=1"),
    "vael": ("darkman", .97, "asetrate=22050*0.92,aresample=22050,atempo=1.087,highpass=f=85,equalizer=f=220:t=q:w=1:g=2"),
    "syra": ("gosia", 1.04, "highpass=f=90"),
    "excel": ("darkman", 1.09, "asetrate=22050*1.12,aresample=22050,atempo=0.893,highpass=f=240,tremolo=f=19:d=0.12"),
    "reaper": ("darkman", .96, "asetrate=22050*0.78,aresample=22050,atempo=1.282,highpass=f=65,aecho=0.8:0.5:55:0.22"),
    "marc": ("darkman", 1.08, "highpass=f=110,equalizer=f=1800:t=q:w=1:g=2"),
    "ship": ("gosia", 1.02, "highpass=f=180,lowpass=f=6500"),
}
PRONUNCIATIONS = {
    "Salesforce": "Selsfors", "Excela": "Ekscela", "Excel": "Ekscel",
    "CSV": "ce es fał", "API": "ej pi aj", "KPI": "kej pi aj",
    "CV": "ce fał", "ID": "aj di", "SQL": "es kju el",
    "permission sety": "permiszyn sety", "permission seta": "permiszyn seta",
    "permission set": "permiszyn set", "rollbacków": "rolbaków",
    "rollback": "rolbak", "deployment": "diplojment", "workflowach": "łorkflołach",
    "workflowem": "łorkflołem", "workflow": "łorkfloł", "lookupem": "lukapem",
    "dashboardzie": "daszbordzie", "dashboardu": "daszbordu", "dashboard": "daszbord",
    "sandboxa": "sandboksa", "sandbox": "sandboks", "backupem": "bekapem",
    "backupu": "bekapu", "backup": "bekap", "hard delete": "hard dilit",
    "batch size": "bacz sajz", "taska": "taska", "ticket": "tiket",
    "governor limits": "gawernor limits", "shared_admin": "szerd admin",
    "voicemail": "wojs mejl", "post-mortem": "post mortem", "Dreamforce": "Drimfors",
    "Trailblazer": "Trejlblejzer", "ZIPsert": "zipsert", "Vael": "Wael",
    "Prothean": "Protean", "Successfully Upserted": "saksesfuli apserted",
}

def pronounce(text):
    for source, target in sorted(PRONUNCIATIONS.items(), key=lambda x: -len(x[0])):
        text = re.sub(r"(?<!\w)" + re.escape(source) + r"(?!\w)", target, text, flags=re.I)
    return text.replace("„", "").replace("”", "")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-root", type=Path, required=True)
    args = parser.parse_args()
    catalog = json.loads(subprocess.check_output(["node", "voice/catalog.cjs"], cwd=ROOT))
    manifest = {"schema": 1, "profileVersion": catalog["profileVersion"], "engine": "sherpa-onnx 1.12.26 / Piper Polish int8", "clips": []}
    engines = {}
    for index, row in enumerate(catalog["clips"]):
        voice, speed, filters = PROFILES[row["speaker"]]
        folder = args.model_root / f"vits-piper-pl_PL-{voice}-medium-int8"
        if voice not in engines:
            config = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
                vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(folder / f"pl_PL-{voice}-medium.onnx"), tokens=str(folder / "tokens.txt"), data_dir=str(folder / "espeak-ng-data")),
                num_threads=2), max_num_sentences=2)
            if not config.validate():
                raise ValueError("Invalid model configuration: " + voice)
            engines[voice] = sherpa_onnx.OfflineTts(config)
        relative = "clips/" + row["id"] + ".mp3"
        output = ROOT / "voice" / relative
        if not output.exists():
            audio = engines[voice].generate(pronounce(row["text"]), sid=0, speed=speed)
            if audio.sample_rate <= 0 or len(audio.samples) < 100:
                raise ValueError("Empty speech: " + row["id"])
            with tempfile.TemporaryDirectory(prefix="bulk-voice-") as temp:
                wav = Path(temp) / "raw.wav"
                with wave.open(str(wav), "wb") as writer:
                    writer.setparams((1, 2, audio.sample_rate, 0, "NONE", "not compressed"))
                    writer.writeframes(array.array("h", (max(-32767, min(32767, int(x * 32767))) for x in audio.samples)).tobytes())
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-af", filters + ",loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=0.08", "-ar", "22050", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "48k", "-map_metadata", "-1", str(output)], check=True)
        duration = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(output)]))
        manifest["clips"].append({**row, "file": relative, "duration": round(duration, 3), "sha256": hashlib.sha256(output.read_bytes()).hexdigest()})
        print(f"{index+1}/{len(catalog['clips'])} {row['id']} {duration:.1f}s", flush=True)
    (ROOT / "voice/manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print("TOTAL", round(sum(c["duration"] for c in manifest["clips"])), "seconds")

if __name__ == "__main__":
    main()
