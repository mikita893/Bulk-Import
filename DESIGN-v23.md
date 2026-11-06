# v23: postacie na kartach, Metro Import 3D i głos komandora

## Gwintforce

Wszystkie 49 kart pokazuje malowane portrety ludzi, kosmitów i stworów. Dotychczasowy SVG z wielokątami i symbolem został zastąpiony ilustracjami, także na planszy, w ręce i kolekcji. Rywale mają portrety. Atlas 4×4 zawiera szesnaście archetypów; warianty powiązanych kart mogą pokazywać tę samą postać. Opisy, moc, reguły, ceny i zapis kolekcji pozostają takie same.

`assets/cards/portraits.webp` jest osadzony w CSS tego samego HTML. `minigames/cards-art.js` przechowuje mapowanie kafelków. Karty nie powielają danych obrazu w DOM i nie pobierają assetów z sieci. Większe pole ilustracji pozostawia czytelne nazwy oraz zdolności. Tekstowe etykiety kart zachowują dostępność.

## Metro Import: Ucieczka przed Audytem

Droga wejścia: **terminal statku → Bird Game 3 → CSV Double → Sudoku → ukończenie → Metro Import 3D**. Po nowym ukończeniu Sudoku ekran minigry otwiera się automatycznie po 0,9 s. Bieg rozpoczyna się przyciskiem, żeby gracz zdążył poznać sterowanie. Ukończone starsze zapisy Sudoku także mają przycisk wejścia. Nie ma nowego trybu w menu głównym ani dodatkowego terminala.

To własna gra inspirowana mechaniką biegów po trzech torach. Komandor ucieka przed audytem przez futurystyczne metro. Omija pociągi Excel Express, przeskakuje skrzynie, ślizga się pod limitami API i zbiera CSV. Prędkość rośnie od 16 do 32 m/s; trzy trafienia kończą bieg. Skok nie może być ponowiony w powietrzu. Ślizg podczas lotu przyspiesza opadanie.

- CSV dają 25 punktów oprócz punktów za dystans. Pliki powyżej głowy wymagają skoku.
- Tarcza pochłania jedno trafienie (maksymalnie dwa ładunki). Po trafieniu działa krótka ochrona przed wielokrotnym naliczeniem kolizji.
- Magnes przez osiem sekund przyciąga CSV z sąsiednich torów. ZIPsert daje na osiem sekund ochronę przed przeszkodami i dodatkowe 5 m/s.
- Generator deterministycznie buduje rzędy z co najmniej jednym wolnym torem. Odstępy pozwalają zmieniać tor także przy maksymalnej prędkości. Kolizje liczone są w małych krokach, aby wolniejsze renderowanie nie pozwalało przelatywać przez przeszkody.
- Sterowanie: A/D lub strzałki — tory, W/↑/spacja — skok, S/↓ — ślizg, P/Escape — pauza. Na telefonie działają przyciski i gesty.

Pauza i ukrycie okna zatrzymują model oraz czasy bonusów. Na czas Metro Import Sudoku nie reaguje na klawiaturę i nie odmierza czasu. CSV Double, Bird Game 3 i kampania pozostają w dotychczasowym zawieszeniu. Powrót przywraca tę samą ukończoną planszę; z niej można wrócić dalej lub uruchomić kolejny bieg.

`minigames/runner-sim.js` jest czystym modelem bez Three.js. `runner-render.js` ma jeden renderer, animowaną postać i instancjonowane CSV, przeszkody, budynki oraz tory. Pula obiektów ma stałe limity; w pętli nie powstaje geometria. Wyjście zwalnia zasoby GPU i zdarzenia. `runner-game.js` obsługuje wejście, HUD, pauzę, dźwięki i rekord. Trwający bieg nie jest zapisywany; najlepszy wynik i liczba CSV są osobnym rekordem schema 1 pod `bulk-import-metro-runner-v1`.

## Komandor i efekty audio

Dodano 108 polskich nagrań bohatera: 96 odpowiedzi w scenach, cztery szczególne wypowiedzi o relacjach oraz osiem krótkich kwestii. Cały katalog ma 290 nagrań (około 18 min 43 s). Po wyborze odpowiedzi najpierw słychać komandora, następnie NPC. Tekst wyboru jest widoczny. Powtarzanie uruchamia nagrania, bez ponownej zmiany przychylności lub zaufania. Zmiana tematu i wyjście przerywają kolejkę.

`audio/effects.js` dodaje warstwy szumu, basu i metalicznego tonu do strzałów, osobne efekty wrogów, trafień, tarcz, eliminacji, leczenia, uniku oraz zakupu ulepszenia. Efekty są syntetyzowane lokalnie przez Web Audio, bez pobierania plików. Szum jest buforem wielokrotnego użytku, a liczba żywych źródeł ograniczona do 32. Główne wyciszenie obejmuje je wszystkie. Podczas dubbingu nowe efekty grają ciszej, aby mowa pozostała zrozumiała. Nagrania i ich licencje pozostają w `voice/`; generator ma dodatkowy profil `hero`.

## Wydanie i sprawdzanie

`Bulk-Import-v23.html` zawiera wszystkie zasoby: kampanię, multiplayer, minigry, atlas i głosy. Zachowano dotychczasowe klucze i formaty zapisów, w tym ukończone Sudoku oraz talie. Publiczna strona korzysta z tego samego wydania; multiplayer CSV Double jest nadal wyłączony, a alwaysdata wstrzymane.

`tests/runner.test.cjs` sprawdza fizykę, kolizje, bonusy, pauzę, tysiące metrów przejezdnych tras i limity obiektów. `tests/runner-browser.cjs` sprawdza rzeczywiste obrazy kart i rozgrywkę, automatyczne wejście po Sudoku, klawiaturę/dotyk, pauzę, budżet GPU, koniec biegu, restart i nienaruszony stan wszystkich rodziców. Test dubbingu dekoduje wszystkie nagrania i sprawdza kolejność bohater/NPC oraz rzeczywiste odtwarzanie strzałów i zakupu. `tests/effects.test.cjs` sprawdza warstwy, wyciszenie, ściszanie i limit źródeł. Testy kampanii, minigier, multiplayera i Pages nadal należą do weryfikacji wydania.
