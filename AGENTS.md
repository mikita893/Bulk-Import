# Bulk Import: zasady wspólnego wydania

- Rozwijaj jedną grę ze wspólnym menu kampanii solo, kooperacji i VS; minigry umieszczaj wewnątrz kampanii.
- Bird Game 3 jest minigrą w głównym terminalu na statku kampanii, otwieranym z bliska klawiszem E. Nie dodawaj jej jako osobnego trybu, kafelka ani skrótu w menu startowym lub na paskach narzędzi.
- Po każdej zmianie gry zwiększ główny numer wersji w `package.json` i wygeneruj przez `npm run build:client` nowy `Bulk-Import-vN.html`. Zachowuj wcześniejsze pliki wydań.
- Przy każdym nowym wydaniu aktualizuj `CHANGELOG.md`: najnowszy wpis na górze, numer i data wydania, link do wersjonowanego HTML, nowe funkcje, poprawki oraz zgodność zapisów. Synchronizuj changelog także do `dev/readable-source`. W odpowiedzi dla użytkownika podawaj krótką listę zmian oraz linki do HTML i changeloga. Same uzupełnienia dokumentacji istniejącego wydania nie wymagają nowego numeru gry.
- Ten sam HTML ma działać przez `file://` oraz na serwerze. Plik lokalny musi zawierać kampanię, minigry i wszystkie zasoby; opcje sieciowe mają być wyłączone i opisane. Nie otwieraj WebSocketów ani nie pobieraj konfiguracji w trybie plikowym.
- Źródła kampanii są w `campaign/`, menu i multiplayera w `multiplayer/`, minigier w `minigames/`, a Three.js w `vendor/`. Nie traktuj starych wygenerowanych HTML jako źródeł do kolejnych wydań.
- Numer i nazwę bieżącego wydania odczytuj przez `release.cjs`. Serwer Node, adapter Cloudflare i strona startowa mają prowadzić do tego samego pliku.
- Zachowuj zgodność zapisów kampanii solo i kooperacji. Zmiana numeru wydania gry nie oznacza zmiany formatu zapisu. Zachowuj dotychczasowe klucze localStorage i import JSON.
- Sprawdzaj nowe wydanie zarówno jako pobrany plik bez pozostałych plików repozytorium, jak i przez serwer z rzeczywistymi klientami multiplayer. Aktualizuj testy bieżącego wydania.

- Gwintforce uruchamiaj wyłącznie z głównego terminala kampanii; sklep kart pozostaje częścią zbrojowni. Kolekcja jest opcjonalnym rozszerzeniem zapisu solo w formacie 10. Starsze zapisy otrzymują zestaw startowy.
- Utrzymuj równolegle `dev/readable-source`: po zmianach gry scal do niej bieżące wydanie, sformatuj własne źródła i uruchom testy. Nie formatuj bibliotek vendor ani archiwalnych HTML. Zachowuj czytelne nazwy, komentarze opisujące mechaniki i instrukcję dla developera. Wydawaj jeden wspólny numer gry, a nie osobną grę na tej gałęzi.
