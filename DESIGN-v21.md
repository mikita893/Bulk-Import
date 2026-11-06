# v21: zbrojownia i animacje kampanii

## Zakupy na kafelkach

Siedem kafelków zbrojowni jest przyciskami kupującymi kolejny poziom. Każdy pokazuje nazwę, pięć segmentów, aktualne statystyki, opis działania i cenę następnego zakupu. Wypełnienie odpowiada liczbie kupionych poziomów. Na maksymalnym poziomie pojawia się MAX, a przy braku kredytów informacja o brakującej kwocie; oba stany blokują zakup. Zduplikowane dolne przyciski usunięto. Sklep kart do Gwintforce i powrót na statek pozostają dostępne.

Kafelki obsługują mysz, dotyk oraz klawiaturę. Po zakupie lista zachowuje przewinięcie i fokus, jeżeli ten sam kafelek nadal jest dostępny. Poziom jest także opisany dla czytników ekranu. Ceny, limity i działanie `buyUpgrade` pozostają takie same: zakup pojemności dodaje wyłącznie zakupioną różnicę życia lub tarczy.

## Animowane modele

`campaign/enemy-models.js` tworzy modele przeciwników z osobnymi stawami nóg, ramion, skrzydeł i broni. `campaign/actor-animation.js` łączy nieruchome części według materiału, zachowując ruchome podgrupy. Zwykli przeciwnicy, elity, Zwiastun, gethy, huski, zbieracze, Banshee, zdrajcy i Excel korzystają ze wspólnego zestawu funkcji animacji.

- Faza chodu wynika z faktycznej drogi przebytej po mapie. Zatrzymany przeciwnik wygasza ruch kończyn zamiast maszerować w miejscu. Banshee unosi się i porusza ramionami, zbieracze mają pracujące skrzydła.
- Przyjęty przez symulację strzał uruchamia odrzut broni i błysk lufy; kontaktowe trafienie uruchamia zamach. Animacja nie tworzy dodatkowych pocisków ani obrażeń.
- Dane pozy znajdują się w `model.userData.animation`. Nie wchodzą do zapisu kampanii. Model pobrany z puli zeruje chód, odrzut i błysk.
- Animacje przeciwników aktualizuje stały krok walki; pauza zatrzymuje również pozy. Geometria i materiały powstają przy budowie modelu, a nie w pętli animacji.

## Unik R

Dotychczasowy unik otrzymał kierunkowy obrót całej sylwetki wokół środka postaci, lekkie uniesienie i błękitny ślad. Obrót trwa 0,32 s, ślad wygasa po 0,36 s. Jeden `InstancedMesh` obsługuje maksymalnie 12 znaczników; tryb szybki ponownie używa sześciu miejsc. Nie dodaje się geometrii ani świateł przy kolejnym uniku. Pauza zamraża efekt, a zmiana misji go czyści. Zasięg, prędkość, nietykalność i odnowienie pozostają niezmienione.

## Zgodność i sprawdzanie

Format kampanii solo nadal wynosi 10, z dotychczasowym kluczem localStorage i importem JSON. Nowe wydanie nie zmienia zapisów kooperacji ani minigier. `Bulk-Import-v21.html` działa samodzielnie offline; builder odświeża też stronę solo w `docs/index.html`. Multiplayer CSV Double pozostaje wyłączony, a wdrożenie alwaysdata wstrzymane.

`tests/campaign-presentation-browser.cjs` sprawdza rzeczywiste zakupy klawiaturą i dotykiem, segmenty, ceny, limity i pojemność życia. Scenariusze animacji sprawdzają ruch i postój, strzały, kontakt, przywracanie modeli, pauzę, zgodność zapisu, stałą liczbę geometrii GPU oraz naciśnięcie R z obrotem i śladem. Pozostałe testy sprawdzają zapisy, zegar, minigry, Pages i rzeczywistych klientów multiplayer.
