# Bulk Import v13: jedna gra, dwa sposoby uruchomienia

Gałąź `feature/bulk-import-unified-v13` powstała z aktualnej gałęzi multiplayer. Weryfikacja merge potwierdziła, że gałąź solo `feature/bulk-import-omega-3d-v5` jest już jej przodkiem. Nowe wydanie zachowuje oba zestawy mechanik i nie zmienia poprzednich plików HTML.

## Dystrybucja i źródła

Aktualnym artefaktem jest **Bulk-Import-v13.html**, około 1 MB. Zawiera wszystkie skrypty, Three.js wraz z licencją MIT, pełną kampanię i minigrę. Nie wymaga osobnego pliku kampanii ani pobierania zasobów z CDN.

- `release.cjs` odczytuje wersję z `package.json` i wskazuje nazwę HTML. Korzystają z niego budowanie, serwer Node, Cloudflare i testy.
- `campaign/` zawiera edytowalny szablon, style i skrypt pełnej kampanii. Źródła wydzielono z v10; starsze wygenerowane HTML pozostają archiwum, nie zależnością budowania.
- `multiplayer/` zawiera wspólne menu, kontroler trybów, istniejący renderer oraz autorytatywny silnik multiplayer.
- `minigames/` zawiera Bird Game 3.
- `vendor/` zawiera osadzoną bibliotekę Three.js 0.160.1 oraz informację licencyjną.

`npm run build:client` tworzy nowy wersjonowany HTML i przekierowanie `index.html`. `npm run build:cloudflare` pakuje ten sam artefakt. Zasada kolejnych wspólnych wydań i zachowania archiwum jest zapisana w `AGENTS.md`.

## Tryb lokalny i sieciowy

Kontroler uznaje `file://` i inne dokumenty poza HTTP/HTTPS za tryb lokalny. Kooperacja, VS, wpisywanie kodu i dołączanie są wyłączone natywnym atrybutem `disabled`, z opisem powodu. Funkcje łączenia i wysyłania dodatkowo sprawdzają ten warunek. Plik nie otwiera WebSocketów i nie pobiera `/api/config`.

Na HTTP/HTTPS opcje sieciowe odblokowują się po powitaniu od serwera. Kampania i arcade działają również wtedy, gdy serwer multiplayer jest chwilowo niedostępny. Istniejące równoważne zestawy Salesforce/Excel, kooperacja, checkpointy, reconnect i reset sekwencji wejścia pozostają zachowane.

Kampania działa w dokumencie `srcdoc` osadzonym wewnątrz tego samego HTML. Oddzielny zakres DOM i JavaScript zapobiega kolizjom identyfikatorów, sterowania i stanu dwóch silników; nie jest to odnośnik do drugiego pliku gry. Biblioteka Three.js wypełnia dokument kampanii z już osadzonego skryptu. Postęp korzysta z magazynu nadrzędnego dokumentu i dotychczasowych kluczy.

Renderer multiplayer powstaje dopiero przy wejściu do gry sieciowej. Podczas solo i arcade przestaje renderować, a nieużywane połączenie sieciowe jest zamykane. Kampania za minigrą ma zatrzymaną symulację i renderowanie. Powrót do menu zapisuje kampanię i usuwa jej ramkę. Z aktywnego pokoju trzeba najpierw jawnie wyjść; przycisk innego trybu nie porzuca współgraczy.

## Bird Game 3: Gołąb API

Autorska zręcznościowa minigra pokładowa, dostępna z głównego menu i przyciskiem na statku. Nie dodaje przewagi ani nagród do kampanii i VS.

- Lot między kolumnami arkusza i przez retranslatory, z proceduralnym tłem, ptakiem, animacją i dźwiękami. Grafika Canvas 2D nie tworzy następnego kontekstu WebGL.
- Spacja, strzałka w górę albo dotknięcie unoszą ptaka. P / Escape pauzują. Zmiana karty i utrata fokusu również zatrzymują grę.
- Trzy życia, krótka ochrona po trafieniu, bez naliczania punktu za nieudany przelot. Zebranie sześciu CSV przywraca jedno życie do limitu trzech.
- Sandbox: 215 jednostek/s, otwór 206. Od 5 udanych importów Produkcja: 250 i 190. Od 12 Governor Limits: 280 i 178. Przeszkody pozostają w osiągalnym zakresie wysokości.
- Symulacja ma krok 1/120 s i ograniczoną pracę po długiej przerwie. Pauza nie zmienia fizyki, pozycji ani prędkości.
- Rekord jest walidowany i zapisany osobno pod `bulk-import-bird-game-3-v1`. Blokada pamięci nie uniemożliwia grania; UI informuje o zapisie wyłącznie w bieżącej sesji.
- Automat na statku odrzuca uruchomienie podczas walki. Po arcade wracasz do tej samej kampanii; otwarte menu pauzy pozostaje poprawnie obsługiwane.

## Zgodność zapisów

Numer wydania HTML **13** jest niezależny od formatów danych. Solo zachowuje format **10**, klucz `bulk-import-omega-3d-v10`, migracje wcześniejszych kampanii i import JSON v8/v9/v10. Kooperacja zachowuje format **1** i klucz `bulk-import-coop-v11`, więc dane z multiplayer v11/v12 pozostają czytelne. Bird Game 3 ma niezależny rekord.

Przeglądarki mogą oddzielać localStorage różnych plików i adresów. Do przeniesienia kampanii z wcześniejszego lokalnego HTML na nowe wydanie albo serwer służy eksport/import JSON. Restart hostingu usuwa aktywne pokoje w RAM; checkpoint kooperacji zachowuje postęp misji i ulepszenia.

## Weryfikacja

Testy silnika, zestawów frakcji, balansu, transportu, pokoi i Bird Game 3 obejmują 40 przypadków. Dotychczasowe walidatory pełnej kampanii oraz timing 5–60 FPS są wykonywane na dokumencie kampanii rzeczywiście osadzonym w nowym HTML. Test minigry obejmuje wszystkie trzy etapy, kolizje, niewrażliwość, życie, jednorazowe punkty, CSV i brak zmian na pauzie.

Testy Chromium obejmują wspólne menu, samodzielny dokument, wyłączoną sieć, prawdziwy lot klawiaturą i pauzę, pełną kampanię 3D i ruch, zamrożenie za arcade, powrót, pobranie JSON, import i kontynuację przy zachowanych relacjach, trwały rekord, widok mobilny oraz istniejące dwa klienty VS i kooperacji. Zarządzany Chromium w tym środowisku blokuje bezpośrednie nawigacje `file://`; test wtedy odczytuje jedyny skopiowany HTML i otwiera go w pustym dokumencie bez sieci. Polityka administratora nie jest zmieniana. Nie jest to deklaracja bezpośredniego testu nawigacji `file://` w tej zarządzanej przeglądarce.

Adapter Cloudflare jest sprawdzany lokalnie przez workerd. Nie tworzono Codespace ani nowego zewnętrznego wdrożenia. Dotychczasowa konfiguracja Start/Stop pozostaje dostępna na nowej gałęzi. Ochrona wspólnym hasłem nie wchodzi w zakres tego wydania.
