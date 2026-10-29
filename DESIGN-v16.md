# v16 — Gwintforce i skończona pula ptasich danych

Wydanie: `Bulk-Import-v16.html`, wspólna kampania i multiplayer. Minigry uruchamia się wyłącznie przez fizyczny terminal na statku (E). Nie mają osobnych pozycji w menu głównym. Przeglądarka lokalna nie łączy się z serwerem.

## Gwintforce: Wojna rekordów

Oryginalna karcianka inspirowana zasadami Gwinta: trzy rzędy, wygranie dwóch rund (maksymalnie trzy), pasowanie do końca rundy, zachowana ręka i dobór dwóch kart między rundami. Remis daje punkt obu stronom; możliwy remis partii. Szpieg trafia do wroga i dobiera dwie karty. Medyk odzyskuje zwykłą jednostkę ze stosu odrzuconych. Więzi, morale, pogoda, horn/Keynote, bohaterowie, podmiana i obustronny DELETE mają wspólną implementację dla gracza i AI.

20 darmowych kart startowych; talia 16–24 unikalnych kart, przynajmniej 12 jednostek. 10 kart kupowanych w zbrojowni za rzeczywiste kredyty kampanii. Zakup nie dodaje karty automatycznie do talii i jest jednorazowy. Trzej rywale: Vael i Syra, o ile pozostają w załodze, oraz zawsze dostępny ExcelBot. Pierwsze zwycięstwo nad każdym daje jedną ekskluzywną kartę. Powtórka nie tworzy nowych nagród ani kredytów. Wyjście podczas partii przerywa ją bez nagrody.

`minigames/cards-sim.js` zawiera katalog, walidację kolekcji, deterministyczne zasady i AI wybierające legalne akcje. `cards-game.js` odpowiada za UI, wybór celu i czas odpowiedzi AI, `cards-game.css` za stół i proceduralne ilustracje SVG. Kampania zarządza ekonomią i jednorazowym tokenem zakończenia partii; UI nie przyznaje sobie nagród samodzielnie.

Zapis: opcjonalne `progress.cards` z własnym `version:1`, `owned`, `deck`, `wins`, `claimed`. Główny format i klucz nadal v10. Brak pola w starym zapisie jest poprawny i uzupełniany zestawem startowym przy wczytaniu. Jawnie uszkodzona kolekcja jest odrzucana. JSON zawiera całą kolekcję. Stan rozgrywanej partii nie jest checkpointem; przy zamknięciu zostaje kolekcja, a partia się kończy.

## Bird Game 3

Pula na start: sześć plików w świecie (trzy na wysokości 3,5–5 m), po dwa u każdego z trzech botów = 12. Cel: dostarczyć minimum osiem. Nie ma zegara generującego nowe pliki. Pokonany ptak upuszcza wyłącznie swój ładunek, a po odrodzeniu ma pusty dziób. Boty odkładają pliki do skarbca Camp Cache; gracz może je odzyskać rajdem na czerwone gniazdo. Suma luźnych, niesionych, przechowanych i dostarczonych CSV jest stała. Wrona przestrzega wysokości i pojemności przy zbieraniu mocą Q.

Pełny dziób: stały złoty komunikat 3/3 na HUD, pojemność w panelu oraz throttlowany komunikat zdarzenia. Po zdeponowaniu ostrzeżenie znika. HUD pokazuje też wysokość i liczbę CSV w posiadaniu botów/bazy.

Bot rozpoczyna atak w pobliżu gracza, blokuje swój kierunek i pozycję oraz pokazuje czerwony sektor o rzeczywistym zasięgu i kącie trafienia. Przygotowanie trwa 0,9 s (sowa: 1,05 s). Obrażenia następują dopiero po nim, z ponownym sprawdzeniem sektora, wysokości i odporności gracza. Ruch, lot i unik C pozwalają uciec. Geometria sektorów jest współdzielona i nie powstaje w każdej klatce.

## Weryfikacja i czytelne źródła

Testy mechanik obejmują 60 deterministycznych partii, zachowanie wszystkich kart, zdolności, pasowanie, stare zapisy, zakupy, duplikaty nagród, brak odrastania CSV, lot i faktyczny unik. Test przeglądarkowy przechodzi przez fizyczny terminal, pełną partię, zakup i zapis talii oraz lokalny i serwerowy HTML. Testy multiplayera nadal sprawdzają rzeczywistych klientów.

Gałąź `dev/readable-source` jest utrzymywana równolegle od tego wydania: własne źródła są sformatowane, a `DEVELOPMENT.md` opisuje strukturę i synchronizację. Biblioteka Three.js i archiwalne HTML pozostają nietknięte.
