# Czytelne źródła Bulk Import

Ta gałąź, `dev/readable-source`, zawiera tę samą grę v16 co `feature/bulk-import-unified-v13`, z sformatowanymi własnymi źródłami i dodatkową dokumentacją. Wygenerowany plik HTML pozostaje samodzielny; większa liczba białych znaków nie zmienia mechanik. Biblioteka Three.js i historyczne HTML nie są formatowane.

## Pierwsze uruchomienie

Node.js 20+ (zalecany 22):

```sh
npm ci
npm run build:client
npm start
```

Otwórz http://localhost:3000. Sam `Bulk-Import-v16.html` można też otworzyć lokalnie z dysku. Wtedy multiplayer jest wyszarzony. Minigry otwiera się w kampanii przez terminal przy hologramie (E). Nie dodawaj osobnych wejść w menu głównym.

## Mapa modułów

| Plik                                                     | Odpowiedzialność i miejsca zmian                                                                                                                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `release.cjs`, `package.json`                            | Numer wspólnego wydania i nowa nazwa HTML. Numer zapisu kampanii jest niezależny.                                                                                                                                  |
| `multiplayer/build-client.cjs`                           | Składa CSS, źródła, Three.js i dokument kampanii w jeden samodzielny HTML. Nigdy nie edytuj wygenerowanego HTML zamiast źródeł.                                                                                    |
| `campaign/shell.html`, `campaign/style.css`              | Układ i styl kampanii, portrety, HUD, panele.                                                                                                                                                                      |
| `campaign/game.js`                                       | Stan kampanii, symulacja i rendering 3D, misje, załoga, walka, zapis. Patrz przewodnik funkcji niżej.                                                                                                              |
| `multiplayer/unified.js`                                 | Wspólna powłoka: menu → iframe kampanii → rekreacja. Zawiesza kampanię podczas minigry, czyści instancje i przywraca terminal. Rozpoznaje tryb plikowy.                                                            |
| `multiplayer/client.js`, `render.js`                     | Klient sieciowy i render multiplayera. Lokalny HTML nie otwiera połączenia.                                                                                                                                        |
| `multiplayer/shared.cjs`, `engine.cjs`                   | Wspólny katalog misji, ulepszeń i frakcji oraz autorytatywne zasady kooperacji/VS. Ulepszenia solo nie wpływają na VS.                                                                                             |
| `server/index.cjs`, `server/rooms.cjs`                   | HTTP/WebSocket i pokoje w pamięci Node.                                                                                                                                                                            |
| `cloudflare/worker.mjs`                                  | Adapter tych samych reguł do Durable Objects i natywnych WebSocketów.                                                                                                                                              |
| `minigames/bird-sim.js`                                  | Czysty model areny: gatunki, skończona pula CSV, wysokość, opóźnione sektory ataków, uniki i boty.                                                                                                                 |
| `minigames/bird-render.js`, `bird-game-3.js`             | Proceduralny las i ptaki Three.js, czerwone stożki, HUD, wejście, audio, zegar i rekordy.                                                                                                                          |
| `minigames/cards-sim.js`                                 | Katalog kart, walidacja talii/kolekcji, deterministyczny pojedynek, punktacja, zdolności i AI. Można importować w Node bez DOM.                                                                                    |
| `minigames/cards-game.js`, `cards-game.css`              | Stół, ręka, legalne cele, kolekcja i budowanie talii. Żadnych połączeń sieciowych.                                                                                                                                 |
| `deploy/alwaysdata/`, `.github/workflows/alwaysdata.yml` | Paczka produkcyjna, start na adresie `IP`/`PORT` alwaysdata, publikacja przez SSH, restart API i kontrola wdrożonego commita. Pierwsza konfiguracja: `docs/ALWAYSDATA-SETUP.md`. Publikuje tylko główna gałąź gry. |
| `tests/`                                                 | Testy reguł, migracji i rzeczywistych klientów WebSocket oraz Chromium.                                                                                                                                            |

### Przewodnik po kampanii

Kampania pozostaje jednym plikiem źródłowym, ponieważ wcześniej była pojedynczym HTML. Teraz jest sformatowana, z nazwanymi funkcjami i komentarzami przy granicach mechanik. Nie trzeba rozdzielać jej na moduły, by zmieniać grę.

- `fresh`, `snapshot`, `save`, `restore`, `validProgress`, `validSaveSnapshot`: stan, walidacja i import. `progress` zawiera trwały postęp; `player` i `run` bieżącą misję. Format solo nadal **10**, klucz `bulk-import-omega-3d-v10`; kooperacja nadal **1**.
- `frame`, `update`, `updateVisuals`: zegar, symulacja i rendering. Nie wiąż szybkości gry z liczbą klatek. Pozostaw ograniczoną pracę po zacięciu i zatrzymanie w tle.
- `buildEnvironment`, `MISSIONS`, `TYPES`: mapa i katalog przeciwników. Twórz geometrię podczas budowy sceny, nie co klatkę.
- `openPanel`, `closePanel`, `shipTerminalMenu`, `nearShipTerminal`: panele i fizyczny terminal. `terminalPanelOpen` stanowi bramkę minigier; samo wejście na statek nie wystarcza.
- `shopMenu`, `buyUpgrade`: ulepszenia walki. `cardShopMenu`, `buyCampaignCard`: karty za kredyty, kontrola ceny i własności.
- `createCrewDefaults`, `applyCrewAnswer`, `crewAvailable`, `reconcileBetrayalsAfterRestore`: relacje, dialogi i odejście załogi.
- `createExcelState`, `validExcelState`, `updateExcelHUD`: dwie formy Excela i obowiązkowa pomoc Marca.
- `canPlayCards`, `beginCardDuel`, `finishCardDuel`, `saveCardDeck`: most do karcianki. Kampania nadaje jednorazowy token partii i przyznaje nagrodę; zakończenie nie może naliczyć się drugi raz. Kolekcja jest opcjonalnym `progress.cards` w starym formacie 10. Brak pola w starym zapisie dodaje starter, uszkodzone jawne pole odrzuca import.
- `window.BulkCampaign`: publiczne API dostępne dla powłoki. `suspend` zatrzymuje również wejście i walkę; `resume` zeruje akumulator czasu.

## Sprawdzanie zmian

```sh
npm run format
npm run format:check
npm run build:client
npm test
npm run test:solo
npm run test:hosting
npm run test:browser
```

Testy przeglądarkowe wymagają Playwright i Chromium (opcjonalnie `BULK_CHROMIUM=/ścieżka/do/chromium`). Testy nie są zależnością uruchomieniową gry. W środowisku Codex Playwright jest dostarczony przez runtime; na własnej maszynie można zainstalować go bez zmiany zależności gry: `npm install --no-save --package-lock=false playwright`, potem `npx playwright install chromium`.

`format` obejmuje tylko własne katalogi źródłowe, testy, konfigurację developera i dokumentację tej gałęzi. `npm run build:cloudflare` składa lokalne assety. Test adaptera: uruchom `npm run dev:cloudflare`, potem `npm run test:cloudflare`. Publikowanie to osobne `deploy:cloudflare`; zwykłe budowanie niczego nie publikuje.

## Kolejne wydania i synchronizacja gałęzi

1. W głównej gałęzi gry wdrażaj nowe mechaniki, zwiększ główny numer `package.json` i lockfile, wygeneruj nowy `Bulk-Import-vN.html`, testuj i commituj. Dodaj na początku `CHANGELOG.md` wpis z numerem, datą, linkiem do HTML, nowymi funkcjami, poprawkami i zgodnością zapisów. Zachowuj stare HTML, wcześniejsze wpisy i zgodność zapisów.
2. W osobnym worktree `dev/readable-source` scal commit głównej gałęzi (`git merge feature/bulk-import-unified-v13`). Przy konflikcie formatowania przenieś aktualne mechaniki z gałęzi gry, zachowując konfigurację Prettiera, dokumentację i komentarze developerskie. Nie używaj globalnego „ours/theirs” ani resetu całej gałęzi.
3. Jeśli konflikt dotyczy wygenerowanego bieżącego HTML, zakończ zmiany źródeł i wygeneruj go ponownie. Nie rozwiązuj konfliktów w minifikowanym payloadzie ręcznie. Nie modyfikuj wydań archiwalnych.
4. Uruchom `npm run format`, budowanie i testy na czytelnych źródłach. Commituj i wypchnij obie gałęzie bez force push. Numer wydania gry i changelog są takie same po obu stronach. Przy udostępnieniu wydania podaj użytkownikowi skrót zmian oraz linki do HTML i changeloga. Samo uzupełnienie dokumentacji istniejącej wersji nie wymaga nowego numeru ani przebudowania gry.
5. Zmiana zrobiona najpierw na gałęzi developera powinna trafić również do wspólnej gry. Przenieś odpowiadający jej commit lub patch źródłowy, bez mechanicznych zmian formatowania całego repozytorium, a następnie wykonaj zwykłą synchronizację powyżej.

Nie minifikuj ręcznie kodu podczas pracy. Nazwy funkcji, reguły, testy i mapa modułów mają umożliwiać zrozumienie zmiany bez rozpakowywania wydanego HTML.
