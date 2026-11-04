# Changelog — Bulk Import

Historia zmian gry. Każde nowe wydanie otrzymuje osobny wpis na początku tego pliku, z datą, nazwą HTML, nowymi funkcjami, poprawkami i informacją o zgodności zapisów.

## v19.0.0 — 2026-11-04

Plik gry: [Bulk-Import-v19.html](Bulk-Import-v19.html).

- Przygotowano multiplayer CSV Double dla 2–4 osób: prywatne pokoje z kodem, lobby, gotowość, wspólny stos, punktacja i rewanże.
- Dodano serwerowe rozstrzyganie odpowiedzi, osobne kary, ukryte karty rywali, wspólną pauzę gospodarza i odzyskiwanie połączenia przez 30 s.
- Multiplayer CSV Double pozostaje wyłączony domyślnie. Lokalny HTML i GitHub Pages pokazują wyszarzone opcje; nie uruchomiono hostingu gry sieciowej, a alwaysdata nadal jest wstrzymane.
- Zachowano kampanię, pozostałe minigry, boty i dotychczasowe formaty zapisów. Publiczna strona solo oraz przycisk pobierania otrzymują v19 pod tym samym adresem.

## v18 — konfiguracja publikacji solo, 2026-11-04

- Przygotowano publiczną stronę GitHub Pages i automatyczne odświeżanie folderu `/docs` przy budowaniu kolejnych wydań.
- Dodano pobieranie oryginalnego HTML, zapis pod stałym adresem i uruchamianie solo bez serwera multiplayer.
- Włączenie Pages wymaga jednorazowego wyboru gałęzi i folderu w ustawieniach repozytorium. Mechaniki oraz numer gry pozostają v18; publikacja alwaysdata nadal jest wstrzymana.

## v18.0.0 — 2026-11-04

Plik gry: [Bulk-Import-v18.html](Bulk-Import-v18.html).

- Dodano szóstego grywalnego ptaka w Bird Game 3: Opium Birda z białym futrem i piórami, dwunożną sylwetką i zakrzywionym dziobem przypominającym maskę lekarza plagi.
- Dodano zamrażające dziobnięcie oraz Winter Release pod Q: kierunkowy lodowy oddech, aura spowalniająca i zamrażająca po dłuższym kontakcie, efekty lodu oraz odporność po odmarznięciu.
- Dostosowano wybór sześciu ptaków do telefonu i dodano żarty o zamrożonych rekordach, licencjach i ochronie arkusza.
- Zachowano klucze i formaty zapisów v16/v17, dotychczasowe rekordy oraz wszystkie tryby i minigry. Publikacja na alwaysdata pozostaje wstrzymana.

## v17.0.0 — 2026-10-30

Plik gry: [Bulk-Import-v17.html](Bulk-Import-v17.html).

- Dodano CSV Double wewnątrz Bird Game 3: 31 kart po 7 symboli, 1–3 botów i pięć trudności.
- Dodano karę za błędne kliknięcie, pauzę, dźwięki, trening, ustawienia czasów botów i ekran wyników.
- Powrót zachowuje stan Bird Game 3; starsze zapisy kampanii i pozostałe tryby pozostają zgodne.
- Wstrzymano publikowanie na alwaysdata; aktualizacja repozytorium nie wdraża gry na serwer.

## v16.0.0 — 2026-10-29

Plik gry: [Bulk-Import-v16.html](Bulk-Import-v16.html).

### Dodano

- **Gwintforce: Wojna rekordów** — minigrę karcianą Salesforce kontra Excel, dostępną w głównym terminalu statku po naciśnięciu **E**.
- Trzy rzędy, zwycięstwo po wygraniu dwóch rund, pasowanie oraz zachowanie niewykorzystanych kart między rundami. Między rundami dobierasz do dwóch kart.
- Zdolności kart: więzi, morale, szpiedzy, medycy, bohaterowie, pogoda, Keynote, podmiana i DELETE.
- Darmową talię startową z 20 kartami oraz edytor talii: 16–24 karty, w tym minimum 12 jednostek.
- Dziesięć kart kupowanych za kredyty kampanii w **Zbrojownia → Karty do Gwintforce / sklep**. Kupioną kartę trzeba dodać do talii w terminalu.
- Trzech rywali: Vaela, Syrę i ExcelBota. Załoganci grają, jeżeli pozostają na statku; ExcelBot jest zawsze dostępny. Pierwsze zwycięstwo z każdym rywalem daje unikalną kartę.

### Poprawiono w Bird Game 3

- Stały komunikat **„PEŁNY DZIÓB · 3/3 CSV”**, wskazujący konieczność powrotu do niebieskiego gniazda.
- Zapowiedź ataku bota czerwonym stożkiem. Przeciwnik blokuje kierunek i czeka 0,9 s (sowa: 1,05 s), więc można uciec, wzlecieć lub wykonać unik **C**.
- CSV na różnych wysokościach — część plików trzeba zbierać w locie. HUD pokazuje wysokość ptaka.
- Stałą pulę **12 CSV**: sześć w świecie i sześć początkowo u botów. Nowe pliki nie odrastają; pokonany ptak upuszcza wyłącznie swój ładunek.
- Odzyskiwanie przechowywanych danych rajdem na gniazdo przeciwników **Camp Cache**, aby wszystkie potrzebne CSV pozostały dostępne.
- Zbieranie mocą wrony uwzględnia wysokość plików i limit dzioba.

### Zapisy i uruchamianie

- Kolekcja kart, talia i liczba zwycięstw zapisują się z kampanią w localStorage i eksporcie JSON. Trwająca partia karciana nie jest zapisywana.
- Format zapisu solo pozostaje **10**, a kooperacji **1**. Starszy zapis bez kolekcji kart otrzymuje darmowy zestaw startowy, zachowując dotychczasowy postęp.
- Jeden HTML nadal zawiera kampanię i obie minigry. Lokalnie opcje multiplayer są wyszarzone; na serwerze dostępne są także kooperacja i VS.
- Obie minigry otwiera się przez terminal kampanii. Na czas rekreacji kampania jest zatrzymana; powrót przywraca ten sam terminal.

### Dla developera

- Dodano równoległą gałąź [dev/readable-source](https://github.com/mikita893/Bulk-Import/tree/dev/readable-source) ze sformatowanymi źródłami, komentarzami, konfiguracją Prettiera i przewodnikiem `DEVELOPMENT.md`.
- Weryfikacja wydania obejmowała 56 testów mechanik, zgodność zapisów, pełną partię karcianki w przeglądarce, zakup i zapis talii, tryb offline oraz rzeczywistych klientów multiplayer i lokalny adapter Cloudflare.

### Konfiguracja hostingu — 2026-10-30 (gra pozostaje v16)

- Przygotowano automatyczne publikowanie pełnej gry na alwaysdata po pushu oraz instrukcję jednorazowego podłączenia konta.
- Dodano sprawdzanie wdrożonego commita, instalację przed przełączeniem oraz powrót do poprzedniej wersji po nieudanej kontroli.
- HTML i formaty zapisów pozostają bez zmian. Publikacja wymaga ustawienia danych konta w GitHubie; nie uruchomiono jeszcze serwera na alwaysdata.
