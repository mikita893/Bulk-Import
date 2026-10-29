# Bulk Import: Start i Stop serwera

Konfiguracja uruchamia grę automatycznie przy starcie lub wznowieniu Codespace. Sam zapis plików w repozytorium nie tworzy ani nie uruchamia środowiska. Utwórz je dopiero przed graniem. Aktualne wspólne wydanie gry to v15.

## Na co dzień: tylko Start i Stop

1. Otwórz [github.com/codespaces](https://github.com/codespaces).
2. **START:** kliknij nazwę swojego Codespace z Bulk Import. GitHub wznowi maszynę, a serwer gry wystartuje automatycznie. Edytor ma ustawione otwarcie strony gry po przekierowaniu portu 3000. Jeżeli przeglądarka nie otworzy jej automatycznie, użyj zapisanego adresu gry albo **Ports → 3000 → Open in Browser**.
3. Graj ze znajomymi. Na stronie gry utwórz pokój i użyj **Kopiuj zaproszenie**. Coop obsługuje do 3 osób, VS równe składy do 3 na 3.
4. **STOP:** na [github.com/codespaces](https://github.com/codespaces) przy swoim środowisku wybierz **… → Stop codespace**. Zatrzymuje to grę i całą maszynę, więc przestaje zużywać czas pracy.

Przy kolejnych sesjach nie instalujesz zależności ani nie wpisujesz `npm start`. Używaj tego samego środowiska.

## Tylko pierwszy raz

1. Opcjonalnie ustaw **Default idle timeout** w [ustawieniach Codespaces](https://github.com/settings/codespaces), np. na 240 minut, i zapisz. Ustawienie obowiązuje nowo tworzone środowiska; domyślnie bezczynne środowisko zatrzymuje się po 30 minutach.
2. Otwórz [gałąź multiplayer](https://github.com/mikita893/Bulk-Import/tree/feature/bulk-import-unified-v13). Aktualny wspólny HTML zawiera kampanię solo, multiplayer i Bird Game 3.
3. Wybierz **Code → Codespaces → … → New with options**, gałąź `feature/bulk-import-unified-v13`, maszynę **2-core** i najbliższy dostępny region. Utwórz Codespace na swoim osobistym koncie. Ten krok od razu uruchamia maszynę.
4. Poczekaj na konfigurację. Node.js 22, zależności produkcyjne i serwer gry przygotują się automatycznie.
5. Na dole edytora otwórz **Ports**. Przy porcie **3000** wybierz prawym przyciskiem **Port Visibility → Public**. Jeżeli port nie jest widoczny, wybierz **Forward a Port** i wpisz `3000`.
6. Kliknij **Open in Browser** i zapisz adres gry w zakładkach. Adres ma postać `https://…-3000.app.github.dev`. Lokalny protokół pozostaw **HTTP**; proxy GitHuba udostępnia stronę przez HTTPS. Publiczny port umożliwia znajomym wejście bez logowania na GitHub.

Publiczną widoczność ustawiasz podczas pierwszej konfiguracji; jeśli znajomi później zobaczą ekran logowania, sprawdź ponownie **Port Visibility → Public**. Sam adres gry otwierany przez znajomych nie zastępuje wznowienia zatrzymanej maszyny przez gospodarza.

## Zapis i oszczędzanie puli

Przed zatrzymaniem serwera w kooperacji pobierz **Eksport checkpointu co-op** albo **Eksport kampanii co-op**. Aktywne pokoje są w pamięci i znikają po zatrzymaniu maszyny. Przy następnej sesji utwórz pokój, a zapis przywróć przez **Import kampanii co-op**.

Zamknięcie strony lub samego edytora nie zatrzymuje Codespace. Używaj **Stop codespace**. Domyślne usypianie następuje po 30 minutach bezczynności; sam ruch graczy nie musi go wyłączać. Pojedyncze uruchomienie ma maksymalny czas życia 12 godzin.

Osobiste GitHub Free obejmuje około **60 rzeczywistych godzin miesięcznie na 2-core** i **15 GB-miesiąc** dysku, wspólnych dla wszystkich Twoich Codespaces. Zatrzymane środowisko nadal zajmuje dysk; usuń je, gdy nie jest potrzebne. Bez zapisanej metody płatności wykorzystanie bezpłatnej puli blokuje dalsze użycie do jej odnowienia. Konfiguracja repozytorium nie zmienia ustawień rozliczeń konta.

## Gdy potrzebna jest naprawa

Jeżeli masz już Codespace utworzony ze starszą konfiguracją, pobierz najnowsze zmiany i raz przebuduj kontener przez **Codespaces: Rebuild Container** w palecie poleceń edytora. Wykonaj to przed graniem; kolejne wznowienia będą uruchamiać grę automatycznie.

Awaryjny przycisk w edytorze: **Terminal → Run Task… → Bulk Import: uruchom serwer**. Pomocnik sprawdza stan serwera i nie uruchamia kolejnej kopii, jeżeli właściwy serwer już działa. Log startu: `/tmp/bulk-import-server.log`. Ręczne `npm start` jest nadal dostępne, ale nie jest potrzebne do codziennego uruchamiania. Zatrzymanie terminalu zadania nie zatrzymuje serwera działającego w tle; do zakończenia sesji użyj **Stop codespace**.

Więcej informacji: [porównanie hostingów](HOSTING-MULTIPLAYER.md), [oficjalny Start i Stop Codespaces](https://docs.github.com/en/codespaces/developing-in-a-codespace/stopping-and-starting-a-codespace), [bezpłatna pula](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces).
