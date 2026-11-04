# Publiczna wersja solo — GitHub Pages

Adres po włączeniu Pages: **https://mikita893.github.io/Bulk-Import/**.

Repozytorium jest publiczne. Gracze nie potrzebują konta GitHub, logowania ani karty płatniczej. Strona serwuje statyczny HTML z kampanią i wszystkimi minigrami; nie uruchamia serwera multiplayer ani alwaysdata. GitHub Pages ma własne limity transferu i budowania, więc nie jest hostingiem bez ograniczeń. Dla tej publicznej gry nie włączamy płatnego planu ani rozliczeń.

## Jednorazowe włączenie przez właściciela

1. Otwórz https://github.com/mikita893/Bulk-Import/settings/pages i zaloguj się jako właściciel repozytorium.
2. W **Build and deployment → Source** wybierz **Deploy from a branch**.
3. W polu **Branch** wybierz **feature/bulk-import-unified-v13**, a obok folder **/docs**.
4. Kliknij **Save**. Pierwsza publikacja może potrwać kilka minut. Jej stan widać w zakładce **Actions → pages build and deployment**, a po zakończeniu na stronie ustawień pojawi się przycisk **Visit site**.
5. Udostępniaj https://mikita893.github.io/Bulk-Import/ — odbiorcy wchodzą bez logowania. Właściciel loguje się tylko do zarządzania repozytorium i ustawieniami.

Ta jednorazowa zmiana wymaga uprawnień administratora repozytorium. Samo wypchnięcie plików nie włącza Pages. Do czasu zakończenia publikacji adres może zwracać 404.

## Kolejne aktualizacje z czatu

Zwykłe `npm run build:client` tworzy wersjonowany HTML i aktualizuje `docs/index.html` przez `deploy/pages/build.cjs`. Po commitcie i pushu na **feature/bulk-import-unified-v13** GitHub sam publikuje folder `/docs`. Nie trzeba zmieniać ustawień ani wysyłać znajomym nowego linku. Publikacja odbywa się z commita wypchniętego do repozytorium; nie wymaga tokena dostawcy hostingu ani workflow z prawami zapisu.

Nie zmieniaj źródła Pages na `main`, `/ (root)` ani `dev/readable-source`. Pozostałe pliki dokumentacji w `/docs` nie są automatycznie zamieniane w witrynę dzięki `.nojekyll`. GitHub udostępnia publicznie cały wybrany folder.

`docs/index.html` zawiera ten sam HTML gry wewnątrz ramki `srcdoc`. Dzięki protokołowi `about:` gra korzysta z istniejącego trybu lokalnego: multi jest wyszarzone, nie ma połączeń WebSocket ani pobierania konfiguracji. Ramka dziedziczy pochodzenie strony, więc localStorage działa pod stałym adresem i zachowuje postęp między wydaniami. Przyciskiem **Pobierz HTML vN** pobierasz dokładnie oryginalny plik `Bulk-Import-vN.html`. Nie ma osobnej wersji mechanik gry.

Zapis z pliku otwieranego lokalnie nie przenosi się sam na stronę. Wyeksportuj go do JSON w grze i zaimportuj na stronie. Wszystkie zapisy pozostają w przeglądarce gracza, bez synchronizacji między urządzeniami. Przy zmianie adresu strony lub wyczyszczeniu danych przeglądarki skorzystaj z własnej kopii JSON.

## Sprawdzenie przygotowanych plików

```sh
npm run build:pages
npm run test:pages
```

Test uruchamia zwykły serwer plików, bez backendu gry. Sprawdza wyszarzone multi i brak połączeń, wejście do kampanii i minigier przez terminal, zapis po przeładowaniu, pobranie oryginalnego HTML oraz układ mobilny.

Publikacja alwaysdata pozostaje niezależnie wstrzymana przez `deploy/alwaysdata/settings.json` (`paused: true`).
