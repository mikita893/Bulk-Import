# Bulk Import: Duplicate Rage 3D

Aktualne wydanie: **[Bulk-Import-Omega-3D-v10.html](Bulk-Import-Omega-3D-v10.html)** — gra 3D w jednym samodzielnym HTML. Starsze pliki v4/v5/v6/v7/v8/v9 pozostają dostępne. Każde następne wydanie do pobrania musi dostać nową nazwę z numerem wersji.

Kod 3D jest na gałęzi `feature/bulk-import-omega-3d-v5`; baza 2D została zachowana w commicie `d4afe8e`. Pełne wymagania: [v5](DESIGN-v5.md), [optymalizacje v6](DESIGN-v6.md), [dialogi i kampania v7](DESIGN-v7.md), [ulepszenia i konsekwencje relacji v8](DESIGN-v8.md), [finał z Excelem i zgodność zapisów v9](DESIGN-v9.md), [tarcza, ZIPsert i wściekły Excel v10](DESIGN-v10.md).

## Uruchomienie

Otwórz pobrany HTML w przeglądarce z WebGL. W środowisku deweloperskim: `npm start` (Python 3, port 3000); strona główna kieruje do v10. Bez instalowania zależności gry, kont ani usług zewnętrznych. Three.js 0.160.1 z licencją MIT jest osadzony w HTML; modele, portrety, tekstury i dźwięki są proceduralne. Nie ma zewnętrznych assetów.

Sterowanie wymaga klawiatury i myszy; responsywne menu nie jest sterowaniem dotykowym.

## Sterowanie i płynność

- WASD / strzałki — ruch względem kamery; Shift — sprint.
- Mysz — cel; LPM / spacja — strzał; PPM + mysz — obrót kamery; rolka — przybliżenie.
- R — unik z krótką nietykalnością, odnowienie 2,5–1,25 s. **C — ZIPsert**, daleki dash z dwoma ładunkami; każdy odnawia się po 6,5–4 s zależnie od mobilności. Q — efekt masy, odnowienie 7–3 s. Ulepszenia skracają odnowienie.
- E — retranslatory / Omega, w finale pomoc Marca przy hologramie; F — rozmowy; M — misje; U — zbrojownia; P / Esc — pauza lub powrót z menu.
- Nagłówek: przełącznik dźwięku i grafiki **Auto → Szybka → Wysoka**.

Auto dostosowuje rozdzielczość do płynności. Szybka dodatkowo obniża rozdzielczość; Wysoka włącza dynamiczne cienie. Zachowano statyczny batching, instancjonowanie efektów i symulację niezależną od FPS. [Pomiar v5/v6](benchmarks/v5-v6.json): w lokalnym SwiftShaderze v6 Auto skróciła medianę klatki walki około 3,6× przy tej samej rozdzielczości; nie jest to obietnica FPS na każdym urządzeniu.

## Kampania

Siedem dotychczasowych misji: Sandbox-7, Archiwum Protean, Stocznia Zbieraczy, Próg Omegi, Illium: Skarbiec Gethów, Katedra Walidacji i Jądro galaktyki. Po pokonaniu Zwiastuna odblokowuje się ósmy rozdział: **Excel: Koniec arkusza**. Mapy mają różne układy osłon, powierzchnie i dekoracje. W pierwszych siedmiu misjach po każdych żniwach wracasz na statek; obecna załoga pozostaje na statku. Załogant, który odejdzie przy obu wskaźnikach relacji 0%, może powrócić jako przeciwnik. Kolejne żniwa i misje wybiera się z mapy. Finał z Excelem jest jednym ciągłym starciem.

Przeciwnicy: Żniwiarze, czerwone elity, Zbieracze oraz nowi **Husk–Duplikat**, **Geth–Permission Wall** i **Banshee–Validation Rule**. Z każdą misją rosną liczba i statystyki; jednocześnie może istnieć do 18 wrogów. Awatar Zwiastuna w Progu Omegi ma 260 HP. Zwiastun w Jądrze galaktyki ma **1200 HP i trzy fazy**, posiłki oraz zapowiadane kręgami ataki. Teleportacje Banshee też są zapowiadane.

Kredyty finansują po pięć poziomów mocy i szybkostrzelności broni oraz **pięć nowych ulepszeń v8**: pancerz (do 225 HP i +50 HP z apteczki), tarczę (do 125 pkt, regeneracja po 4 s bez trafienia), poszycie (do 30% redukcji obrażeń życia), biotykę (większe obrażenia i szybszy efekt masy) oraz mobilność (szybszy unik). Zakupy są dostępne na statku; zwiększenie pojemności dodaje tylko nową pojemność do aktualnego stanu, bez pełnego leczenia. Tarcza pochłania trafienie pierwsza, poszycie chroni pozostałe życie. **Paski życia i tarczy są też nad bohaterem.** Apteczki: +35–50 HP, odnowienie 18 s. CSV daje rekordy i kredyty. TURBO CSV co piątą eliminację przyspiesza ogień przez 6 s; serie eliminacji w odstępie do 4 s dają premie. QTE indoktrynacji: cztery klawisze WASD w 5 s, pomyłka −0,7 s, sukces +40 CR, porażka −20 HP.

## Ostatni boss: Excel

Pierwsza forma Excela zachowuje **2400 HP, trzy fazy i ataki z v9**. Po jej pokonaniu walka trwa dalej na tej samej arenie: pojawia się **wściekły Excel z 3200 HP**, który zasypuje gracza zduplikowanymi danymi i opóźnionymi kopiami ataków. Ta forma również ma trzy coraz trudniejsze fazy. Dopiero jej pokonanie kończy kampanię. Nie ma podziału na żniwa ani QTE indoktrynacji.

Nietykalność bossa pokazuje wyraźna osłona energii z siatką, świecącymi pierścieniami i etykietą **NIETYKALNY**. Zablokowany strzał wywołuje błysk tarczy. Gdy Marc przełamuje ochronę, osłona znika i można zadawać obrażenia; po zakończeniu okna wraca. Wściekły Excel zmienia wygląd, aby było jasne, że zaczęła się nowa część pojedynku.

**Pomoc Marca Benioffa jest konieczna w obu formach.** Kiedy pojawi się niebieski hologram, podejdź do niego i naciśnij **E**. Marc na kilka sekund przełamie osłonę i odnowi część życia oraz tarczy. W pierwszej formie okna podatności trwają 9, 8 lub 7 sekund, a pomoc odnawia do 30 HP i 45 pkt tarczy. Wściekły Excel daje okna kontrataku trwające 6,5, 6 lub 5,5 sekundy. Przegapiony sygnał powraca; hologram, panel odliczania i znacznik M na radarze pokazują miejsce wsparcia. Marc jest fikcyjną, satyryczną postacią gry.

**ZIPsert pod C** ma dwa ładunki. Pozwala wykonać daleki dash z krótką nietykalnością, lecz nadal zatrzymuje się na przeszkodach. Korzystaj z niego, aby wydostać się z kopiowanych ataków; pozostają też dotychczasowy unik R, efekt masy Q, ulepszenia i apteczki. Finał wymaga dobrego wyposażenia i reakcji na ostrzeżenia. Wcześniejsze misje można powtarzać po kredyty.

Pokonanie pierwszej formy tworzy trwały punkt kontrolny. Jeśli zginiesz podczas walki ze wściekłym Excelem, ponowne rozpoczęcie finału prowadzi od razu do drugiej formy. Nie trzeba powtarzać pierwszego pojedynku ani kampanii.

## Relacje i odejścia

Vael i Syra mają zmieniające mimikę portrety, **przychylność i zaufanie 0–100%**, po 16 scen z trzema odpowiedziami oraz trzy tematy na każdy pobyt na statku. Odpowiedzi mogą poprawiać i pogarszać nastawienie. Po wyborze widać reakcję i faktyczną zmianę procentów. Powtarzanie tego samego tematu nie daje punktów.

Przeprosiny pomagają odbudować zaufanie. Można rozwijać przyjaźń lub zaproponować wyłączny, wzajemny związek od 75% przychylności i 60% zaufania. Związek można zakończyć; spadek dowolnego wskaźnika poniżej 20% również prowadzi do rozstania. Gdy **oba wskaźniki osiągną 0%**, załogant opuszcza statek, kończy ewentualny związek i staje się przeciwnikiem przy następnym starcie misji lub kolejnych żniw. Po pokonaniu już nie wraca; śmierć bohatera zachowuje spotkanie do ponownej próby. Odejście i jego konsekwencja są zapisywane. Relacje, historia odpowiedzi i postęp tematów również pozostają w zapisie.

## Zapis i migracja

localStorage v10: `bulk-import-omega-3d-v10`; ustawienia grafiki: `bulk-import-3d-settings`. Automatyczny zapis co 2 s walki i przy ważnych zmianach obejmuje kampanię, przeciwników i pociski, życie, tarczę, ulepszenia, relacje oraz odejścia załogi. Zapisuje także ładunki i odnowienie ZIPserta, formę i HP Excela, punkt kontrolny po pierwszej formie oraz stan wsparcia Marca. Po odświeżeniu wybierz **KONTYNUUJ KAMPANIĘ**.

Menu **ZAPIS** eksportuje i importuje JSON v4–v10. Ekran startowy umożliwia również przeniesienie starszego zapisu z localStorage. Obsługiwane są **v9 i v8**, a wcześniejsze migratory v4–v7 pozostają dostępne. Kredyty, wyposażenie, relacje, historia dialogów i ukończone wcześniejsze misje są zachowywane.

**Jeśli pokonałeś Excela w v9, po migracji pozostaje tylko nowa, wściekła forma.** Wygrana z v9 jest uznawana za ukończenie pierwszej formy; oznaczenie zwycięstwa kampanii v10 pojawia się dopiero po pokonaniu drugiej. Aktywna walka z Excelem z v9 zachowuje dotychczasowe HP i okno podatności jako pierwsza forma. Jeśli w v8 pokonałeś już Zwiastuna, finał jest odblokowany, ale do ukończenia pozostają obie formy Excela.

Import v8 zachowuje pancerz, tarcze i konsekwencje odejść. W zapisie v7 pięć ulepszeń dodanych w v8 zaczyna od zera; aktywna postać zachowuje HP. Import v5/v6 zachowuje aktywną walkę na zgodnej mapie, a v4 wraca na statek 3D. Dawne więzi są przeliczane na procenty. Stare zwycięstwo v4–v6 nie zalicza później dodanych bossów. Nowa umiejętność ZIPsert zaczyna w starszych zapisach z dwoma ładunkami.

Migracja nie nadpisuje źródłowego zapisu poprzedniej wersji. Różne lokalne pliki HTML mogą mieć oddzielne localStorage: przed zmianą pliku lub wersji wyeksportuj JSON. Blokada zapisu jest zgłaszana w HUD; eksport nadal działa. Import jest sprawdzany przed zastąpieniem kampanii, również pod kątem spójności formy bossa, wsparcia, duplikowanych pocisków i nowej umiejętności. Rozpoczęte ostrzeżenia ataków są po wczytaniu anulowane, aby nie zadawać niewidocznych zaległych obrażeń.

## Sprawdzenie

Test balansu na kodzie wydania przeszedł. Porównanie wszystkich dziewięciu kombinacji fazy i wzoru ataku potwierdziło, że pierwsza forma zachowuje ostrzeżenia, czasy i pociski z v9. Symulacja potwierdziła osiągalność wygranej z obiema formami i samego wściekłego Excela przez bota reagującego na zagrożenia; bot ignorujący ostrzeżenia przegrywa, a bez Marca nie zadaje bossowi obrażeń. Model ma idealne celowanie i natychmiast wykorzystuje dostępną pomoc; nie jest pomiarem wyników graczy.

Walidacja zapisów, testy zegara symulacji i regresja wcześniejszej kampanii przeszły. Końcowe testy Chromium potwierdziły widoczność, błysk i wyłączanie osłony, ZIPsert z klawiatury, jego ładunki, kolizje i zapis, przejście do wściekłej formy bez nagrody za pierwszy pojedynek, opóźnione kopie ataków oraz zwycięstwo dopiero po pokonaniu drugiej formy. Sprawdzono punkt kontrolny, odrzucanie uszkodzonych danych, migrację zwycięzcy v9 prosto do nowej formy, zachowanie aktywnej walki v9 oraz obie formy po migracji zwycięzcy v8. Wczytanie zachowuje stan, a źródłowy zapis starszej wersji pozostaje bez zmian. Nie wystąpiły błędy JavaScript ani żądania do zewnętrznych zasobów.

- `node tests/v10-state.test.cjs`
- `node tests/v10-excel-balance.test.cjs` — porównanie pierwszej formy z v9 i symulacja obu form.
- `node tests/frame-clock.test.cjs Bulk-Import-Omega-3D-v10.html`
- `node tests/v10-browser.test.cjs` — wymaga Playwright, systemowego Chromium i serwera na porcie 3000.
- Benchmark deweloperski: `node tests/benchmark-3d.cjs Bulk-Import-Omega-3D-v10.html /tmp/perf-v10.json fast` (Playwright, Chromium i serwer na porcie 3000).

Wcześniejsze wyniki zachowano w [DESIGN-v8.md](DESIGN-v8.md) i [DESIGN-v9.md](DESIGN-v9.md). Historyczne pomiary wydajności nie są obietnicą FPS dla nowej sceny ani każdego urządzenia.
