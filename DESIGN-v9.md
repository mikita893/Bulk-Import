# Bulk Import: End of Sheet 3D — v9

Wymagania poprzednich wydań nadal obowiązują: [v5](DESIGN-v5.md), [optymalizacje v6](DESIGN-v6.md), [dialogi i kampania v7](DESIGN-v7.md), [wyposażenie i konsekwencje relacji v8](DESIGN-v8.md). Nowe samodzielne wydanie to `Bulk-Import-Omega-3D-v9.html`. Starsze pliki v4–v8 pozostają dostępne. Każde kolejne wydanie dostaje osobną nazwę z numerem wersji.

## Ostatni rozdział

Po pokonaniu Zwiastuna w Jądrze galaktyki odblokowuje się ósmy rozdział: **Excel: Koniec arkusza**. W zapisie ma indeks 7. Dotychczasowy Zwiastun pozostaje w rozdziale 6, a pierwsze siedem misji zachowuje swoje mapy, żniwa i zasady działania.

Finał to jedno ciągłe starcie z Excelem we własnej osobie. Nie ma podziału na żniwa, powrotów na statek pomiędzy fazami, zwykłych przeciwników ani QTE indoktrynacji. Excel ma **2400 HP i trzy fazy**, zmieniające się po utracie jednej i dwóch trzecich życia. Nie odnawia własnego HP. Pokonanie Excela kończy kampanię v9; sama wygrana ze Zwiastunem odblokowuje finał.

Boss ma postać wielkiego, uzbrojonego arkusza z twarzą utworzoną z komórek, ramionami i zieloną osłoną. Arena przypomina arkusz kalkulacyjny: nagłówki kolumn i wierszy, siatka komórek oraz komunikaty błędów. Układ osłon zostawia miejsce na uniki, dojście do apteczek i punktów wsparcia.

## Trudność i czytelność

Finał ma wymagać dobrego wyposażenia, opanowania ruchu i wykorzystywania pomocy, ale pozostawać możliwy do ukończenia przez doświadczonego gracza. Mocne ulepszenia ułatwiają przetrwanie; wcześniejsze misje można powtarzać po kredyty. Nie uzależniaj zwycięstwa od pojedynczego zdarzenia, które po przegapieniu już nie wraca.

Excel używa zapowiadanych wybuchów komórek i wierszy, wachlarzy pocisków oraz pierścieni z luką pozwalającą uniknąć trafienia. Kolejne fazy zwiększają presję. Ostrzeżenia mają dawać czas na reakcję; ataki nie mogą opierać się na niewidocznych lub natychmiastowych obrażeniach. Zmiana fazy daje krótką przerwę na odczytanie następnego wzoru. Nadal działają unik R, efekt masy Q, pancerz, tarcza, poszycie i apteczki.

W fazie III bazowy odstęp pomiędzy atakami wynosi 2,25 sekundy, a ostrzeżenia dają co najmniej 1,25 sekundy na reakcję. Trafienia głównych ataków w tej fazie zadają 62 obrażenia przed działaniem tarczy i poszycia. Sam maksymalny poziom wyposażenia nie zastępuje reagowania na ostrzeżenia.

## Obowiązkowe wsparcie Marca

Marc Benioff występuje jako fikcyjny, satyryczny hologram. Jego wejścia i wypowiedzi łączą humor Salesforce, importu danych i walki z Excelem: „No spreadsheets”, ratunkowe deploymenty i Permission Set do pokonania arkusza.

Excel jest odporny na strzały i efekt masy, dopóki Marc nie przełamie osłony. Pomoc wymaga świadomej akcji: podejścia do niebieskiego hologramu na odległość najwyżej 3,8 jednostki i naciśnięcia **E**. Po aktywacji Excel przyjmuje obrażenia przez 9 sekund w fazie I, 8 sekund w fazie II lub 7 sekund w fazie III. Wtedy hologram znika, a osłona bossa wyłącza się. Po wygaśnięciu okna osłona wraca i następuje kolejne wezwanie pomocy.

Wsparcie odnawia do **30 HP i 45 pkt tarczy**, nie przekraczając limitów wyposażenia. Daje chwilę ochrony, usuwa pobliskie pociski i przerywa bieżące ostrzeżenia bossa, aby można było rozpocząć kontratak. Nie leczy Excela.

Pierwszy sygnał pojawia się po krótkiej chwili od początku walki. Hologram jest dostępny przez 12 sekund. Jeśli gracz go nie wykorzysta, po przerwie pojawia się następna szansa. Utrata sygnału nie blokuje zwycięstwa. Komunikaty, panel odliczania i znacznik M na radarze pokazują, kiedy i gdzie można skorzystać z pomocy. W finalnym starciu klawisz E obsługuje pomoc Marca.

## Zapis i zgodność dwóch poprzednich wersji

Nowy klucz localStorage: `bulk-import-omega-3d-v9`. Ustawienia grafiki pozostają pod `bulk-import-3d-settings`. Eksport JSON dostaje numer wersji 9 i unikalny znacznik czasu. Oryginalne zapisy poprzednich wersji pozostają zachowane.

Import i przeniesienie z localStorage obsługują **co najmniej v8 i v7**, a migratory v4–v6 pozostają dostępne. Zapis v8 zachowuje kredyty, rekordy, eliminacje, ukończone misje, wszystkie siedem ulepszeń, relacje, historię dialogów, partnera i konsekwencje odejść. Zapis v7 zachowuje swoje dane, a pięć ulepszeń wprowadzonych w v8 otrzymuje poziom 0. Aktywne misje v7/v8 zachowują dotychczasowy postęp walki i HP postaci.

**Jeśli zapis v7 lub v8 ma ukończone Jądro galaktyki i pokonanego Zwiastuna, po migracji ukończone rozdziały 0–6 pozostają ukończone, a do końca gry pozostaje tylko Excel.** Nowy finał jest od razu odblokowany na mapie. Nie wymagaj ponownego przechodzenia wcześniejszych misji. Dawny znacznik wygranej kampanii nie zalicza nieistniejącego wówczas Excela: zwycięstwo v9 następuje dopiero po ukończeniu rozdziału 7. Dane starszej wersji nie mogą zawierać ukończenia nowego finału.

Migracja v5/v6 nadal zachowuje aktywną walkę na zgodnej mapie, a v4 wraca na statek. Ukończenie dawnej kampanii v4–v6 nie zalicza rozdziałów dodanych w późniejszych wersjach. Stare więzi i zwycięstwa są przenoszone według reguł v7/v8.

W aktywnym finale zapis obejmuje HP Excela, fazę, HP i tarczę gracza, pociski i apteczki oraz stan wsparcia: oczekiwanie, dostępny hologram lub trwające okno podatności, jego pozostały czas, współrzędne i liczbę użyć pomocy. Wczytanie nie może odnowić bossa ani zgubić koniecznego wsparcia. Ostrzeżenia rozpoczęte przed zapisem są anulowane, aby po wczytaniu nie zadawały niewidocznych zaległych obrażeń.

Walidacja poprzedza zastąpienie bieżącej kampanii. Sprawdzaj dotychczasowe limity misji, relacji i wyposażenia oraz spójność nowego finału: pojedynczy Excel, właściwe maksymalne HP, fazę zgodną z HP, brak podziału na żniwa i poprawne czasy wsparcia. Wadliwy import nie może częściowo zmienić gry. Różne lokalne pliki HTML mogą mieć oddzielne localStorage; eksport i import JSON umożliwiają przeniesienie zapisu.

## Wydajność i samodzielny plik

Cała gra nadal mieści się w jednym HTML. Modele, arena, portrety, etykiety i dźwięki są proceduralne; nie dodawaj żądań do zewnętrznych zasobów. Nowe modele korzystają ze statycznego łączenia geometrii, a etykiety i tekstury z pamięci podręcznej. Animacje bossa i hologramu nie mogą tworzyć geometrii ani tekstur w każdej klatce. Po zmianie mapy należy zwalniać zasoby należące do hologramu.

Zachowaj tryby Auto, Szybka i Wysoka, instancjonowanie efektów, limit ostrzeżeń i pocisków oraz symulację niezależną od FPS. Nie dodawaj dynamicznych świateł ani kosztownego postprocessingu do finału.

## Weryfikacja wydania

Walidacja zapisów v9 i testy zegara symulacji przeszły. Zakończono też regresję dotychczasowej kampanii, migracji i mechanik v8.

Deterministyczna symulacja balansu używa tego samego promienia trafienia bossa co gra. Bot z pełnym wyposażeniem, reagujący na ostrzeżenia i korzystający z okien pomocy, wygrywa. Bot ignorujący ostrzeżenia przegrywa mimo wyposażenia, a bez użycia pomocy nie zadaje Excelowi obrażeń. To sprawdzenie mechaniki i osiągalności zwycięstwa, nie wynik testów z udziałem graczy.

Końcowa weryfikacja Chromium przeszła. Potwierdzono migrację zwycięzcy v8 z zachowaniem danych i źródłowego klucza zapisu oraz odblokowaniem wyłącznie Excela. Sprawdzono aktywną walkę v8 z ulepszonym życiem i tarczą, konieczność użycia E przy Marcu, ponawianie pomocy, leczenie, okna podatności i ich zapis, wszystkie trzy fazy, zwycięstwo i ponowne wczytanie. Niespójny stan wsparcia i zduplikowany boss są odrzucane przed zmianą kampanii. Nie wystąpiły błędy JavaScript ani żądania do zewnętrznych zasobów. Obejrzano Excela, arenę i hologram Marca na desktopie oraz w układzie mobilnym.

- `node tests/v9-state.test.cjs`
- `node tests/v9-excel-balance.test.cjs` — symulacja balansu i konieczności wsparcia Marca.
- `node tests/frame-clock.test.cjs Bulk-Import-Omega-3D-v9.html`
- `node tests/v9-browser.test.cjs` — wymaga serwera na porcie 3000, Playwright i systemowego Chromium.
