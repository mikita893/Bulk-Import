# Gdzie uruchomić Bulk Import Multiplayer bez karty

Sprawdzono 24.10.2026. Do multiplayera potrzebny jest serwer WebSocket; sam GitHub Pages, Netlify Static lub otwarcie pliku HTML nie uruchomi wspólnej symulacji. Kampania solo nadal działa z własnego HTML. Gra nie została automatycznie opublikowana na żadnym koncie hostingowym.

**Rekomendacja: Cloudflare Workers Free + Durable Objects.** Repozytorium zawiera osobny adapter Cloudflare, więc nie trzeba samemu przepisywać serwera Node. Do okazjonalnego grania z kolegami prostą alternatywą jest **GitHub Codespaces na osobistym koncie Free**: uruchamiasz obecny serwer i udostępniasz port 3000.

| Opcja | Karta i bezpłatność | Gotowa do tego projektu | Najważniejsze ograniczenie |
| --- | --- | --- | --- |
| **Cloudflare Workers Free + Durable Objects** | Oficjalna rejestracja konta wymienia email, hasło i weryfikację emaila, bez kroku płatności. Durable Objects SQLite są dostępne na Free. | **Tak, przez adapter i `wrangler.jsonc`.** | Dzienne limity operacji i czasu obiektów; stan aktywnego meczu w pamięci może zniknąć po restarcie. |
| **GitHub Codespaces, osobiste konto Free** | **Można używać bez zapisanej metody płatności do wyczerpania bezpłatnego limitu.** Potem uruchamianie jest blokowane do odnowienia limitu. | **Tak, zwykłe `npm start` i publiczny port 3000.** | Około 60 godzin pracy maszyny 2-rdzeniowej miesięcznie, limity dysku, automatyczne zatrzymanie. To serwer na sesje, nie hosting 24/7. |
| **Render Free Web Service** | Oficjalne materiały potwierdzają Free Web Service. **Bieżącego wymogu karty przy rejestracji nie udało się potwierdzić.** | **Tak, zwykły serwer Node.** | Usypianie po bezczynności, jeden proces, nietrwały dysk; sprawdź warunek braku karty przed tworzeniem usługi. |

Formularzy rejestracji nie zakładano na żywo. Nie ma tu obietnicy, że dostawca nigdy nie poprosi konkretnego konta o dodatkową weryfikację. Wybieraj wyłącznie plan Free i nie aktywuj płatnego Workers Paid ani płatnych instancji.

## Cloudflare: zalecane wdrożenie

Gałąź do wdrożenia: [`feature/bulk-import-unified-v13`](https://github.com/mikita893/Bulk-Import/tree/feature/bulk-import-unified-v13).

1. Załóż i zweryfikuj bezpłatne konto Cloudflare. Wystarcza adres `workers.dev`; własna domena nie jest potrzebna.
2. Pobierz repozytorium i przełącz się na podaną gałąź. Użyj Node.js zgodnego z `package.json`.
3. W katalogu projektu uruchom:

   ```sh
   npm ci
   npx wrangler login
   npm run deploy:cloudflare
   ```

4. Wrangler wyświetli publiczny adres aplikacji. Wyślij go kolegom; gospodarz tworzy pokój, reszta wpisuje jego kod lub korzysta z linku zaproszenia.

`deploy:cloudflare` buduje pliki klienta i uruchamia `wrangler deploy`. Ręczny odpowiednik to `npm run build:cloudflare`, a następnie `npx wrangler deploy`. `wrangler.jsonc` deklaruje migrację SQLite dla Durable Object `GameRooms`. Ta konfiguracja jest potrzebna nawet wtedy, gdy aktywna rozgrywka jest przechowywana w pamięci. Nie zamieniaj migracji na starszy typ obiektów wymagający płatnego planu.

Do lokalnego sprawdzenia adaptera służy `npm run dev:cloudflare` na porcie 8787. Test rzeczywistego lokalnego runtime workerd potwierdził sześć połączeń WebSocket, mecz 3 na 3, kontrolę stanu po stronie serwera, wznowienie połączenia i udostępnianie kampanii solo. Uruchomienie tego polecenia nie publikuje gry na koncie Cloudflare.

Plan Free Durable Objects obejmuje **100 000 rozliczeniowych żądań dziennie i 13 000 GB-s czasu dziennie**. Przychodzące wiadomości WebSocket są naliczane w proporcji 20:1, a wychodzące nie są naliczane jako żądania. Worker ma osobne limity Free, m.in. 100 000 żądań dziennie. Intensywna, wielogodzinna gra zużywa pulę, mimo że nie wymaga płatnego serwera: przy sześciu graczach wysyłających po 20 wiadomości na sekundę same wejścia odpowiadają orientacyjnie 21 600 żądaniom DO na godzinę. Po przekroczeniu bezpłatnego limitu usługa może odrzucać operacje; Free nie zapewnia bezwarunkowej gry 24/7.

Obecny adapter kieruje pokoje do wspólnego obiektu, aby nie rozdzielić kolegów pomiędzy odizolowane instancje. Przy restarcie lub wymianie instancji aktywny mecz może się zakończyć. **Eksportuj postęp kampanii kooperacyjnej do JSON** przed przerwą; zapis pozwala przenieść postęp kampanii, a nie odtworzyć każdą klatkę przerwanej walki.

## GitHub Codespaces: najprostszy serwer na wieczór

Konfiguracja jest gotowa w repozytorium: **wznowienie Codespace automatycznie uruchamia grę**, a **Stop codespace** zatrzymuje całą maszynę. Zapis plików nie tworzy Codespace. Pierwsze utworzenie środowiska uruchamia maszynę i zaczyna zużywać pulę, więc zrób to dopiero przed graniem. Instrukcja Start/Stop: **[CODESPACES-START.md](CODESPACES-START.md)**.

1. Otwórz repozytorium na gałęzi multiplayer.
2. Wybierz **Code → Codespaces → … → New with options → Create codespace**. Dla osobistego konta Free wybierz maszynę **2-core**. Konfiguracja deklaruje minimum 2 rdzenie; wybór większej maszyny szybciej zużyje pulę.
3. Dołączony `.devcontainer` instaluje Node.js 22 i zależności produkcyjne. Po utworzeniu lub wznowieniu Codespace uruchamia grę automatycznie. Log działania znajduje się w `/tmp/bulk-import-server.log`; ponowne wywołanie pomocnika startowego wykorzystuje już działający serwer.

4. Otwórz zakładkę **Ports**, znajdź port **3000**, ustaw **Port Visibility → Public** i skopiuj jego adres przeglądarkowy. Dla serwera Node zostaw lokalny protokół HTTP; publiczny adres jest obsługiwany przez proxy GitHuba. Nie zmieniaj portu na lokalne HTTPS, jeśli aplikacja nie uruchamia własnego TLS.
5. Udostępnij adres kolegom. Po grze wyeksportuj checkpoint kooperacji i zatrzymaj całe środowisko na [github.com/codespaces](https://github.com/codespaces) przez **… → Stop codespace**. Zamknięcie terminalu pomocnika nie zatrzymuje serwera działającego w tle ani Codespace. Usuń niepotrzebne środowisko, aby nie zużywać limitu dysku.

Przy kolejnych sesjach wystarczy kliknąć nazwę tego samego środowiska na [github.com/codespaces](https://github.com/codespaces), a po grze wybrać **… → Stop codespace**. Edytor ma ustawione otwarcie strony gry po przekierowaniu portu; zachowaj też jej adres w zakładkach. Publiczną widoczność ustaw przy pierwszej konfiguracji, a potem sprawdzaj ją tylko w razie problemów z dostępem znajomych.

Oficjalna tabela osobistego GitHub Free obejmuje **120 godzin obliczeniowych i 15 GB-miesiąc**. Maszyna 2-rdzeniowa ma mnożnik 2, więc jest to około **60 rzeczywistych godzin pracy miesięcznie**, współdzielonych z innymi Twoimi Codespaces. Jeśli na koncie nie ma metody płatności, przekroczenie puli blokuje dalsze użycie zamiast wymagać kontynuacji płatnej.

Domyślny limit bezczynności to **30 minut**; w ustawieniach Codespaces można ustawić od 5 do 240 minut. Niezależnie od ustawienia pojedyncze uruchomienie ma maksymalny czas życia **12 godzin**. Nie zakładaj, że sam ruch graczy zawsze zapobiegnie zatrzymaniu środowiska. Po zatrzymaniu aplikacja nie działa, a aktywne pokoje w pamięci znikają. Publiczny port jest dostępny dla każdego, kto zna adres; nie publikuj go jako prywatnego sekretu.

## Render: prosty hosting Node, z niepotwierdzonym warunkiem karty

W oficjalnym repozytorium Render Agent Skills potwierdzono Free Web Services: **512 MB RAM**, **750 godzin instancji Free na workspace miesięcznie**, jeden proces, brak trwałych dysków i usypianie po około 15 minutach bezczynności. Dokumentacja repozytorium zawiera rozbieżne opisy przydziału CPU, dlatego nie zakładamy konkretnej wydajności na podstawie tych materiałów.

Aktualne strony rejestracji, cennika i pełnej dokumentacji Render były niedostępne z tego środowiska przez reguły sieciowe. Materiały GitHub nie potwierdzają jednoznacznie, czy nowe konto konkretnego użytkownika może uruchomić Free bez karty. **Dlatego Render jest tu alternatywą do sprawdzenia, a nie potwierdzoną odpowiedzią na warunek „bez karty”.** Jeśli formularz wymaga metody płatności, wybierz Cloudflare Free lub Codespaces.

Jeżeli Twoje konto pozwala utworzyć Free Web Service:

- repozytorium: `mikita893/Bulk-Import`;
- gałąź: `feature/bulk-import-unified-v13`;
- runtime: Node;
- build: `npm ci`;
- start: `npm start`;
- plan: **Free**, jedna instancja;
- aplikacja słucha na `0.0.0.0` i porcie z `PORT`, HTTPS/WSS kończy się na proxy dostawcy.

Nie dodawaj osobnego statycznego hostingu klienta na początek. Serwer gry obsługuje HTML i WebSocket pod tym samym adresem, co upraszcza połączenie. Restart, ponowne wdrożenie lub uśpienie może usunąć pokoje. Zapis kooperacji eksportuj do JSON; nie traktuj plików na Free jako trwałego dysku.

## Opcje odrzucone albo wymagające większych zmian

- **Northflank Developer Sandbox:** ma bezpłatny limit usług, ale aktualne oficjalne materiały mówią, że **wszyscy użytkownicy muszą dodać metodę płatności przed utworzeniem zasobów, niezależnie od planu**. Nie spełnia warunku bez karty/metody płatności.
- **Hugging Face Spaces:** obecna dokumentacja mówi, że tworzenie Docker i Gradio Spaces wymaga **płatnego planu PRO/Team/Enterprise**, mimo że sam wariant CPU Basic ma zerową stawkę godzinową. Darmowe Static Spaces nie uruchomią serwera WebSocket tej gry. Starsze poradniki o darmowym Docker Space dla nowego konta są nieaktualne.
- **Deno Deploy:** aktualny runtime obsługuje aplikacje Node, ale dokumentacja przewiduje wiele jednoczesnych, odizolowanych instancji bez wspólnej pamięci. Zwykłe pokoje serwera Node w RAM wymagałyby koordynacji lub pewnego kierowania wszystkich uczestników pokoju do jednej instancji. Bieżącego planu bez karty nie potwierdzono. Deno Deploy Classic zamknięto 20.07.2026; instrukcje dla Classic nie są właściwą instrukcją dla nowej aplikacji.
- **GitHub Pages / sam hosting plików:** dobry dla kampanii solo, niewystarczający dla autorytatywnego multiplayera.

## Źródła sprawdzone przy przygotowaniu porównania

Cloudflare:

- [Tworzenie bezpłatnego konta](https://developers.cloudflare.com/fundamentals/account/create-account/).
- [Durable Objects — plany i limity](https://developers.cloudflare.com/durable-objects/platform/pricing/) oraz [oficjalne źródło tabeli limitów](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/durable-objects/durable-objects-pricing.mdx).
- [Workers — cennik](https://developers.cloudflare.com/workers/platform/pricing/).
- [WebSockets w Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).

GitHub Codespaces:

- [Rozliczenia i bezpłatna pula](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces) — [oficjalny plik źródłowy](https://github.com/github/docs/blob/main/content/billing/concepts/product-billing/github-codespaces.md).
- [Udostępnianie portów](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace) — [źródło](https://github.com/github/docs/blob/main/content/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace.md).
- [Ustawienie czasu bezczynności](https://docs.github.com/en/codespaces/setting-your-user-preferences/setting-your-timeout-period-for-github-codespaces) — [źródło](https://github.com/github/docs/blob/main/content/codespaces/setting-your-user-preferences/setting-your-timeout-period-for-github-codespaces.md).

Pozostali dostawcy:

- [Render Web Services — oficjalne materiały](https://github.com/render-oss/skills/blob/main/skills/render-web-services/SKILL.md) i [limity Free](https://github.com/render-oss/skills/blob/main/skills/render-deploy/references/configuration-guide.md). Zweryfikowane repozytorium: commit `8675173` z 08.10.2026. [Przykład Node od Render](https://github.com/render-examples/express-hello-world).
- [Northflank — oficjalna dokumentacja rozliczeń](https://github.com/northflank/skills/blob/master/skills/northflank/references/guides/billing.md#pricing-on-northflank). Zweryfikowane repozytorium: commit `36d327e` z 20.10.2026.
- [Hugging Face Spaces — aktualne wymagania](https://github.com/huggingface/hub-docs/blob/main/docs/hub/spaces-overview.md).
- [Deno Deploy — aktualny runtime i izolacja instancji](https://github.com/denoland/docs/blob/main/deploy/reference/runtime.md) oraz [start i data zamknięcia Classic](https://github.com/denoland/docs/blob/main/deploy/getting_started.md).

Weryfikacja używała bieżących oficjalnych repozytoriów dokumentacji. Dostęp do stron Render i Northflank przez skonfigurowany proxy kończył się odmową polityki sieciowej; nie obchodzono tej blokady. Nie testowano rzeczywistych formularzy rejestracji ani nie uruchamiano płatnych zasobów.
