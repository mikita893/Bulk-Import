# Czytelne źródła Bulk Import

Ta gałąź, `dev/readable-source`, zawiera tę samą grę v28 co `feature/bulk-import-unified-v13`, z sformatowanymi własnymi źródłami i dodatkową dokumentacją. Wygenerowany plik HTML pozostaje samodzielny; większa liczba białych znaków nie zmienia mechanik. Biblioteka Three.js i historyczne HTML nie są formatowane.

## Pierwsze uruchomienie

Node.js 20+ (zalecany 22):

```sh
npm ci
npm run build:client
npm start
```

Otwórz http://localhost:3000. Sam `Bulk-Import-v28.html` można też otworzyć lokalnie z dysku. Wtedy multiplayer jest wyszarzony. Minigry otwiera się w kampanii przez terminal przy hologramie (E). Nie dodawaj osobnych wejść w menu głównym.

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

## v23: karty z postaciami, Metro Import i głos komandora

Atlas `assets/cards/portraits.webp` zawiera szesnaście malowanych archetypów, a `minigames/cards-art.js` mapuje wszystkie 49 kart. Builder dodaje jeden osadzony obraz do CSS. Poszczególne karty przechowują współrzędne kafelka, bez kopii base64 w DOM. Warianty Batch/Flow mogą współdzielić postać. Zachowuj czytelne portrety na stole, w ręce i kolekcji — stare reguły CSS zmniejszające ilustracje do 18 px zostały usunięte.

- `minigames/runner-sim.js`: czysta fizyka, generator z wolnym torem, małe kroki kolizji, trzy życia, tarcza, magnes i ZIPsert. Każdy efekt ma skończony czas lub liczbę ładunków. Model nie zależy od renderera ani FPS.
- `minigames/runner-render.js`: jedna scena Three.js, animowany człowiek, instancjonowane obiekty i stałe geometrie. Nie twórz geometrii w `render`. Wyjście zwalnia renderer, materiały, tekstury i kontekst WebGL.
- `minigames/runner-game.js`, `runner-game.css`: wejście klawiaturą, gestami i dotykiem, HUD, pauza, start/restart, audio i osobny rekord `bulk-import-metro-runner-v1`.
- `minigames/sudoku-game.js`, `multiplayer/unified.js`: nowe ukończenie Sudoku otwiera Metro po 0,9 s; stare ukończone plansze mają przycisk. `openRunner` wymaga tej konkretnej ukończonej minigry. Na czas biegu Sudoku zawiesza timery i wejście, pozostawiając wszystkich rodziców zamrożonych. Nie dodawaj wejść w menu ani terminalu.
- `audio/effects.js`: lokalne warstwy dźwięku, bufor szumu do ponownego użycia, limit 32 źródeł, master mute i ducking. Instancja kampanii nazywa się `soundEffects`, ponieważ `effects` już oznacza grupę Three.js.

Katalog głosu bierze odpowiedzi gracza z tych samych `CREW_SCENES` co tekst UI. Profil `hero` w generatorze dodaje komandora bez ponownego generowania istniejących nagrań załogi. `speakCrew` kolejkuje bohatera i reakcję NPC w jednym kanale. Zmiana sceny przerywa kolejkę, a odtworzenie nie nalicza relacji po raz drugi. Krótkie kwestie walki mają oddzielne ograniczenia częstotliwości. Gra zawiera 290 nagrań, bez usługi TTS przy uruchamianiu.

Nowe testy: `runner.test.cjs` (trasy, fizyka, bonusy, rekord, kompletność atlasu), `runner-browser.cjs` (rzeczywiste ilustracje, pełne zagnieżdżenie, wejście/wyjście, gesty, budżet GPU), `effects.test.cjs` (audio). Testy dubbingu i Pages sprawdzają też odpowiedzi komandora oraz ukończenie Sudoku prowadzące do Metro. Szczegóły: [DESIGN-v23.md](DESIGN-v23.md). Formaty zapisów kampanii i starych minigier pozostają bez zmian.

## v24: skończona trasa Metro i Apex Souls

- `runner-sim.js` eksportuje `GOAL = 30000` i `CHECKPOINT = 5000`. Dystans jest fizyczny, wynik zawiera także CSV. Tylko stan `won` przy mecie nadaje nowe odblokowanie. `readRecord` rozszerza schema 1 bez zmiany klucza: stare wyniki zostają, brak dystansu nie odblokowuje gry. Test przechodzi dwie pełne trasy bez zmiany życia i pozycji — wybiera tylko legalny wolny tor.
- `runner-game.js` zapisuje najwyższy checkpoint, odtwarza go po śmierci/wczytaniu i wywołuje `onComplete` po mecie. `suspendForMinigame` anuluje RAF oraz timer automatycznego wejścia. `resumeFromMinigame` zeruje zegar i nie ponawia przejścia.
- `souls-sim.js` jest czystym modelem: `Game.action`, `tick` i `step`, `hurtPlayer`, `hurtEnemy`, `updateEnemy`, ogniska i `interact`. Małe kroki 1/120 s utrzymują trafienia niezależne od FPS. Wytrzymałość, chwila trafienia, zasięg, kierunek, krótka nietykalność i blok są regułami modelu. Nova omija blok. Boss zmienia fazę przy 60% i 30% życia. Po śmierci przerwij resztę kroku, zanim kod odzyskiwania run dotknie nowego miejsca śmierci.
- `souls-render.js` to proceduralni, animowani rycerze, współdzielone geometrie i instancjonowany świat. Zapowiedzi ataków używają tego samego kąta i promienia co model. Pula 12 pocisków, 40 iskier, limit 900 tys. pikseli i brak geometrii tworzonej w pętli. Wspólne zasoby zwalnia `destroy`.
- `souls-game.js/css` obsługuje kamerę, namierzanie, klawiaturę, ruch dotykowy, HUD, menu ogniska, pauzę i dźwięki. Dźwięki zaakceptowanego ciosu/uniku wywołuj od razu w kontrolerze: następny `tick` resetuje listę zdarzeń modelu. Efekty wyniku trafienia pochodzą ze zdarzeń symulacji.
- `multiplayer/unified.js`: `openSouls` działa wyłącznie z odblokowanego Metro przy nieaktywnej sieciowej partii Double. Zachowuje zamrożone modele rodziców i po wyjściu wraca do tego samego biegu. Nie twórz skrótów w menu/terminalu.

Osobny zapis `bulk-import-apex-souls-v1` (schema 1) zawiera poziom, runy, lokację, zgony, zwycięstwa i miejsce utraty run. Nie zapisujemy ataku w połowie animacji; wczytanie wraca do ogniska. Format solo nadal 10, kooperacja 1. Wszystkie zasoby należą do jednego HTML. Dubbing i ilustracje v23 są zachowane.

Testy: `souls.test.cjs` obejmuje zasady walki, checkpointy, zgony/runy i pełne zwycięstwo bez ulepszeń przy użyciu legalnych wejść. `runner-browser.cjs` sprawdza automatyczne otwarcie, walkę, dotyk, ognisko, fazy, zapis, powrót i budżet GPU. Dokument about:blank testu offline ma jawną pamięć testową (zarządzany Chromium blokuje file://); `pages-browser.cjs` dodatkowo sprawdza prawdziwy localStorage pod originem HTTP, bez backendu. Szczegóły: [DESIGN-v24.md](DESIGN-v24.md).

## v25: cel Metro to wynik punktowy

`BulkRunner.GOAL` oznacza teraz **25 000 punktów**, nie metry. `finishIfReady` oblicza wynik z dystansu i CSV (+25 pkt) oraz sprawdza próg zarówno po ruchu, jak i od razu po zebraniu pliku. Dzięki temu ostatni CSV kończy bieg w tej samej aktualizacji. Nie przywracaj ograniczenia dystansu w generatorze ani HUD. Dystans pozostaje statystyką i jednostką starych checkpointów co 5000 m.

`LEGACY_DISTANCE_GOAL = 30000` służy jedynie zgodności starych zapisów i punktów wznowienia. `readRecord` odblokowuje Apex Souls, gdy stary/nowy rekord wynosi co najmniej 25 000 pkt lub zachodzi zapisane ukończenie dawnej trasy. Klucz i schema 1 bez zmian. `canEnterSouls` nie wymaga dystansu 30 000 m. HUD, ekran mety, brama oraz wstęp Apex Souls pokazują punkty.

Testy modelu obejmują próg 24 999 pkt, ostatni CSV, dystans jako składnik wyniku, rekordy v23/v24 i pełne legalne biegi poniżej czterech minut. Testy Chromium/Pages kończą trasę przez rzeczywiste zebranie CSV przy około 100 m i sprawdzają automatyczne wejście. Szczegóły: [DESIGN-v25.md](DESIGN-v25.md).

## v26: Grand Theft CSV i helikopter

Wejście jest wyłącznie z ukończonego Apex Souls (`progress.wins > 0`). `BulkSoulsGame` ma `onComplete`, `canEnterCity`, `suspendForMinigame` i `resumeFromMinigame`. Nowe zwycięstwo uruchamia jednorazowy timer. Wyjście, nowa podróż i zawieszenie anulują go. Zawieszenie zatrzymuje RAF, dźwięki, wejście i resize; po powrocie odtwarzamy ten sam model bez kolejnego automatycznego wejścia. `multiplayer/unified.js` zarządza `openCity` i powrotem do Souls. Nie twórz skrótu w menu/terminalu.

- `city-sim.js`: czysty model bez DOM/Three.js. `progress.stage` oznacza 0 — kurier, 1 — helikopter, 2 — ukończenie. `phase` rozdziela odbiór, dostawę, zrzuty, powrót i jazdę swobodną. `mode` to pieszo, auto lub helikopter. `actor()` wskazuje właściwy obiekt fizyczny. `tick` dzieli czas na kroki 1/120 s, maks. 0,25 s na wywołanie. Jednostki fizyki: metry i sekundy; HUD mnoży prędkość przez 3,6.
- `BUILDINGS`, `TARGETS`, `PAD`, `PICKUP` są wspólne dla kolizji, renderingu i mapy. Dachy docelowe mają jawne wysokości używane w modelu budynków. Zmiana układu musi zachować dojazd drogami oraz bezpieczny wzlot z lądowiska. Zapis ma cztery flagi zrzutów; przy zmianie liczby celów dodaj świadomą migrację.
- `Game.action`: E sprawdza odległość i bezpieczne wysiadanie; F obsługuje zrzut lub klakson. Ładunek jest skończonym obiektem `drop`, a nagrodę/checkpoint nadajemy po dotarciu na dach, tylko raz na cel. Pozostałe cele pozostają aktywne. Zakończenie wymaga czterech zrzutów i rzeczywistego lądowania w bazie.
- Samochód ma przyspieszenie, cofanie, hamulec, kierownicę zależną od prędkości oraz ograniczony nitro/boost. Ruch uliczny jest deterministyczny; audytorzy poruszają się po siatce skrzyżowań. Helikopter ma tłumione prędkości poziome i pionową, limit wysokości oraz kolizje bryły z budynkami. Drony najpierw zapisują nieruchomy czerwony cel, dopiero po 1,4 s sprawdzają trafienie. Gracz może odlecieć lub zmienić wysokość.
- `city-render.js`: wspólne geometrie, instancjonowany świat, palmy i pojazdy NPC, animowana postać, wirniki i kamera. Bufory mają limity 14 aut NPC/policji, 56 kół, trzech dronów i 40 cząstek. Brak geometrii tworzonej w pętli. Three.js może po raz pierwszy wysłać gotową geometrię na GPU dopiero przy jej użyciu; testy sprawdzają niezmienność tożsamości geometrii i limity puli, aby nie mylić tego z alokowaniem nowej sceny.
- `city-game.js/css`: HUD, mapa 2D, klawiatura i przyciski z przechwyceniem wskaźnika. Zwolnienie, anulowanie, pauza, wyjście i blur czyszczą sterowanie. Ruch helikoptera jest względem północy/stałej kamery, samochód używa gazu i kierownicy względem własnego przodu. Audio silnika, wirnika i autorskiego radia ma ograniczoną częstotliwość i korzysta z `BulkEffects`; główne wyciszenie obowiązuje wszędzie. Nigdy nie dodawaj usług audio/assetów pobieranych podczas gry.

Zapis `bulk-import-grand-theft-csv-v1` (schema 1) zawiera etap, cztery zrzuty, kredyty, wygrane, kraksy i czas lotu. `retry`/wczytanie resetują pojazdy i zegar, zachowując zakończone zrzuty. Jazda swobodna po historii nie uruchamia limitu czasu. Nowa historia zachowuje liczniki wygranych/kraks i rekord, resetując cele oraz kredyty. Stare formaty kampanii i minigier bez zmian.

`tests/city.test.cjs` przechodzi obie misje legalnymi wejściami, bez teleportowania czy uzupełniania życia, i sprawdza kolizje, boost, drony, zegary, zapis, próby i swobodną jazdę. `runner-browser.cjs` rozszerza pełne zagnieżdżenie o rzeczywistą jazdę/lot/dotyk, cztery zrzuty, fizyczną kraksę i retry, lądowanie, zwycięstwo, ponowne odczytanie zapisu, zamrożenie rodziców i GPU. `pages-browser.cjs` dodatkowo testuje nową grę w statycznej ramce z prawdziwym localStorage. Szczegóły: [DESIGN-v26.md](DESIGN-v26.md).

## v27: Importic — kolonia RPG z Vice Import

Wejście jest z `city`, bez wymogu ukończenia jego fabuły: pieszo przy `BulkCity.PORTAL` na E albo przycisk `colony` na ekranie wejścia/pauzy. `openColony` sprawdza ekran i brak aktywnej partii online. Nie dodawaj skrótu w menu głównym ani terminalu. `BulkCityGame.suspendForMinigame` pauzuje model i zatrzymuje RAF, wejście, audio oraz resize. `resumeFromMinigame` zeruje zegar i odtwarza ten sam model; celowo pozostawia trwającą wcześniej misję w pauzie. Dzięki temu podczas lotu nie tracimy wysokości ani czasu, zanim gracz wznowi miasto.

- `colony-sim.js`: czysty model `Game`, poziomy, frakcje, zadania, dialogi i handel. `quest` 0–5 wyznacza kolejno przepustkę, frakcję, ruiny, raport, finał i ukończenie. `nearby`/`action('interact')` są wspólną bramką do NPC, rudy, skrzyni i ogniska. Nie przyznawaj nagród ani przedmiotów w samym UI.
- `fresh`, `valid`, `read`, `snapshot`: schema 1, klucz `bulk-import-colony-legacy-v1`. Walidacja sprawdza m.in. zgodność `lp + strength + 2 * vitality = 3 * (level - 1)`, osiem złóż, unikalne ID zabitych wrogów oraz warunki fabularne. `spawn`/retry/wczytanie odtwarzają bezpieczny punkt, zachowując postęp; niedokończona walka wraca do pełnego życia przeciwnika.
- `NPCS`, `HUTS`, `TREES`, `ORE`, `FIRE`, `CHEST`, `MINE`, `height` są wspólne dla fizyki, renderera i mapy. Oś z maleje w kierunku północy. Brama obozu jest zamknięta przed oddaniem rudy. Nie blokuj początkowych złóż ani dojścia do NPC; po zmianie mapy zaktualizuj trasę pełnego testu fabuły.
- `dialogue` zwraca wyłącznie aktualne, dozwolone wybory i ich stan disabled. `choose` ponownie je waliduje. Pierwsze przywitanie zmienia przychylność tylko raz, a ceny zależą od aktualnej przychylności. Wybór frakcji jest jednorazowy. Zmiana statystyk i zakup muszą zużywać PN/rudę atomowo. Złoża, skrzynia, pokonanie wroga i raport nie mogą naliczać nagród ponownie.
- Walka: koszty wytrzymałości, opóźnione trafienie i zakres kierunkowy; odskok ma krótkie okno nietykalności. Blok działa z przodu. Ognisty Upsert zużywa skupienie i tworzy ograniczony pocisk, który zatrzymują drzewa i ściany. Krzyk Walidacji zużywa wytrzymałość i działa w obszarze. `tick` dzieli czas na 1/120 s z ograniczeniem nadrabiania. Dialog, pauza i dziennik zamrażają świat.
- `colony-render.js`: jeden teren, wspólne geometrie, instancjonowane mury/drzewa/domki/ruda, proceduralni ludzie i stworzenia. Cache wrogów jest ograniczony do siedmiu ID. Zapowiedzi sektorów korzystają z modelowego kąta i zasięgu. Pula magicznych pocisków 6, cząstek 40, budżet pikseli około 900 tys. Poziomy terenu muszą być identyczne dla modeli i mapy kolizji.
- `colony-game.js/css`: dziennik, karta postaci, dialogi, własne portrety SVG reagujące na przychylność, sterowanie klawiaturą i wskaźnikami, minimapa, audio i zapis. Czyść klawisze po dialogu/panelu, blur i powrocie. W panelach nie nadrabiaj upływu czasu. Dźwięk przyjętej akcji odtwarzaj w kontrolerze; `tick` resetuje listę zdarzeń. Wyniki trafień i zadań w pętli pochodzą ze zdarzeń modelu. Wszystkie źródła audio respektują główne wyciszenie.

`tests/colony.test.cjs` zawiera pełną legalną trasę dla każdej frakcji: ruch, walkę, wydobywanie, rozmowy, zakupy, naukę, ruiny, raport i bossa. Nie podmienia życia ani pozycji w tym teście. Osobne scenariusze izolują koszty, dialogi, bramki, zapis i pauzę. `runner-browser.cjs` przechodzi rzeczywisty portal oraz cały interfejs nowego RPG i sprawdza m.in. powrót do niezmienionego, zapauzowanego miasta. Czekaj na klatkę renderera przy sprawdzaniu bramy; stan zadania aktualizuje się wcześniej niż widoczność obiektu 3D. `pages-browser.cjs` sprawdza wejście z pauzy nieukończonego miasta i zachowanie zapisu po przeładowaniu strony.

Formaty wcześniejszych gier i wszystkie archiwalne HTML pozostają bez zmian. Szczegóły: [DESIGN-v27.md](DESIGN-v27.md).

Przed uzyskaniem przepustki (quest 0) usługi kowalki, nauczyciela i komendantki są zablokowane, także gdy gracz obejdzie obóz od północy. Chroni to skończoną rudę pierwszego zadania przed wydaniem jej przed oddaniem strażnikowi. Osobny test sprawdza odmowę usług przed przepustką i ich odblokowanie po oddaniu rudy.

Ruda do przepustki może pochodzić także z łupów przeciwników. Nie wymagaj trzech wydobytych złóż w walidacji zapisu po uzyskaniu przepustki: model przyjmuje dowolne trzy bryły, a poprawny zapis ma zachować także tę legalną drogę. Osobny test obejmuje oddanie rudy z walki bez wydobywania i ponowne wczytanie takiego stanu.

## v28: parowanie, riposta i backstab w Apex Souls

Sterowanie: V to parowanie, C to kontekstowy cios krytyczny. J/LPM i K pozostają zwykłymi atakami. Parowanie kosztuje 18 wytrzymałości, działa od 0,08 do 0,30 s i odnawia się po 0,9 s. Wyłącznie `hurtPlayer(..., attacker)` wywołane przez rzeczywiste zwykłe cięcie może ogłuszyć wroga: frontalny kąt, aktywne okno i `parryable(attacker)` muszą jednocześnie przejść walidację. Pociski nie przekazują napastnika, nova ma `unblockable=true`.

`Game.criticalTarget()` wybiera pojedynczy żywy cel: priorytet ma riposta (`stunned`, timer > 0,12 s, dystans ≤ 2,25), potem backstab (dystans ≤ 2, kąt za plecami > 2,35 rad, boss wykluczony). Obie akcje wymagają zwrócenia się ku celowi i `clearPath`; nie wiąż ich z namierzeniem tak, aby blokowało inne legalne cele. `action('critical')` kosztuje 32 wytrzymałości, zamraża przemieszczanie gracza, rezerwuje ID celu i uruchamia skończoną animację. Trafienie po 0,38 s ponownie sprawdza zasięg i przeszkody. Nie teleportuj aktorów ani nie przyznawaj obrażeń wszystkim w zasięgu miecza.

`criticalGuard` i `parryCooldown` to stany przejściowe, zmniejszane tylko w aktywnej symulacji. Osobne `stunned` / `critical` odraczają ruch, ataki i zmianę fazy bossa do końca animacji; zmiana fazy musi się potem wykonać. `hurtEnemy` pozostaje jedyną drogą do nagród, śmierci i zwycięstwa. Respawn tworzy nowe pola. Nie dopisuj ich do schema 1 ani nie zmieniaj klucza zapisu.

Renderer używa istniejącej geometrii pierścienia, stałej poświaty i puli cząstek: nie dodawaj geometrii w `render`. Błękitny stożek oznacza ostatnie 0,3 s parowalnego cięcia, a turkusowy znacznik odpowiada dokładnie `criticalTarget()`. HUD rozróżnia ripostę/backstab i brak wytrzymałości. Kontroler obsługuje klawiaturę i dotyk; efekty wyniku pochodzą ze zdarzeń `parried`, `riposte`, `backstab`, a dźwięk rozpoczęcia z zaakceptowanej akcji.

Testy: `tests/souls.test.cjs` sprawdza sukcesy, porażki, timing, kierunek, cooldowny, koszt, filary, wygaśnięcie okna, pauzę, pojedynczy cel/nagrody i odporności/fazy bossa. `tests/runner-browser.cjs` wykonuje prawdziwe V/C i dotyk, sprawdza komunikaty/audio, budżet GPU, zapis, powrót i pełne zagnieżdżenie. `tests/pages-browser.cjs` weryfikuje statyczną publikację, pobranie oryginalnego HTML i localStorage po odświeżeniu. Szczegóły balansu: [DESIGN-v28.md](DESIGN-v28.md).
