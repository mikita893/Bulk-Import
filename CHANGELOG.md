# Changelog — Bulk Import

Historia zmian gry. Każde nowe wydanie otrzymuje osobny wpis na początku tego pliku, z datą, nazwą HTML, nowymi funkcjami, poprawkami i informacją o zgodności zapisów.

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
