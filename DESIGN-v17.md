# v17 — CSV Double: Ptasie duplikaty

Wydanie `Bulk-Import-v17.html` zawiera nową minigrę refleksu otwieraną wyłącznie z Bird Game 3. Wejście do kampanii i ptasiej areny pozostaje w fizycznym terminalu statku. Powrót z CSV Double zachowuje model ptasiej rozgrywki, zapis rekordu, pozycje, ładunek i pozostały czas. Zatrzymana arena wymaga ręcznego wznowienia, aby uniknąć niespodziewanego ataku po powrocie. Kampania pozostaje zatrzymana przez obie warstwy rekreacji.

## Matematyka

Nie istnieje płaszczyzna rzutowa rzędu 6, więc nie generujemy fikcyjnej pełnej talii 43 kart po 7 symboli. `minigames/symbol-deck.js` tworzy PG(2,5): 25 linii nachylenia/przecięcia, 5 pionowych i linię w nieskończoności. Każda ma sześć punktów. Każda z 31 kart otrzymuje ponadto swój prywatny, niepowtarzalny symbol. Wynik: 31 kart po dokładnie siedem różnych symboli, 62 symbole ogółem i dokładnie jeden wspólny symbol dla dowolnej pary różnych kart. Automat sprawdza wszystkie 465 par.

Symbole są czytelnymi emoji dostępnymi w systemie, z polskimi nazwami i opisami dostępności. Nie ma zewnętrznych fontów, grafik ani bibliotek. Układ i delikatny obrót są deterministycznie mieszane niezależnie od generatora losowego silnika. Przed rozstrzygnięciem żaden wspólny symbol nie jest wyróżniany.

## Silnik i wyścigi

`symbol-sim.js` jest niezależny od DOM i animacji. Maszyna stanów: MENU, COUNTDOWN, PLAYING, ROUND_TRANSITION, PAUSED, GAME_OVER. Używa monotonicznego czasu logicznego, unikalnej sesji i rosnącego identyfikatora rundy. Boty otrzymują datowane zdarzenia, a silnik przetwarza je w kolejności chronologicznej, także przy dużym skoku czasu pomiędzy aktualizacjami. Dokładny remis czasowy odpowiedzi gracza z terminem bota jest rozstrzygany na rzecz już wymagalnego zdarzenia bota. Kolejność botów rozstrzyga ich równe terminy.

Jedna funkcja `answer` sprawdza kliknięcia, dotyk i klawiaturę. Odrzuca nieaktualne identyfikatory, przejścia kart, pauzę, karę i próby w odstępie poniżej 160 ms. Błąd nalicza karę 1, 1,5 lub 2 s. Kara nie znika po wygraniu rundy przez bota. Zdobyta karta daje dokładnie jeden punkt i staje się kartą zwycięzcy. Pozostali zachowują swoje karty. Przed grą rozdawane są karty uczestnikom, więc stos do zdobycia liczy 27–29 kart w pojedynku albo 30 w treningu.

Boty niezależnie losują czas na każdą rundę z ograniczonego rozkładu trójkątnego. Standardowe przedziały: 6–10 s, 4–6 s, 2,5–4 s, 1,5–2,5 s, 0,8–1,5 s. Menu pozwala ustawić własny przedział dla danego poziomu. Nie stosujemy ukrytego dopasowywania trudności. Osobny trening usuwa boty.

## UI i przechowywanie

`symbol-game.js` obsługuje menu, wejście, dźwięki Web Audio, terminarz i HUD. `setTimeout` uruchamia zdarzenia silnika; requestAnimationFrame aktualizuje wyłącznie wizualne odliczanie i pasek blokady. CSS odpowiada za przelot karty, zmianę punktów i informację o błędzie. Animacja nie przyznaje punktów ani nie rozstrzyga wyścigów. Ukrycie strony lub utrata fokusu zatrzymuje odliczanie, boty, przejścia i karę. Restart unieważnia starą sesję, czyści timery i zachowuje ustawienia.

Wyniki: wspólny ranking z obsługą remisu, liczba zdobytych kart, udział w stosie, poprawne/błędne odpowiedzi i średnia czasu poprawnych odpowiedzi. Dźwięk ma własny przełącznik i respektuje globalne wyciszenie gry. Dostępne są duże przyciski dotykowe, klawisze 1–7, P/Escape, focus klawiatury i ograniczanie animacji przez prefers-reduced-motion.

Ustawienia zapisują się w `bulk-import-csv-double-v1`. Nie zmieniamy formatu solo 10, co-op 1, kluczy ptasiego rekordu ani kolekcji Gwintforce. Gra pozostaje jednym HTML, bez zapytań sieciowych w trybie plikowym. Projekt zachowuje istniejący lekki stos JavaScript/CSS, ponieważ framework nie jest potrzebny do tego pojedynczego samodzielnego wydania.

## Publikowanie i weryfikacja

Publikacja alwaysdata jest jawnie zatrzymana w `deploy/alwaysdata/settings.json`. Kontrola działa przed odczytaniem danych konta i wywołaniem SSH. CI może sprawdzać nowy kod, ale nie publikuje go na hostingu. Repozytorium oraz czytelne źródła aktualizujemy normalnie.

Testy obejmują matematyczną talię, 150 deterministycznych partii, równe terminy gracz/bot, spam przycisków, karę przenoszoną do następnej rundy, pauzę podczas odliczania, gry i przejścia, restart w animacji, ostatnią kartę, remis oraz niezależność od częstotliwości renderowania. Test przeglądarkowy sprawdza rzeczywiste przyciski, klawiaturę, dotyk, menu, wyniki, zapisy ustawień i odtworzenie tej samej ptasiej areny. Pozostałe testy nadal obejmują pełną kampanię i prawdziwy multiplayer.
