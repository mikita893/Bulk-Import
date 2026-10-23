# Bulk Import: Omega 3D — wymagania i zasady kolejnych wydań

## Wydania i repozytorium

- v5 jest napisana jako nowa gra 3D, w osobnej gałęzi `feature/bulk-import-omega-3d-v5`.
- Wersja 2D v4 została zachowana commitem `d4afe8e` na gałęzi `work` oraz w pliku `Bulk-Import-v4.html`.
- Każda następna wersja do pobrania musi otrzymać nową, niepowtarzającą się nazwę pliku z numerem wersji. Nie udostępniaj użytkownikowi pobrania pod nazwą `index.html`.
- Wydanie to jeden samodzielny plik HTML. Silnik Three.js, style, kod, geometria, tekstury i dźwięki są w pliku albo powstają proceduralnie; gra nie pobiera bibliotek, modeli, fontów ani grafik z sieci.
- `index.html` może kierować do najnowszego wydania, ale poprzednie pliki pozostają dostępne.

## Świat i styl

Kosmiczna gra akcji inspirowana klimatem Mass Effect. Gracz jest człowiekiem w futurystycznym pancerzu. Świat łączy Salesforce, czyszczenie rekordów, import danych, Data Loadera i kosmiczną walkę. Żniwiarze sprzedają Excela. Humor Salesforce i importowy jest obecny w radiu, opisach operacji, dialogach, QTE oraz komunikatach walki i leczenia. Zachowuj polski interfejs.

W v5: perspektywiczna kamera 3D, animowane postacie, modele przeciwników, światła, cienie, szklane burty statku, neonowe retranslatory, holograficzna mapa, planety i gwiazdy. Kamera obraca się prawym przyciskiem myszy; rolka zmienia przybliżenie. Ruch jest zgodny z kierunkiem kamery. Celowanie odbywa się kursorem na płaszczyźnie areny; broń strzela pociskami w świecie 3D.

## Wymagane mechaniki

1. Człowiek biega po statku i arenach, sprintuje, celuje i strzela. Osłony/życie, obrażenia, śmierć, powrót na statek i ponawianie misji.
2. Osłony i terminale blokują postacie i pociski. CSV daje rekordy i kredyty. Apteczki odnawiają do 35 HP, wracają po 18 s i nie zużywają się przy pełnym zdrowiu.
3. Efekt masy pod Q: obrażenia obszarowe, odrzut zwykłych przeciwników i usuwanie pobliskich pocisków, odnowienie 7 s. Retranslatory pod E przenoszą pomiędzy bokami areny, odnowienie 2 s.
4. Kampania składa się z kilku misji, każda z kilku **żniw**. Nie używaj „fala” w interfejsie zamiast „żniwa”.
5. Po żniwach następuje powrót na statek. Załoga występuje wyłącznie w bezpiecznej części statku, nigdy na arenie walki. Tam można spacerować, rozmawiać i kupować broń. Kolejne żniwa/misje uruchamia się z mapy statku.
6. Cztery różne mapy 3D: Sandbox-7 (3 żniwa), Archiwum Protean (3), Stocznia Zbieraczy (4), Jądro galaktyki (3). Zmieniają się przeszkody, kolory, otoczenie i obiekty.
7. Ulepszenia kupowane za kredyty między żniwami/misjami: moc oraz szybkostrzelność, po 5 poziomów. Koszt to 275 × nowy poziom. Ulepszenia przechodzą na kolejne misje.
8. Rodzaje przeciwników: Żniwiarz XLSX, mocniejsza czerwona elita z większą wytrzymałością/obrażeniami, złoty owadopodobny Zbieracz, ogromny Zwiastun. Modele muszą różnić się wizualnie.
9. Czerwony retranslator Omega na statku odblokowuje się po trzeciej misji i uruchamia skok do jądra galaktyki. Ostatnie żniwa czwartej misji zawierają bossfight ze Zwiastunem. Boss ma osobny pasek życia, szerokie salwy i agresywniejszą fazę poniżej połowy HP.
10. Proteanie Vael i Syra na statku. System rozmów i romansów: raz na osobę na każdy pobyt rozwój więzi, trzy rozmowy do propozycji związku, wzajemna zgoda, jeden aktywny związek, możliwość przyjaźni. Relacje są zapisywane.
11. Indoktrynacja Żniwiarzy wymaga QTE: cztery klawisze WASD w podanej kolejności w 5 s. Zły klawisz zabiera 0,7 s. Walka jest zatrzymana; utrata fokusu wstrzymuje QTE. Sukces: +40 CR; porażka: −20 HP. Nie wyłączaj tej mechaniki w testach gotowości.
12. localStorage zachowuje kampanię, misje, bieżące żniwa, życie, przeciwników/pociski, kredyty, ulepszenia i romanse. Zapis co 2 s walki i przy zmianach. Kontynuacja po odświeżeniu nie resetuje aktywnej misji. Samo otwarcie ekranu powitalnego nie może nadpisać istniejącego zapisu.
13. Eksport/import JSON przenosi progres między nazwami plików i przeglądarkami. Import v4 zachowuje progres kampanii, broń, relacje i kredyty, a umieszcza gracza na statku 3D (stare współrzędne 2D nie są przenoszone). Nieprawidłowy import nie zmienia bieżącej gry. Blokada localStorage musi być widoczna; eksport nadal działa.
14. Pauza zatrzymuje walkę. Dźwięk proceduralny ma wyłącznik. Gra wymaga WebGL, klawiatury i myszy. Nie wymagaj kont, sekretów ani zewnętrznych API do rozgrywki.

## Weryfikacja przy zmianach

Uruchom aktualny HTML w Chromium z WebGL. Sprawdź: widoczny model człowieka i pomieszczenia 3D; ruch/celowanie/obrót kamery; strzelanie, osłony, obrażenia; brak załogi podczas walki; różnice map; powroty na statek; kredyty i obydwa ulepszenia; rozmowy, ograniczenie powtarzania i romans; zapis/odczyt w walce i podczas odpoczynku; eksport/import; Omegę; Zwiastuna i przejście fazy; QTE sukces/porażkę; apteczki; śmierć i kontynuację. Obejrzyj zrzuty ekranu, nie poprzestawaj na testach samej składni.
