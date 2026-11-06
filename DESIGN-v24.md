# v24 — koniec Metro Import i Apex Souls: Klątwa Legacy

Metro Import kończy się dokładnie na **30 000 m**. Wynik punktowy (zawierający premie CSV) nie zastępuje przebiegniętego dystansu. Na HUD jest dystans do mety, pasek i sześć etapów. Co 5000 m zapisuje się checkpoint i wracają trzy serca; na trasie pojawiają się pojedyncze apteczki. Śmierć lub powrót do gry pozwala kontynuować od najwyższego checkpointu. Nowy bieg od zera jest opcjonalny, a odblokowanie pozostaje zachowane.

Przed metą kończy się generowanie przeszkód, pojawia się brama mety. Po jej przekroczeniu ruch zatrzymuje się, zapisuje się ukończenie i po krótkim komunikacie automatycznie otwiera się **Apex Souls: Klątwa Legacy**. Można też kliknąć wejście. Po powrocie do Metro gra czeka na tym samym ekranie; nie uruchamia się ponownie automatycznie. Nie ma skrótów w menu głównym ani terminalu: terminal → Bird Game 3 → CSV Double → ukończone Sudoku → Metro Import → 30 000 m → Apex Souls.

## Nowa gra 3D

To własna gra akcji inspirowana zasadami soulslike, z proceduralnymi rycerzami, ruinami i czarnym humorem o Salesforce/Excelu. Nie używa modeli, map ani postaci z Dark Souls/Elden Ring.

- **Przedsionek Null**, **Dziedziniec Rollbacku**, **Katedra Legacy**: strażnicy z mieczami, silniejszy rycerz, skrybowie z pociskami oraz **Lord Legacy — Pierwszy Administrator**. Bramy otwierają się po pokonaniu wszystkich strażników; przejście zapisuje następny punkt kontrolny.
- Lekki i mocny cios kosztują wytrzymałość; trafienie następuje w określonym momencie animacji i sprawdza zasięg oraz kierunek. Mocny cios przerywa zwykłych strażników. Boss nie daje się stale ogłuszać.
- Unik kosztuje wytrzymałość, ma krótki okres nietykalności i przemieszcza postać. Blok działa od przodu, zużywa wytrzymałość i przepuszcza część obrażeń. Czerwona zapowiedź oznacza kierunek i rzeczywisty obszar ataku. Nova bossa omija tarczę, ale można jej uniknąć.
- Trzy flakony leczą po chwili; trafienie może przerwać picie. Ogniska odnawiają życie i flakony, ale odradzają strażników. Za zdobyte run ID można kupić do ośmiu poziomów: życie, wytrzymałość i obrażenia. Ognisko nie działa przy wrogu w odległości poniżej pięciu metrów.
- Śmierć zostawia runy na ziemi, a gracz wraca do ogniska danej lokacji. Dotknięcie miejsca śmierci odzyskuje je; następna śmierć zastępuje dawną stratę. Poziom i odblokowane lokacje zostają.
- Lord Legacy ma trzy fazy przy 60% i 30% życia, szybsze i mocniejsze ataki oraz cykliczną novę. Zwycięstwo zapisuje się osobno; można rozpocząć nową podróż.

Sterowanie: **WASD/strzałki** ruch względem kamery, **J/LPM** lekki cios, **K** mocny cios, **spacja** unik, **F** przytrzymany blok, **R** flakon, **Q** namierzanie, **E** ognisko/brama, **Shift** sprint, **P/Escape** pauza, **PPM + przeciąganie** kamera. Na telefonie dostępne są przyciski ruchu i akcji.

## Zapis, wydajność i wydanie

Rekord Metro zachowuje klucz `bulk-import-metro-runner-v1` i wersję 1, dodając opcjonalne pola `bestDistance`, `checkpoint`, `completed`. Stary wynik i CSV są nadal czytane; ukończenie wymaga zapisanych 30 000 m. Apex Souls ma niezależny klucz `bulk-import-apex-souls-v1` i wersję 1: poziom, runy, lokacja, zgony, zwycięstwa i zgubione runy. Bieżąca walka po wczytaniu zaczyna się przy ognisku, a nie w połowie ciosu. Kampania solo pozostaje w formacie 10, kooperacja w 1, reszta minigier i nagrania v23 bez migracji. W lokalnych plikach pamięć zależy od przeglądarki i ścieżki; stały URL Pages zachowuje origin.

Każda gra ma oddzielny model, kontroler i renderer. Wejście do Apex Souls zamraża Metro, Sudoku, CSV Double, Bird i kampanię. Ukrycie karty/pauza zatrzymują walkę; wznowienie zeruje zegar. Wyjście zwalnia zdarzenia, audio, geometrię, materiały, tekstury i kontekst WebGL. Świat i części modeli korzystają z instancjonowania, geometria jest współdzielona, liczba pocisków ograniczona do 12, cząstek do 40, pikseli renderowania do 900 tys. Nie tworzymy geometrii w pętli. Dźwięki miecza i bloku działają lokalnie przez istniejący ograniczony mikser.

`tests/runner.test.cjs` sprawdza fizyczne przejście pełnych tras 30 km, checkpointy, leczenie i migrację. `tests/souls.test.cjs` sprawdza zasady walki, śmierć i runy, leczenie, ogniska, bramy oraz zwycięstwo nad wszystkimi fazami bossa bez ulepszeń za pomocą legalnych akcji. Test Chromium przechodzi całą ścieżkę wejścia, klawiaturę/dotyk, walkę, pauzę, ulepszenia, fazy bossa, zwycięstwo, zapis, powrót, budżet GPU i brak żądań offline. Test Pages sprawdza także nowe zagnieżdżenie w publicznej powłoce.

`Bulk-Import-v24.html` zawiera całość i działa offline. `npm run build:client` aktualizuje również GitHub Pages pod stałym adresem. CSV Double online pozostaje domyślnie wyłączone, a wdrożenie alwaysdata jest nadal wstrzymane.
