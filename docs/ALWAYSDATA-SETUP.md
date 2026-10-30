# alwaysdata: jednorazowa konfiguracja i automatyczne aktualizacje

Docelowy adres: **https://bulkimport.alwaysdata.net** (jeżeli nazwa `bulkimport` jest dostępna). Kampania, minigry, kooperacja i VS działają pod jednym adresem. Gracze nie zakładają kont. Konfigurację właściciela wykonujesz raz; kolejne publikacje uruchamia push z tego czatu do `feature/bulk-import-unified-v13`.

Gotowy workflow: [alwaysdata.yml](../.github/workflows/alwaysdata.yml). Wydanie gry pozostaje v16 — dodajemy konfigurację hostingu, bez zmiany HTML ani formatu zapisów.

## 1. Załóż konto Free

Wejdź na https://www.alwaysdata.com, wybierz **Free**, potwierdź email i utwórz konto hostingowe o nazwie **bulkimport**. Bez karty konto działa w [trybie ograniczonym](https://help.alwaysdata.com/en/docs/admin-billing/profile/restricted-mode/). Jeżeli nazwa jest zajęta, wybierz inną i użyj jej wszędzie zamiast `bulkimport`.

## 2. Ustaw SSH

W https://admin.alwaysdata.com otwórz **Remote access → SSH/SFTP**. Włącz dostęp SSH dla użytkownika **bulkimport** i ustaw mu hasło. Jeśli użytkownik już istnieje, edytuj go. To hasło SSH, nie hasło logowania do profilu alwaysdata.

Z tego samego panelu skopiuj odcisk klucza **ED25519 / SHA256** serwera SSH. Potrzebny jest sam fragment `SHA256:...`. Użyj odcisku pokazanego przez alwaysdata; automat porówna go przed wysłaniem hasła.

Jeżeli panel pokazuje odcisk w innym formacie, otwórz terminal pod https://ssh-bulkimport.alwaysdata.net, zaloguj się użytkownikiem SSH i uruchom:

```sh
bulk_host_key=$(mktemp)
ssh-keyscan -t ed25519 ssh-bulkimport.alwaysdata.net 2>/dev/null > "$bulk_host_key"
ssh-keygen -lf "$bulk_host_key" -E md5
ssh-keygen -lf "$bulk_host_key" -E sha256
rm -f "$bulk_host_key"
```

Porównaj odcisk MD5 z panelem, a do GitHuba skopiuj odpowiadający mu odcisk `SHA256:...`. Jeśli się nie zgadza, nie zapisuj go jako zaufanego.

## 3. Wybierz Node.js 22

W panelu alwaysdata: **Environment → Node.js → 22**.

## 4. Utwórz witrynę

Wejdź w **Web → Sites → Add a site** i ustaw:

| Pole | Wartość |
| --- | --- |
| Name | Bulk Import |
| Addresses | `bulkimport.alwaysdata.net` |
| Type | **Node.js** |
| Command | `node /home/bulkimport/bulk-import/current/deploy/alwaysdata/start.cjs` |
| Advanced → Idle time | **0** |

Zapisz. Katalogi i pliki utworzy automat podczas pierwszej publikacji, więc witryna może do tego czasu pokazywać błąd startu. Własnej domeny ani osobnego serwisu w **Advanced → Services** nie trzeba dodawać. Nasz jeden proces Node udostępnia zarówno HTML, jak i WebSocket `/ws`.

Zapisz **ID witryny**: liczbę widoczną przy edycji witryny, np. `123456` w adresie panelu `/site/123456/`. Nie jest to nazwa konta ani adres domeny.

## 5. Utwórz token API

W profilu alwaysdata włącz **two-factor authentication / 2FA**. Następnie w **Profile → Tokens** utwórz token, np. `Bulk Import GitHub`. API służy automatowi do restartowania tej witryny po przesłaniu gotowych plików.

## 6. Dodaj trzy zmienne w GitHubie

Otwórz:

https://github.com/mikita893/Bulk-Import/settings/variables/actions

Klikaj **New repository variable** i dodaj:

| Name | Value |
| --- | --- |
| `ALWAYSDATA_ACCOUNT` | `bulkimport` |
| `ALWAYSDATA_SITE_ID` | ID witryny z kroku 4, same cyfry |
| `ALWAYSDATA_SSH_FINGERPRINT` | Odcisk `SHA256:...` klucza ED25519 z kroku 2 |

Jeżeli użytkownik SSH nazywa się inaczej niż konto hostingowe, dodaj też `ALWAYSDATA_SSH_USER` z jego nazwą. W standardowej konfiguracji nie jest potrzebny.

## 7. Dodaj dwa sekrety

Otwórz:

https://github.com/mikita893/Bulk-Import/settings/secrets/actions

Klikaj **New repository secret** i dodaj:

| Name | Secret |
| --- | --- |
| `ALWAYSDATA_SSH_PASSWORD` | Hasło użytkownika SSH z kroku 2 |
| `ALWAYSDATA_API_TOKEN` | Token API z kroku 5 |

Hasła i token zapisuj w GitHub Secrets. Nie wklejaj ich do czatu ani do plików repozytorium. Nie musisz udostępniać asystentowi ich treści — GitHub Actions odczytuje je podczas publikacji.

## 8. Pierwsza publikacja z czatu

Otwórz zakładkę **Actions** repozytorium i włącz workflowy, jeżeli GitHub tego wymaga. Po zakończeniu kroków napisz w czacie: **„alwaysdata skonfigurowane”**.

Asystent może wtedy wykonać push uruchamiający pierwszą publikację. Samo zapisanie sekretów nie uruchamia workflowa. Nie musisz scalać gry do `main` ani uruchamiać terminala/Codespaces. Workflow uruchamia się po pushu na `feature/bulk-import-unified-v13`; nie zakładamy dostępności przycisku „Run workflow” dla pliku istniejącego tylko na tej gałęzi.

W **Actions → Publikuj grę na alwaysdata** zobaczysz testy i wdrożenie. Zielony wynik z wpisem **„Gra opublikowana”** oraz adresem w podsumowaniu oznacza, że nowa wersja odpowiedziała na kontrolę `/healthz`. Zielony przebieg z komunikatem **„Uzupełnij konfigurację alwaysdata”** oznacza, że sprawdzono grę, ale publikacja została pominięta.

## 9. Link do grania

Po udanym wdrożeniu wysyłasz znajomym:

**https://bulkimport.alwaysdata.net**

Pod tym adresem otwiera się aktualny HTML, kampania, obie minigry, kooperacja i VS. Wszyscy wchodzą bez logowania do GitHuba lub alwaysdata. Gospodarz tworzy pokój i podaje kod albo zaproszenie. Pobrany HTML nadal działa lokalnie z kampanią i minigrami, z wyłączonym multiplayerem.

## Kolejne aktualizacje

Piszesz tutaj, co zmienić. Asystent przygotowuje i testuje zmianę, wersjonowany HTML, krótki changelog i push na gałąź gry. Automat sprawdza kod, przygotowuje paczkę, instaluje tylko zależności produkcyjne, przełącza witrynę i weryfikuje dokładny commit przez `/healthz`. Link pozostaje ten sam. Gałąź `dev/readable-source` jest aktualizowana równolegle, ale nie uruchamia drugiego wdrożenia.

Pliki trafiają do `/home/bulkimport/bulk-import/releases/<commit>`, a `current` wskazuje aktywne wydanie. Nowa paczka jest instalowana przed przełączeniem. Przy nieudanej kontroli automat przywraca poprzedni katalog i restartuje witrynę, jeśli istnieje poprzednie wydanie i API jest dostępne. Pierwsza nieudana publikacja nie ma wcześniejszej wersji do przywrócenia. Zachowywane są co najmniej trzy najnowsze katalogi oraz aktywne i poprzednie wydanie; stare kopie są sprzątane dopiero po udanym wdrożeniu.

Aktualizacja lub restart przerywa aktywne mecze. Przed publikacją zakończcie mecz lub wyeksportujcie checkpoint kooperacji. Zapisy solo/kolekcji w przeglądarce i checkpointy JSON pozostają zgodne; po aktualizacji odświeżcie stronę.

## Utrzymanie i rozwiązywanie problemów

- Plan Free jest niekomercyjny: 1 GB dysku, 256 MB RAM i ¼ CPU. Działanie gry przy sześciu graczach trzeba sprawdzić na rzeczywistym hostingu; lokalne testy nie potwierdzają wydajności konta Free.
- Nowe konto wymaga logowania właściciela do panelu co 120 dni. Nie zakładaj, że sama gra lub automat zastąpią to logowanie.
- Błąd SSH: sprawdź hasło użytkownika **SSH/SFTP**, jego nazwę i odcisk **ED25519**. Automat nie wyłącza weryfikacji hosta.
- HTTP 401/403 przy restarcie: sprawdź token API, konto i ID witryny oraz uprawnienia profilu tokena.
- Błąd startu: sprawdź Node 22, komendę i logi witryny. Wrapper korzysta z `IP`/`HOST` oraz `PORT` nadanych przez alwaysdata; nie wpisuj własnego portu 3000.
- Kontrola `/healthz` nie przechodzi: sprawdź adres, logi i działanie konta w trybie ograniczonym. Nie publikuj danych dostępowych w zgłoszeniu.
- Na prywatnym repozytorium obowiązują limity bezpłatnego GitHub Actions. Pierwsze uruchomienie na alwaysdata wymaga faktycznej konfiguracji konta — samo przygotowanie tych plików niczego tam nie publikuje.

Oficjalne materiały: [Free](https://help.alwaysdata.com/en/docs/admin-billing/billing/public-cloud-prices/), [tryb ograniczony](https://help.alwaysdata.com/en/docs/admin-billing/profile/restricted-mode/), [Node.js](https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/), [SSH](https://help.alwaysdata.com/en/docs/web-hosting/remote-access/ssh/), [tokeny](https://help.alwaysdata.com/en/docs/admin-billing/profile/tokens/), [API](https://help.alwaysdata.com/en/docs/development/api/).
