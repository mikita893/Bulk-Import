# v20: Sudoku wewnątrz CSV Double

## Wejście i powrót

**Kampania → terminal statku E → Bird Game 3 → CSV Double → Sudoku · walidacja cyfr**. Przycisk jest częścią CSV Double. Nie ma nowego trybu w menu głównym ani skrótu na statku.

`BulkUnified.openSudoku` wymaga ekranu CSV Double i braku aktywnego pokoju online. Lokalna partia CSV Double przechodzi w pauzę; jej timery i obsługa klawiszy zostają zatrzymane. Powrót przywraca tę samą instancję, wynik, karty, karę i zegar. Wcześniej trwającą partię wznawia się ręcznie. Bird Game 3 oraz kampania pozostają zatrzymane przez cały czas. W pokoju sieciowym przycisk Sudoku jest wyłączony; zmiana minigry nie opuszcza ani nie pauzuje meczu innych graczy.

## Zasady i interfejs

Klasyczne Sudoku 9×9: cyfry 1–9 występują raz w każdym wierszu, kolumnie i bloku 3×3. Dane startowe są stałe; własne wpisy można zmieniać. Konflikty duplikatów podświetlają się od razu. **Sprawdź** wskazuje także wpisy niezgodne z rozwiązaniem. Gra nie karze za błędy i nie zużywa zasobów kampanii.

- Trzy poziomy celują w 42 / 35 / 29 pól startowych. To poziomy liczby wskazówek, bez deklarowania wymaganych technik rozwiązywania; czasami generator zostawia więcej danych, aby zachować jedno rozwiązanie.
- **Notatki / N** przełączają kandydatów w pustych polach. Wpisanie cyfry usuwa odpowiadające jej notatki z pól w tym samym wierszu, kolumnie lub bloku.
- **Cofnij** przywraca poprzedni wpis i notatki. Historia do 100 ruchów działa w bieżącym otwarciu minigry; po zamknięciu zachowujemy planszę, ale nie historię cofania. Cofnięcie podpowiedzi nie zmniejsza licznika jej użycia.
- **Podpowiedź** uzupełnia wybrane edytowalne pole albo następne niepoprawne/puste pole, nie nadpisując danych startowych.
- Mysz i dotyk wybierają pole oraz cyfry na klawiaturze ekranowej. Klawiatura: **1–9**, strzałki, **N**, **0 / Delete / Backspace**, **P / Escape**. Pola mają etykiety wiersza/kolumny, wyróżnienie wyboru i klawiaturową nawigację.
- Zegar działa tylko podczas aktywnej gry, zatrzymuje się przy pauzie, ukryciu/opuszczeniu okna i po ukończeniu planszy. UI zegara aktualizuje się cztery razy na sekundę, bez ciągłego przeliczania planszy.

## Generator i koszt działania

`minigames/sudoku-sim.js` tworzy poprawny pełny układ przez permutację cyfr, wierszy, kolumn i grup 3×3. Następnie usuwa wskazówki, akceptując usunięcie wyłącznie po sprawdzeniu, że pozostało dokładnie jedno rozwiązanie. Solver stosuje maski bitowe, wybór pola o najmniejszej liczbie kandydatów, zatrzymanie po dwóch rozwiązaniach i budżet węzłów. Przekroczenie budżetu odrzuca usunięcie; nie uznajemy nieukończonego sprawdzania za dowód jednoznaczności. Nie tworzymy zasobów ani nie szukamy rozwiązań co klatkę.

`minigames/sudoku-game.js` i `sudoku-game.css` odpowiadają za UI i zapis. Wszystko jest osadzone w tym samym HTML; brak bibliotek, obrazów i żądań do sieci.

## Zapis i zgodność

Klucz **`bulk-import-sudoku-v1`**, schema 1: dane startowe, własne cyfry, notatki, wybrane pole, tryb notatek, czas, poziom i liczba podpowiedzi. Odczyt waliduje rozmiary, zakresy i jednoznaczność planszy; błędny zapis nie blokuje pozostałej gry. Błędne wpisy gracza są zachowane, żeby dało się je poprawić. Brak localStorage pozostawia Sudoku grywalne w sesji.

To osobny zapis minigry, bez zmiany kampanii (solo 10, coop 1), Bird Game 3 i ustawień CSV Double. Nie dodajemy Sudoku do eksportu JSON kampanii. Publiczny adres Pages zachowuje postęp przy aktualizacjach; przeniesienie na inny adres, urządzenie lub osobny lokalny plik nie przenosi automatycznie localStorage.

## Wydanie i sprawdzanie

`Bulk-Import-v20.html` zachowuje poprzednie wydania i zawiera całą wspólną grę. Builder odświeża też `docs/index.html` na GitHub Pages. Multiplayer CSV Double nadal jest domyślnie wyłączony, a publikacja serwera alwaysdata wstrzymana.

`tests/sudoku.test.cjs` sprawdza znany układ, konflikty, niejednoznaczność, limity solvera, 60 generowanych plansz, poprawność ruchów, notatki, cofanie, podpowiedzi, ukończenie i zapis. `tests/sudoku-browser.cjs` sprawdza rzeczywiste wejście przez terminal i minigry, rozwiązanie planszy klawiaturą, pauzę zegara, układ mobilny, niezmienność nadrzędnych gier i odczyt po przeładowaniu. Test Pages sprawdza wejście do Sudoku bez backendu; test multiplayera sprawdza zakaz wejścia z aktywnego pokoju.
