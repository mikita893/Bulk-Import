# Bulk Import: Wspólna Galaktyka — v16

Historia zmian: [CHANGELOG.md](CHANGELOG.md) — aktualizowana przy każdym nowym wydaniu, począwszy od v16.

**Jedna gra, jeden plik, dwa sposoby uruchomienia:** [Bulk-Import-v16.html](Bulk-Import-v16.html). Nowa wspólna gałąź: [`feature/bulk-import-unified-v13`](https://github.com/mikita893/Bulk-Import/tree/feature/bulk-import-unified-v13). Zawiera pełną kampanię 3D, kooperację, Salesforce kontra Excel i minigry **Bird Game 3** i **Gwintforce: Wojna rekordów**. Wcześniejsze wydania HTML i gałęzie pozostają zachowane.

## Pobierz HTML i graj lokalnie

Pobierz **Bulk-Import-v16.html** i otwórz go w przeglądarce z WebGL. Wystarcza ten jeden plik: kampania, Three.js, grafika, dźwięki, Bird Game 3 i Gwintforce są osadzone. Nie potrzebujesz serwera, połączenia z Internetem ani pozostałych plików repozytorium.

Menu automatycznie rozpoznaje uruchomienie z pliku. **Kampania solo działa offline; Obie minigry uruchomisz w jej głównym terminalu na statku. Kooperacja, VS oraz dołączanie do pokoju są wyszarzone.** Tryb lokalny nie otwiera WebSocketów i nie pobiera konfiguracji. Rekord minigry i kampania zapisują się w localStorage, jeżeli przeglądarka na to pozwala. Różne pliki mogą mieć odrębną pamięć: przed zmianą wydania wyeksportuj kampanię do JSON, a następnie ją zaimportuj.

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
- **Bird Game 3:** leśna arena 3D inspirowana ekranami i żartami z mema. Wybierz gołębia, wronę, sowę, kolibra albo kaczkę: różnią się modelem, statystykami i mocą Q. Zbieraj CSV, dziob boty i dostarcz 8 rekordów do niebieskiego gniazda w 120 sekund. Masz trzy próby i limit trzech CSV w dziobie, sygnalizowany stałym komunikatem o pełnym dziobie. Jest tylko 12 CSV: sześć luźnych (także w powietrzu), sześć u botów. Pliki nie odrastają; odbierz je przeciwnikom lub z ich gniazda Camp Cache. Czerwony stożek uprzedza atak o 0,9–1,05 s i pozostaje skierowany w to samo miejsce, aby dało się uniknąć trafienia. Las, staw, gniazda, ptaki i portrety są proceduralne, bez pobierania assetów.

- **Gwintforce: Wojna rekordów:** lokalna karcianka przeciw Vaelowi, Syrze albo ExcelBotowi. Trzy rzędy, maksymalnie trzy rundy, pas, więzi, morale, szpiedzy, medycy, bohaterowie, pogoda, Keynote, podmiana i DELETE. Darmowa talia startowa liczy 20 kart. Nowe karty kupisz za kredyty w **Zbrojownia → Karty do Gwintforce**. Pierwsza wygrana z każdym rywalem daje unikalną kartę. W terminalu ułożysz talię (16–24 kart, minimum 12 jednostek). Nieobecny załogant nie zagra; ExcelBot jest zawsze dostępny. Kolekcja, talia i wygrane zapisują się z kampanią, także w JSON. Starsze zapisy otrzymują darmowy zestaw.

Bird Game 3 jest częścią kampanii, dostępną wyłącznie w **głównym terminalu na statku**. Rozpocznij lub kontynuuj kampanię, podejdź do niebieskiego hologramu pośrodku statku, naciśnij **E** i wybierz **Rekreacja: Bird Game 3** albo **Rekreacja: Gwintforce / wojna rekordów**. Nie ma osobnego kafelka minigry ani skrótów na paskach. Kampania zamraża się na czas rekreacji, a **Wróć do terminala** przywraca tę samą konsolę i pozycję postaci. Terminal zawiera także mapę misji, zbrojownię i zapis. Podczas walki jest niedostępny. Wyjście z kampanii do menu zapisuje postęp. Aktywny pokój multiplayer trzeba najpierw opuścić, aby zmienić tryb.

## Sterowanie i zapis

Kampania: WASD / strzałki — ruch, Shift — sprint, mysz — cel, LPM / spacja — ogień, Q — efekt masy, C — ZIPsert, R — unik, F — załoga, E — główny terminal, retranslator lub pomoc Marca, M — misje, U — ulepszenia, P — pauza.

Multiplayer: WASD, mysz i strzał; Q — atak, F — obrona, C / R — dash, E — reanimacja lub wsparcie. Menu nie zatrzymuje meczu pozostałych graczy.

Bird Game 3: WASD / strzałki — ruch; spacja — wzlot; Shift — sprint; J / LPM — dziobnięcie pobliskiego bota; Q — moc ptaka; C — unik; P / Escape — pauza; PPM z ruchem myszy — kamera. Na małym ekranie są przyciski dotykowe. Lot i sprint zużywają wytrzymałość; na wyczerpaniu ptak musi odpocząć. Utrata widoczności lub fokusu zatrzymuje mecz. Rekord i wybór ptaka zapisują się osobno; wynik starej minigry z v13 pozostaje w archiwum.

Format zapisu solo nadal ma numer **10** i klucz `bulk-import-omega-3d-v10`: numer wydania HTML jest od niego niezależny. Pozostają migracje i import JSON starszych kampanii, w tym v8/v9. Kooperacja zachowuje format **1** i klucz `bulk-import-coop-v11`, zgodny z multiplayer v11/v12. Restart hostingu usuwa pokoje w RAM; checkpoint JSON zachowuje misje i wyposażenie.

## Wydawanie następnych wersji

Źródła kampanii są w `campaign/`, menu i multiplayera w `multiplayer/`, minigier w `minigames/`, a Three.js z licencją MIT w `vendor/`. Każda następna zmiana gry otrzymuje nowy numer i nowy HTML. Równoległy branch [`dev/readable-source`](https://github.com/mikita893/Bulk-Import/tree/dev/readable-source) zawiera sformatowane źródła, komentarze i `DEVELOPMENT.md` z mapą modułów. Po kolejnych zmianach synchronizuj także tę gałąź, buduj ten sam numer wydania i sprawdzaj testy. Nie rozwijamy oddzielnego klienta solo oraz multiplayer.

Po zwiększeniu wersji w `package.json` uruchom:

```sh
npm run build:client
```

Przy każdym nowym wydaniu dodaj wpis na początku [CHANGELOG.md](CHANGELOG.md): numer, datę, link do nowego HTML, funkcje, poprawki i zgodność zapisów. Zachowuj wcześniejsze wpisy i synchronizuj changelog do gałęzi z czytelnymi źródłami. Przy udostępnianiu wersji dołączaj skrót zmian oraz linki do HTML i changeloga.

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

Karcianka i poprawki ptasiej areny: [DESIGN-v16.md](DESIGN-v16.md). Integracja minigry z terminalem: [DESIGN-v15.md](DESIGN-v15.md). Opis ptasiej areny i źródła inspiracji: [DESIGN-v14.md](DESIGN-v14.md). Scalenie gry: [DESIGN-v13.md](DESIGN-v13.md). Mechaniki frakcji: [DESIGN-v12.md](DESIGN-v12.md); historia kampanii: [DESIGN-v10.md](DESIGN-v10.md).
