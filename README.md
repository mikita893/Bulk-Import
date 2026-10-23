# Bulk Import: End of Sheet 3D

Aktualne wydanie: **[Bulk-Import-Omega-3D-v9.html](Bulk-Import-Omega-3D-v9.html)** — gra 3D w jednym samodzielnym HTML. Starsze pliki v4/v5/v6/v7/v8 pozostają dostępne. Każde następne wydanie do pobrania musi dostać nową nazwę z numerem wersji.

Kod 3D jest na gałęzi `feature/bulk-import-omega-3d-v5`; baza 2D została zachowana w commicie `d4afe8e`. Pełne wymagania: [v5](DESIGN-v5.md), [optymalizacje v6](DESIGN-v6.md), [dialogi i kampania v7](DESIGN-v7.md), [ulepszenia i konsekwencje relacji v8](DESIGN-v8.md), [finał z Excelem i zgodność zapisów v9](DESIGN-v9.md).

## Uruchomienie

Otwórz pobrany HTML w przeglądarce z WebGL. W środowisku deweloperskim: `npm start` (Python 3, port 3000); strona główna kieruje do v9. Bez instalowania zależności gry, kont ani usług zewnętrznych. Three.js 0.160.1 z licencją MIT jest osadzony w HTML; modele, portrety, tekstury i dźwięki są proceduralne. Nie ma zewnętrznych assetów.

Sterowanie wymaga klawiatury i myszy; responsywne menu nie jest sterowaniem dotykowym.

## Sterowanie i płynność

- WASD / strzałki — ruch względem kamery; Shift — sprint.
- Mysz — cel; LPM / spacja — strzał; PPM + mysz — obrót kamery; rolka — przybliżenie.
- R — unik z krótką nietykalnością, odnowienie 2,5–1,25 s. Q — efekt masy, odnowienie 7–3 s. Ulepszenia skracają odnowienie.
- E — retranslatory / Omega, w finale pomoc Marca przy hologramie; F — rozmowy; M — misje; U — zbrojownia; P / Esc — pauza lub powrót z menu.
- Nagłówek: przełącznik dźwięku i grafiki **Auto → Szybka → Wysoka**.

Auto dostosowuje rozdzielczość do płynności. Szybka dodatkowo obniża rozdzielczość; Wysoka włącza dynamiczne cienie. Zachowano statyczny batching, instancjonowanie efektów i symulację niezależną od FPS. [Pomiar v5/v6](benchmarks/v5-v6.json): w lokalnym SwiftShaderze v6 Auto skróciła medianę klatki walki około 3,6× przy tej samej rozdzielczości; nie jest to obietnica FPS na każdym urządzeniu.

## Kampania

Siedem dotychczasowych misji: Sandbox-7, Archiwum Protean, Stocznia Zbieraczy, Próg Omegi, Illium: Skarbiec Gethów, Katedra Walidacji i Jądro galaktyki. Po pokonaniu Zwiastuna odblokowuje się ósmy rozdział: **Excel: Koniec arkusza**. Mapy mają różne układy osłon, powierzchnie i dekoracje. W pierwszych siedmiu misjach po każdych żniwach wracasz na statek; obecna załoga pozostaje na statku. Załogant, który odejdzie przy obu wskaźnikach relacji 0%, może powrócić jako przeciwnik. Kolejne żniwa i misje wybiera się z mapy. Finał z Excelem jest jednym ciągłym starciem.

Przeciwnicy: Żniwiarze, czerwone elity, Zbieracze oraz nowi **Husk–Duplikat**, **Geth–Permission Wall** i **Banshee–Validation Rule**. Z każdą misją rosną liczba i statystyki; jednocześnie może istnieć do 18 wrogów. Awatar Zwiastuna w Progu Omegi ma 260 HP. Zwiastun w Jądrze galaktyki ma **1200 HP i trzy fazy**, posiłki oraz zapowiadane kręgami ataki. Teleportacje Banshee też są zapowiadane.

Kredyty finansują po pięć poziomów mocy i szybkostrzelności broni oraz **pięć nowych ulepszeń v8**: pancerz (do 225 HP i +50 HP z apteczki), tarczę (do 125 pkt, regeneracja po 4 s bez trafienia), poszycie (do 30% redukcji obrażeń życia), biotykę (większe obrażenia i szybszy efekt masy) oraz mobilność (szybszy unik). Zakupy są dostępne na statku; zwiększenie pojemności dodaje tylko nową pojemność do aktualnego stanu, bez pełnego leczenia. Tarcza pochłania trafienie pierwsza, poszycie chroni pozostałe życie. **Paski życia i tarczy są też nad bohaterem.** Apteczki: +35–50 HP, odnowienie 18 s. CSV daje rekordy i kredyty. TURBO CSV co piątą eliminację przyspiesza ogień przez 6 s; serie eliminacji w odstępie do 4 s dają premie. QTE indoktrynacji: cztery klawisze WASD w 5 s, pomyłka −0,7 s, sukces +40 CR, porażka −20 HP.

## Ostatni boss: Excel

Excel jest wielkim, uzbrojonym arkuszem z **2400 HP i trzema coraz trudniejszymi fazami**. To ostatni przeciwnik, bez podziału na żniwa, zwykłych wrogów ani QTE indoktrynacji. Arena ma siatkę komórek; boss atakuje wachlarzami pocisków, pierścieniami z luką i wybuchającymi polami arkusza. Ostrzeżenia pokazują miejsce i moment zagrożenia. Pełne wyposażenie, czytanie ataków, unik R, efekt masy Q i apteczki pomagają przetrwać.

**Pomoc Marca Benioffa jest konieczna do wygranej.** Kiedy pojawi się niebieski hologram, podejdź do niego i naciśnij **E**. Marc przełamuje nieprzebijalną osłonę Excela na 9, 8 lub 7 sekund, zależnie od fazy, oraz odnawia do 30 HP i 45 pkt tarczy. Gdy osłona działa, strzały i efekt masy nie zadają bossowi obrażeń. Przegapione wezwanie pomocy powraca; walka nie zostaje przez to zablokowana. Hologram, komunikaty i znacznik M na radarze wskazują miejsce wsparcia.

Finał ma być wymagający dla doświadczonych graczy, a wyposażona postać powinna móc go ukończyć dzięki dobremu ruchowi i wykorzystywaniu okien obrażeń. Wcześniejsze misje nadal można powtarzać po kredyty. Marc występuje jako fikcyjna, satyryczna postać; jego ratunkowe deploymenty i żarty o Salesforce oraz Excelu są częścią gry.

## Relacje i odejścia

Vael i Syra mają zmieniające mimikę portrety, **przychylność i zaufanie 0–100%**, po 16 scen z trzema odpowiedziami oraz trzy tematy na każdy pobyt na statku. Odpowiedzi mogą poprawiać i pogarszać nastawienie. Po wyborze widać reakcję i faktyczną zmianę procentów. Powtarzanie tego samego tematu nie daje punktów.

Przeprosiny pomagają odbudować zaufanie. Można rozwijać przyjaźń lub zaproponować wyłączny, wzajemny związek od 75% przychylności i 60% zaufania. Związek można zakończyć; spadek dowolnego wskaźnika poniżej 20% również prowadzi do rozstania. Gdy **oba wskaźniki osiągną 0%**, załogant opuszcza statek, kończy ewentualny związek i staje się przeciwnikiem przy następnym starcie misji lub kolejnych żniw. Po pokonaniu już nie wraca; śmierć bohatera zachowuje spotkanie do ponownej próby. Odejście i jego konsekwencja są zapisywane. Relacje, historia odpowiedzi i postęp tematów również pozostają w zapisie.

## Zapis i migracja

localStorage v9: `bulk-import-omega-3d-v9`; ustawienia grafiki: `bulk-import-3d-settings`. Automatyczny zapis co 2 s walki i przy ważnych zmianach obejmuje kampanię, przeciwników i pociski, życie, tarczę i jej regenerację, siedem ulepszeń, kredyty, relacje oraz odejścia załogi. W finale zapisuje również HP Excela, fazę i stan wsparcia Marca: miejsce, odliczanie oraz pozostałe okno podatności. Po odświeżeniu wybierz **KONTYNUUJ KAMPANIĘ**. Po śmierci wracasz na statek z zachowanymi zdobyczami i możesz ponowić starcie.

Menu **ZAPIS** eksportuje i importuje JSON v4–v9. Ekran startowy umożliwia także przeniesienie starszego zapisu z localStorage. **Zapisy v8 i v7 zachowują ukończone misje, kredyty, broń, relacje, historię dialogów i aktywną walkę. Jeśli Zwiastun jest już pokonany, pozostaje wyłącznie nowy finał z Excelem — nie trzeba ponownie przechodzić wcześniejszych misji.** Stan zwycięstwa całej kampanii v9 oznacza dopiero pokonanie Excela.

Import v8 zachowuje też pancerz, tarcze, pozostałe ulepszenia i konsekwencje odejść. W zapisie v7 pięć ulepszeń dodanych w v8 zaczyna od zera; aktywna postać zachowuje dotychczasowe HP. Import v5/v6 zachowuje aktywną walkę na zgodnej mapie. Import v4 wraca na statek 3D. Dawne więzi są przeliczane na procenty, a istniejący partner otrzymuje 85%/80%. Dawne ukończone rozdziały 0–3 pozostają ukończone; stare zwycięstwo v4–v6 nie zalicza później dodanego Zwiastuna ani Excela. Niedokończone ostrzeżenia ataków są po wczytaniu anulowane, aby nie zadawać niewidocznych zaległych obrażeń.

Migracja nie nadpisuje źródłowego zapisu poprzedniej wersji. Różne lokalne pliki HTML mogą mieć oddzielne localStorage: przed przenoszeniem pliku lub zmianą wersji wyeksportuj JSON. Blokada zapisu jest zgłaszana w HUD; eksport nadal działa. Import jest sprawdzany przed zastąpieniem kampanii, także pod kątem spójności finału i wsparcia Marca.

## Sprawdzenie

Walidacja zapisów v9, testy zegara symulacji oraz regresja dotychczasowej kampanii, migracji i mechanik v8 przeszły. Test balansu potwierdził, że bot z pełnym wyposażeniem, reagujący na ostrzeżenia i korzystający z Marca, może wygrać; bot ignorujący ostrzeżenia przegrywa, a bez pomocy Marca nie zadaje obrażeń. To symulacja, nie pomiar trudności wśród graczy. Końcowy test Chromium również przeszedł: odblokowanie tylko Excela po migracji zwycięzcy v8, konieczność i ponawianie pomocy, leczenie, zapis okien podatności, odrzucanie niespójnych danych, trzy fazy, zwycięstwo i wczytanie po zwycięstwie. Potwierdzono zachowanie aktywnej walki v8 z ulepszonym życiem i tarczą. Nie wystąpiły błędy JavaScript ani żądania do zewnętrznych zasobów; obejrzano finał i hologram na desktopie oraz w układzie mobilnym.

- `node tests/v9-state.test.cjs`
- `node tests/v9-excel-balance.test.cjs` — symulacja balansu i konieczności wsparcia Marca.
- `node tests/frame-clock.test.cjs Bulk-Import-Omega-3D-v9.html`
- `node tests/v9-browser.test.cjs` — test przeglądarkowy; wymaga Playwright, systemowego Chromium i serwera na porcie 3000.
- Benchmark deweloperski z Playwright/systemowym Chromium: `node tests/benchmark-3d.cjs Bulk-Import-Omega-3D-v9.html /tmp/perf-v9.json fast` (serwer na porcie 3000).

Wcześniejsze wyniki zachowano w [DESIGN-v8.md](DESIGN-v8.md). Późna scena v7 w trybie Szybka z 14 przeciwnikami i trzema ostrzeżeniami: 160 wywołań renderowania i 27 544 trójkąty. To koszt tej sceny, nie deklaracja FPS.
