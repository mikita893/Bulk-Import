# Bulk Import

Aktualna wersja: **[Bulk-Import-v4.html](Bulk-Import-v4.html)** — samodzielna gra HTML, którą można otworzyć bezpośrednio w przeglądarce. Każde kolejne wydanie dostaje nową, niepowtarzającą się nazwę z numerem wersji. Starsze pliki pozostają wcześniejszymi wydaniami.

## Uruchomienie

Otwórz `Bulk-Import-v4.html` lub uruchom `npm start` w katalogu repozytorium (Python 3, port 3000) — strona główna przekierowuje do najnowszej wersji. Bez instalowania zależności, konta i usług zewnętrznych.

## Kampania v4

- Cztery misje: Sandbox-7 (3 żniwa), Archiwum Protean (3), Stocznia Zbieraczy (4), Jądro galaktyki (3). Każda mapa ma inny układ przeszkód i oprawę.
- Po każdych żniwach wracasz na bezpieczny statek. Załoga jest obecna tylko na statku. M uruchamia kolejne żniwa lub następną odblokowaną misję.
- U: zbrojownia. Kredyty z eliminacji, CSV, QTE i premii za misje finansują moc oraz szybkostrzelność broni (po 5 poziomów).
- Proteanie Vael i Syra: rozmowy oraz wzajemny, wyłączny romans. Jedna rozmowa rozwijająca więź na osobę podczas każdego powrotu; po trzech rozmowach można wejść w związek.
- Żniwiarze, czerwone opancerzone elity z większą wytrzymałością i obrażeniami oraz złoci owadopodobni Zbieracze.
- Czerwony retranslator Omega odblokowuje się po trzeciej misji i prowadzi do jądra galaktyki. Zwiastun pojawia się w ostatnich żniwach, ma osobny pasek życia i drugą, agresywniejszą fazę walki.
- QTE indoktrynacji: cztery wskazane klawisze WASD w 5 sekund. Pomyłka odejmuje 0,7 s; porażka zabiera 20 życia. Podczas QTE walka jest wstrzymana; udany opór daje 40 CR.
- Apteczki: +35 życia, odnowienie 18 sekund; przy pełnym zdrowiu pozostają dostępne.

## Sterowanie

WASD / strzałki — ruch; Shift — sprint; mysz — celowanie; LPM / spacja — strzelanie; Q — efekt masy; E — retranslator; F — załoga / rozmowa; M — misje; U — ulepszenia; P — pauza. Używaj przycisków menu do powrotu na pokład.

## Zapis

Automatyczny zapis w localStorage pod kluczem `bulk-import-campaign-v4`: postęp kampanii, kredyty, ulepszenia, relacje i aktywna walka (żniwa, przeciwnicy, życie, pociski). Zapis odbywa się co 2 sekundy walki i przy ważnych zmianach. Odświeżenie strony udostępnia przycisk kontynuacji. Po śmierci wracasz na statek z zachowanymi zdobyczami, a misję rozpoczynasz od nowa.

Menu **ZAPIS** pozwala eksportować / importować JSON. Użyj eksportu przed zmianą nazwy pliku, wersji, przeglądarki lub komputera: localStorage może być odrębny dla różnych lokalnych plików. Gdy przeglądarka blokuje localStorage, gra zgłasza to w HUD; nadal można wyeksportować zapis. Nowa kampania wymaga potwierdzenia zastąpienia progresu.

## Sprawdzenie v4

Sprawdzono w systemowym Chromium z Playwright: start z pokładu i misje, brak załogi w walce, warianty przeciwników, apteczki, powrót po żniwach, zakup ulepszeń, odtworzenie aktywnej misji po przeładowaniu, relacje, QTE (sukces i porażka), odblokowanie czterech map, Omegę, obie fazy Zwiastuna i zakończenie kampanii. Sprawdzono renderowanie na desktopie i wąskim ekranie. Sterowanie walką wymaga klawiatury i myszy.
