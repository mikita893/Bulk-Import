# Bulk Import: Duplicate Rage 3D — v10

Wymagania poprzednich wydań nadal obowiązują: [v5](DESIGN-v5.md), [optymalizacje v6](DESIGN-v6.md), [dialogi i kampania v7](DESIGN-v7.md), [wyposażenie i konsekwencje relacji v8](DESIGN-v8.md), [finał z Excelem v9](DESIGN-v9.md). Samodzielne wydanie to `Bulk-Import-Omega-3D-v10.html`; starsze pliki v4–v9 pozostają dostępne. Każda kolejna wersja musi mieć nową nazwę pliku.

## Widoczna nietykalność Excela

Osłona ma jednoznacznie pokazywać, że boss nie przyjmuje obrażeń. Wokół Excela znajduje się wypełniona, przezroczysta powłoka energii z siatką, jasnymi pierścieniami i etykietą **ARKUSZ CHRONIONY / NIETYKALNY**. Trafienie w aktywną osłonę powoduje krótki błysk. Strzały i efekt masy nadal zadają wtedy zero obrażeń.

Po aktywacji wsparcia Marca powłoka, pierścienie i etykieta nietykalności znikają. Koniec okna podatności przywraca osłonę. Jej wygląd ma odpowiadać stanowi obrażeń po rozpoczęciu walki, trafieniu, zmianie formy, wczytaniu zapisu i ponownym użyciu modelu z puli.

Powłoka korzysta z prostej geometrii i proceduralnej tekstury energii. Nie dodawaj dynamicznych świateł, postprocessingu ani geometrii tworzonych co klatkę. Zachowaj czytelność bossa wewnątrz powłoki.

## ZIPsert — specjalny dash pod C

Nowa umiejętność nazywa się **ZIPsert**. Jest dostępna obok dotychczasowego uniku R i efektu masy Q. Ma dwa ładunki, a każdy odnawia się osobno po `6,5 − 0,5 × poziom mobilności` sekundy, do minimum 4 sekund. Zapis przechowuje liczbę ładunków i czas pozostały do odnowienia następnego.

Dash porusza postać z prędkością 44 jednostek na sekundę przez 0,22 sekundy, co na otwartej przestrzeni daje około 10 jednostek. Daje 0,3 sekundy nietykalności. Kierunek wynika z ruchu względem kamery, a przy braku ruchu z kierunku celowania. Nadal obowiązują kolizje z osłonami i granice areny; dash nie może przenikać przez ściany.

Nie można wykonać ZIPserta w menu, podczas QTE ani bez ładunku. Rozpoczęty dash nie może zostać nadpisany kolejnym C lub unikiem R. Pauza i menu zatrzymują odnowienie. Rozpoczęcie starcia odnawia ładunki, a przejście do wściekłej formy również daje gotowy ZIPsert, aby można było zareagować na nową presję. W starszych zapisach brakujące pola otrzymują dwa ładunki i zerowy czas odnowienia.

HUD i sterowanie pokazują C, nazwę umiejętności, pozostałe ładunki i odnowienie. Efekt ruchu wykorzystuje dotychczasowe cząstki i dźwięki.

## Dwie formy jednego finału

Finał pozostaje w rozdziale 7. Nie ma podziału na żniwa, powrotu na statek pomiędzy formami, zwykłych przeciwników ani QTE indoktrynacji. Dotychczasowe pierwsze siedem misji zachowuje swoje zasady.

**Pierwsza forma zachowuje walkę z v9:** 2400 HP, trzy fazy wynikające z proporcji życia, te same ataki, obrażenia i czasy. Zmienia się czytelność osłony i dochodzi nowa umiejętność gracza. Pierwsze wyzerowanie HP nie daje nagrody za zabicie, nie zapisuje zwycięstwa i nie kończy misji.

Na tej samej arenie Excel przechodzi w **wściekłą formę z 3200 HP**. Nadal istnieje jeden przeciwnik typu `excel`; model zmienia wygląd na czerwony, uszkodzony arkusz. Nowa forma ma własne trzy fazy, szybsze i gęstsze wzory ataków oraz pociski przedstawiające zduplikowane dane. Kopie ataków mają czytelne ostrzeżenia i opóźnienie pozwalające na reakcję. Główne ataki zadają 62, 68 i 74 obrażenia przed ochroną gracza, a bazowe odstępy wynoszą 2,3, 2 i 1,75 sekundy w kolejnych fazach. Ostrzeżenia dają co najmniej 1,15 sekundy na reakcję. Rosnąca presja ma wymagać ZIPserta, uniku, dobrego wyposażenia i wykorzystywania pomocy Marca, a nie polegać na niewidocznych obrażeniach.

Przejście odnawia do 40 HP i 60 punktów tarczy, daje 1,5 sekundy nietykalności i 3 sekundy przerwy przed atakami oraz uzupełnia ZIPsert. Usuwa poprzednie ostrzeżenia i pociski, aby stary wzór nie nakładał się niespodziewanie na początek nowej formy. Dopiero pokonanie wściekłego Excela przyznaje końcową nagrodę i zwycięstwo kampanii v10.

## Marc i punkt kontrolny

Marc Benioff pozostaje fikcyjnym, satyrycznym hologramem. W obu formach jego pomoc jest wymagana do przełamania osłony. Gracz podchodzi do oznaczonego hologramu i naciska E. Pierwsza forma zachowuje okna podatności 9, 8 i 7 sekund oraz odnowienie do 30 HP i 45 punktów tarczy. Wściekły Excel pozostawia okna 6,5, 6 i 5,5 sekundy, z przerwą 6 sekund po ich zakończeniu. Pomoc nadal odnawia do 30 HP i 45 punktów tarczy; przerwa przed kolejnymi atakami po aktywacji wynosi 1,5 sekundy. Liczba użyć pomocy w nowej formie jest zapisywana osobno jako `rageHelpUsed`. Przegapione wydarzenie powraca; nie wolno trwale zablokować wygranej przez utratę pojedynczego sygnału.

Pokonanie pierwszej formy ustawia trwały znacznik `progress.excelFirstFormCleared`. To punkt kontrolny: po śmierci w drugiej formie kolejne rozpoczęcie finału prowadzi od razu do niej. Gracz nie musi powtarzać pierwszej formy ani wcześniejszych misji. Zapis aktywnego starcia nadal zachowuje bieżące HP i czasy; sam punkt kontrolny nie oznacza pokonania drugiej formy.

## Zapis i zgodność poprzednich wersji

Nowy klucz localStorage to `bulk-import-omega-3d-v10`, a ustawienia grafiki nadal korzystają z `bulk-import-3d-settings`. Eksport JSON zawiera numer wersji 10 i unikalny znacznik czasu. Migracja nie nadpisuje źródłowego zapisu.

Obsługuj co najmniej **v9 i v8**, zachowując migratory v4–v7. Zachowaj ukończone wcześniejsze misje, kredyty, wyposażenie, relacje, historię dialogów, partnera, odejścia załogi i zgodne aktywne walki.

Jeśli zapis v9 ma ukończonego Excela, migracja uznaje pierwszą formę za pokonaną: ustawia punkt kontrolny, pozostawia wcześniejsze rozdziały ukończone, a do wygrania pozostaje wyłącznie nowa wściekła forma. Dawne ukończenie rozdziału 7 nie oznacza pełnego zwycięstwa v10. Aktywna pierwsza walka z Excelem z v9 zachowuje jego HP, fazę i stan pomocy jako pierwsza forma. Zapis v8 po pokonaniu Zwiastuna odblokowuje finał, ale wymaga obu form Excela.

W aktywnym finale zapis obejmuje formę bossa, bieżące i maksymalne HP, fazę, wsparcie Marca, pociski wraz z oznaczeniami kopii, HP i tarczę gracza, apteczki oraz ładunki i odnowienie ZIPserta. Ostrzeżenia trwające przed wczytaniem są anulowane, aby nie zadawały niewidocznych zaległych obrażeń.

Walidacja musi zakończyć się przed zmianą kampanii. Sprawdzaj formę 1 lub 2, maksymalne HP zgodne z formą, fazę zgodną z HP, jeden model Excela, brak żniw i zwykłych przeciwników w finale oraz spójność punktu kontrolnego i zwycięstwa. Sprawdzaj też stan pomocy, oznaczenia duplikowanych pocisków, ładunki dasha 0–2 i poprawny czas odnowienia. Uszkodzony import nie może częściowo zastąpić bieżącego stanu.

## Wydajność i weryfikacja

Cała gra nadal mieści się w jednym HTML, bez zewnętrznych assetów. Modele, tarcza, tekstury, etykiety i dźwięki są proceduralne. Utrzymuj statyczne łączenie geometrii, instancjonowane pociski i ostrzeżenia, dotychczasowe limity obiektów, pamięć podręczną tekstur oraz zwalnianie zasobów przy zmianach mapy. Zachowaj symulację niezależną od FPS oraz tryby Auto, Szybka i Wysoka.

Test balansu na kodzie wydania przeszedł. Automatyczne porównanie dziewięciu kombinacji fazy i wzoru ataku potwierdziło, że pierwsza forma ma te same ostrzeżenia, czasy ładowania i rozstrzygane pociski co v9. Deterministyczny bot reagujący na ostrzeżenia wygrał z obiema formami oraz w osobnej próbie z samą wściekłą formą. Bot ignorujący ostrzeżenia przegrywa, a bez wsparcia Marca Excel nie otrzymuje obrażeń. Model ma idealne ciągłe celowanie i natychmiast aktywuje Marca w zasięgu; przybliża niektóre zegary i nie używa uniku R ani ZIPserta. Wyniki potwierdzają osiągalność zwycięstwa w modelu, nie przewidują skuteczności graczy.

Walidacja zapisów v10, testy zegara symulacji, symulacja balansu i regresja dotychczasowej kampanii przeszły. Końcowy test Chromium potwierdził widoczność osłony i etykiety nietykalności, błysk zablokowanego trafienia oraz znikanie osłony w oknie podatności. Sprawdzono ZIPsert uruchamiany klawiszem C, ładunki, kolizje i zapis umiejętności, pierwszy śmiertelny cios bez nagrody i bez końca misji, przejście do wściekłego Excela, opóźnione kopie ataków oraz zwycięstwo i ponowne wczytanie dopiero po drugim śmiertelnym ciosie.

Potwierdzono zapis punktu kontrolnego drugiej formy i odrzucanie niespójnych danych przed zmianą kampanii. Zwycięzca v9 przechodzi od razu do nowej formy, aktywna walka v9 zachowuje HP bossa i okno pomocy, a zwycięzca v8 rozpoczyna finał z obiema formami. Źródłowy zapis starszej wersji pozostaje zachowany. Regresja i końcowy test przeglądarkowy zakończyły się bez błędów JavaScript i bez żądań do zewnętrznych zasobów.

- `node tests/v10-state.test.cjs`
- `node tests/v10-excel-balance.test.cjs` — porównanie pierwszej formy z v9 i symulacja obu form.
- `node tests/frame-clock.test.cjs Bulk-Import-Omega-3D-v10.html`
- `node tests/v10-browser.test.cjs` — Playwright, systemowy Chromium i serwer na porcie 3000.
