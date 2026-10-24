# Bulk Import: Pivot Wars — v12

Rozszerzenie pozostaje na gałęzi multiplayer. Nowe wydanie klienta to `Bulk-Import-Multiplayer-v12.html`; poprzedni HTML v11 i pełna kampania solo v10 pozostają zachowane. Format zapisu coop i protokół pokojów zachowują zgodność. Ten etap zmienia rzeczywiste zachowanie frakcji VS, nie tylko ich nazwy i wygląd.

## Asymetryczne zestawy i kontry

Bazowe HP, pojemność tarczy, obrażenia i tempo podstawowej broni oraz zwykły ruch pozostają równe. Różnią się ataki Q, umiejętności obronne F i parametry dasha. Kampanijne ulepszenia nadal nie dają przewagi w VS.

| Przycisk | Salesforce | Excel |
| --- | --- | --- |
| LPM | Celowane pociski Data Loadera | Lecące arkusze; ten sam bazowy potencjał obrażeń |
| Q | **Apex: SELECT * FROM WROGOWIE** — wąski pocisk zapytania, który może przebić dwa cele, zatrzymuje się na osłonach | **Tabela przestawna** — wskazane pole arkusza z ostrzeżeniem przed uderzeniem; trafienie zadaje obrażenia i krótko spowalnia |
| F | **Permission Set: NIE MASZ DOSTĘPU** — ograniczona osłona przednia, ze stałym kierunkiem i budżetem blokowanych obrażeń | **Cofnij: Ctrl+Z** — po krótkim czasie cofa ograniczoną część faktycznie poniesionych, świeżych strat życia i tarczy |
| C / R | **ZIPsert** — dłuższy dash, dłuższe odnowienie | **Przeciągnij komórkę** — krótszy dash, dostępny częściej |

Apex wymaga celowania; przeciwnik może zejść z linii albo schować się za osłoną. Tabela ma widoczne pole i czas na wyjście, dash lub schowanie się za przeszkodą. Kontrola widoczności dotyczy rzutu i obrażeń; tabela nie zabija przez ściany. Tarcza Salesforce chroni z przodu i wyczerpuje się, więc można ją obejść; nie zatrzymuje uderzenia tabeli z góry. Ctrl+Z nie wskrzesza, nie leczy ponad limity i nie może ponownie wykorzystywać tych samych strat ani zmieniać już odnowionej tarczy w leczenie dawnych ran.

Krótsze odnowienie dasha Excela rekompensuje mniejszy dystans. Oba dashe respektują kolizje i mają tę samą krótką ochronę. Brak teleportacji przez osłony, stałej nietykalności i globalnych ataków bez ostrzeżenia.

## Serwer i replikacja

Wszystkie czasy, trafienia, straty, osłony, limity leczenia i cooldowny liczy serwer. F jest nowym wejściem `secondary`; tak jak Q oraz dash wymaga nowego numeru sekwencji i odpowiedniego odnowienia. Odrodzenie i śmierć czyszczą stany tymczasowe, a autoryzowany reconnect nie odnawia zdrowia ani umiejętności.

Snapshot zawiera odnowienie F, kierunek i wytrzymałość osłony, opóźnienie Ctrl+Z oraz ograniczoną listę efektów. Pola tabel, trajektorie zapytań, bariera i cofnięcie obrażeń są widoczne dla obu drużyn. Renderer wykorzystuje stałe pule i instancjonowanie; nowe efekty nie tworzą materiałów ani geometrii w każdej klatce.

Metadane zestawów pochodzą ze wspólnych parametrów serwera i są osadzone w generowanym HTML. Lobby, HUD i instrukcja opisują realne moce, słabe strony i odnowienia. Pobrany HTML ma poprawne dane także wtedy, gdy przeglądarka nie może pobrać `/api/config` innego hosta.

Kooperacja zachowuje własną kampanię, skalowanie i dotychczasowy impuls Q z ulepszeniami. Nowa osłona F Salesforce służy również w coop; nie zmienia formatu checkpointów ani wyposażenia solo. Adaptery Node i Cloudflare korzystają z jednego silnika.

## Weryfikacja

Testy nowych mechanik przeszły: 13 scenariuszy zestawów frakcji obejmuje ostrzeżenia, opóźnienia i kontry, kąty i budżet bariery, świeże straty Ctrl+Z, częściowe leczenie apteczką, brak ponownego leczenia i zmiany slotów HP/tarczy, ograniczenia pól przez osłony, przebijanie dwóch celów i dodanie pełnych obrażeń Apex do normalnego ognia, odrodzenie i reconnect. Testy integracyjne Node potwierdziły Q/F na prawdziwych WebSocketach, ochronę sekwencji i walidację wejścia. Dwie przeglądarki potwierdziły sterowanie Q/F, odmienne efekty 3D, opisy, powrót po rozłączeniu, solo i coop. Renderowanie 600 zmian efektów nie tworzy nowych geometrii ani tekstur. Końcowy test lokalnego workerd również przeszedł: sześć WebSocketów, różne Apex/tabela/osłona, stan liczony przez serwer, poprawny reconnect oraz dostęp do solo. Pełne `npm test` zakończyło się wynikiem 36/36, bez pominiętych scenariuszy. Obejrzano zrzuty nowych efektów, lobby i układu mobilnego; nie wystąpiły błędy JavaScript ani pobieranie zewnętrznych assetów.

Symulacje 1v1 i 3v3 powinny obejmować różne ustawienia, nasiona oraz odwróconą kolejność graczy. Wynik pojedynczego bota nie jest dowodem doskonałego balansu dla ludzi. Parametry i ograniczenia są jawne w `multiplayer/shared.cjs`; przyszłe wyniki prawdziwych meczów mogą uzasadnić dalsze strojenie.

W 24 deterministycznych próbach z sześcioma nasionami, w 1v1 i 3v3, Salesforce uzyskał 32 eliminacje, a Excel 38 (45,7% eliminacji dla Salesforce). Odwrócenie kolejności przetwarzania frakcji przy zachowanych pozycjach odrodzenia nie zmieniło wyników żadnej pary. Model używa wspólnej polityki poruszania, przybliżonego celowania i reakcji co 133 ms; nie mierzy wyników ludzi. Test zawiera strażnik istotnej dominacji frakcji, a nie obietnicę idealnego wyniku 50/50.

Polecenia: `npm test`, `npm run test:balance`, `npm run test:browser`, `npm run test:cloudflare` przy uruchomionym lokalnym adapterze.
