# Bulk Import: Omega Chronicles 3D — v7

Wymagania v5 i optymalizacje v6 nadal obowiązują: [DESIGN-v5.md](DESIGN-v5.md), [DESIGN-v6.md](DESIGN-v6.md). Aktualne samodzielne wydanie to `Bulk-Import-Omega-3D-v7.html`. Poprzednie pliki pozostają bez zmian.

## Załoga, portrety i wybory

- Vael i Syra mają proceduralne portrety SVG osadzone w HTML. Portrety zmieniają brwi, oczy, usta, rumieniec i kolor oprawy zależnie od nastawienia; związek dodaje symbol serca. Brak zewnętrznych obrazów i dodatkowego renderowania 3D w dialogach.
- Dwa niezależne wskaźniki 0–100%: **przychylność** (`affection`) i **zaufanie** (`trust`). Przy nowej kampanii wynoszą 35% i 40%. Odpowiedzi mogą zwiększać lub zmniejszać obie wartości.
- Sześć nastawień: wrogość, nieufność, neutralność, sympatia, bliskość, zakochanie. Wrogość pojawia się przy dowolnym wskaźniku poniżej 20%, nieufność poniżej 35%, sympatia od 55%/45%, bliskość od 75%/60%. Zakochanie wymaga aktywnego związku i co najmniej 65%/55%.
- Każda osoba ma 16 scen z trzema odpowiedziami. Podczas każdego pobytu na statku dostępne są trzy tematy: odprawa, sprawy osobiste oraz wartości/granice. Sceny zmieniają się między pobytami; kontekst pokazuje postęp misji. Kolejność odpowiedzi obraca się, ale ich skutki pozostają stałe.
- Raz omówiony temat jest blokowany do następnego pobytu; samo otwieranie okna nie zwiększa wskaźników. Po odpowiedzi widoczne są reakcja rozmówcy i faktyczna zmiana procentów.
- Przeprosiny raz na pobyt pozwalają odbudować zaufanie. Można zadeklarować przyjaźń. Romans wymaga co najmniej 75% przychylności i 60% zaufania, obopólnej zgody i braku innego związku. Utrata zaufania nadal działa po rozpoczęciu romansu; poniżej 20% któregokolwiek wskaźnika związek się kończy. Możliwe jest też świadome rozstanie.
- Portret i wskaźniki znajdują się obok odpowiedzi na desktopie; na wąskim ekranie używany jest zwarty układ pionowy. Pamięć ostatnich ośmiu odpowiedzi i wynik ostatniej rozmowy są zapisywane.

## Kampania i różnorodność

Siedem misji o rosnącej liczbie wrogów i statystykach:

| Misja | Żniwa | Oprawa |
| --- | --- | --- |
| Sandbox-7 | 3 | Port importowy, skrzynie i metalowe panele |
| Archiwum Protean | 3 | Kamienne runy, łuki i pozostałości archiwum |
| Stocznia Zbieraczy | 4 | Organiczne kokony i heksagonalna podłoga |
| Próg Omegi | 3 | Uszkodzony retranslator i czerwone obwody |
| Illium: Skarbiec Gethów | 4 | Serwerownie, niebieskie układy i nowe osłony |
| Katedra Walidacji | 4 | Kolumny, kryształy i kamienna świątynia |
| Jądro galaktyki | 4 | Reactor, koncentryczne obwody i świecące obrzeża |

Pierwsze cztery układy kolizji pozostają zgodne z zapisami wcześniejszych wersji. Nowe mapy mają inne układy osłon. Wszystkie dekoracje są scalane w statyczne partie; nie dodawaj kosztownych świateł/postprocessingu.

Trzy nowe rodzaje obok dotychczasowych Żniwiarzy, elit i Zbieraczy:

- **Husk / Duplikat**: zielony humanoid szarżujący do walki wręcz. Musi podchodzić do odległości około 0,95, aby mógł trafić.
- **Geth / Permission Wall**: niebieski opancerzony strzelec z pojedynczym okiem i trzypociskowymi seriami.
- **Banshee / Validation Rule**: wysoka fioletowa postać, która ostrzega kręgiem o teleportacji, a potem atakuje z nowego miejsca.

Limit jednoczesnych przeciwników: 18. Strzały, HP, obrażenia i prędkość skalują się z misją. Nie zwiększaj spawnu po nieudanej próbie utworzenia przeciwnika przy pełnym limicie.

## Bossowie i uczciwe ostrzeżenia

- Próg Omegi kończy awatar Zwiastuna z 260 HP i dwiema fazami.
- Finałowy Zwiastun ma **1200 HP i trzy fazy**. Przy spadku poniżej 2/3 oraz 1/3 HP przechodzi do kolejnej fazy, przyspiesza ataki i przywołuje posiłki.
- Ataki obszarowe są poprzedzane kręgami widocznymi przez co najmniej 1,05 s. Nova ma 1,25 s ostrzeżenia, po czym wypuszcza radialne pociski z luką ucieczki. R, osłony i sprint pozostają skuteczne.
- Ostrzeżenia aktualizują się w kroku fizyki, wyłącznie podczas walki. Menu i QTE zatrzymują czas tych ataków. Pierścienie są instancjonowane w dwóch wywołaniach renderowania.
- Po odczycie zapisu nieodpalone ostrzeżenia są bezpiecznie anulowane, a boss dostaje krótki odstęp przed nowym atakiem; nie wolno zadawać niewidocznych zaległych obrażeń.

## Zapis i migracja

Klucz v7: `bulk-import-omega-3d-v7`. Eksport JSON zachowuje procenty, zaufanie, historię, wybrane tematy, związek, kampanię i walkę. Ustawienia grafiki pozostają pod dotychczasowym kluczem.

Import v4/v5/v6 normalizuje dawne trzy poziomy więzi do procentów. Istniejący partner otrzymuje co najmniej 85%/80%. Aktywne walki 3D z v5/v6 pozostają na zgodnej mapie; v4 wraca na statek.

Ukończone dawne misje 0–3 pozostają ukończone. Stare zwycięstwo jest pamiętane jako `legacyVictory`, a nowy finał v7 wymaga przejścia rozdziałów 4–6. Dawny aktywny boss 210 HP pozostaje minibossem w Progu Omegi; nie jest zamieniany w nowego bossa finałowego.

Import jest walidowany przed zastąpieniem gry: procenty, tematy, historia, granice misji, limity przeciwników, znane typy oraz skończone pola walki. Wadliwy zapis nie może uszkodzić bieżącej kampanii.

## Weryfikacja

Przeszły testy Chromium: pozytywne/negatywne odpowiedzi, portrety i procenty, ograniczenie powtarzania, przeprosiny, progi/wyłączność/rozstanie, kampania, siedem map, nowe modele i zachowania, telegrapy i uniki, fazy/nova/posiłki bossa, zapisy/importy v6, odrzucanie uszkodzonych procentów, kamera, audio/menu, szybka grafika i brak żądań do zasobów zewnętrznych. Obejrzano dialogi desktop i mobile.

- `node tests/v7-state.test.cjs`
- `node tests/frame-clock.test.cjs Bulk-Import-Omega-3D-v7.html`

Późna scena w trybie Szybka z 14 przeciwnikami i trzema ostrzeżeniami: 160 wywołań renderowania, 27 544 trójkąty, skala 0,65. To pomiar kosztu sceny, nie obietnica FPS.
