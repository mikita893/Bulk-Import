# v22: polski dubbing z gotowych nagrań

## Obsada i zakres

Kampania solo zawiera **182 nagrania, około 12 minut 22 sekund mowy**: wszystkie kwestie otwierające sceny Vaela i Syry oraz odpowiedzi NPC na wybory gracza, powitania i szczególne rozmowy o relacjach. Kwestie wybierane przez gracza pozostają tekstem. Dubbing obejmuje też wybrane zdarzenia Zwiastuna, obu form Excela, wsparcie hologramu Marca i komunikaty komputera statku. Minigry i kampania multiplayer zachowują dotychczasowe audio.

Głosy wygenerowano lokalnie przez Piper / sherpa-onnx z polskich modeli `darkman` i `gosia`. Sześć profili różni się głosem bazowym, tempem, wysokością i filtrami: Vael jest niższy, Syra klarowna, Excel bardziej nosowy i elektroniczny, Zwiastun głęboki z krótkim echem, Marc jaśniejszy i energiczny, komputer statku ma pasmo radiowe. Głos Marca jest fikcyjny. Źródła i karty modeli CC0: [voice/LICENSE.md](voice/LICENSE.md).

## Sterowanie i tekst

**DUBBING** na górnym pasku kampanii otwiera wyłącznik, suwak głośności oraz odsłuch obsady. Zamknięcie ustawień przywraca poprzedni panel i jego przyciski, również ekran startowy lub bieżącą rozmowę. W dialogach są przyciski powtarzania i pomijania głosu. Nowa scena przerywa poprzednią kwestię; po wyborze odpowiedzi słychać właściwą reakcję NPC. Powtarzanie nie nalicza ponownie przychylności ani zaufania.

Tekst rozmów i reakcji pozostaje widoczny również przy wyłączonym dźwięku. Podczas komunikatów głosowych w walce dodatkowy pasek pokazuje faktycznie odtwarzaną kwestię i rozmówcę. Pomoc Marca ma wyższy priorytet od żartów Excela. Nie są odczytywane wszystkie powtarzane techniczne powiadomienia.

Główny wyłącznik dźwięku kampanii wycisza też dubbing. Pauza, zmiana panelu i opuszczenie kampanii zatrzymują głos i kolejkę. Ukrycie karty wstrzymuje odtwarzanie, a powrót może je wznowić, jeśli nie zakończono wcześniej sceny. Blokada automatycznego odtwarzania nie blokuje gry; przycisk powtórzenia pozwala ponowić próbę po kliknięciu.

## Plik offline i koszt działania

Gotowe MP3 (mono, 22,05 kHz, 48 kb/s) i ich metadane są osadzane raz w zewnętrznej powłoce tego samego HTML. Kampania korzysta z tej paczki, bez kopiowania jej do dokumentu iframe. Odtwarzacz ma jeden element audio, maksymalnie dwie oczekujące kwestie i cache sześciu adresów Blob. Rozpakowuje wyłącznie odtwarzane nagrania. Nie dekoduje całej kolekcji przy starcie i nie tworzy instancji audio co klatkę. Usuwa stare adresy Blob przy wymianie cache i zamknięciu.

Nie ma Web Speech API, pobierania głosów, tokenów, abonamentów ani połączeń z serwerem TTS w grze. Narzędzia generacji są potrzebne wyłącznie developerowi, gdy zmienia teksty. Builder kontroluje identyfikatory, kompletność i SHA-256 nagrań. Instrukcja generacji i rozdzielenie licencji tekstu/audio znajdują się w `voice/LICENSE.md`.

## Zapis i sprawdzanie

Ustawienia `{enabled, volume}` zapisują się osobno pod **`bulk-import-dubbing-v1`**. Niedostępny localStorage nie blokuje odtwarzania w bieżącej sesji. Format kampanii pozostaje 10, wszystkie klucze zapisów i minigry są zachowane. Stare HTML pozostają bez zmian. `Bulk-Import-v22.html` i publiczna strona solo korzystają z tych samych nagrań. Multiplayer CSV Double nadal jest wyłączony; alwaysdata pozostaje wstrzymane.

`tests/dubbing.test.cjs` sprawdza kompletny katalog, sumy nagrań, pojedynczy kanał, kolejkę, wygasanie zdarzeń, priorytety, mute, ustawienia, cache, czyszczenie i blokady autoplay. `tests/dubbing-browser.cjs` dekoduje wszystkie 182 rzeczywiste MP3 i sprawdza ich czas oraz niezerowy sygnał. Testuje także postęp odtwarzania w standalone HTML bez ruchu sieciowego, wszystkie profile, rozmowę i reakcję na wybór, powtarzanie/pomijanie, priorytet Marca, pauzę, wyciszenie, powrót z ustawień, telefon i zapis preferencji po przeładowaniu. Pozostałe testy obejmują kampanię, zapis, minigry, multiplayer i Pages.
