# Bulk Import v15: minigra w głównym terminalu statku

Bird Game 3 jest pokładową rekreacją wewnątrz kampanii. Nie występuje jako osobny tryb w menu startowym, w górnej nawigacji ani na paskach narzędzi kampanii. Dotychczasowe minigra, pięć gatunków, moce, boty i rekordy pozostają zachowane.

## Droga gracza

1. Rozpocznij lub kontynuuj kampanię solo.
2. Podejdź do głównego niebieskiego hologramu pośrodku statku. Konsola ma ekran oraz etykietę **TERMINAL GŁÓWNY / E**.
3. Naciśnij **E**, gdy pokaże się podpowiedź interakcji.
4. W terminalu wybierz **Rekreacja: Bird Game 3**. Wybór ptaka następuje wewnątrz minigry.
5. **Wróć do terminala** przywraca tę samą konsolę, stan kampanii i pozycję postaci. **Wróć na pokład** zamyka konsolę i wznawia eksplorację.

Terminal jest dostępny na statku i podczas pokładowej przerwy między żniwami. Zawiera również mapę misji, zbrojownię i archiwum kampanii. Klawisz E zachowuje kontekstowe działanie przy Omedze, retranslatorach i pomocy Marca.

## Ograniczenie wejścia

Uruchomienie minigry wymaga aktywnej kampanii, strefy statku, bliskości konsoli i otwartego panelu głównego terminala. Sam ekran startowy kampanii, pasek nagłówka, menu zapisu, dowolne miejsce na statku lub walka nie umożliwiają wejścia. Kontroler wspólnego HTML dodatkowo sprawdza warunki przekazane przez kampanię.

W trakcie minigry kampania pozostaje zamrożona. Powrót nie usuwa ramki kampanii ani nie przenosi do wspólnego menu startowego. Zamknięcie terminala albo przejście do innego panelu kasuje uprawnienie do wejścia do rekreacji.

## Wydanie i zgodność

Nowy artefakt: **Bulk-Import-v15.html** na dotychczasowym wspólnym branchu. V14 pozostaje archiwum. Format kampanii solo nadal ma numer 10, kooperacji 1, a ptasich rekordów 2. Nie ma resetu postępu ani zmiany kluczy localStorage. Ten sam plik działa offline i na serwerze; opcje sieciowe nadal są wyłączone przy otwarciu lokalnego HTML.

Testy przeglądarkowe sprawdzają brak samodzielnych przycisków, odmowę bezpośredniego wejścia, podejście postaci do konsoli, podpowiedź E, otwarcie terminala prawdziwym klawiszem, uruchomienie rekreacji, wybór ptaka, grę i powrót do konsoli. Zachowują sprawdzanie eksportu, importu i kontynuacji kampanii, ptasich rekordów, widoku mobilnego oraz klientów kooperacji i VS. Walidatory zapisów i timing kampanii są uruchamiane na payloadzie nowego HTML. Ograniczenie zarządzanego Chromium dotyczące `file://` i test samodzielnego dokumentu bez sieci pozostają opisane w README.
