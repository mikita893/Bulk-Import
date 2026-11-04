# v19: CSV Double — przygotowany multiplayer

## Dostęp i stan publikacji

Wejście nadal prowadzi przez **kampanię → terminal statku E → Bird Game 3 → CSV Double**. Nie ma osobnego kafelka ani skrótu w głównym menu. W CSV Double pozostaje dotychczasowe solo z botami, pięć trudności, trening, ustawienia i dźwięk. Doszła sekcja gry ze znajomymi.

Na prośbę użytkownika multiplayer jest **wyłączony domyślnie**. Ani GitHub Pages, ani pobrany HTML nie otwierają połączeń sieciowych: przyciski utworzenia i dołączenia są wyszarzone. Nowa wersja solo jest publikowana normalnie. Alwaysdata pozostaje wstrzymane (`paused: true`).

Kod jest gotowy do przyszłego serwera, bez jego uruchamiania teraz. Dopiero wyraźnie włączona flaga `BULK_DOUBLE_MULTIPLAYER=1` w Node lub Workers udostępni `/ws/double` i oznaczy `features.csvDoubleMultiplayer: true` w `/api/config`. Bez flagi endpoint zwraca HTTP 503. Samo osadzenie kodu w HTML, budowanie i push nie aktywują trybu. Testy włączają flagę tylko na lokalnym serwerze.

## Rozgrywka

- 2–4 ludzi, bez botów w meczu sieciowym. Pokój ma sześcioznakowy kod, listę uczestników i gospodarza. Wszyscy zaznaczają gotowość; dołączenie gracza albo zmiana kary resetuje gotowość.
- Wspólne odliczanie 3 s. Każdy otrzymuje własną kartę, stos ma 31 minus liczba graczy kart. Każda karta ma siedem symboli i dokładnie jeden wspólny symbol z każdą inną kartą.
- Wszyscy odpowiadają jednocześnie. Pierwsza poprawna odpowiedź odebrana przez serwer przejmuje kartę; nie ma pierwszeństwa gospodarza ani zaufania do czasu podanego przez klienta. Opóźnienie Internetu wpływa na kolejność.
- Pomyłka blokuje tylko jej autora na 1 / 1,5 / 2 s. Blokada trwa także po przejęciu karty przez innego gracza. Klawisze 1–7, mysz i dotyk korzystają z tego samego serwerowego sprawdzania. Limit przyjętych prób wynosi jedną co 160 ms.
- Punkty, stan stosu, poprawne/błędne odpowiedzi, średnia reakcji i ranking po wyczerpaniu stosu oblicza serwer. Gospodarz może wrócić do lobby po rewanż; nowy mecz ponownie wymaga gotowości.

## Pauza i rozłączenia

Tylko gospodarz może wstrzymać lub wznowić mecz. Ukrycie karty przeglądarki nie zatrzymuje meczu innych osób. Zerwanie połączenia powoduje wspólną pauzę serwera na odzyskanie sesji do 30 s. Zegar, odliczanie, przejście kart i kary w tym czasie stoją.

Klient próbuje odzyskać tę samą sesję prywatnym tokenem (maksymalnie pięć prób); token jest związany z serwerem i pokojem oraz zapisany wyłącznie w sessionStorage danej karty przeglądarki. Nie trafia do kodu zaproszenia, publicznego URL ani wiadomości innych graczy. Ręczną pauzę gospodarza zachowuje także powrót gracza. Połączenie nie odnawia punktów ani kary.

Po 30 s bez powrotu lub po jawnym opuszczeniu stołu mecz jest przerwany bez przyznawania fikcyjnego zwycięstwa. Gospodarz może otworzyć nowe lobby. Po odejściu gospodarza rolę przejmuje połączony uczestnik. Wyjście do Bird Game 3 zamyka połączenie i przywraca tę samą, zatrzymaną ptasią arenę.

## Podział kodu i prywatność

`server/double-match.cjs` rozszerza istniejący `DoubleMatch`: ta sama talia, odliczanie, przejmowanie kart i przejścia, ale oddzielne liczniki oraz blokady ludzi. `server/double-rooms.cjs` obsługuje pokoje, transport, sesje, gotowość i odłączenia niezależnie od serwera strzelanki. Oba działają w Node i adapterze Workers; używają tego samego portu HTTP/WebSocket. Paczka alwaysdata zawiera niezbędne źródła talii i zasad.

Każdy klient otrzymuje tylko swoją kartę, środkową kartę, publiczne punkty i zdobytą wcześniej kartę. Nie wysyłamy seedów, przyszłego stosu, cudzych rąk ani tokenów. Kolejny numer sekwencji, numer meczu i numer rozdania odrzucają powtórzone/stare odpowiedzi. Klient nie może ustawić punktów, uczestnika ani zegara. Nazwy są ograniczone i w interfejsie kodowane jako tekst. Limity: 16 stołów, 64 połączenia, 4 osoby na stół, wiadomość do 2048 bajtów, 40 wiadomości na sekundę, ograniczony bufor wysyłania, heartbeat i usuwanie pustych sesji/pokojów.

`minigames/symbol-network.js` prowadzi lobby i połączenie, a `BulkDoubleRemoteView` udostępnia istniejącemu UI projekcję stanu serwera. Rendering i animacja licznika niczego nie punktują. Połączenie powstaje wyłącznie po świadomym utworzeniu, dołączeniu lub wznowieniu pokoju, gdy serwer udostępnia funkcję. Tryb solo korzysta z niezmienionego `symbol-sim.js`.

## Zapisy i kontrola

Nie zmieniamy kluczy ani formatów localStorage: solo 10, kooperacja 1, Bird Game 3 schema 2, CSV Double settings schema 1. Aktualne spotkania online istnieją w pamięci serwera; restart serwera usuwa pokoje, bez wpływu na zapis kampanii. Nie obiecujemy trwałego zapisu meczu sieciowego.

`tests/symbol-multiplayer.test.cjs` sprawdza odmowę połączenia przy wyłączonej funkcji, prawdziwe sockety, 2–4 graczy, prywatność, wyścig odpowiedzi, osobne kary, walidację, hosta, pauzę, tokeny, rozłączenia, rewanż, limity i 100 pełnych deterministycznych meczów. `tests/symbol-multiplayer-browser.cjs` rozgrywa pełny 29-kartowy mecz w dwóch prawdziwych przeglądarkach z lobby, pomyłką, wspólną pauzą, automatycznym odzyskaniem sesji, wynikami, rewanżem i ekranem mobilnym. Pozostałe testy chronią solo, Pages, kampanię i dotychczasowy multiplayer.
