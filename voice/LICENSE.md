# Polish prerecorded voices

These are synthetic fictional character performances, generated locally with
Piper Polish models through **sherpa-onnx 1.12.26** (Apache-2.0). No actor recordings
or cloned celebrity voices are used. Marc's game voice is fictional.

Models are `pl_PL-darkman-medium` and `pl_PL-gosia-medium`, int8 distributions
from the [official sherpa-onnx TTS model releases](https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models).
Their bundled model cards identify [OHF Voice datasets](https://github.com/OHF-Voice/voice-datasets)
and **CC0**. Unmodified cards are retained in `voice/models/`. The model weights and
inference engine are not distributed in the game or required at runtime.

Generated MP3 recordings in `voice/clips/` are dedicated to the public domain under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
This dedication concerns the audio recordings; dialogue text retains the project's terms.

Regeneration: install `sherpa-onnx==1.12.26` and ffmpeg/ffprobe, extract the two
`vits-piper-pl_PL-*-medium-int8.tar.bz2` archives to a directory, then run:

```sh
python scripts/generate-voices.py --model-root /path/to/models
```

`voice/catalog.cjs` collects the actual NPC dialogue and event lines from
`campaign/dialogues.js`. Existing clips are reused by content/profile ID. If voice
profiles or pronunciation rules change, increment `profileVersion` in the catalogue.
Normal builds only validate and embed the finished recordings; they do not download
models, invoke speech synthesis, contact APIs, or require credentials.
