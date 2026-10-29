# Bulk Import: Wspólna Galaktyka — v13

**Jedna gra, jeden plik, dwa sposoby uruchomienia:** [Bulk-Import-v13.html](Bulk-Import-v13.html). Nowa wspólna gałąź: [`feature/bulk-import-unified-v13`](https://github.com/mikita893/Bulk-Import/tree/feature/bulk-import-unified-v13). Zawiera pełną kampanię 3D, kooperację, Salesforce kontra Excel i minigrę **Bird Game 3**. Wcześniejsze wydania HTML i gałęzie pozostają zachowane.

## Pobierz HTML i graj lokalnie

Pobierz **Bulk-Import-v13.html** i otwórz go w przeglądarce z WebGL. Wystarcza ten jeden plik: kampania, Three.js, grafika, dźwięki i Bird Game 3 są osadzone. Nie potrzebujesz serwera, połączenia z Internetem ani pozostałych plików repozytorium.

Menu automatycznie rozpoznaje uruchomienie z pliku. **Kampania solo i Bird Game 3 są dostępne; kooperacja, VS oraz dołączanie do pokoju są wyszarzone.** Tryb lokalny nie otwiera WebSocketów i nie pobiera konfiguracji. Rekord minigry i kampania zapisują się w localStorage, jeżeli przeglądarka na to pozwala. Różne pliki mogą mieć odrębną pamięć: przed zmianą wydania wyeksportuj kampanię do JSON, a następnie ją zaimportuj.

## Ten sam HTML na serwerze

Wymagany Node.js 20+, zalecany 22.

```sh
npm ci
npm start
```

Otwórz `http://localhost:3000`. Serwer udostępnia ten sam HTML; po udanym połączeniu dostępne są również kooperacja i VS. HTTP i WebSocket `/ws` korzystają z jednego portu, ustawianego przez `PORT`. Gospodarz tworzy pokój i przekazuje znajomym link lub kod.

- **Kampania solo 3D:** statek, proteańska załoga, rozmowy, relacje i romanse, zdrady, ulepszenia, apteczki, kolejne mapy, Zwiastun oraz obie formy finałowego Excela. Dotychczasowe mechaniki i zapisy pozostają zachowane.
- **Kooperacja, do 3 osób:** osobna kampania sześciu misji, wspólne kredyty i wyposażenie, ratowanie powalonych graczy oraz finał z pomocą hologramu Marca.
- **VS, 1v1 / 2v2 / 3v3:** równe podstawowe statystyki, różne umiejętności frakcji, symetryczna arena, odrodzenia i brak friendly fire. Salesforce: Apex i Permission Set. Excel: tabela przestawna i Ctrl+Z.
- **Bird Game 3:** pokładowy automat z gołębiem API. Przelatuj przez retranslatory między kolumnami Excela, zbieraj CSV, zachowaj trzy życia i pobij lokalny rekord. Etapy Sandbox, Produkcja i Governor Limits stają się coraz trudniejsze. Co sześć CSV odzyskujesz życie, do limitu trzech.

Bird Game 3 otworzysz z menu albo przyciskiem automatu na statku. Kampania zamraża się na czas minigry, a powrót zachowuje bieżący stan. Podczas walki automat jest niedostępny. Wyjście z kampanii do menu zapisuje postęp. Aktywny pokój multiplayer trzeba najpierw opuścić, aby zmienić tryb.

## Sterowanie i zapis

Kampania: WASD / strzałki — ruch, Shift — sprint, mysz — cel, LPM / spacja — ogień, Q — efekt masy, C — ZIPsert, R — unik, F — załoga, E — retranslator lub pomoc Marca, M — misje, U — ulepszenia, P — pauza.

Multiplayer: WASD, mysz i strzał; Q — atak, F — obrona, C / R — dash, E — reanimacja lub wsparcie. Menu nie zatrzymuje meczu pozostałych graczy.

Bird Game 3: spacja / strzałka w górę / dotknięcie — machnięcie skrzydłami; P / Escape — pauza. Utrata widoczności lub fokusu zatrzymuje minigrę. Rekord zapisywany jest osobno i nie daje przewagi w kampanii ani VS.

Format zapisu solo nadal ma numer **10** i klucz `bulk-import-omega-3d-v10`: numer wydania HTML jest od niego niezależny. Pozostają migracje i import JSON starszych kampanii, w tym v8/v9. Kooperacja zachowuje format **1** i klucz `bulk-import-coop-v11`, zgodny z multiplayer v11/v12. Restart hostingu usuwa pokoje w RAM; checkpoint JSON zachowuje misje i wyposażenie.

## Wydawanie następnych wersji

Źródła kampanii są w `campaign/`, menu i multiplayera w `multiplayer/`, minigier w `minigames/`, a Three.js z licencją MIT w `vendor/`. Każda następna zmiana gry otrzymuje nowy numer i nowy HTML. Nie rozwijamy oddzielnego klienta solo oraz multiplayer.

Po zwiększeniu wersji w `package.json` uruchom:

```sh
npm run build:client
```

`release.cjs` ustala nazwę `Bulk-Import-vN.html`; ten sam numer trafia do UI, serwera Node, adaptera Cloudflare i przekierowania `index.html`. Budowanie nie czyta starszych wygenerowanych HTML. Poprzednie wydania pozostają w repozytorium.

## Hosting

Przygotowano `Dockerfile`, `render.yaml` i adapter Cloudflare Workers z jednym Durable Object obsługującym wspólną pamięć pokojów. `npm run build:cloudflare` buduje aktualny wspólny HTML. `npm run dev:cloudflare` uruchamia lokalny adapter na porcie 8787; `npm run deploy:cloudflare` publikuje dopiero po zalogowaniu na własne konto.

Konfiguracja Codespaces automatycznie uruchamia grę przy wznowieniu środowiska. Do pierwszego utworzenia użyj obecnej gałęzi **feature/bulk-import-unified-v13**. Codzienny Start / Stop: [CODESPACES-START.md](docs/CODESPACES-START.md). Porównanie bezpłatnych hostingów: [HOSTING-MULTIPLAYER.md](docs/HOSTING-MULTIPLAYER.md). Żadnego nowego hostingu nie uruchomiono ani nie opublikowano automatycznie. Ochrona publicznego serwera wspólnym hasłem pozostaje osobnym, niewdrożonym jeszcze rozszerzeniem.

## Weryfikacja

```sh
npm test
npm run test:solo
npm run test:browser
# Przy działającym lokalnym npm run dev:cloudflare:
npm run test:cloudflare
```

Testy przeglądarkowe wymagają Playwright i Chromium; nie są potrzebne do grania. Sprawdzają samodzielny HTML, wygaszone opcje sieciowe, pełną kampanię i JSON, arcade na statku, rekord, pauzę, widok mobilny i rzeczywiste połączenia multiplayer. W zarządzanym Chromium na tym środowisku polityka administratora blokuje adresy `file://`; wtedy test ładuje zawartość samodzielnego pliku w pustym dokumencie bez sieci. Nie zmienia zasad bezpieczeństwa przeglądarki. Format i timingi kampanii są dodatkowo sprawdzane z payloadu rzeczywiście osadzonego w nowym HTML.

Szczegóły wspólnego wydania: [DESIGN-v13.md](DESIGN-v13.md). Mechaniki frakcji: [DESIGN-v12.md](DESIGN-v12.md); historia kampanii: [DESIGN-v10.md](DESIGN-v10.md).
