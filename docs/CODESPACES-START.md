# Bulk Import: Codespaces gotowe do ręcznego uruchomienia

Konfiguracja jest zapisana w repozytorium. Samo zapisanie tych plików nie tworzy ani nie uruchamia Codespace i nie zużywa jego puli czasu ani dysku. Utworzenie Codespace od razu uruchamia maszynę, dlatego wykonaj poniższe kroki dopiero przed graniem. Kod gry pozostaje w wersji v12.

## Pierwsza sesja

1. Opcjonalnie ustaw **Default idle timeout** w [ustawieniach Codespaces](https://github.com/settings/codespaces), np. na 240 minut, i zapisz. To ustawienie obowiązuje nowo tworzone środowiska; domyślnie bezczynne środowisko zatrzymuje się po 30 minutach.
2. Otwórz [gałąź multiplayer](https://github.com/mikita893/Bulk-Import/tree/feature/bulk-import-multiplayer-v11). Nazwa gałęzi zawiera v11, a aktualna gra to v12.
3. Wybierz **Code → Codespaces → … → New with options**, gałąź `feature/bulk-import-multiplayer-v11`, maszynę **2-core** i najbliższy dostępny region. Utwórz Codespace na swoim osobistym koncie.
4. Poczekaj na konfigurację. Node.js 22 i zależności serwera instalują się automatycznie. Instalowane są tylko zależności do grania; narzędzia Cloudflare nie są potrzebne. Serwer gry czeka na ręczny start.
5. W edytorze wybierz **Terminal → Run Task… → Bulk Import: uruchom serwer**. Alternatywnie otwórz terminal i wpisz `npm start`. Wystarczy jedna z tych metod; komunikat `EADDRINUSE` oznacza zwykle, że serwer już działa.
6. Otwórz zakładkę **Ports** na dole edytora. Przy porcie **3000** wybierz prawym przyciskiem **Port Visibility → Public**. Jeżeli port nie jest widoczny, wybierz **Forward a Port** i wpisz `3000`.
7. Kliknij **Open in Browser** lub skopiuj **Forwarded Address** w postaci `https://…-3000.app.github.dev`. Lokalny protokół portu pozostaw **HTTP**; proxy GitHuba udostępnia publiczny adres przez HTTPS.
8. Na stronie gry wybierz kooperację albo VS, utwórz pokój i użyj **Kopiuj zaproszenie**. Znajomi otwierają ten link w swojej przeglądarce. Publiczny port nie wymaga ich logowania na GitHub. Coop obsługuje do 3 osób, VS równe składy do 3 na 3.

## Po grze i następna sesja

1. W kooperacji pobierz **Eksport checkpointu co-op** albo **Eksport kampanii co-op**. Aktywne pokoje są w pamięci serwera i znikają po jego zatrzymaniu.
2. Wejdź na [Twoje Codespaces](https://github.com/codespaces), przy tym środowisku wybierz **… → Stop codespace**. Zatrzymanie samej gry przez `Ctrl+C` lub zamknięcie karty przeglądarki nie zatrzymuje naliczania czasu działającego Codespace.
3. Przed kolejną sesją uruchom to samo środowisko, ponownie wybierz zadanie **Bulk Import: uruchom serwer** i sprawdź publiczną widoczność portu 3000. Utwórz pokój; zapis kooperacji przywrócisz przez **Import kampanii co-op**.

Osobiste GitHub Free obejmuje około **60 rzeczywistych godzin miesięcznie na 2-core** i **15 GB-miesiąc** dysku. Pula jest wspólna dla wszystkich Twoich Codespaces. Zatrzymane środowisko nadal zajmuje dysk; usuń je, gdy nie jest potrzebne. Bez zapisanej metody płatności wykorzystanie bezpłatnej puli blokuje dalsze użycie do jej odnowienia. Sama konfiguracja w repozytorium nie zmienia ustawień rozliczeń konta.

W razie problemów przy instalacji zależności otwórz terminal i uruchom `npm ci --omit=dev --ignore-scripts`, a następnie `npm start`. Istniejący Codespace utworzony ze starszą konfiguracją wymaga przebudowania kontenera (**Codespaces: Rebuild Container**), aby usunąć dawny automatyczny start gry. Przebudowę wykonuj dopiero w czasie zaplanowanej sesji.

Więcej informacji: [porównanie hostingów](HOSTING-MULTIPLAYER.md), [oficjalne limity Codespaces](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces), [udostępnianie portów](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace).
