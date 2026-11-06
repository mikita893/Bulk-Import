# v26 — Grand Theft CSV: Vice Import

Nowa minigra 3D inspirowana miejskimi grami akcji. Własne miasto, pojazdy i postać Billy'ego Bulka, bez modeli, map, nagrań czy postaci z GTA. Wszystko jest proceduralne i osadzone w `Bulk-Import-v26.html`.

## Wejście po Apex Souls

Nowe pokonanie Lorda Legacy po krótkim komunikacie automatycznie otwiera Vice Import. Starszy zapis z `progress.wins > 0` otrzymuje przycisk wejścia w ekranach Apex Souls; nie trzeba ponownie pokonywać bossa. Wygrana pozostaje odblokowaniem także po rozpoczęciu następnej podróży.

Ścieżka: terminal statku → Bird Game 3 → CSV Double → ukończone Sudoku → Metro Import (25 000 punktów) → ukończone Apex Souls → Vice Import. Brak nowego kafelka w menu i skrótu w terminalu. Podczas pobytu w mieście wszystkie poprzednie gry są zamrożone. Powrót przywraca ten sam model Apex Souls; timer przejścia jest anulowany, więc nie wchodzimy do miasta ponownie automatycznie.

## Dwie misje i jazda swobodna

**Ostatni kurs Admina.** Podejdź do koralowego auta i wsiądź (E). Jedź po CSV przy żółtym znaczniku na północy. Po odbiorze pojawiają się dwie gwiazdki pościgu i samochody audytorów. Wróć na lądowisko H i zwolnij poniżej 25 km/h. Ukończenie daje 500 CR i checkpoint drugiej misji. Ruch uliczny, budynki i policja powodują kolizje; nie da się przejeżdżać przez ściany. Bulk Boost ma ograniczony zapas, odnawiany po puszczeniu klawisza.

**Demolka duplikatów.** Wsiądź do helikoptera na lądowisku. Własnoręcznie steruj lotem i wysokością. Wykonaj cztery zrzuty DELETE na różne różowe dachy, w dowolnej kolejności. Zawiś w promieniu 6 m od środka celu, na wysokości 3–14 m ponad dachem, z prędkością poziomą poniżej 36 km/h; wtedy F zrzuca ładunek. Zrzut nalicza się dopiero po fizycznym dotarciu paczki na dach. Daje 1000 CR, checkpoint i 20 sekund (do maks. 240 s).

Limit czterech minut rusza dopiero po wejściu do helikoptera. Kolizje uwzględniają wysokość budynków; wzlot ponad dach pozwala nad nimi przelecieć, ale opadanie nie przenika przez dach. Trzy drony audytu patrolują okolicę i zaznaczają czerwony obszar 1,4 s przed atakiem. Zmiana pozycji lub wysokości pozwala uniknąć skanu. Po ostatnim zrzucie wróć na H, opuść maszynę X i utrzymaj lądowanie przez 1,2 s. Dodatkowa nagroda to 2500 CR. Po zaliczeniu można zwiedzać miasto autem, pieszo lub helikopterem bez licznika misji albo rozpocząć nową historię.

Po kraksie lub wyczerpaniu czasu wznawiasz bieżącą misję. Wykonane zrzuty i zdobyte w niej kredyty zostają, pojazdy wracają do bazy, życie i limit czasu są odnawiane. Pierwsza misja zaczyna się od nowa, jeśli nie dostarczono jeszcze CSV. Nie ma kosztu kolejnych prób ani utraty odblokowania Apex Souls.

## Sterowanie i dźwięk

- Pieszo: WASD/strzałki — ruch, Shift — sprint, E — wsiądź.
- Auto: W/S — gaz/cofanie, A/D — kierownica, spacja — hamulec ręczny, Shift — Bulk Boost, E — wysiądź po zatrzymaniu, F — klakson.
- Helikopter: WASD/strzałki — lot w poziomie, spacja — wzlot, X — opadanie, F — zrzut. Puszczenie WASD hamuje do zawisu. Wysiadanie E wymaga lądowania w bazie.
- P/Escape — pauza, M/przycisk radia — prosta autorska muzyka syntezatorowa. Na telefonie działają przyciski ruchu, wzlotu, opadania, pojazdu i zrzutu.

Minimapa pokazuje postać/pojazd, policję, odbiór CSV, bazę i pozostałe dachy. HUD pokazuje cel, prędkość, wysokość oraz wysokość nad aktualnym dachem, licznik czasu, stan pojazdu, kredyty i gwiazdki pościgu. Radio wyświetla żarty o Salesforce, Excelu i migracjach. Nowe dźwięki drzwi, silnika, wirnika, klaksonu, syren, skanu i paczki korzystają z istniejącego ograniczonego miksera. Główne wyciszenie obejmuje je wszystkie. Pauza i wyjście przerywają dźwięk; bez usług sieciowych.

## Zapis, wydajność i kontrola

Osobny klucz `bulk-import-grand-theft-csv-v1`, schema 1: etap historii, cztery znaczniki zrzutów, kredyty, wygrane, kraksy i najlepszy czas lotu. Wczytanie wraca do bezpiecznego początku bieżącej misji z zachowanymi checkpointami; po finale odtwarza ekran zaliczenia. Kampania nadal używa schema 10, kooperacja 1; zapisy i odblokowania pozostałych minigier pozostają zgodne. Brak dostępu do localStorage nie blokuje bieżącej gry.

`city-sim.js` działa bez DOM/Three.js i używa kroków fizyki 1/120 s. `city-render.js` współdzieli geometrię, instancjonuje budynki, ulice, palmy, ruch i policję, ma stałe pule trzech dronów i 40 cząstek oraz limit około 950 tys. renderowanych pikseli. Nie tworzy geometrii w pętli. `city-game.js` obsługuje HUD, mapę, modalne ekrany, audio i wejście z klawiatury/dotyku; zwolnienie palca, pauza i utrata fokusu czyszczą sterowanie. Wyjście usuwa zdarzenia i zwalnia audio, tekstury, materiały, geometrię oraz kontekst WebGL.

Testy sprawdzają pełne ukończenie obu misji wyłącznie legalnym sterowaniem, kolizje i wysokość, ograniczony boost, reguły zrzutu, zapowiedź drona, zegary, retry, zapis, zwycięstwo i jazdę swobodną. Chromium przechodzi od zabicia bossa do miasta, sprawdza realne wejście do auta, jazdę, lot, dotyk, cztery zrzuty, fizyczną kraksę, checkpoint, lądowanie, wynik, odtworzenie i powroty do zamrożonych rodziców. Pages testuje tę samą grę bez backendu i z prawdziwym localStorage.

Nowy HTML i publiczna strona solo aktualizują się razem. Alwaysdata pozostaje wstrzymane, CSV Double online domyślnie wyłączone. Starsze wydania HTML zachowane.
