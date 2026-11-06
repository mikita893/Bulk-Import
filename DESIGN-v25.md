# v25 — Metro Import: 25 000 punktów

Cel zmienia się z 30 000 metrów na **25 000 punktów**. Wynik obejmuje 1 pkt za każdy pełny metr i +25 pkt za każdy zebrany CSV, również przyciągnięty magnesem. Zbieranie plików pozwala ukończyć trasę w kilka minut. Model sprawdza próg także bezpośrednio po odebraniu CSV, więc premia od razu kończy bieg i uruchamia dotychczasowe przejście do Apex Souls. Wynik może przekroczyć próg; nie obcinamy zdobytych punktów.

HUD pokazuje wynik / 25 000 pkt, liczbę brakujących punktów i pasek liczony z wyniku. Dystans pozostaje statystyką. Instrukcje, ekran zwycięstwa, brama i ekran wejścia do Apex Souls używają punktów. Znika limit generowania przeszkód związany ze starą metą; po zwycięstwie model się zatrzymuje.

Rekord pozostaje pod `bulk-import-metro-runner-v1`, schema 1. Wcześniejszy wynik co najmniej 25 000 pkt odblokowuje przycisk Apex Souls od razu, bez kolejnego biegu. Zachowujemy też jawne ukończenie dawnej trasy 30 000 m. Stare checkpointy co 5000 m nadal można wczytać i korzystać z nich w długim biegu; nie są wymagane do zwycięstwa. Kampania, minigry, samodzielny zapis Apex Souls i wszystkie zasoby pozostają zgodne z v24.

Testy sprawdzają pozostanie w grze przy 24 999 pkt, przekroczenie progu premią CSV przy bardzo małym dystansie, punktację za sam dystans, jednorazowe zwycięstwo, migrację rekordów v23/v24, przejezdność i czas dwóch pełnych biegów poniżej czterech minut. Chromium i statyczna powłoka Pages sprawdzają automatyczne wejście po uzyskaniu punktów, zachowanie rodziców, zapis i powrót. Nowy plik: `Bulk-Import-v25.html`; starszych wydań nie zmieniamy.

GitHub Pages aktualizuje publiczne solo. Alwaysdata pozostaje wstrzymane, multiplayer CSV Double wyłączony domyślnie.
