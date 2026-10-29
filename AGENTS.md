# Bulk Import: zasady wspólnego wydania

- Rozwijaj jedną grę ze wspólnym menu: kampania solo, kooperacja, VS i minigry.
- Po każdej zmianie gry zwiększ główny numer wersji w `package.json` i wygeneruj przez `npm run build:client` nowy `Bulk-Import-vN.html`. Zachowuj wcześniejsze pliki wydań.
- Ten sam HTML ma działać przez `file://` oraz na serwerze. Plik lokalny musi zawierać kampanię, minigry i wszystkie zasoby; opcje sieciowe mają być wyłączone i opisane. Nie otwieraj WebSocketów ani nie pobieraj konfiguracji w trybie plikowym.
- Źródła kampanii są w `campaign/`, menu i multiplayera w `multiplayer/`, minigier w `minigames/`, a Three.js w `vendor/`. Nie traktuj starych wygenerowanych HTML jako źródeł do kolejnych wydań.
- Numer i nazwę bieżącego wydania odczytuj przez `release.cjs`. Serwer Node, adapter Cloudflare i strona startowa mają prowadzić do tego samego pliku.
- Zachowuj zgodność zapisów kampanii solo i kooperacji. Zmiana numeru wydania gry nie oznacza zmiany formatu zapisu. Zachowuj dotychczasowe klucze localStorage i import JSON.
- Sprawdzaj nowe wydanie zarówno jako pobrany plik bez pozostałych plików repozytorium, jak i przez serwer z rzeczywistymi klientami multiplayer. Aktualizuj testy bieżącego wydania.
