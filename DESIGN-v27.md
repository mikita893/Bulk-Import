# v27 — Importic: Kolonia Legacy

Własna minigra RPG 3D inspirowana klimatem klasycznych górniczych kolonii fantasy: szorstki strażnik, drewniany obóz, las, ruiny, ruda, nauczyciel i kopalnia otoczona magiczną barierą. Własne postacie, dialogi, modele i portrety; brak pobieranych assetów. Całość w `Bulk-Import-v27.html`.

## Wejście z Vice Import

W Vice Import, przy południowym początku ulicy, stoi oznaczony portal **IMPORTIC / E**. Podejdź pieszo i użyj E. Alternatywnie wybierz **IMPORTIC · KOLONIA LEGACY** na jego ekranie wejścia lub pauzy. Nie trzeba kończyć samochodowej ani helikopterowej misji miasta. Brak osobnego trybu w menu i skrótu w terminalu kampanii.

Wejście zatrzymuje model, zegary, sterowanie, RAF i dźwięki Vice Import. Wszystkie wcześniejsze minigry i kampania pozostają zamrożone. Powrót przywraca ten sam samochód/helikopter/postać i etap misji; trwająca wcześniej gra czeka w pauzie na ręczne wznowienie. Nie ma automatycznego ponownego wejścia ani utraty pojazdu w locie.

## Fabuła i rozwój

1. **Borut, Strażnik Nulli:** trzy bryły rudy za otwarcie bramy. Osiem złóż w świecie jest skończonych. Wydobywanie trwa chwilę; odejście i trafienie mogą je przerwać. Strażnik przyznaje nagrodę i przepustkę tylko raz.
2. **Kora, Komendantka Importu:** wybierz Stary Obóz Walidacji (+15 życia i redukcja obrażeń), Nowy Obóz CSV (+4 obrażenia i szybszy ruch) albo Krąg Bulk API (dystansowy Ognisty Upsert). Jedna frakcja na wyprawę. Pozostałe frakcje mają obszarowy Krzyk Walidacji.
3. **Ruiny:** pokonaj dwa Wilki Błędnego Mapowania i wydobądź ze skrzyni Pieczęć External ID. Pozostałe stworzenia to CSV-jady i Poborca Licencji.
4. **Raport dla Kory:** oddanie pieczęci otwiera kopalnię, przyznaje rudę/XP i uruchamia finał.
5. **Nadzorca Wielkiego Importu:** finałowy przeciwnik z szybszą drugą fazą, czerwonymi zapowiedziami ataków i obszarową zdolnością omijającą blok. Po wygranej można zwiedzać dalej lub rozpocząć nową wyprawę.

Ruda jest walutą. Magda, Kowalka Hotfixów, sprzedaje Miecz Ręcznego Merge (+10 obrażeń), Kaftan Enterprise (redukcja obrażeń) i mikstury. Uprzejma albo bezczelna odpowiedź zmienia przychylność i wyraz portretu; wysoka przychylność obniża ceny, ujemna je podnosi. Nagroda za pierwszą odpowiedź u danego NPC nie może być powtarzana.

XP za walkę i zadania daje poziomy (do 8) i po 3 punkty nauki na poziom. Witold, Stary Administrator, uczy siły (+3 obrażeń za 1 PN) albo żywotności (+10 życia za 2 PN). Zakupy, koszty, limity i przychylność są walidowane przez model. Dziennik zawiera pięć etapów, a karta postaci pokazuje statystyki, ekwipunek i zasoby.

## Walka i sterowanie

Ciosy mają koszt wytrzymałości, zasięg, kierunek i opóźnioną chwilę trafienia. Mocny cios przerywa zwykłych przeciwników. Blok chroni z przodu, zużywa wytrzymałość i przepuszcza część obrażeń. Odskok ma krótki okres nietykalności. Mikstury leczą po animacji, którą można przerwać trafieniem. Magia zużywa skupienie, ma odnowienie, skończony zasięg i nie przechodzi przez ściany ani drzewa. Zdolności innych frakcji zużywają wytrzymałość.

**WASD/strzałki** — ruch; **Shift** — sprint; **J/LPM** — cios; **K** — mocny cios; **F** — przytrzymany blok; **spacja** — odskok; **R** — mikstura; **Q** — zdolność frakcji; **T** — namierzanie; **E** — rozmowa, ruda, skrzynia lub ognisko; **I** — dziennik; **C** — karta postaci; **P/Escape** — pauza/zamknięcie rozmowy; **PPM + przeciąganie** — obrót kamery. Telefon ma przyciski ruchu i akcji. Zmiana okna, pauza i wyjście czyszczą sterowanie.

Obóz jest bezpiecznym miejscem odpoczynku. Ognisko odnawia życie, zasoby i zapas co najmniej dwóch mikstur. Powalenie wraca do punktu przed bramą lub do obozu z zachowanymi zadaniami, rudą, wydobytymi złożami, ekwipunkiem, zabitymi przeciwnikami i nauką; niedokończona walka zaczyna się ponownie. Nie ma kosztu prób i blokady fabuły z powodu utraty rudy.

## Zapis i wydajność

Osobny klucz `bulk-import-colony-legacy-v1`, schema 1. Zapis obejmuje etap, przyjęcie zadania, frakcję, XP, PN, siłę/żywotność, sprzęt, rudę, mikstury, osiem złóż, identyfikatory pokonanych wrogów, jednorazowe powitania, przychylność, wygrane i powalenia. Walidacja sprawdza również zgodność wydanych PN z poziomem oraz bramki fabuły. Wczytanie odtwarza bezpieczny punkt, a nie trwający cios. Formaty wszystkich wcześniejszych gier są zachowane.

Model jest niezależny od DOM i Three.js, fizyka działa w małych krokach 1/120 s. Wspólne definicje terenu, budynków, drzew i obiektów służą kolizjom oraz renderingowi. Teren i propsy powstają raz, drzewa/mury/domy/ruda są instancjonowane, geometrie współdzielone. Pula magicznych pocisków ma limit 6, cząstek 40, renderowanie około 900 tys. pikseli. Wyjście zwalnia zdarzenia, audio, materiały, tekstury, geometrię i kontekst WebGL.

Testy modelu przechodzą całą historię wszystkimi trzema frakcjami legalnym sterowaniem, bez teleportowania i dopisywania życia. Sprawdzają też wydobycie, blokady, jednorazowe nagrody, dialogi, zakupy, naukę, walkę, magię, pauzę, powalenie i zapis. Chromium testuje prawdziwy portal, dialogi/portret, dziennik, wydobycie, zakupy, naukę, walkę i finał, dotyk, odtworzenie zapisu, zamrożone miasto, bezpieczny powrót i budżet geometrii. Pages sprawdza wejście z pauzy niezakończonej misji i prawdziwy localStorage także po odświeżeniu.

Publikacja publicznego solo nadal odbywa się przez GitHub Pages. Alwaysdata pozostaje wstrzymane, multiplayer CSV Double domyślnie wyłączony. Wszystkie wcześniejsze HTML pozostają w repozytorium.
