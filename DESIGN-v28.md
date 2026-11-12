# v28 — Apex Souls: parowanie, riposta i backstab

Walka pozostaje w istniejącym Apex Souls, dostępnym po ukończeniu Metro Import. Nie dodano skrótów do zagnieżdżonych gier.

## Sterowanie i informacje dla gracza

- **V / Paruj:** odbicie tarczą. Koszt 18 wytrzymałości, przygotowanie 0,08 s, aktywne okno do 0,30 s, pełny ruch 0,65 s, odnowienie 0,9 s. Chybione parowanie pozostawia gracza odsłoniętego; nie można anulować go kolejną akcją.
- **C / Krytyk:** jedna riposta albo backstab, koszt 32 wytrzymałości. Normalne ataki J/LPM i K zachowują swoje działanie.
- **Riposta:** sparuj frontalne cięcie, podejdź na maksymalnie 2,25 jednostki, zwróć się w stronę ogłuszonego przeciwnika i użyj C. Okno ogłuszenia trwa 1,65 s, a cios trzeba rozpocząć przed jego ostatnimi 0,12 s.
- **Backstab:** podejdź za plecy zwykłego strażnika, skryby lub wardena na maksymalnie 2 jednostki i użyj C. Dopuszczalny kąt za plecami to około ±45°. Nie działa z boku ani od przodu.
- Zwykły stożek cięcia zmienia kolor na błękitny w ostatnich 0,3 s, jeśli atak można parować. Aktywne parowanie podświetla tarczę. Turkusowy pierścień oraz tekst rozróżniają RIPOSTĘ i BACKSTAB; HUD informuje też o braku wytrzymałości.

## Trafienia i balans

Trafienie krytyczne następuje po 0,38 s animacji trwającej 0,95 s. Cel jest zarezerwowany, a gracz stoi w miejscu; nie ma teleportacji. Dystans i droga przez filary są sprawdzane zarówno przy wyborze, jak i trafieniu. Cios obejmuje wyłącznie wybrany cel. Na czas animacji gracz otrzymuje skończoną ochronę przed przerwaniem.

Riposta zadaje 110 + 6 × poziom obrażeń strażnikom, 140 + 6 × poziom Lordowi Legacy. Backstab: 100 + 6 × poziom. Po rozpoczęciu krytyka przeciwnik ma czasową odporność na następny krytyk/parowanie (3 s, boss 6 s), a po wygaśnięciu niewykorzystanego ogłuszenia krótki okres odporności. Zapobiega to nieskończonemu ogłuszaniu.

Lord Legacy nie przyjmuje backstabów. Jego zwykłe cięcia można parować; nova oraz pociski skrybów pozostają nieparowalne. Przejścia faz są odraczane do końca krytycznej animacji, a nie pomijane. Dotychczasowa wygrana bez ulepszeń, przy użyciu uników i zwykłych ataków, nadal przechodzi test.

## Kod, zapis i wydajność

- `minigames/souls-sim.js`: `criticalTarget()`, `parryable()`, `clearPath()`, parowanie, rezerwacja i opóźnione trafienia. Model działa bez DOM.
- `minigames/souls-game.js/css`: V/C, przyciski dotykowe, instrukcja, status i wspólny kanał efektów respektujący wyciszenie.
- `minigames/souls-render.js`: ruch tarczy, pchnięcie, zgięcie przeciwnika, stały pierścień, poświata i istniejąca pula cząstek. Żadnych geometrii tworzonych podczas krytyka.
- `audio/effects.js`: lokalne efekty `parry` i `critical`, z dotychczasowym limitem 32 źródeł.

Bez zmiany klucza `bulk-import-apex-souls-v1` i schema 1. Nowe pola walki są przejściowe; starszy zapis odtwarza je przy wejściu na mapę. Pozostałe kampanie, odblokowania i zapisy minigier nie zmieniają formatu. Wcześniejsze HTML zachowane, nowe wydanie: `Bulk-Import-v28.html`.

## Kontrola

Testy modelu obejmują okno czasowe i kierunek parowania, porażki, cooldown, wytrzymałość, pociski/novę, wygaśnięcie okazji, pauzę, pozycję za plecami, filary, opóźnione pojedyncze trafienia, jednorazowe nagrody, reset po śmierci i fazy bossa. Test przeglądarkowy prowadzi przez rzeczywiste zagnieżdżenie, wykonuje V/C klawiaturą oraz parowanie dotykiem i sprawdza podpowiedzi, audio, budżet GPU, zapis i powrót do rodzica. Wydanie jest sprawdzane jako samodzielny dokument i w opakowaniu Pages oraz przez serwer multiplayer.
