# Bulk Import: Omega Turbo 3D — v6

Wszystkie wymagania kampanii opisane w [DESIGN-v5.md](DESIGN-v5.md) nadal obowiązują. Wydanie v6 jest pojedynczym plikiem `Bulk-Import-Omega-3D-v6.html`. Nie zastępuj starszych plików do pobrania.

## Priorytet: płynność i prawidłowy czas

- Tempo symulacji musi być niezależne od liczby renderowanych klatek. v5 obcinała upływ czasu do 45 ms, przez co przy 10 FPS gra działała w zwolnionym tempie. v6 używa akumulatora i kroków 1/60 s, z maksymalnie 15 krokami nadrabiania po zacięciu.
- Ukryta karta nie renderuje ani nie nadrabia walki; powrót nie powoduje skoku czasu. Menu renderuje maksymalnie około 20 FPS. QTE nadal odlicza rzeczywisty czas aktywnej gry.
- Grafika ma trzy tryby: Auto (domyślnie), Szybka i Wysoka. Auto dopasowuje rozdzielczość do obserwowanej płynności; Szybka używa niższej rozdzielczości. Cienie dynamiczne są domyślnie wyłączone, dostępne w Wysokiej. Kontaktowe cienie pod postaciami pozostają.
- Nie przywracaj kosztownego PBR, cieni 2048², DPR 1,75, osobnych meshów iskier ani trzech obiektów na każdy pocisk jako ustawień domyślnych.
- Statyczne części statku i modeli są łączone według materiału. Zachowaj oddzielne animowane kończyny gracza, obroty retranslatorów, hologram, NPC i paski życia. Pociski i łupy używają InstancedMesh, iskry jednego Points. Modele przeciwników są ponownie wykorzystywane.
- HUD aktualizuje DOM tylko po zmianie, pełny odczyt podczas walki do 10 Hz, radar do 8 Hz. QTE nie przebudowuje całego panelu co klatkę. Efekty wizualne są ograniczone zależnie od jakości.

## Dynamika i dodatki v6

- R — unik w kierunku ruchu, a bez ruchu w kierunku celowania. Odnowienie 2,5 s, ruch 0,18 s i krótka nietykalność. Unik respektuje ściany i granice areny.
- TURBO CSV — złoty pakiet po co piątej eliminacji. Daje 6 sekund szybszego ognia (odstęp strzałów ×0,60). Ulepszenia szybkostrzelności nadal działają.
- Seria eliminacji — kolejne trafione cele w odstępie do 4 sekund zwiększają serię. Dodatkowe kredyty: +15 co trzy kolejne eliminacje, maksymalnie +75 za cel. Nowe żniwa resetują serię.
- Szybszy ruch, sprint, strzelanie i pojawianie się przeciwników. Wrogowie też są bardziej aktywni. Zachowaj apteczki, relacje, sklepy i przerwy na statku.
- Dodatkowe polskie żarty o Excelu, Salesforce, uprawnieniach, duplikatach, separatorach, governor limits i imporcie. Humor pojawia się w radiu, efektach serii, TURBO CSV i QTE.

## Zapisy

Klucz kampanii: `bulk-import-omega-3d-v6`. Ustawienia grafiki: `bulk-import-3d-settings`. Nie nadpisuj zapisu v5.

Import v5 przenosi również aktywną walkę 3D. Import v4 zachowuje progres i umieszcza gracza na statku 3D. Dodatkowe modyfikatory v6 (TURBO, odnowienie uniku, seria) są zapisywane. Eksport/import JSON nadal służy przenoszeniu kampanii między nazwami plików i przeglądarkami.

## Weryfikacja

- `node tests/frame-clock.test.cjs` sprawdza prawdziwy driver z dostarczanego HTML: 5–60 FPS, limit nadrabiania, ukrytą kartę i ograniczenie renderowania menu.
- `node tests/benchmark-3d.cjs Bulk-Import-Omega-3D-v6.html /tmp/perf-v6.json` uruchamia porównywalne sceny w Chromium/Playwright. Serwer musi działać na porcie 3000. Opcjonalny ostatni argument `fast` wybiera tryb Szybka. Playwright jest tylko narzędziem deweloperskim, nie zależnością gry.
- Wyniki lokalnego porównania zapisano w [benchmarks/v5-v6.json](benchmarks/v5-v6.json). Nie przedstawiaj ich jako gwarantowanego FPS na komputerze użytkownika. Porównanie Auto ma tę samą rozdzielczość; Szybka obniża rozdzielczość renderowania.
- `node tests/save-validation.test.cjs` sprawdza zgodność migracji i odrzucanie błędnych pól zapisu.
- Oprócz wymagań v5 sprawdzaj unik/kolizje/nietykalność, TURBO CSV, serię i premie, przełączanie jakości, import v5 i zachowanie modyfikatorów po przeładowaniu.
