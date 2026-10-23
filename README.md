# Bulk Import: Omega Chronicles 3D

Aktualne wydanie: **[Bulk-Import-Omega-3D-v7.html](Bulk-Import-Omega-3D-v7.html)** — gra 3D w jednym samodzielnym HTML. Starsze pliki v4/v5/v6 pozostają dostępne. Każde następne wydanie do pobrania musi dostać nową nazwę z numerem wersji.

Kod 3D jest na gałęzi `feature/bulk-import-omega-3d-v5`; baza 2D została zachowana w commicie `d4afe8e`. Pełne wymagania: [v5](DESIGN-v5.md), [optymalizacje v6](DESIGN-v6.md), [dialogi i kampania v7](DESIGN-v7.md).

## Uruchomienie

Otwórz pobrany HTML w przeglądarce z WebGL. W środowisku deweloperskim: `npm start` (Python 3, port 3000); strona główna kieruje do v7. Bez instalowania zależności gry, kont ani usług zewnętrznych. Three.js 0.160.1 z licencją MIT jest osadzony w HTML; modele, portrety, tekstury i dźwięki są proceduralne. Nie ma zewnętrznych assetów.

Sterowanie wymaga klawiatury i myszy; responsywne menu nie jest sterowaniem dotykowym.

## Sterowanie i płynność

- WASD / strzałki — ruch względem kamery; Shift — sprint.
- Mysz — cel; LPM / spacja — strzał; PPM + mysz — obrót kamery; rolka — przybliżenie.
- R — unik z krótką nietykalnością, odnowienie 2,5 s. Q — efekt masy, odnowienie 7 s.
- E — retranslatory / Omega; F — rozmowy; M — misje; U — zbrojownia; P / Esc — pauza lub powrót z menu.
- Nagłówek: przełącznik dźwięku i grafiki **Auto → Szybka → Wysoka**.

Auto dostosowuje rozdzielczość do płynności. Szybka dodatkowo obniża rozdzielczość; Wysoka włącza dynamiczne cienie. Zachowano statyczny batching, instancjonowanie efektów i symulację niezależną od FPS. [Pomiar v5/v6](benchmarks/v5-v6.json): w lokalnym SwiftShaderze v6 Auto skróciła medianę klatki walki około 3,6× przy tej samej rozdzielczości; nie jest to obietnica FPS na każdym urządzeniu.

## Kampania v7

Siedem misji: Sandbox-7, Archiwum Protean, Stocznia Zbieraczy, Próg Omegi, Illium: Skarbiec Gethów, Katedra Walidacji i Jądro galaktyki. Mapy mają różne układy osłon, powierzchnie i dekoracje. Po każdych żniwach wracasz na statek; załoga nigdy nie pojawia się w walce. Kolejne żniwa/misje wybiera się z mapy.

Przeciwnicy: Żniwiarze, czerwone elity, Zbieracze oraz nowi **Husk–Duplikat**, **Geth–Permission Wall** i **Banshee–Validation Rule**. Z każdą misją rosną liczba i statystyki; jednocześnie może istnieć do 18 wrogów. Awatar Zwiastuna w Progu Omegi ma 260 HP. Finałowy Zwiastun ma **1200 HP i trzy fazy**, posiłki oraz zapowiadane kręgami ataki. Teleportacje Banshee też są zapowiadane.

Kredyty finansują pięć poziomów mocy i szybkostrzelności broni. Apteczki: do +35 HP, odnowienie 18 s. CSV daje rekordy i kredyty. TURBO CSV co piątą eliminację przyspiesza ogień przez 6 s; serie eliminacji w odstępie do 4 s dają premie. QTE indoktrynacji: cztery klawisze WASD w 5 s, pomyłka −0,7 s, sukces +40 CR, porażka −20 HP.

## Relacje v7

Vael i Syra mają zmieniające mimikę portrety, **przychylność i zaufanie 0–100%**, po 16 scen z trzema odpowiedziami oraz trzy tematy na każdy pobyt na statku. Odpowiedzi mogą poprawiać i pogarszać nastawienie. Po wyborze widać reakcję i faktyczną zmianę procentów. Powtarzanie tego samego tematu nie daje punktów.

Przeprosiny pomagają odbudować zaufanie. Można rozwijać przyjaźń lub zaproponować wyłączny, wzajemny związek od 75% przychylności i 60% zaufania. Związek można zakończyć; spadek dowolnego wskaźnika poniżej 20% również prowadzi do rozstania. Relacje, historia odpowiedzi i postęp tematów są zapisywane.

## Zapis i migracja

localStorage v7: `bulk-import-omega-3d-v7`; ustawienia grafiki: `bulk-import-3d-settings`. Automatyczny zapis co 2 s walki i przy ważnych zmianach obejmuje kampanię, przeciwników/pociski, życie, broń, kredyty i relacje. Po odświeżeniu wybierz **KONTYNUUJ KAMPANIĘ**. Po śmierci wracasz na statek z zachowanymi zdobyczami, a misję ponawiasz.

Menu **ZAPIS** eksportuje/importuje JSON v4–v7. Różne pliki lokalne mogą mieć oddzielne localStorage: eksportuj przed przenoszeniem pliku albo zmianą wersji/przeglądarki. Blokada zapisu jest zgłaszana w HUD; eksport nadal działa.

Import v5/v6 zachowuje aktywną walkę na zgodnej mapie. Import v4 wraca na statek 3D. Dawne więzi są przeliczane na procenty, a istniejący partner otrzymuje 85%/80%. Dawne ukończone rozdziały 0–3 pozostają ukończone; nowe 4–6 prowadzą do nowego finału. Stare zwycięstwo jest pamiętane, ale nie zalicza nowego bossa. Niedokończone ostrzeżenia ataków są po wczytaniu anulowane, aby nie zadawać niewidocznych zaległych obrażeń.

## Sprawdzenie

Przeszły testy Chromium: dialogi/portrety/negatywne i pozytywne skutki/procenty, ograniczenie powtarzania, romans i rozstanie, siedem map, nowi wrogowie, boss i ostrzeżenia, istniejąca walka, zapisy/importy/eksporty, QTE, grafika Szybka i brak zewnętrznych żądań. Obejrzano dialogi desktop i mobile oraz nowe areny.

- `node tests/v7-state.test.cjs`
- `node tests/frame-clock.test.cjs Bulk-Import-Omega-3D-v7.html`
- Benchmark deweloperski z Playwright/systemowym Chromium: `node tests/benchmark-3d.cjs Bulk-Import-Omega-3D-v7.html /tmp/perf-v7.json fast` (serwer na porcie 3000).

Późna scena v7 w trybie Szybka z 14 przeciwnikami i trzema ostrzeżeniami: 160 wywołań renderowania i 27 544 trójkąty. To koszt sceny, nie deklaracja FPS.
