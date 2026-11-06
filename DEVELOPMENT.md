# Czytelne źródła Bulk Import

Ta gałąź, `dev/readable-source`, zawiera tę samą grę v22 co `feature/bulk-import-unified-v13`, z sformatowanymi własnymi źródłami i dodatkową dokumentacją. Wygenerowany plik HTML pozostaje samodzielny; większa liczba białych znaków nie zmienia mechanik. Biblioteka Three.js i historyczne HTML nie są formatowane.

## Pierwsze uruchomienie

Node.js 20+ (zalecany 22):

```sh
npm ci
npm run build:client
npm start
```

Otwórz http://localhost:3000. Sam `Bulk-Import-v22.html` można też otworzyć lokalnie z dysku. Wtedy multiplayer jest wyszarzony. Minigry otwiera się w kampanii przez terminal przy hologramie (E). Nie dodawaj osobnych wejść w menu głównym.

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
| `minigames/symbol-deck.js`                               | Konstrukcja 31 kart PG(2,5) z unikalnym siódmym symbolem; walidacja wszystkich 465 par.                                                                                                                            |
| `minigames/symbol-sim.js`                                | Maszyna stanów CSV Double, chronologiczne terminy botów, wspólna walidacja odpowiedzi i kara odporna na zmianę rund.                                                                                               |
| `minigames/symbol-game.js`, `symbol-game.css`            | UI, dotyk/klawiatura, dźwięki i animacje. Wejście wyłącznie z Bird Game 3, powrót do tego samego modelu areny.                                                                                                     |
| `tests/`                                                 | Testy reguł, migracji i rzeczywistych klientów WebSocket oraz Chromium.                                                                                                                                            |

### Przewodnik po kampanii

Stan i reguły kampanii pozostają w `campaign/game.js`. Modele przeciwników i pozy wydzielono w v21 do `campaign/enemy-models.js` i `campaign/actor-animation.js`. Od v22 teksty rozmów są w `campaign/dialogues.js`, a interfejs głosów w `campaign/dubbing-ui.js`. Builder łączy te pliki w jeden skrypt kampanii ze wspólnym zakresem; nie ładuj ich jako niezależnych modułów ES.

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

Publikacja alwaysdata pozostaje wstrzymana przez `deploy/alwaysdata/settings.json` (`paused: true`). Push uruchamia testy, ale nie wysyła plików na hosting. Wznowienie wymaga wyraźnej prośby użytkownika.

## v18: Opium Bird i mróz

`BULK_BIRDS.opium` określa statystyki i opisy szóstego ptaka. `freezeBird` przerywa zamach i blokuje ruch, a `tickBird` po odmarznięciu przyznaje 2 s odporności. `updateFrost` rozlicza opóźnienie oddechu i ciągłą ekspozycję na aurę; `resolveFrostBreath` sprawdza zablokowany kierunek, stożek, odległość i wysokość. Zegar symulacji jest jedynym źródłem trafień.

`makeOpiumBody` tworzy biały, dwunożny model z maskowym dziobem i instancjonowanymi piórami. `renderFrost` aktualizuje gotową pulę 32 drobin, sektor i pierścień, bez alokacji geometrii w pętli. `syncBird` pokazuje osłonkę lodową na zamrożonych botach. Przy zmianie zasięgów synchronizuj wizualizację i model. Testy w `tests/bird-game.test.cjs` chronią odporność po odmarznięciu, pauzę, anulowanie po śmierci i skończoną pulę CSV; `tests/unified-browser.cjs` sprawdza Q oraz układ sześciu ptaków. Szczegóły: [DESIGN-v18.md](DESIGN-v18.md).

## Publikacja solo na GitHub Pages

Publiczna strona korzysta z gałęzi gry i folderu `/docs`, wybieranych jednorazowo w Settings → Pages. `multiplayer/build-client.cjs` po zbudowaniu zwykłego wydania wywołuje `deploy/pages/build.cjs`, który generuje `docs/index.html` i `.nojekyll`. To konfiguracja publikacji: nie zmienia numeru gry ani mechanik.

`renderPages` bezpiecznie osadza niezmieniony HTML w JSON i przypisuje go do `iframe.srcdoc`. Własne `about:` ramki wybiera istniejący tryb lokalny, a odziedziczone pochodzenie zachowuje localStorage na stałym adresie. Oryginalny HTML można pobrać przez Blob z wersjonowaną nazwą. Przejście przez logo wraca do głównej strony, aby nie opuścić konfiguracji solo. Nie dodawaj backendu, tokenów ani klientów WebSocket do tej strony.

Kontrola po zmianie buildera: `npm run test:pages`. Test używa zwykłego serwera jednego pliku pod prefiksem `/Bulk-Import/`, sprawdza brak połączeń sieciowych gry, pobieranie oryginalnego HTML, terminal i wszystkie minigry, ekran mobilny oraz zapis po przeładowaniu. Instrukcja właściciela: [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md). Wdrożenie alwaysdata nadal ma osobną pauzę.

## v19: przygotowany multiplayer CSV Double

Funkcja ma pozostać wyłączona: `BULK_DOUBLE_MULTIPLAYER` nie jest ustawione w konfiguracji. Nie włączaj jej przy zwykłej aktualizacji. API zwraca `features.csvDoubleMultiplayer: false`, a bez jawnej zgody i flagi endpoint `/ws/double` odmawia połączenia. Pages i plik lokalny zawsze korzystają z solo. Pauza alwaysdata pozostaje osobna.

- `server/double-match.cjs`: `DoubleOnlineMatch` używa starego silnika talii i przejść, dodając niezależne kary, liczniki i odpowiedzi ludzi. `view(id)` musi nadal ujawniać wyłącznie własną rękę i publiczne informacje. Nie serializuj całego modelu, seedów, stosu ani obiektów uczestników.
- `server/double-rooms.cjs`: protokół pokoi, gotowość, uprawnienia gospodarza, monotoniczne sekwencje, sesje, pauza przy rozłączeniu i limit powrotu 30 s. Zegar jest serwerowy i wstrzymuje także karę. Ręczna pauza pozostaje ręczna po odzyskaniu sesji. Przerwanie nie przyznaje zwycięstwa.
- `server/index.cjs`, `cloudflare/worker.mjs`: ten sam serwis CSV Double na istniejącym porcie, osobny endpoint i te same reguły. `deploy/alwaysdata/package.cjs` pakuje także oba pliki zasad/talii, których wymaga serwer.
- `minigames/symbol-network.js`: sieć i lobby. `BulkDoubleRemoteView` podaje istniejącemu UI tylko projekcję stanu; nigdy nie rozlicza punktów. Połączenie jest otwierane po akcji gracza i zamykane przy wyjściu. Token wznowienia jest prywatny, związany z serwerem i przechowywany w sessionStorage.
- `minigames/symbol-game.js`: wspólny widok solo/sieciowy. W online ukrycie karty przeglądarki nie pauzuje meczu. Tylko host może wstrzymać stół. `multiplayer/unified.js` nadal udostępnia CSV Double wyłącznie wewnątrz Bird Game 3.

Testy `symbol-multiplayer.test.cjs` sprawdzają m.in. domyślne wyłączenie, prywatność, autorytet, kary, wyścigi, rozłączenia, limity i 100 pełnych meczów. `symbol-multiplayer-browser.cjs` rozgrywa cały mecz dwoma klientami z automatycznym wznowieniem, wynikami i powrotem do tej samej areny. `test:pages` i lokalny test CSV Double chronią brak socketów bez serwera. Pełne zasady i ograniczenia: [DESIGN-v19.md](DESIGN-v19.md). Formaty zapisów pozostają bez zmian.

## v20: Sudoku w CSV Double

`BulkUnified.openSudoku` wymaga ekranu CSV Double oraz braku aktywnego pokoju online. `BulkDoubleGame.suspendForMinigame` zatrzymuje lokalny model, zegar, timery, rendering i klawisze. Powrót odtwarza ten sam ekran i wymaga ręcznego wznowienia wcześniej trwającej gry. Podczas Sudoku nie zmieniaj kampanii ani Bird Game 3; oba pozostają w istniejącym zawieszeniu. Nie dodawaj dodatkowej drogi wejścia z terminala lub menu głównego.

- `minigames/sudoku-sim.js`: czysty generator, solver MRV z maskami i limitem węzłów oraz model ruchów. Usunięcie wskazówki jest dozwolone tylko po ukończonym sprawdzeniu dokładnie jednego rozwiązania. `SudokuGame` obsługuje wpisy, notatki, konflikty, podpowiedzi i cofanie do 100 ruchów; `restoreSudoku` waliduje zapis i rozwiązuje jego dane startowe.
- `minigames/sudoku-game.js`, `sudoku-game.css`: UI, wybór pól, klawiatura/dotyk i zegar co 250 ms. Pauza i utrata widoczności zatrzymują czas. Układ ma klasy `sdk-*`, aby nie dziedziczyć ukrywania bocznego panelu multiplayera na telefonie.
- Zapis minigry: `bulk-import-sudoku-v1`, schema 1. Klucze kampanii i CSV Double są bez zmian. Cofanie nie przechodzi przez zamknięcie minigry, natomiast cyfry, notatki, czas i licznik podpowiedzi pozostają zapisane. Sudoku nie należy do JSON kampanii.

Testy `sudoku.test.cjs` sprawdzają solver, 60 generowanych plansz, ruchy i odczyt. `sudoku-browser.cjs` rozwiązuje planszę rzeczywistymi klawiszami, sprawdza dotyk, niezmienność nadrzędnych modeli, przywrócenie CSV Double i zapis po przeładowaniu. Testy Pages i CSV Double online obejmują także nową nawigację i zakaz wejścia w aktywnym pokoju. Dokument wydania: [DESIGN-v20.md](DESIGN-v20.md).

## v21: zbrojownia i animacje

- `campaign/game.js`: `shopMenu` tworzy siedem natywnych przycisków z `data-upgrade` i segmentami `role=meter`. `buyUpgrade` nadal rozlicza cenę, limit oraz zakupioną różnicę pojemności. Zachowuj przewinięcie i fokus po przebudowaniu panelu. Style są ograniczone do `.upgrade-grid`.
- `campaign/enemy-models.js`: modele z osobnymi stawami. `jointPart` zachowuje światowe położenie przenoszonych elementów. Nieruchome części są łączone według materiału; ruchomych podgrup nie wolno włączyć do statycznego batcha.
- `campaign/actor-animation.js`: `finishEnemyAnimation` zakłada pozy w `model.userData.animation`; `resetEnemyAnimation` zeruje model pobrany z puli. `animateEnemy` używa rzeczywistego przesunięcia i stałego kroku symulacji. Strzał wyzwala błysk dopiero po przyjęciu pocisku przez silnik. Nie dodawaj danych modeli do zapisu.
- `syncHeroAnimation` obraca całą sylwetkę przy uniku R. `heroPose` jest pivotem; `dodgeTrailMesh` ma stałe 12 miejsc (sześć używanych na szybkiej jakości). Pauza zamraża czas animacji, a `wipeCombat` zeruje ślad. Nie zmieniaj fizyki ani nietykalności w kodzie wizualizacji.

`tests/campaign-presentation-browser.cjs` jest częścią `test:browser`: zakupy klawiaturą i dotykiem, limity, pojemność, chód/postój, strzały, zwarcie, pule, osłona i odczyt Excela, pauza, geometria GPU oraz rzeczywiste R. Szczegóły: [DESIGN-v21.md](DESIGN-v21.md). Format zapisu solo pozostaje 10; multiplayer CSV Double pozostaje wyłączony, a alwaysdata wstrzymane.

## v22: gotowe nagrania dubbingu

Źródłem scen jest `campaign/dialogues.js`. `voice/catalog.cjs` zbiera kwestie NPC i zdarzenia, tworząc stabilny identyfikator z tekstu, rozmówcy i wersji profilu. `scripts/generate-voices.py` generuje MP3 z lokalnych polskich modeli Piper. Nie jest częścią startu ani zwykłego budowania; instrukcja i licencje: `voice/LICENSE.md`. Karty modeli w `voice/models/` zachowuj bez formatowania. Nie dodawaj modeli ONNX ani środowiska Python do artefaktów gry.

`voice/build.cjs` wymaga zgodnego manifestu i SHA-256 każdej używanej kwestii. Po zmianie wypowiadanego tekstu odśwież nagrania; po zmianie wymowy lub filtrów zwiększ `profileVersion`. Builder osadza nagrania raz w `BULK_VOICE_PACK` powłoki. Kampania korzysta z tej samej paczki przez rodzica, bez duplikowania jej w srcdoc. Przy zwykłym budowaniu nie wolno wymagać API TTS ani pobierania modeli.

`voice/player.js` działa również w Node do testów. Ma jeden kanał audio, kolejkę dwóch krótkotrwałych zdarzeń i cache sześciu Blobów. Zmiana sceny przerywa poprzedni dialog; próbki głosów także zastępują się natychmiast. Priorytet Marca przerywa żarty bossów. Token `epoch` chroni nowy głos przed późnym odrzuceniem starszej obietnicy autoplay. Każda trwała likwidacja kampanii wywołuje `BulkCampaign.dispose`, zwalniając adresy Blob; rekreacja używa `suspend` i zachowuje instancję.

`campaign/dubbing-ui.js` obsługuje napisy komunikatów, przyciski dialogów i panel głośności. Otwarcie ustawień zachowuje węzły i funkcje poprzedniego panelu, a powrót je przywraca. `bulk-import-dubbing-v1` przechowuje wyłącznie wyłącznik i głośność; nie zmieniaj schematów kampanii. Wyciszenie, pauza i nawigacja muszą zatrzymywać głos. Nie używaj Web Speech API jako zamiennika osadzonych nagrań.

`tests/dubbing.test.cjs` sprawdza katalog, odtwarzacz, pamięć i autoplay. `tests/dubbing-browser.cjs` dekoduje wszystkie nagrania, sprawdza niezerowy sygnał i rzeczywisty postęp odtwarzania, wszystkie profile, dialogi/reakcje, sterowanie, priorytety, zapis preferencji, telefon i brak ruchu sieciowego. Adresy Blob są lokalnymi zasobami; testy nadal odrzucają żądania do zewnętrznych plików i usług. Dokument wydania: [DESIGN-v22.md](DESIGN-v22.md).
