# v18: Opium Bird / Winter Release

Wejście pozostaje wspólne: kampania → terminal statku (E) → Bird Game 3 → Opium Bird. Nie dodajemy nowego kafelka ani oddzielnego trybu. CSV Double nadal otwiera się z wnętrza Bird Game 3.

## Postać i grafika

Szósty grywalny ptak ma wysoką, dwunożną sylwetkę, śnieżnobiałe futro i opadające pióra, ciemny zakrzywiony dziób przypominający maskę lekarza plagi oraz lodowoniebieskie oczy. Model i portret powstają z geometrii Three.js i SVG; nie wymagają obrazów ani pobierania zasobów. 56 piór tułowia to jedna instancjonowana siatka. Oddech korzysta z puli 32 drobin i współdzielonej geometrii, bez tworzenia obiektów co klatkę.

## Reguły mrozu

| Mechanika | Działanie |
| --- | --- |
| Statystyki | 125 HP, szybkość 7,6, dziobnięcie 16 obrażeń co 0,85 s |
| Dotyk dziobem | Trafienie zamraża na 0,8 s; trafienie musi przejść przez zwykłą ochronę obrażeń |
| Q: Winter Release | Odnowienie 12 s, przygotowanie 0,55 s, kierunek zablokowany w chwili aktywacji |
| Oddech | Stożek 80°, zasięg 10 m, różnica wysokości do 1,8 m, 12 obrażeń i zamrożenie na 1,8 s |
| Aura | Promień 5,5 m przez 3,8 s, uwzględnia wysokość, spowalnia do 38% prędkości bota |
| Dłuższy kontakt z aurą | 1,2 s ciągłego przebywania zamraża na 0,65 s; wyjście zeruje ekspozycję |
| Odmarznięcie | 2 s odporności na kolejne zamrożenie; nadal można otrzymać obrażenia i spowolnienie |

Mróz zatrzymuje ruch i rozpoczynanie ataków bota, przerywa istniejący zamach i nie przedłuża już trwającego zamrożenia. Respawn daje zwykłą ochronę. Śmierć gracza anuluje oddech i aurę. Zegar pauzy zatrzymuje wszystkie efekty; rendering nie rozstrzyga trafień. Zamrożenie nie generuje CSV ani nie zmienia skończonej puli 12 plików.

## Zapis i wydanie

Format Bird Game 3 nadal wynosi 2 pod kluczem `bulk-import-bird-game-3-v1`. Starszym rekordom dochodzi zerowy rekord Opium Birda; wybór i wynik nowego ptaka zapisują się tak samo jak pozostałych. Solo pozostaje w formacie 10, kooperacja w formacie 1. Wersje v16 i v17 są zgodne; zachowujemy ich HTML.

`Bulk-Import-v18.html` zawiera całą grę i nowe zasoby. Lokalnie multi jest wyłączone; na serwerze korzysta ze wspólnego klienta. `deploy/alwaysdata/settings.json` nadal ma `paused: true`: aktualizacja repozytorium nie publikuje gry na hostingu.

## Weryfikacja

`tests/bird-game.test.cjs` sprawdza stożek, wysokość i zasięg oddechu, opóźnienie trafienia, przerwanie ataku, odmarzanie, odporność, ekspozycję na aurę, pauzę, śmierć/respawn, pulę CSV i zachowanie starych rekordów. `tests/unified-browser.cjs` sprawdza rzeczywisty wybór Opium Birda, Q, widoczność oddechu/aury/lodu, pauzę i układ mobilny zarówno w samodzielnym HTML, jak i przez serwer. Pozostałe testy weryfikują kampanię, CSV Double, Gwintforce i multiplayer.
