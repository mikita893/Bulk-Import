# Bulk Import: Omega Alliance 3D

Aktualne wydanie: **[Bulk-Import-Omega-3D-v8.html](Bulk-Import-Omega-3D-v8.html)** — gra 3D w jednym samodzielnym HTML. Starsze pliki v4/v5/v6/v7 pozostają dostępne. Każde następne wydanie do pobrania musi dostać nową nazwę z numerem wersji.

Kod 3D jest na gałęzi `feature/bulk-import-omega-3d-v5`; baza 2D została zachowana w commicie `d4afe8e`. Pełne wymagania: [v5](DESIGN-v5.md), [optymalizacje v6](DESIGN-v6.md), [dialogi i kampania v7](DESIGN-v7.md), [ulepszenia i konsekwencje relacji v8](DESIGN-v8.md).

## Uruchomienie

Otwórz pobrany HTML w przeglądarce z WebGL. W środowisku deweloperskim: `npm start` (Python 3, port 3000); strona główna kieruje do v8. Bez instalowania zależności gry, kont ani usług zewnętrznych. Three.js 0.160.1 z licencją MIT jest osadzony w HTML; modele, portrety, tekstury i dźwięki są proceduralne. Nie ma zewnętrznych assetów.

Sterowanie wymaga klawiatury i myszy; responsywne menu nie jest sterowaniem dotykowym.

## Sterowanie i płynność

- WASD / strzałki — ruch względem kamery; Shift — sprint.
- Mysz — cel; LPM / spacja — strzał; PPM + mysz — obrót kamery; rolka — przybliżenie.
- R — unik z krótką nietykalnością, odnowienie 2,5–1,25 s. Q — efekt masy, odnowienie 7–3 s. Ulepszenia skracają odnowienie.
- E — retranslatory / Omega; F — rozmowy; M — misje; U — zbrojownia; P / Esc — pauza lub powrót z menu.
- Nagłówek: przełącznik dźwięku i grafiki **Auto → Szybka → Wysoka**.

Auto dostosowuje rozdzielczość do płynności. Szybka dodatkowo obniża rozdzielczość; Wysoka włącza dynamiczne cienie. Zachowano statyczny batching, instancjonowanie efektów i symulację niezależną od FPS. [Pomiar v5/v6](benchmarks/v5-v6.json): w lokalnym SwiftShaderze v6 Auto skróciła medianę klatki walki około 3,6× przy tej samej rozdzielczości; nie jest to obietnica FPS na każdym urządzeniu.

## Kampania

Siedem misji: Sandbox-7, Archiwum Protean, Stocznia Zbieraczy, Próg Omegi, Illium: Skarbiec Gethów, Katedra Walidacji i Jądro galaktyki. Mapy mają różne układy osłon, powierzchnie i dekoracje. Po każdych żniwach wracasz na statek; obecna załoga pozostaje na statku. Załogant, który odejdzie przy obu wskaźnikach relacji 0%, może powrócić jako przeciwnik. Kolejne żniwa/misje wybiera się z mapy.

Przeciwnicy: Żniwiarze, czerwone elity, Zbieracze oraz nowi **Husk–Duplikat**, **Geth–Permission Wall** i **Banshee–Validation Rule**. Z każdą misją rosną liczba i statystyki; jednocześnie może istnieć do 18 wrogów. Awatar Zwiastuna w Progu Omegi ma 260 HP. Finałowy Zwiastun ma **1200 HP i trzy fazy**, posiłki oraz zapowiadane kręgami ataki. Teleportacje Banshee też są zapowiadane.

Kredyty finansują po pięć poziomów mocy i szybkostrzelności broni oraz **pięć nowych ulepszeń v8**: pancerz (do 225 HP i +50 HP z apteczki), tarczę (do 125 pkt, regeneracja po 4 s bez trafienia), poszycie (do 30% redukcji obrażeń życia), biotykę (większe obrażenia i szybszy efekt masy) oraz mobilność (szybszy unik). Zakupy są dostępne na statku; zwiększenie pojemności dodaje tylko nową pojemność do aktualnego stanu, bez pełnego leczenia. Tarcza pochłania trafienie pierwsza, poszycie chroni pozostałe życie. **Paski życia i tarczy są też nad bohaterem.** Apteczki: +35–50 HP, odnowienie 18 s. CSV daje rekordy i kredyty. TURBO CSV co piątą eliminację przyspiesza ogień przez 6 s; serie eliminacji w odstępie do 4 s dają premie. QTE indoktrynacji: cztery klawisze WASD w 5 s, pomyłka −0,7 s, sukces +40 CR, porażka −20 HP.

## Relacje i odejścia v8

Vael i Syra mają zmieniające mimikę portrety, **przychylność i zaufanie 0–100%**, po 16 scen z trzema odpowiedziami oraz trzy tematy na każdy pobyt na statku. Odpowiedzi mogą poprawiać i pogarszać nastawienie. Po wyborze widać reakcję i faktyczną zmianę procentów. Powtarzanie tego samego tematu nie daje punktów.

Przeprosiny pomagają odbudować zaufanie. Można rozwijać przyjaźń lub zaproponować wyłączny, wzajemny związek od 75% przychylności i 60% zaufania. Związek można zakończyć; spadek dowolnego wskaźnika poniżej 20% również prowadzi do rozstania. Gdy **oba wskaźniki osiągną 0%**, załogant opuszcza statek, kończy ewentualny związek i staje się przeciwnikiem przy następnym starcie misji lub kolejnych żniw. Po pokonaniu już nie wraca; śmierć bohatera zachowuje spotkanie do ponownej próby. Odejście i jego konsekwencja są zapisywane. Relacje, historia odpowiedzi i postęp tematów również pozostają w zapisie.

## Zapis i migracja

localStorage v8: `bulk-import-omega-3d-v8`; ustawienia grafiki: `bulk-import-3d-settings`. Automatyczny zapis co 2 s walki i przy ważnych zmianach obejmuje kampanię, przeciwników/pociski, życie, tarczę i jej regenerację, siedem ulepszeń, kredyty, relacje i odejścia załogi. Po odświeżeniu wybierz **KONTYNUUJ KAMPANIĘ**. Po śmierci wracasz na statek z zachowanymi zdobyczami, a misję ponawiasz.

Menu **ZAPIS** eksportuje/importuje JSON v4–v8. Przy braku zapisu v8 gra szuka zgodnego zapisu starszej wersji; oryginał pozostaje zachowany. Różne pliki lokalne mogą mieć oddzielne localStorage: eksportuj przed przenoszeniem pliku albo zmianą wersji/przeglądarki. Blokada zapisu jest zgłaszana w HUD; eksport nadal działa.

Import v7 zachowuje kampanię, relacje i aktywną walkę; nowe ulepszenia zaczynają od zera. Import v5/v6 zachowuje aktywną walkę na zgodnej mapie. Import v4 wraca na statek 3D. Dawne więzi są przeliczane na procenty, a istniejący partner otrzymuje 85%/80%. Dawne ukończone rozdziały 0–3 pozostają ukończone; nowe 4–6 prowadzą do nowego finału. Stare zwycięstwo jest pamiętane, ale nie zalicza nowego bossa. Niedokończone ostrzeżenia ataków są po wczytaniu anulowane, aby nie zadawać niewidocznych zaległych obrażeń.

## Sprawdzenie

Testy Chromium v8 objęły: dialogi/portrety/negatywne i pozytywne skutki/procenty, ograniczenie powtarzania, romans i rozstanie, siedem map, nowi wrogowie, boss i ostrzeżenia, istniejąca walka, zapisy/importy/eksporty, QTE, grafika Szybka i brak zewnętrznych żądań. Obejrzano dialogi desktop i mobile oraz nowe areny. Dodatkowo potwierdzono zakupy i limity siedmiu ulepszeń, absorpcję i regenerację tarczy, życie ponad 100 HP, paski nad postacią, odejście przy obu 0%, jednorazowego przeciwnika oraz migrację v7 bez utraty historii dialogów i aktywnej walki; szczegóły w [DESIGN-v8.md](DESIGN-v8.md).

- `node tests/v8-state.test.cjs`
- `node tests/v7-state.test.cjs`
- `node tests/frame-clock.test.cjs Bulk-Import-Omega-3D-v8.html`
- `node tests/v8-browser.test.cjs` — test przeglądarkowy; wymaga Playwright, systemowego Chromium i serwera na porcie 3000.
- Benchmark deweloperski z Playwright/systemowym Chromium: `node tests/benchmark-3d.cjs Bulk-Import-Omega-3D-v8.html /tmp/perf-v8.json fast` (serwer na porcie 3000).

Późna scena v7 w trybie Szybka z 14 przeciwnikami i trzema ostrzeżeniami: 160 wywołań renderowania i 27 544 trójkąty. To koszt sceny, nie deklaracja FPS.

Testy przeglądarkowe uruchomiono przez lokalny HTTP i potwierdzono brak zewnętrznych żądań. Bezpośrednią próbę `file://` zatrzymała polityka zarządzanego Chromium (`ERR_BLOCKED_BY_ADMINISTRATOR`) przed załadowaniem gry.
