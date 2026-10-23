# Bulk Import: Omega Alliance 3D — v8

Wymagania i mechaniki poprzednich wydań nadal obowiązują: [v5](DESIGN-v5.md), [optymalizacje v6](DESIGN-v6.md), [dialogi i kampania v7](DESIGN-v7.md). Samodzielne wydanie to `Bulk-Import-Omega-3D-v8.html`. Starsze pliki v4–v7 pozostają dostępne; nazwy kolejnych wydań nie mogą się powtarzać.

## Rozbudowana zbrojownia

Dotychczasowe wzmocnienie strzału i szybkostrzelność pozostają bez zmian. Dochodzi pięć ulepszeń; każde ma poziomy 0–5 i jest dostępne wyłącznie na statku, także pomiędzy żniwami.

| Ulepszenie | Zmiana za poziom | Poziom 5 | Cena następnego poziomu |
| --- | --- | --- | --- |
| Pancerz Enterprise | +25 maksymalnego życia, +3 leczenia apteczki | 225 HP, apteczka +50 HP | 300 × (obecny poziom + 1) CR |
| Tarcza Permission Set | +25 pojemności tarczy, szybsza regeneracja | 125 tarczy, 18 pkt/s | 340 × (obecny poziom + 1) CR |
| Poszycie Validation Rule | −6% obrażeń zadawanych życiu | 30% redukcji | 380 × (obecny poziom + 1) CR |
| Biotyka Apex Trigger | +1,6 obrażeń efektu masy, −0,8 s odnowienia | +8 obrażeń, odnowienie 3 s | 325 × (obecny poziom + 1) CR |
| Unik Asynchronous Job | −0,25 s odnowienia uniku | unik co 1,25 s | 280 × (obecny poziom + 1) CR |

Wzmocnienie strzału nadal dodaje 0,7 obrażeń za poziom; akcelerator dodaje 22% bazowej szybkostrzelności. Każde kosztuje 275 × (obecny poziom + 1) CR. Efekt masy zachowuje dodatkowe 0,6 obrażeń za poziom wzmocnienia strzału.

Tarcza pochłania surowe obrażenia przed życiem. Pozostałe obrażenia życia są redukowane przez poszycie. Regeneracja tarczy rusza po czterech sekundach bez trafienia z szybkością 8 + 2 × poziom tarczy pkt/s. Bez zakupionej tarczy jej pojemność wynosi zero. Nie ma samoczynnej regeneracji życia; apteczki odnawiają się po 18 sekundach. Pauza, menu i QTE zatrzymują regenerację.

Zakup większej pojemności dodaje tylko różnicę pojemności do obecnego stanu: 50/100 HP po zakupie pancerza staje się 75/125 HP; 5/25 tarczy po zakupie kolejnego poziomu staje się 30/50. Pozostałe ulepszenia nie leczą. Nie można kupować podczas walki ani przekraczać piątego poziomu. Rozpoczęcie żniw i powrót na statek, tak jak wcześniej, odnawiają życie; teraz uwzględniają też zakupione tarcze i nowe limity.

Nieudane QTE indoktrynacji nadal odbiera bezpośrednio 20 HP. To kara za indoktrynację; omija tarczę i poszycie. Zwykłe trafienia zachowują krótką nietykalność, dźwięk i wstrząs kamery.

## Odejście załogi i konsekwencje wyborów

Gdy **jednocześnie przychylność i zaufanie osiągną 0%**, Vael lub Syra opuszcza statek. Jeden wyzerowany wskaźnik nie wystarcza. Aktywny romans z tą osobą się kończy. Nie można już prowadzić z nią rozmów ani korzystać z przeprosin; HUD i lista załogi pokazują odejście. Nie wolno pozostawiać jej modelu na pokładzie.

Osoba, która odeszła, pojawia się jako rozpoznawalny przeciwnik po następnym rozpoczęciu misji lub wznowieniu kolejnych żniw. Vael zachowuje proteańską sylwetkę w czerwieni i pomarańczu, Syra w różu; imię i pasek HP pomagają ich rozpoznać. Spotkanie jest jednorazową konsekwencją odejścia: po pokonaniu ta osoba już nie wraca. Śmierć bohatera przed wygraną zachowuje spotkanie do ponownej próby. Nie jest to towarzysz w walce: pozostali członkowie załogi zostają na statku. Przeciwnik podlega limitom liczby wrogów i mechanikom obrażeń, nie może blokować zakończenia żniw przez pominięcie go w warunku zwycięstwa.

Spotkanie nie zużywa zwykłej puli spawnu, ale respektuje limit 18 aktywnych przeciwników. Oczekujący przeciwnik musi pojawić się i zostać pokonany przed zaliczeniem żniw. Stan odejścia i oczekującego spotkania jest zapisywany. Wczytanie gry nie przywraca załoganta ani nie tworzy kolejnych kopii przeciwnika. Aktywne spotkanie odtwarza się razem z walką.

## Życie nad bohaterem

Nad bohaterem znajduje się pasek życia oraz pasek tarczy, jeśli została odblokowana. Pasek życia używa proporcji obecne HP / maksymalne HP, więc ulepszenie ponad 100 HP nie przepełnia wskaźnika. Tarcza korzysta z własnego limitu. HUD pokazuje wartości bieżące i maksymalne.

Paski muszą pozostać czytelne przy obrocie i przybliżaniu kamery. Nie dodawaj kosztownego modelu pola siłowego, świateł ani postprocessingu. Zachowaj instancjonowanie efektów, statyczny batching, tryby grafiki i symulację niezależną od FPS z v6/v7.

## Zapis i migracja

Nowy klucz localStorage: `bulk-import-omega-3d-v8`. Ustawienia grafiki nadal korzystają z `bulk-import-3d-settings`. Zapis obejmuje siedem ulepszeń, HP do nowego limitu, tarczę, czas oczekiwania na regenerację oraz stan odejścia i spotkań z dawną załogą.

Import JSON i odczyt starszego localStorage zachowują zgodność z v7 oraz wcześniejszymi v4–v6. Migracja nie nadpisuje źródłowego zapisu starszej wersji. W v7 zachowane są misje, broń, kredyty, relacje, historia dialogów i aktywna walka. Pięć nowych ulepszeń zaczyna od poziomu 0; brakujące tarcza i czas regeneracji zaczynają od 0. Bieżące HP z aktywnego zapisu nie są zmieniane w pełne leczenie. Gdy w starym zapisie oba wskaźniki relacji już wynoszą 0%, migracja oznacza odejście i przygotowuje spotkanie na następny start walki.

Pozostają wcześniejsze reguły: v5/v6 zachowują zgodną aktywną mapę 3D; v4 wraca na statek. Dawne więzi są przeliczane na procenty, partner otrzymuje co najmniej 85%/80%, ukończone dawne misje 0–3 pozostają ukończone. Dawne zwycięstwo nie zalicza nowego finału v7/v8.

Import jest walidowany przed zastąpieniem kampanii. Poza wcześniejszymi ograniczeniami sprawdzaj poziomy wszystkich ulepszeń 0–5, HP względem zakupionego pancerza, tarczę względem jej pojemności, czas regeneracji oraz spójność stanu odejścia. Wadliwy plik nie może zmienić bieżącej gry. Różne lokalne HTML-e mogą mieć oddzielne localStorage; eksport/import JSON pozostaje sposobem przenoszenia zapisu.

## Weryfikacja

Sprawdź zakup i limity wszystkich siedmiu ulepszeń, brak pełnego leczenia przez zakup, tarczę przed redukcją obrażeń, czterosekundowe oczekiwanie i ograniczenie regeneracji, leczenie powyżej 100 HP oraz QTE. Sprawdź odejście dopiero przy obu wskaźnikach 0%, zniknięcie z pokładu, jednorazowe spotkanie i jego zapis. Zweryfikuj paski nad bohaterem przy zmianach kamery i zapisy v8/v7/v4–v6. Ponownie sprawdź dotychczasową walkę, dialogi, kampanię, dźwięk, tryb Szybka i brak żądań do zewnętrznych zasobów.

Weryfikacja wydania: pełna regresja Chromium, walidacja zapisów i testy zegara symulacji przeszły. Potwierdzono też migracje rzeczywistych zapisów v4/v5, migrację v6/v7, odkrywanie v7 w localStorage, odejście wywołane odpowiedzią w dialogu, natychmiastowe usunięcie modelu i etykiety oraz kolejkę spotkania przy limicie 18 wrogów. Obejrzano zbrojownię i scenę z paskami nad bohaterem oraz wrogim Vaelem. Bezpośredni test file:// uniemożliwiła polityka zarządzanej przeglądarki przed załadowaniem HTML; test HTTP nie używał zasobów zewnętrznych.
