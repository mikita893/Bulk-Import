# Bulk Import: Shared Universe — v11

Rozszerzenie powstaje na osobnej gałęzi `feature/bulk-import-multiplayer-v11`, bazującej na kompletnej wersji v10. Kampania solo nie jest przepisywana ani zastępowana uproszczonym trybem: zachowano oryginalny HTML i jego zapis. Nowy, samodzielny HTML klienta to `Bulk-Import-Multiplayer-v11.html`. Multiplayer wymaga dodatkowo serwera WebSocket.

## Sieć i sesje

HTTP i WebSocket korzystają ze wspólnego portu. Serwer symuluje rozgrywkę 30 razy na sekundę i publikuje stan 15 razy na sekundę. Klient wysyła kierunek ruchu, celowanie i przyciski; nie decyduje o zadanych obrażeniach, pozycji ani tempie strzelania. Sekwencje wejścia, wartości liczbowe, częstotliwość komunikatów, rozmiary wiadomości i pojemność pokojów są sprawdzane przez serwer.

Pokój ma kod zaproszenia, gospodarza i gotowość każdego gracza. VS wymaga równych zespołów i maksymalnie trzech osób na stronę. Coop mieści do trzech osób. Przy ponownym połączeniu prywatny token przywraca tę samą postać; sesja nie odnawia życia ani umiejętności. Token nie jest częścią publicznego linku lub danych innych graczy. Utrata gospodarza przenosi zarządzanie na połączonego uczestnika. Rozłączeni gracze nie sterują postacią; pozostają podatni na obrażenia. Całkowicie opustoszała drużyna VS po okresie na powrót przegrywa walkowerem.

## Salesforce kontra Excel

Dwie frakcje mają różne modele, nazwy umiejętności i kolory, ale identyczny zestaw parametrów liczbowych. Każda ma 140 HP, 40 tarczy, broń z 14 obrażeniami co 0,19 s, ten sam zasięg, ruch, sprint i dash oraz identyczny impuls Q. Tarcza regeneruje się po czterech sekundach bez trafienia. Nie ma importu wyposażenia kampanii, losowych bonusów jednej drużyny ani friendly fire.

Arena ma lustrzane osłony, spawny i neutralne apteczki. Eliminacja daje drużynie punkt. Gracz odradza się po pięciu sekundach. Warunek zwycięstwa to 15 punktów albo wyższy wynik po sześciu minutach; równy wynik oznacza remis. Kolejność graczy na serwerze nie może dawać przewagi w jednoczesnym pojedynku — sprawdza to test w obu kolejnościach.

## Osobna kampania kooperacyjna

Sześć misji: Deadlock-9, Archiwum Shared With Everyone, Fabryka INSERT zamiast UPSERT, Omega: globalny Permission Set, Jądro: konflikt wszystkich gałęzi oraz Excel Online: współdzielona katastrofa. Każda ma własny układ areny i stopniowo rosnącą trudność. Liczba oraz zdrowie przeciwników zależą od wielkości drużyny; jednocześnie obowiązują limity 24 wrogów, 180 pocisków i 10 ostrzeżeń.

Powalony gracz ma czas na ratunek. Kolega przytrzymuje E przez dwie sekundy w pobliżu; drużyna ma dodatkowo trzy wspólne pakiety awaryjnego odzyskiwania, aby samotny gracz lub jednocześnie powalona grupa nie utknęli w martwym stanie. Po wyczerpaniu możliwości ratunku misję można ponowić.

Kredyty i siedem ulepszeń są wspólne. Gospodarz kupuje je między starciami, a zmiany obejmują całą drużynę. Intermisja zatrzymuje przeciwników do decyzji o kolejnych żniwach. Po ukończeniu misji odblokowuje się następna. Finał to pojedynczy Excel Online z osłoną i wspólnym wsparciem Marca; zwykłe żniwa nie zastępują tego starcia. Pomoc Marca jest konieczna do zdjęcia osłony.

## Zachowanie postępu

Kampania solo zachowuje format i kompatybilność z v10, w tym wcześniejszymi v8/v9. Nie miesza się jej wyposażenia z multiplayerem. Coop używa osobnego, przenośnego checkpointu JSON obejmującego ukończone misje, odblokowania, kredyty i ulepszenia. Nie odtwarza aktywnych pocisków ani dokładnego momentu rozpoczętej misji. Lokalna kopia i eksport umożliwiają powrót po restarcie darmowego serwera.

Import checkpointu jest dostępny gospodarzowi w nowym lobby coop i jest walidowany przed zmianą stanu. Nie działa w VS. Jest to wspólna kampania znajomych, bez kont, płatnej ekonomii i globalnego rankingu; plik checkpointu nie stanowi dowodu osiągnięć w publicznym rankingu.

## Hosting i wydajność

Serwer Node oraz adapter Cloudflare Workers używają wspólnej obsługi pokojów i silnika. Adapter Workers centralizuje pokoje w jednym SQLite Durable Object. Aktywne pokoje pozostają w RAM; nie obiecuje się trwałości bieżącego meczu po restarcie procesu. Opis darmowych planów, limitów i wymagań kont znajduje się w `docs/HOSTING-MULTIPLAYER.md`.

Klient zachowuje proceduralne modele 3D i dźwięki, instancjonowane pociski, ograniczoną rozdzielczość i interpolację stanu. Nie tworzy sceny ani materiałów dla każdego pakietu sieciowego. Wszystkie zasoby klienta są osadzone w jednym HTML.

## Weryfikacja wydania

Testy zakończone: 13 scenariuszy silnika, trzy scenariusze integracyjne z rzeczywistymi WebSocketami i cztery scenariusze cyklu życia pokojów przeszły. Potwierdzono sześciu klientów VS 3v3, odrzucenie siódmego i nierównych drużyn, autorytatywne sterowanie, sekwencje, cooldowny i wznowienie sesji po numerze 5000 od zera bez leczenia. Testy coop obejmują ratowanie przytrzymanym E, wspólne zakupy, checkpoint JSON, uprawnienia gospodarza i przejście na inną mapę. Dwie przeglądarki widziały ten sam ruch i strzały; przeszły również dash, impuls, automatyczne ponowne połączenie, pełne odświeżenie, start coop i pobranie zapisu. Obejrzano lobby, VS, coop oraz układ mobilny, bez błędów JavaScript i zewnętrznych assetów. Lokalny workerd potwierdził sześć WebSocketów, 3v3, poprawne wznowienie i udostępnianie solo na adapterze Cloudflare. Testy zapisu oraz zegara niezmienionej kampanii v10 także przeszły.

Dodatkowa symulacja trzech postaci z wyposażeniem poziomu 3 ukończyła wszystkie sześć misji coop. Boty mają idealne celowanie i przewidują zagrożenia; wynik potwierdza osiągalność kampanii, nie stanowi pomiaru trudności dla ludzi.
