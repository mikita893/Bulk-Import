# Bulk Import: Omega 3D

Aktualne wydanie: **[Bulk-Import-Omega-3D-v5.html](Bulk-Import-Omega-3D-v5.html)**. Pełna gra 3D w jednym samodzielnym pliku HTML. Każde kolejne wydanie dostaje nową nazwę z numerem wersji; starsze pliki pozostają dostępne.

v5 powstała od nowa na gałęzi `feature/bulk-import-omega-3d-v5`. Wersja 2D v4 jest zachowana na gałęzi `work` (commit `d4afe8e`) i w [Bulk-Import-v4.html](Bulk-Import-v4.html). Wszystkie wymagania i zasady kolejnych wydań zapisano w [DESIGN-v5.md](DESIGN-v5.md).

## Uruchomienie

Otwórz pobrany `Bulk-Import-Omega-3D-v5.html` w przeglądarce z WebGL i akceleracją sprzętową. Plik zawiera cały silnik Three.js 0.160.1 wraz z licencją MIT. Modele, tekstury, efekty i dźwięki powstają proceduralnie. Nie ma zewnętrznych bibliotek, assetów ani zapytań do API podczas gry.

W środowisku deweloperskim: `npm start` (Python 3, port 3000). Strona główna kieruje do v5. Nie trzeba instalować zależności. Gra jest przeznaczona do sterowania klawiaturą i myszą; responsywne menu nie zastępuje sterowania dotykowego.

## Sterowanie

- WASD / strzałki — poruszanie postacią względem kamery; Shift — sprint.
- Mysz — celowanie w świat 3D; LPM / spacja — strzał.
- PPM + ruch myszy — obrót kamery; rolka — przybliżenie.
- Q — efekt masy: obrażenia obszarowe, odrzut i usuwanie pocisków; odnowienie 7 s.
- E przy retranslatorze — skok między bokami areny; odnowienie 2 s. Na statku: czerwony retranslator Omega do jądra galaktyki.
- F — załoga, rozmowy i romanse; M — mapa misji; U — zbrojownia; P / Esc — pauza lub powrót z menu.
- Przycisk DŹWIĘK w nagłówku włącza/wyłącza proceduralne efekty audio.

## Kampania

Cztery osobne areny 3D: Sandbox-7 (3 żniwa), Archiwum Protean (3), Stocznia Zbieraczy (4), Jądro galaktyki (3). Każda ma inny układ przeszkód i otoczenie. Po każdych żniwach wracasz na statek, gdzie czekają Proteanie Vael i Syra. Załoga nigdy nie pojawia się na arenach walki.

Kredyty z eliminacji, CSV, QTE i ukończonych operacji pozwalają kupić 5 poziomów mocy oraz szybkostrzelności broni. Apteczki dają do 35 życia, odnawiają się po 18 s i nie zużywają przy pełnym zdrowiu. Przeciwnicy to zwykli Żniwiarze, mocniejsze czerwone elity oraz złoci Zbieracze.

Omega odblokowuje się po trzech misjach. Zwiastun pojawia się w ostatnich żniwach czwartej misji; ma własny pasek HP, salwy pocisków i agresywniejszą fazę poniżej połowy życia. Indoktrynację odpiera się QTE: 4 wskazane klawisze WASD w 5 s; zły klawisz odejmuje 0,7 s; porażka zabiera 20 HP, sukces daje 40 CR. Podczas QTE walka jest zatrzymana.

Relacje rozwijają się raz na osobę podczas każdego powrotu na statek. Po trzech rozmowach można zaproponować wzajemny, wyłączny związek. Relacje, kredyty i ulepszenia pozostają po porażce; misję można rozpocząć ponownie.

## Zapis i migracja v4

localStorage: `bulk-import-omega-3d-v5`. Zapis co 2 sekundy walki i przy ważnych zmianach. Obejmuje aktywną walkę 3D: pozycje, życie, przeciwników, pociski, żniwa, kampanię, broń i relacje. Po przeładowaniu wybierz **KONTYNUUJ KAMPANIĘ**.

Menu **ZAPIS** eksportuje/importuje JSON. Różne nazwy lokalnych plików mogą mieć odrębne localStorage: eksportuj przed przenoszeniem pliku lub zmianą wersji/przeglądarki. Blokada zapisu jest zgłaszana w HUD; eksport nadal działa.

Import JSON z v4 zachowuje ukończone misje, kredyty, ulepszenia, rekordy, eliminacje i romanse. Gracz trafia na statek 3D; bieżąca walka i współrzędne 2D nie są konwertowane. Jeżeli zapis v4 jest dostępny w tym samym origin, ekran powitalny pozwala go przenieść. Nieprawidłowy import nie zmienia bieżącej gry.

## Weryfikacja v5

Sprawdzono w Chromium z WebGL: renderowanie modeli 3D, ruch/sprint/kolizje, pociski, medigel, efekt masy, retranslatory, brak załogi na arenach, przejścia statek–żniwa, ulepszenia, rozmowy i romans, zapis aktywnej misji i odpoczynku, cztery mapy, Omegę, dwie fazy Zwiastuna, ukończenie kampanii oraz QTE sukces/porażkę. Sprawdzono desktop i wąski ekran oraz brak zewnętrznych żądań sieciowych.
