# Bulk Import: Pivot Wars — v12

Aktualne wydanie: **[Bulk-Import-Multiplayer-v12.html](Bulk-Import-Multiplayer-v12.html)**. Rozszerzenie multiplayer na gałęzi `feature/bulk-import-multiplayer-v11`. Zawiera pełną kampanię solo v10, osobną kampanię kooperacyjną i Salesforce kontra Excel do **3 na 3**. Poprzednia gałąź 3D i wydania HTML pozostają zachowane.

Otwórz stronę serwera, wybierz tryb i utwórz pokój. Przekaż znajomym link lub kod pokoju. Każdy gra we własnej przeglądarce; nie potrzeba kont w grze. W VS wszyscy wybierają drużyny i gotowość, a gospodarz uruchamia mecz przy równych składach. Multiplayer wymaga działającego serwera — samo pobranie HTML nie łączy komputerów znajomych.

## Tryby gry

- **Solo:** dokładna kampania [Bulk-Import-Omega-3D-v10.html](Bulk-Import-Omega-3D-v10.html), z relacjami, statkiem, wyposażeniem, zapisami v8/v9, ZIPsertem, Markiem i obiema formami Excela. Dotychczasowy klucz zapisu pozostaje bez zmian.
- **Kooperacja, 1–3 osoby:** sześć oddzielnych misji, trudniejsze i skalowane starcia, wspólne kredyty oraz siedem rodzajów ulepszeń. Ratuj powalonych kolegów klawiszem E; drużyna ma trzy pakiety awaryjnego odzyskiwania. Finałem jest Excel Online z pomocą hologramu Marca.
- **VS:** Salesforce przeciw Excelowi, 1v1, 2v2 albo 3v3. Pierwsza drużyna z 15 eliminacjami wygrywa; po sześciu minutach decyduje wynik lub remis. Odrodzenie trwa pięć sekund. Nie ma friendly fire ani przewagi z kampanijnego wyposażenia.

Bazowe życie, tarcza, broń i zwykły ruch pozostają równe, ale frakcje mają **rzeczywiście różne umiejętności i kontry**. Salesforce używa celowanego zapytania Apex i przedniej osłony Permission Set; Excel rzuca tabelę przestawną na wybrany obszar i cofa część świeżych obrażeń przez Ctrl+Z. Salesforce ma dalszy dash, Excel krótszy i częstszy. Arena, spawny i apteczki są symetryczne; serwer oblicza wszystkie trafienia i odnowienia.

## Nowe moce frakcji

- **Salesforce / Q — Apex: SELECT * FROM WROGOWIE.** Celowany, przebijający pocisk zapytania; trafiaj precyzyjnie, bo osłony zatrzymują go.
- **Salesforce / F — Permission Set: NIE MASZ DOSTĘPU.** Tarcza przednia z ograniczoną wytrzymałością. Można obejść ją z boku; nie chroni przed tabelą spadającą z góry.
- **Excel / Q — Tabela przestawna.** Wybrane pole arkusza najpierw ostrzega przeciwników, potem uderza i krótko spowalnia. Przeciwnik może wyjść z pola, użyć dasha lub osłony mapy.
- **Excel / F — Cofnij: Ctrl+Z.** Ograniczone cofnięcie świeżych strat po krótkim opóźnieniu. Bez wskrzeszania, leczenia ponad limit i powielania odzyskanego życia.

Lobby pozwala porównać zestawy, a HUD pokazuje osobno Q, F i dash wraz z odnowieniami. Latające arkusze, pole tabeli, wiązka zapytania, bariera i efekt cofania mają odrębny wygląd.

## Uruchomienie lokalne / serwer Node

Wymagany Node.js 20 lub nowszy, zalecany Node.js 22.

```sh
npm ci
npm start
```

Strona: `http://localhost:3000`. Serwer nasłuchuje na `0.0.0.0` i zmiennej `PORT`; HTTP i WebSocket `/ws` używają jednego portu. W sieci domowej znajomi mogą otworzyć adres IP komputera gospodarza. Internet wymaga hostingu lub tunelu — propozycje i instrukcje: **[HOSTING-MULTIPLAYER.md](docs/HOSTING-MULTIPLAYER.md)**.

Gra wieloosobowa znajduje się w [Bulk-Import-Multiplayer-v12.html](Bulk-Import-Multiplayer-v12.html). Poprzedni HTML v11 jest zachowany. Biblioteka Three.js, grafika proceduralna i kod klienta są osadzone w tym pliku. Serwer jest osobnym programem. Bez zewnętrznych CDN, assetów ani płatnych usług. Po edycji źródeł klienta uruchom `npm run build:client`, aby odtworzyć HTML.

## GitHub Codespaces: Start i Stop serwera

Na [github.com/codespaces](https://github.com/codespaces) kliknij nazwę swojego środowiska, aby je wznowić: serwer gry wystartuje automatycznie, a edytor ma ustawione otwarcie strony gry. Po sesji wybierz **… → Stop codespace**, aby zatrzymać grę i maszynę. Bez wpisywania komend przy każdej sesji. Jednorazowo utwórz środowisko **2-core** z tej gałęzi i ustaw port **3000 → Public**. Konfiguracja jest zapisana w repozytorium; samo jej zapisanie nie tworzy ani nie uruchamia zdalnego Codespace. Instrukcja: **[CODESPACES-START.md](docs/CODESPACES-START.md)**.

## Darmowy Cloudflare Workers

Dołączony adapter używa tego samego silnika i obsługi pokojów co serwer Node. Pokojami zarządza jeden Durable Object, dzięki czemu gracze nie trafiają do różnych instancji z rozdzielonym stanem. Konfiguracja korzysta z klasy SQLite Durable Objects dostępnej w planie Free.

```sh
npm ci
npm run dev:cloudflare
```

Lokalny adres: `http://localhost:8787`. Po zalogowaniu na własne konto Cloudflare przez `npx wrangler login` można uruchomić `npm run deploy:cloudflare`. Kod nie został automatycznie opublikowany na cudzym koncie. Szczegóły limitów darmowego planu i alternatywy są w [porównaniu hostingów](docs/HOSTING-MULTIPLAYER.md).

Dla zwykłych hostingów Node przygotowano także `render.yaml` i `Dockerfile`. Nie zakładaj, że sam napis „Free” oznacza brak wymaganej metody płatności — aktualna weryfikacja dostawców jest opisana w porównaniu.

## Sterowanie i zapis

WASD / strzałki — ruch, Shift — sprint, mysz — cel, LPM / spacja — ogień, C / R — dash frakcji, Q — atak frakcji (impuls w coop), F — obrona frakcji, E — przytrzymaj przy powalonym koledze albo aktywuj pomoc Marca. Instrukcja i menu **nie zatrzymują** rozgrywki pozostałych graczy. Interfejs pokazuje życie i tarczę nad postaciami, wynik i odnowienia. Ustawienie Szybka ogranicza rozdzielczość renderowania.

Kooperacja automatycznie przechowuje lokalną kopię postępu misji, kredytów i wspólnych ulepszeń. Można pobrać JSON, założyć nowy pokój i wczytać go jako gospodarz. To checkpoint kampanii; nie odtwarza każdej pozycji i pocisku z aktywnego starcia. Zapisy solo oraz coop mają osobne formaty i klucze. Ulepszenia coop nie trafiają do VS.

Pokoje i bieżące mecze są przechowywane w pamięci serwera. Restart, uśpienie lub aktualizacja hostingu mogą je zakończyć. Po ponownym połączeniu można wznowić istniejącą sesję bez leczenia i zerowania odnowień; po utracie pokoju utwórz nowy i przywróć checkpoint coop. Nie przekazuj znajomym tokena sesji — udostępniaj zwykły link lub kod pokoju.

## Testy i źródła

```sh
npm test
npm run test:solo
npm run test:browser
# W drugim terminalu przy działającym npm run dev:cloudflare:
npm run test:cloudflare
```

Wszystkie 36 testów różnych zestawów frakcji, balansu, rzeczywistych sześciu połączeń i cyklu życia pokojów przeszły. Przeszedł także lokalny test adaptera Cloudflare z nowymi mocami. Próby 1v1/3v3 z oboma porządkami graczy sprawdzają budżety i brak przewagi kolejności; to regresja botów, nie obietnica ludzkiego wyniku 50/50. Dwie przeglądarki sprawdziły VS i coop, ruch, strzały, obie różne moce Q/F, reconnect oraz odświeżenie; zachowane są też testy zapisu solo.

Testy przeglądarkowe wymagają Playwright i Chromium; nie są zależnością do grania ani uruchomienia serwera. Serwer testowy używa osobnego portu. Szczegóły mechanik i zakres weryfikacji: [DESIGN-v12.md](DESIGN-v12.md), a opis pierwszego multiplayera w [DESIGN-v11.md](DESIGN-v11.md). Wymagania poprzednich wersji pozostają w [DESIGN-v10.md](DESIGN-v10.md) i wcześniejszych dokumentach.

Three.js 0.160.1 z licencją MIT jest osadzony w HTML; klient nie pobiera obrazów ani modeli z Internetu. Modele, tekstury i dźwięki powstają proceduralnie. Kod silnika multiplayer znajduje się w `multiplayer/engine.cjs`, wspólne parametry w `multiplayer/shared.cjs`, transport i pokoje w `server/`, a adapter Workers w `cloudflare/`.
