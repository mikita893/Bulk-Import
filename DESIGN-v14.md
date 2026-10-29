# Bulk Import v14: Bird Game 3 — ptaki kontra duplikaty

To nadal wspólne wydanie na gałęzi `feature/bulk-import-unified-v13`. Aktualnym plikiem jest **Bulk-Import-v14.html**; poprzedni HTML v13 pozostaje zachowany. Zmiana dotyczy minigry, jej opisu w menu oraz informacji o wymaganiu WebGL. Kampania, zapis solo, kooperacja i zestawy frakcji VS zachowują dotychczasowe mechaniki.

## Materiały referencyjne

Przeczytano publiczne materiały fanowskie i obejrzano zrzuty przedstawiające leśną scenę, ptaka na słupku, wybór postaci i latanie za ptakiem. To one wyznaczają kierunek, zamiast poprzedniej interpretacji jako lotu między kolumnami.

- [Fanowska strona ze zrzutami](https://github.com/t9mp/bird-game-3-site).
- [Menu z sową na słupku](https://github.com/t9mp/bird-game-3-site/blob/main/ss1.png).
- [Wybór P.I.G.E.O.N.](https://github.com/t9mp/bird-game-3-site/blob/main/ss3.png).
- [Widok lotu w lesie](https://github.com/t9mp/bird-game-3-site/blob/main/ss2.png).
- [Publiczna próba zamiany mema w grę](https://github.com/Abhi2049-glitch/Bird-game-3-Early-version-).

Zrzuty, film, modele i kod tych projektów nie są dołączone do gry. Własne modele proceduralne i grafika mają zachować lekki, samodzielny HTML. Nie jest to pełna komercyjna gra ze zrzutów ani nowy sieciowy matchmaking: UI wyraźnie oznacza **lokalną arenę z botami**.

## Wybór ptaka

Ekran wyboru ma animowany model na słupku w lesie, pięć portretów SVG, czytelne statystyki, opis mocy i żart o danym mainie. Wszystkie gatunki są od razu dostępne.

| Ptak | HP | Ruch | Dziób | Moc Q |
| --- | --- | --- | --- | --- |
| Gołąb / P.I.G.E.O.N. | 110 | 8,8 | 19 co 0,62 s | Duplicate Rule: sobowtór odciąga boty przez 3,5 s; odnowienie 9 s. |
| Wrona / Cache Master | 95 | 9,7 | 17 co 0,53 s | Cache & Carry: CSV z promienia 9 m i do jednego CSV od pobliskiego noszącego bota; limit 3; odnowienie 8 s. |
| Sowa / Nocny Audyt | 135 | 7,3 | 25 co 0,82 s | Spowolnienie na 3,5 s i 10 obrażeń botom do 9 m; odnowienie 10 s. |
| Koliber / Governor Limit | 75 | 12 | 11 co 0,32 s | Bulk API Burst: 32 obrażenia w promieniu 5 m; odnowienie 9 s. |
| Kaczka / Flow Builder | 120 | 8 | 20 co 0,66 s | Naprawczy Flow: do 24 HP i 18 osłony na 3 s; odnowienie 11 s. |

Różnice służą różnym sposobom zbierania i walki: szybkość ma koszt w życiu, wolniejsze ptaki są wytrzymalsze. To lokalna minigra, bez przenoszenia mocy lub punktów do głównego VS.

## Rozgrywka

W 120 sekund trzeba dostarczyć **8 CSV do niebieskiego gniazda**. Złote pliki zbiera się automatycznie blisko ziemi; w dziobie mieszczą się trzy. Każdy dostarczony plik daje 100 punktów, pokonany bot 25, a zwycięstwo dodaje premię za pozostały czas. Trzy próby obejmują odrodzenie w gnieździe. Boty zbierają dane, odwożą je do własnego obozu i atakują gracza, gdy jest blisko. Po ich pokonaniu wypadają niesione CSV.

WASD / strzałki sterują ruchem względem kamery, spacja wznoszeniem, Shift sprintem, J / LPM dziobnięciem, Q mocą, C unikiem, P / Escape pauzą, PPM obrotem kamery. Lot i sprint zużywają wytrzymałość; po wyczerpaniu trzeba zregenerować przynajmniej 30 punktów. Kolizje uwzględniają drzewa, skały, granice mapy i wysokość. Boty unikają przeszkód. Nad skałą można przelecieć.

Wszystkie boty i mecz są lokalne, więc połączenie sieciowe nie jest potrzebne. Na statku główna kampania pozostaje zamrożona za minigrą. Wyjście i powrót działają jak w v13. Stan ptasiego meczu nie jest kampanijnym checkpointem; zapisywany jest wybór postaci i rekord.

## Zasoby i zapis

`bird-sim.js` zawiera czystą symulację, `bird-render.js` renderer Three.js, `bird-game-3.js` UI i sterowanie. Drzewa i CSV używają instancjonowania. Modele ptaków, portrety, staw, gniazda i tekstury są generowane z kodu. Nie ma zewnętrznych modeli, zdjęć, fontów ani żądań sieciowych w trybie lokalnym. HTML pozostaje bliski 1 MB. Podgląd renderuje maksymalnie około 30 FPS; pauza zatrzymuje pętlę. Renderer zwalnia geometrię, materiały, tekstury i kontekst po zamknięciu minigry.

Klucz `bulk-import-bird-game-3-v1` pozostaje ten sam. Wartość ma teraz format **2**, z rekordem punktów, wynikami gatunków i wyborem ptaka. Stary rekord przelotów z formatu 1 przechodzi do `legacyBest` i jest wyświetlany jako archiwum v13. Kampania nadal ma format 10, a kooperacja format 1 — nie są nadpisywane ani resetowane.

## Sprawdzenie

- Dziewięć testów ptasiej symulacji: wybór, statystyki, CSV, pojemność, wysokość, depozyty, obrażenia, odnowienia, pięć mocy, sobowtór, kradzież, lot, stamina, unik, odrodzenie, pauza, zakończenie, budżety obiektów i migracja rekordów.
- Próba celu wszystkimi pięcioma ptakami z rzeczywistymi zasadami ruchu i zbierania.
- Testy przeglądarkowe wybierają wszystkie gatunki, uruchamiają moc wrony, lecą klawiaturą, dziobią bota i sprawdzają zamrożenie na pauzie, zachowanie rekordu oraz widok mobilny.
- Pełna dotychczasowa weryfikacja silnika multiplayer, dwóch przeglądarek, checkpointów i zapisów solo pozostaje w pakiecie: łącznie 45 testów logiki.

Tak jak w v13, zarządzany Chromium blokuje bezpośrednią nawigację `file://`; test wtedy otwiera zawartość pojedynczego HTML w pustym dokumencie bez dostępu do sieci. Nie zmienia polityki administratora. Nie utworzono ani nie uruchomiono nowego zewnętrznego hostingu.
