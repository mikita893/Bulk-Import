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

- Changelog dla użytkownika podawaj w krótkim bloku tekstowym do skopiowania: numer wersji i maksymalnie 4 krótkie punkty.
- Hosting alwaysdata: wdrażaj przez `.github/workflows/alwaysdata.yml` po pushu na `feature/bulk-import-unified-v13`. `dev/readable-source` nie publikuje drugi raz. Instrukcja: `docs/ALWAYSDATA-SETUP.md`. Dane dostępowe należą do GitHub Secrets/Variables; nie zapisuj ich w kodzie ani nie proś o wklejanie do czatu. Zmiana samej infrastruktury wdrażania nie tworzy nowej wersji gry ani nowego HTML.

- CSV Double jest zagnieżdżone w Bird Game 3: wejście tylko przyciskiem wewnątrz ptasiej minigry, powrót do tej samej areny. Nie dodawaj osobnego kafelka w menu głównym ani skrótu w terminalu kampanii.
- Publikowanie na alwaysdata jest wstrzymane na prośbę użytkownika (`deploy/alwaysdata/settings.json`, `paused: true`). Aktualizuj i pushuj repozytorium oraz wersjonowany HTML, ale zachowuj pauzę do czasu wyraźnego wznowienia wdrożenia przez użytkownika.

- Publiczna wersja solo korzysta z GitHub Pages: gałąź `feature/bulk-import-unified-v13`, folder `/docs`. `npm run build:client` musi też generować `docs/index.html` przez `deploy/pages/build.cjs`. Zachowuj stały URL, oryginalny HTML do pobrania i lokalny tryb w ramce srcdoc (bez WebSocketów). Sama konfiguracja hostingu nie zwiększa numeru gry. Szczegóły: `docs/GITHUB-PAGES.md`; kontrola: `npm run test:pages`. Włączenie Pages w panelu to jednorazowa czynność właściciela; nie twierdź, że strona działa, zanim potwierdzisz publikację.

- Multiplayer CSV Double jest przygotowany, ale ma pozostać domyślnie wyłączony na prośbę użytkownika. Serwer Node/Workers wymaga jawnego `BULK_DOUBLE_MULTIPLAYER=1`; nie ustawiaj tej flagi w konfiguracji wdrożenia bez wyraźnego polecenia uruchomienia. GitHub Pages i lokalny HTML zawsze pozostają w solo. Multiplayer CSV Double otwiera się wyłącznie z istniejącej minigry. Reguły oraz serwer w `server/double-*.cjs`, klient w `minigames/symbol-network.js`; sprawdzaj prywatność kart, serwerowe kary, powrót po rozłączeniu i zgodność zapisu.

- Sudoku jest zagnieżdżone wyłącznie w CSV Double. Nie dodawaj osobnego kafelka ani skrótu w terminalu. Na czas Sudoku zatrzymuj lokalną partię CSV Double (wejście, zegar, boty i kary); po powrocie zachowuj ten sam model i wymagaj ręcznego wznowienia wcześniej trwającego meczu. Z aktywnego pokoju online nie wolno otwierać Sudoku. Postęp Sudoku zapisuj osobno pod `bulk-import-sudoku-v1`, bez zmian formatów kampanii i minigier. Nowe plansze muszą mieć jedno rozwiązanie; testuj zagnieżdżenie, zapis i wersję Pages.
