'use strict';
// Shared dialogue text: the game and recording catalogue use the same source.
const CREW_SCENES = [
  [
    {
      title: 'Archiwum bez backupu',
      line: 'Nasza cywilizacja zapisała wszystko. Tylko nikt nie sprawdził, czy kopię da się odczytać. Co zrobisz z tym archiwum?',
      answers: [
        [
          'Zrobimy kopię i przetestujemy odtwarzanie. Pamięć zasługuje na troskę.',
          10,
          10,
          'Dziękuję. Dla ciebie to nie jest tylko kolejny załącznik.',
        ],
        [
          'Najpierw policzę rozmiar importu. Potem zdecydujemy.',
          2,
          2,
          'Rozumiem ostrożność. Byleśmy nie zapomnieli o ludziach za rekordami.',
        ],
        [
          'Usuńmy stare dane. Prościej będzie zacząć od zera.',
          -14,
          -12,
          'To nie brudne rekordy. To całe życie mojego narodu.',
        ],
      ],
    },
    {
      title: 'Osierocony rekord',
      line: 'Czasem czuję się jak rekord bez rodzica. Wszystko działa, ale nigdzie nie należę.',
      answers: [
        [
          'Na tym statku należysz do załogi. I nie musisz na to zasługiwać użytecznością.',
          12,
          7,
          'Miło usłyszeć, że nie jestem tylko lookupem do przeszłości.',
        ],
        [
          'Możesz pomóc mi opisać proteańskie schematy. Zrobimy to razem.',
          6,
          8,
          'Wspólna praca to dobry początek. Dziękuję.',
        ],
        [
          'Jesteś specjalistą. Uczucia zostaw na czas wolny.',
          -12,
          -9,
          'Zrozumiałem. W takim razie będę wyłącznie specjalistą.',
        ],
      ],
    },
    {
      title: 'Proteańskie duplikaty',
      line: 'Znalazłem dwie sprzeczne wersje tego samego wspomnienia. Usunąć tę mniej wygodną?',
      answers: [
        [
          'Zachowajmy obie i opiszmy źródła. Prawda nie zawsze mieści się w jednym polu.',
          8,
          12,
          'Właśnie tak chciałbym ocalać historię. Bez fałszowania.',
        ],
        [
          'Wybierzmy wersję lepiej udokumentowaną i zachowajmy kopię drugiej.',
          3,
          6,
          'Rozsądny kompromis. Ważne, że druga nie zniknie.',
        ],
        [
          'Zostaw tę, która lepiej wygląda w raporcie dla dowództwa.',
          -9,
          -16,
          'Nie będę wykonywał hard delete na prawdzie.',
        ],
      ],
    },
    {
      title: 'Kawa z epoki Prothean',
      line: 'Przygotowałem napój według starej receptury. Smakuje jak błąd importu, ale z nutą nostalgii.',
      answers: [
        [
          'Spróbuję. A potem razem poprawimy recepturę, bez kasowania tradycji.',
          10,
          5,
          'Uśmiechnąłem się. To rzadkie zjawisko, zapisz je w logu.',
        ],
        [
          'Może najpierw pół kubka. Mam niski limit eksperymentów.',
          4,
          2,
          'Przynajmniej uczciwie deklarujesz batch size.',
        ],
        [
          'Nie dziwię się, że wasza cywilizacja upadła.',
          -17,
          -10,
          'To miało być zaproszenie. Odpowiedź była niepotrzebnie okrutna.',
        ],
      ],
    },
    {
      title: 'Zwycięstwo i koszt',
      line: 'Po walce wszyscy liczą eliminacje. Ja liczę miejsca przy stole, które mogły pozostać puste.',
      answers: [
        [
          'Też o tym myślę. Zwycięstwo nie zwalnia nas z troski o załogę.',
          10,
          9,
          'Dobrze wiedzieć, że dowódca widzi coś więcej niż zielone KPI.',
        ],
        [
          'Będziemy analizować straty i poprawiać procedury.',
          2,
          6,
          'Procedury pomagają. Pamiętajmy jeszcze o tych, którzy je wykonują.',
        ],
        [
          'Najważniejsze, że metryki się zgadzają.',
          -10,
          -11,
          'Nie chcę być kolejnym wpisem w twoim dashboardzie.',
        ],
      ],
    },
    {
      title: 'Eksport wspomnień',
      line: 'Mógłbym udostępnić ci osobiste wspomnienie. Nie jest wojskowe. Nie jest użyteczne. Jest moje.',
      answers: [
        [
          'Tylko jeśli naprawdę chcesz. Zostanie między nami.',
          12,
          10,
          'Tak. Właśnie komuś takiemu chciałem je pokazać.',
        ],
        [
          'Chętnie posłucham. Powiedz, jeśli wolisz przerwać.',
          7,
          8,
          'Dziękuję za zostawienie mi kontroli nad własnym zapisem.',
        ],
        [
          'Nagrajmy je. Przyda się w odprawie.',
          -13,
          -18,
          'Wycofuję zgodę. To nie był materiał do prezentacji.',
        ],
      ],
    },
    {
      title: 'Certyfikat ze starożytności',
      line: 'Żniwiarz stwierdził, że bez certyfikatu Salesforce nie mogę komentować jego arkusza.',
      answers: [
        [
          'Masz pięćdziesiąt tysięcy lat doświadczenia. On ma scalone komórki.',
          9,
          4,
          'To najlepsza walidacja mojego CV od wielu tysięcy lat.',
        ],
        [
          'Pomożemy ci zdobyć certyfikat, jeśli masz na to ochotę.',
          4,
          5,
          'Miło, że pytasz o moją ochotę, zamiast robić taska za mnie.',
        ],
        [
          'Może ma rację. Twoja wiedza jest mocno przestarzała.',
          -11,
          -9,
          'Historia jest stara. Brak szacunku pozostaje zadziwiająco świeży.',
        ],
      ],
    },
    {
      title: 'Granice',
      line: 'Nie chcę dziś opowiadać o wojnie. Czy to problem?',
      answers: [
        [
          'Nie. Możemy pomilczeć albo porozmawiać o czymś zupełnie innym.',
          11,
          12,
          'Taka odpowiedź daje więcej bezpieczeństwa niż cały pancerz.',
        ],
        [
          'Rozumiem. Wrócimy do tematu, kiedy będziesz gotowy.',
          5,
          9,
          'Dziękuję. Sam zdecyduję, kiedy otworzyć ten plik.',
        ],
        [
          'Jako dowódca mam prawo znać każdy szczegół.',
          -15,
          -19,
          'Moje wspomnienia nie są obiektem, do którego dostajesz automatyczne uprawnienia.',
        ],
      ],
    },
    {
      title: 'Mostek po służbie',
      line: 'Z mostka widać mgławicę, która przypomina mi dom. Chciałbyś ją zobaczyć?',
      answers: [
        [
          'Tak. Tym razem bez terminala i bez pośpiechu.',
          12,
          5,
          'Zarezerwuję nam widok. Żadnych alertów poza gwiazdami.',
        ],
        [
          'Chętnie, jeśli starczy czasu po odprawie.',
          4,
          3,
          'W porządku. Daj znać, gdy zamkniesz wszystkie zakładki.',
        ],
        [
          'Nie mam czasu na sentymentalne prezentacje.',
          -12,
          -7,
          'Nie prosiłem o prezentację. Zapraszałem ciebie.',
        ],
      ],
    },
    {
      title: 'Błąd w proteańskim przekładzie',
      line: 'Pomyliłem dwa symbole. Dowództwo dostało „kocham separator” zamiast „zamykam retranslator”.',
      answers: [
        [
          'Naprawimy to wspólnie. Każdy popełnia błędy.',
          9,
          10,
          'Dziękuję, że nie utożsamiasz jednego błędu z całą moją osobą.',
        ],
        [
          'Wyślij korektę i dodaj słownik walidacyjny.',
          2,
          7,
          'Zrobię to. Procedura będzie mniej romantyczna niż pierwszy komunikat.',
        ],
        [
          'Opowiem o tym całej załodze. Niech się pośmieją.',
          -14,
          -15,
          'Liczyłem na twoją dyskrecję. Nie na publiczny dashboard wstydu.',
        ],
      ],
    },
    {
      title: 'Lojalność',
      line: 'Gdy moje zdanie różni się od twojego, oczekujesz lojalności czy ciszy?',
      answers: [
        [
          'Szczerego sprzeciwu. Lojalność bez głosu to tylko zablokowane pole.',
          8,
          14,
          'W takim razie będę mówił szczerze. Nawet gdy to trudne.',
        ],
        [
          'Najpierw porozmawiajmy w cztery oczy, później zdecydujmy.',
          4,
          7,
          'To uczciwa ścieżka eskalacji.',
        ],
        [
          'W czasie misji masz się zgadzać.',
          -9,
          -17,
          'Mogę wykonać rozkaz. Zaufania nie wymusisz.',
        ],
      ],
    },
    {
      title: 'Dane żywych ludzi',
      line: 'Zbieracze zostawili listę jeńców. Niektóre rekordy są niepełne. Dowództwo sugeruje je pominąć.',
      answers: [
        [
          'Szukamy wszystkich. Człowiek nie staje się nieważny przez brak pola.',
          11,
          12,
          'Dlatego chcę zostać na tym statku.',
        ],
        [
          'Sprawdźmy źródła i spróbujmy uzupełnić dane przed akcją.',
          4,
          8,
          'Pomogę. Każda poprawiona linia może oznaczać czyjś powrót.',
        ],
        [
          'Bez pełnych danych nie ma sensu tracić zasobów.',
          -16,
          -18,
          'Dla ciebie brakujące pole oznacza brakującą wartość. Dla mnie oznacza osobę.',
        ],
      ],
    },
    {
      title: 'Cichy wieczór',
      line: 'Na proteańskich statkach bywały dni bez alarmu. Trudno mi sobie przypomnieć, co się wtedy robiło.',
      answers: [
        [
          'Możemy stworzyć nową tradycję. Pierwszy punkt: nikt nie otwiera Excela.',
          11,
          5,
          'Popieram. Wpisuję to do konstytucji nowej tradycji.',
        ],
        ['Zacznijmy od wspólnej kolacji.', 7, 4, 'To brzmi dobrze. I nie wymaga mapowania kolumn.'],
        [
          'Przyzwyczaj się. Tu nie ma czasu na odpoczynek.',
          -8,
          -10,
          'Zmęczona załoga też ma governor limits.',
        ],
      ],
    },
    {
      title: 'Pamięć i przyszłość',
      line: 'Boję się, że jeśli zacznę żyć tutaj, zdradzę tych, których straciłem.',
      answers: [
        [
          'Możesz ich pamiętać i nadal budować własną przyszłość. Nie musisz wybierać.',
          13,
          10,
          'Może właśnie tego pozwolenia potrzebowałem.',
        ],
        [
          'Nie znam dobrej odpowiedzi, ale mogę cię wysłuchać.',
          8,
          9,
          'To bardziej uczciwe niż fałszywa pewność.',
        ],
        [
          'Przeszłość jest zamknięta. Po prostu idź dalej.',
          -13,
          -12,
          'Gdyby to było takie proste, nie prosiłbym o rozmowę.',
        ],
      ],
    },
    {
      title: 'Prawo do pomyłki',
      line: 'Syra poprawiła moje obliczenia. Czuję wdzięczność i odrobinę wstydu.',
      answers: [
        [
          'Załoga jest zespołem. Wspólna poprawka to sukces, nie porażka.',
          9,
          9,
          'Dobrze. Nie będę próbował debugować poczucia własnej wartości.',
        ],
        [
          'Podziękuj jej i zapisz test, żeby błąd się nie powtórzył.',
          4,
          6,
          'Tak zrobię. Test będzie miał na imię „nie bądź zbyt dumny”.',
        ],
        [
          'Z takim doświadczeniem nie powinieneś się mylić.',
          -11,
          -14,
          'Widzę, że w twoim schemacie brakuje miejsca na człowieczeństwo.',
        ],
      ],
    },
    {
      title: 'Co zostaje po misji',
      line: 'Kiedy to się skończy, co zamierzasz zachować: raporty czy ludzi?',
      answers: [
        [
          'Ludzi. Raporty też, ale bez nich nie miałyby znaczenia.',
          12,
          10,
          'To jest przyszłość, w której chciałbym uczestniczyć.',
        ],
        [
          'Obie rzeczy. Pamięć wymaga ludzi i dobrego zapisu.',
          7,
          8,
          'Zgadzam się. Właściwy rekord ma serce i historię.',
        ],
        [
          'To zależy, co będzie bardziej użyteczne.',
          -14,
          -15,
          'Nie chcę być oceniany według kolejnego pola „przydatność”.',
        ],
      ],
    },
  ],
  [
    {
      title: 'Rdzeń i makra',
      line: 'Żniwiarze znowu próbowali zasilić rdzeń makrem. Mogę poprawić zabezpieczenia, ale potrzebuję czasu.',
      answers: [
        [
          'Masz czas i wsparcie. Bezpieczeństwo nie jest ozdobą do raportu.',
          9,
          11,
          'Dobrze. Zrobię to porządnie, zamiast heroicznie gasić kolejną produkcję.',
        ],
        [
          'Przedstaw plan i priorytety, ustalimy harmonogram.',
          3,
          6,
          'Jasne. Lubię plan, o ile ktoś potem naprawdę go respektuje.',
        ],
        [
          'Obejdź zabezpieczenia. Musimy szybciej ruszyć.',
          -10,
          -18,
          'Nie zaryzykuję załogi, żeby dashboard świecił się na zielono.',
        ],
      ],
    },
    {
      title: 'Nocny import',
      line: 'Siedziałam przy migracji do trzeciej. Nie potrzebuję bohatera. Potrzebuję kogoś, kto przyniesie jedzenie.',
      answers: [
        [
          'Przyniosę jedzenie i przejmę część pracy. Potem odpoczniesz.',
          12,
          9,
          'To brzmi dużo lepiej niż kolejny motywacyjny mail.',
        ],
        [
          'Pomogę rozbić zadanie na mniejsze partie.',
          5,
          6,
          'Dobry pomysł. Przyda się też coś do jedzenia między partiami.',
        ],
        [
          'Wszyscy jesteśmy zmęczeni. Nie rób z tego problemu.',
          -14,
          -11,
          'Nie robię problemu. Mówię ci, gdzie jest limit systemu.',
        ],
      ],
    },
    {
      title: 'Walidacja kontra dowódca',
      line: 'Zablokowałam twoje żądanie dostępu. Nie miało uzasadnienia. Gniewasz się?',
      answers: [
        [
          'Nie. Dobrze, że zasady obowiązują również dowódcę.',
          9,
          14,
          'Właśnie na taką odpowiedź liczyłam.',
        ],
        [
          'Wyjaśnijmy potrzebę i wystawmy właściwy wniosek.',
          5,
          9,
          'Idealnie. Nawet galaktykę da się ratować bez konta shared_admin.',
        ],
        [
          'Odblokuj. Moja ranga jest wystarczającym uzasadnieniem.',
          -11,
          -19,
          'Ranga nie jest permission setem. I nie powinna nim być.',
        ],
      ],
    },
    {
      title: 'Kolacja bez ekranu',
      line: 'Mam pomysł: kolacja, żadnych terminali. Wytrzymasz kwadrans bez sprawdzania logów?',
      answers: [
        [
          'Z tobą? Nawet dwa kwadranse. Telefon idzie do szuflady.',
          12,
          5,
          'Ostrożnie, komandorze. Jeszcze uznam cię za dobrze skonfigurowanego.',
        ],
        [
          'Spróbuję. Ale jeśli Zwiastun zadzwoni, dam mu voicemail.',
          6,
          3,
          'Dozwolony wyjątek. Byle nie wrócił jako załącznik.',
        ],
        [
          'Jeśli nie ma agendy, to nie ma sensu.',
          -13,
          -7,
          'Agenda brzmiała: spędzić czas z tobą. Szkoda.',
        ],
      ],
    },
    {
      title: 'Nie mój pomysł',
      line: 'Ktoś przypisał dowództwu moje usprawnienie retranslatora. Powinnam to odpuścić?',
      answers: [
        [
          'Nie. Dopilnuję, żeby twój wkład był podpisany twoim nazwiskiem.',
          11,
          12,
          'Dziękuję. Nie chcę być niewidzialnym polem obliczeniowym.',
        ],
        [
          'Przygotujmy dokumentację zmian i poprawmy autorstwo.',
          5,
          10,
          'Konkretnie i uczciwie. Tak lubię.',
        ],
        [
          'Ważne, że zespół wygrał. Nazwiska są drugorzędne.',
          -12,
          -14,
          'Zwykle mówią to ci, których nazwiska już są na slajdzie.',
        ],
      ],
    },
    {
      title: 'Eksperyment',
      line: 'Zaprojektowałam szybszy akcelerator. Może działać świetnie, ale najpierw potrzebuję sandboxa.',
      answers: [
        [
          'Dostaniesz sandbox i czas na testy. Chcę zobaczyć, co wymyśliłaś.',
          10,
          11,
          'Świetnie. Dziś zrobimy coś szybkiego i odpowiedzialnego. Rzadkie połączenie.',
        ],
        [
          'Pokaż mi ryzyka i metryki. Potem uruchomimy test.',
          4,
          7,
          'Jasne. Wolę pytania od ślepego entuzjazmu.',
        ],
        [
          'Włącz od razu na produkcji. Najwyżej zrobimy rollback.',
          -8,
          -17,
          '„Najwyżej” to nie strategia. To ostatnie słowo przed alarmem.',
        ],
      ],
    },
    {
      title: 'Słaby dzień',
      line: 'Dzisiaj wszystko mnie drażni. Nawet poprawnie nazwane pliki CSV.',
      answers: [
        [
          'Nie musisz dziś udawać dobrego humoru. Chcesz towarzystwa czy spokoju?',
          12,
          10,
          'Dziękuję za wybór. Dzisiaj trochę spokoju, później kawa razem.',
        ],
        [
          'Mogę przejąć ci najgorsze zgłoszenia.',
          7,
          6,
          'To byłoby naprawdę pomocne. Szczególnie ticket „nie działa nic”.',
        ],
        [
          'Uśmiechnij się. Z takim nastawieniem psujesz atmosferę.',
          -16,
          -12,
          'Teraz drażni mnie też ta odpowiedź.',
        ],
      ],
    },
    {
      title: 'Separator osobowości',
      line: 'Vael stwierdził, że jestem zbyt bezpośrednia. Może powinnam mieć bardziej przyjazny interfejs?',
      answers: [
        [
          'Lubię twoją szczerość. Nie musisz przepisywać siebie pod cudzy formularz.',
          12,
          8,
          'To chyba najładniejsze zdanie, jakie usłyszałam o interfejsach.',
        ],
        [
          'Możesz dobierać ton do sytuacji, nie tracąc własnego zdania.',
          5,
          7,
          'Uczciwe. Czytelność nie musi oznaczać uległości.',
        ],
        [
          'Tak. Załoga woli, kiedy mniej dyskutujesz.',
          -14,
          -16,
          'A ja wolę dowódcę, który słucha. Widzisz? Oboje mamy preferencje.',
        ],
      ],
    },
    {
      title: 'Prawdziwe przeprosiny',
      line: 'Kiedy ktoś psuje deployment, wszyscy mówią „sorry”. Mało kto potem naprawia przyczynę.',
      answers: [
        [
          'Słowa powinny prowadzić do działania. Ustalmy, co realnie poprawić.',
          9,
          13,
          'Właśnie. Przeprosiny bez poprawki to tylko komentarz w logu.',
        ],
        [
          'Zróbmy retrospektywę bez szukania kozła ofiarnego.',
          6,
          10,
          'Jestem za. Prawdziwy post-mortem, nie teatr.',
        ],
        [
          'Błędy były i będą. Nie roztrząsajmy tego.',
          -9,
          -15,
          'Bez refleksji to nie doświadczenie. To cykliczny błąd.',
        ],
      ],
    },
    {
      title: 'Własna kabina',
      line: 'Chciałabym urządzić swoją kabinę. Czy każda rzecz na statku musi być najpierw zatwierdzona w trzech workflowach?',
      answers: [
        [
          'To twoja przestrzeń. Powiedz tylko, jeśli potrzebujesz pomocy.',
          11,
          8,
          'Potrzebuję kogoś do przeniesienia stołu. W sam raz zadanie dla komandora.',
        ],
        [
          'Ustalmy tylko zasady bezpieczeństwa, reszta jest twoja.',
          6,
          9,
          'To rozsądne. Obiecuję nie montować rdzenia w szafie.',
        ],
        [
          'Na statku nie ma prywatnej przestrzeni. Wszystko podlega kontroli.',
          -15,
          -17,
          'W takim razie to nie dom. To bardzo duży formularz.',
        ],
      ],
    },
    {
      title: 'Komplement z metryką',
      line: 'Powiedziałeś ostatnio, że jestem „wydajna”. Mam nadzieję, że znasz też inne przymiotniki.',
      answers: [
        [
          'Odważna, zabawna i uparta w dobrym sensie. Lubię cię, nie tylko twoje wyniki.',
          13,
          5,
          'Znacznie lepiej. Ten rekord warto zapisać.',
        ],
        [
          'Chodziło mi o uznanie dla twojej pracy. Ale masz rację, to za mało.',
          6,
          8,
          'Dziękuję, że umiesz to poprawić bez defensywnego wyjątku.',
        ],
        [
          'Nie przesadzaj. To był komplement.',
          -12,
          -10,
          'Właśnie dlatego zwróciłam uwagę, a nie otworzyłam zgłoszenie.',
        ],
      ],
    },
    {
      title: 'Strach przed Omegą',
      line: 'Nie boję się przyznać, że Omega mnie przeraża. Bardziej boję się, że wszyscy udają, że nie czują nic.',
      answers: [
        [
          'Ja też się boję. Przygotujemy plan i zadbamy o siebie nawzajem.',
          12,
          12,
          'Dobrze. Szczerość jest lepszą osłoną niż przechwałki.',
        ],
        [
          'Mamy ryzyka i procedury awaryjne. Przejdźmy je razem.',
          5,
          9,
          'Tak. Z planem strach staje się bardziej konkretny i mniej samotny.',
        ],
        [
          'Strach osłabia załogę. Zachowaj to dla siebie.',
          -14,
          -18,
          'Udawanie odwagi nie jest odwagą.',
        ],
      ],
    },
    {
      title: 'Czyj jest ten sukces?',
      line: 'Po misji usłyszałam „dowódca uratował statek”. A ilu ludzi pracowało przy osłonach?',
      answers: [
        [
          'Cała załoga. Powiem to na odprawie i dopilnuję uznania dla was.',
          11,
          12,
          'Wtedy naprawdę możemy mówić o wspólnym sukcesie.',
        ],
        [
          'Zapiszmy wkład wszystkich w raporcie.',
          5,
          8,
          'To dobry początek. Nie zapomnij też powiedzieć im tego osobiście.',
        ],
        [
          'Ktoś musi być twarzą zwycięstwa.',
          -12,
          -15,
          'Twarz nie utrzyma reaktora. Dobrze, że reszta ciała nie bierze tego osobiście.',
        ],
      ],
    },
    {
      title: 'Ostatni plik przed snem',
      line: 'Za każdym razem obiecuję sobie „jeszcze tylko jeden import”. Potem jest świt.',
      answers: [
        [
          'Ustawmy granicę razem. Teraz zamykasz terminal, jutro pomogę ci dokończyć.',
          11,
          9,
          'Dobrze. Z tobą łatwiej wyłączyć tryb wiecznego dyżuru.',
        ],
        [
          'Może timer i mniejsze zadania pomogą?',
          4,
          5,
          'Spróbuję. Byle timer też nie miał piętnastu wyjątków.',
        ],
        [
          'Ambitni ludzie tak mają. Przynajmniej dużo robisz.',
          -7,
          -11,
          'Nie potrzebuję pochwały za przeciążenie. Potrzebuję odpoczynku.',
        ],
      ],
    },
    {
      title: 'Dwie wersje nas',
      line: 'Znam ciebie z odpraw i ciebie z tych rozmów. Która wersja jest prawdziwa?',
      answers: [
        [
          'Obie, ale tutaj staram się mówić szczerzej. I chcę słyszeć prawdziwą ciebie.',
          13,
          10,
          'To mi odpowiada. Nie musimy występować w roli idealnego dashboardu.',
        ],
        [
          'Bycie dowódcą wymaga innego tonu. Próbuję je pogodzić.',
          5,
          8,
          'Rozumiem. Ważne, żeby rola nie zjadła człowieka.',
        ],
        [
          'Na służbie nie ma znaczenia, co naprawdę myślę.',
          -10,
          -15,
          'Dla rozkazów może nie. Dla relacji ma znaczenie ogromne.',
        ],
      ],
    },
    {
      title: 'Po wszystkim',
      line: 'Gdy galaktyka przestanie płonąć, mam zamiar polecieć gdzieś, gdzie nikt nie zna słowa „migration”.',
      answers: [
        [
          'Brzmi jak miejsce, które chętnie zobaczyłbym z tobą. Jeśli będziesz chciała.',
          13,
          8,
          'Chciałabym. I dziękuję za ostatnią część tego zdania.',
        ],
        [
          'Zasłużyłaś na taki urlop. Pomogę zamknąć sprawy przed wylotem.',
          6,
          9,
          'To byłoby miłe. Urlop bez zdalnego gaszenia pożarów.',
        ],
        [
          'Najpierw upewnij się, że ktoś przejmie twoje zadania.',
          -11,
          -9,
          'Wiedziałam, że da się zepsuć marzenie jednym workflowem.',
        ],
      ],
    },
  ],
];

const CREW_GREETINGS = [
  'Jesteśmy razem, ale ostatnie słowa mnie zraniły. Potrzebuję odbudowy zaufania.',
  'Dobrze cię widzieć. Pośród tych wszystkich rekordów chcę mieć czas właśnie dla ciebie.',
  'Mogę porozmawiać, ale nie udawajmy, że wszystko jest w porządku.',
  'Posłucham. Proszę, tym razem uszanuj moje zdanie.',
  'Lubię nasze rozmowy. Przy tobie łatwiej pomyśleć o czymś więcej niż kolejnej misji.',
  'Mamy chwilę między żniwami. O czym chcesz porozmawiać?',
];
const CREW_EXTRA_LINES = [
  [
    'Dziękuję. Szczere przeprosiny nie kasują pamięci, ale otwierają nowy rozdział.',
    'Tak. Chcę budować z tobą przyszłość, nie tylko archiwum.',
  ],
  [
    'Przyjmuję. Najważniejsze będzie to, jak potraktujesz mnie w kolejnej rozmowie.',
    'Tak. Relacja utworzona za obopólną zgodą. Bez wymuszonych uprawnień.',
  ],
];
const CREW_SHARED_LINES = [
  'Przyjaźń też jest ważna. Dziękuję za jasne intencje.',
  'To trudne, ale doceniam szczerość. Dajmy sobie przestrzeń i szacunek.',
  'Nasz związek się kończy. Potrzebuję dystansu.',
];
// Prefixes match displayed events; cooldowns prevent repeated warnings from becoming chatter.
const VOICE_EVENTS = [
  {
    match: 'Podejdź do głównego hologramu: E',
    speaker: 'ship',
    text: 'Witaj na pokładzie, komandorze. Żniwiarze znów sprzedają Excela. Terminal misji czeka przy głównym hologramie.',
    cooldown: 30,
  },
  {
    match: 'Operacja ',
    speaker: 'ship',
    text: 'Rozpoczynamy operację. Załoga zostaje na statku. Ty zajmij się deduplikacją galaktyki.',
    cooldown: 12,
  },
  {
    match: 'OMEGA: skok do jądra',
    speaker: 'ship',
    text: 'Czerwony retranslator Omega aktywny. Cel: jądro galaktyki. Załączniki od Żniwiarzy pozostaw w kwarantannie.',
    cooldown: 20,
  },
  {
    match: 'ZWIASTUN: „1200 HP',
    speaker: 'reaper',
    text: 'Tysiąc dwieście punktów życia. Trzy fazy. Zero rollbacków!',
    cooldown: 30,
  },
  {
    match: 'AWATAR ZWIASTUNA',
    speaker: 'reaper',
    text: 'Twoja licencja na spokój wygasła. Przejmuję kontrolę!',
    cooldown: 30,
  },
  {
    match: 'ZWIASTUN / FAZA II',
    speaker: 'reaper',
    text: 'Przejmuję wszystkie permission sety!',
    cooldown: 15,
  },
  {
    match: 'ZWIASTUN / FAZA III',
    speaker: 'reaper',
    text: 'Limit API? Ja jestem limitem!',
    cooldown: 15,
  },
  {
    match: 'ZWIASTUN ŁADUJE NOVĘ',
    speaker: 'ship',
    text: 'Zwiastun ładuje nowę. Żółty krąg! Przygotuj unik!',
    cooldown: 18,
  },
  {
    match: 'OPÓR UDANY',
    speaker: 'ship',
    text: 'Indoktrynacja odparta. Dostęp odmówiony. Nawet inwazja potrzebuje permission seta.',
    cooldown: 25,
  },
  {
    match: 'TURBO CSV',
    speaker: 'ship',
    text: 'Turbo CSV! Szybszy ogień. Excel: program nie odpowiada.',
    cooldown: 25,
  },
  {
    match: 'EXCEL: „Zapisz jako:',
    speaker: 'excel',
    text: 'Zapisz jako: ostatnia nadzieja, final, wersja trzecia. Czy na pewno chcesz zamknąć galaktykę bez zapisywania?',
    cooldown: 30,
  },
  {
    match: 'WŚCIEKŁY EXCEL: „TERAZ',
    speaker: 'excel',
    text: 'Teraz to ja jestem duplikatem!',
    cooldown: 30,
  },
  {
    match: 'EXCEL / FAZA II',
    speaker: 'excel',
    text: 'Scalam komórki. I wasze nadzieje!',
    cooldown: 12,
  },
  {
    match: 'EXCEL / FAZA III',
    speaker: 'excel',
    text: 'Nie odpowiadam. Ale nadal strzelam!',
    cooldown: 12,
  },
  {
    match: 'EXCEL: „#ARG!',
    speaker: 'excel',
    text: 'Błąd argumentu! Cały wiersz do usunięcia!',
    cooldown: 20,
  },
  { match: 'EXCEL: „Scal komórki', speaker: 'excel', text: 'Scal komórki!', cooldown: 20 },
  {
    match: 'EXCEL: „TABELA PRZESTAWNA',
    speaker: 'excel',
    text: 'Tabela przestawna! Teraz przestawię ciebie!',
    cooldown: 20,
  },
  {
    match: 'EXCEL: „Autouzupełnianie',
    speaker: 'excel',
    text: 'Autouzupełnianie ołowiem!',
    cooldown: 20,
  },
  {
    match: 'EXCEL WRACA WŚCIEKŁY',
    speaker: 'excel',
    text: 'Ty usuwasz duplikaty? Ja je produkuję!',
    priority: 2,
    cooldown: 30,
  },
  {
    match: 'WŚCIEKŁY EXCEL / FAZA II',
    speaker: 'excel',
    text: 'Duplikuję kłopoty. Nie dane!',
    cooldown: 15,
  },
  {
    match: 'WŚCIEKŁY EXCEL / FAZA III',
    speaker: 'excel',
    text: 'Kontrol C. Kontrol V. Kontrol Z? Za późno!',
    cooldown: 15,
  },
  {
    match: 'WŚCIEKŁY EXCEL: „CTRL+C',
    speaker: 'excel',
    text: 'Kopiuj, wklej twojego końca!',
    cooldown: 20,
  },
  {
    match: 'WŚCIEKŁY EXCEL: „DUPLICATE_VALUE',
    speaker: 'excel',
    text: 'Duplikat wartości! Rekordów przybywa, nadziei ubywa!',
    cooldown: 20,
  },
  {
    match: 'WŚCIEKŁY EXCEL: „SCAL WSZYSTKO',
    speaker: 'excel',
    text: 'Scal wszystko!',
    cooldown: 20,
  },
  {
    match: 'WŚCIEKŁY EXCEL: „NIE MA DUPLIKATÓW',
    speaker: 'excel',
    text: 'Nie ma duplikatów. Są rekordy premium!',
    cooldown: 20,
  },
  {
    match: 'MARC BENIOFF / Ohana',
    speaker: 'marc',
    text: 'Ohana znaczy: nikt nie zostaje sam w CSV. Podejdź i naciśnij E!',
    priority: 3,
    cooldown: 8,
  },
  {
    match: 'MARC BENIOFF / Hasło',
    speaker: 'marc',
    text: 'Hasło ochrony arkusza? Trailblazer, jeden dwa trzy! Podejdź i naciśnij E!',
    priority: 3,
    cooldown: 8,
  },
  {
    match: 'MARC BENIOFF / Nie kupuj',
    speaker: 'marc',
    text: 'Nie kupuj Excela. Ten deployment jest na mój koszt! E przy hologramie.',
    priority: 3,
    cooldown: 8,
  },
  {
    match: 'MARC BENIOFF / Twój',
    speaker: 'marc',
    text: 'Twój permission set właśnie dostał uprawnienie: pokonaj arkusz! Naciśnij E!',
    priority: 3,
    cooldown: 8,
  },
  {
    match: 'MARC: „Ochrona zdjęta',
    speaker: 'marc',
    text: 'Ochrona zdjęta! Ten permission set nie wymaga dopłaty. Strzelaj!',
    priority: 3,
    cooldown: 5,
  },
  {
    match: 'MARC: „Zgubiłem',
    speaker: 'marc',
    text: 'Zgubiłem połączenie z Dreamforce. Zaraz wracam!',
    priority: 3,
    cooldown: 12,
  },
  {
    match: 'ARKUSZ CHRONIONY / bez pomocy',
    speaker: 'ship',
    text: 'Arkusz chroniony. Szukaj niebieskiego hologramu Marca i naciśnij E!',
    priority: 2,
    cooldown: 25,
  },
];
const HERO_LINES = {
  apology: 'Przepraszam. Chcę lepiej słuchać i poprzeć to działaniem.',
  romance: 'Chcę z tobą być. Czy ty też?',
  friendship: 'Chcę rozwijać naszą przyjaźń.',
  breakup: 'To trudna decyzja. Zostańmy przyjaciółmi.',
};
const HERO_BARKS = {
  shot: ['Upsert albo nic!', 'Rekord namierzony. Zero duplikatów!', 'Ten import ma zasięg!'],
  hit: ['Tego nie było w specyfikacji!', 'Przydałby się permission set na nietykalność.'],
  heal: ['Medigel zaimportowany. Bez błędnych rekordów.'],
  upgrade: ['Nowa wersja mnie. Wdrożenie bez przerwy technicznej!'],
  dash: ['Przenoszę rekord!'],
};
if (typeof module !== 'undefined' && module.exports)
  module.exports = {
    CREW_SCENES,
    CREW_GREETINGS,
    CREW_EXTRA_LINES,
    CREW_SHARED_LINES,
    VOICE_EVENTS,
    HERO_LINES,
    HERO_BARKS,
  };
