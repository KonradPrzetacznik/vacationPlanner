# Dokument wymagań produktu (PRD) - VacationPlanner

## 1. Przegląd produktu

VacationPlanner to aplikacja internetowa zaprojektowana w celu uproszczenia i centralizacji procesu zarządzania urlopami w firmie. Aplikacja wprowadza trzy role użytkowników (ADMINISTRATOR, HR, EMPLOYEE), z których każda ma określone uprawnienia do zarządzania użytkownikami, zespołami i wnioskami urlopowymi. System umożliwia pracownikom składanie wniosków o urlop, przeglądanie grafików swoich zespołów oraz śledzenie dostępnych dni urlopowych. Pracownicy HR mogą zarządzać wnioskami, konfigurować ustawienia systemowe, takie jak liczba dni urlopowych, i organizować strukturę zespołów. Administratorzy odpowiadają za zarządzanie kontami użytkowników. Celem aplikacji jest zastąpienie manualnych lub rozproszonych metod zarządzania urlopami, zwiększając przejrzystość i efektywność tego procesu.

## 2. Problem użytkownika

Zarządzanie urlopami w organizacjach jest często procesem chaotycznym, opartym na arkuszach kalkulacyjnych, wiadomościach e-mail lub nieformalnych ustaleniach. Prowadzi to do braku przejrzystości, trudności w planowaniu pracy zespołowej oraz pomyłek w obliczaniu wykorzystanych i dostępnych dni urlopowych. Pracownicy nie mają łatwego wglądu w grafiki urlopowe swoich kolegów, co utrudnia koordynację. Dział HR poświęca znaczną ilość czasu na ręczne przetwarzanie wniosków, odpowiadanie na pytania dotyczące dostępnych dni i monitorowanie obłożenia zespołów. VacationPlanner adresuje te problemy, dostarczając jedno, dedykowane narzędzie, które automatyzuje i porządkuje cały cykl życia wniosku urlopowego, od jego złożenia po akceptację i wizualizację w kalendarzu.

## 3. Wymagania funkcjonalne

### 3.1. Role i uprawnienia

- System obsługuje trzy role: ADMINISTRATOR, HR, EMPLOYEE.
- ADMINISTRATOR:
  - Może dodawać, usuwać (soft-delete) i edytować (imię, nazwisko) użytkowników.
  - Może zmieniać role użytkowników (z wyjątkiem własnej).
  - Nie może edytować adresu e-mail użytkownika.
  - Widzi listę wszystkich użytkowników, w tym usuniętych (oznaczonych wizualnie).
  - Nie ma dostępu do funkcji związanych z zarządzaniem urlopami i zespołami.
- HR:
  - Może tworzyć i usuwać zespoły.
  - Może przypisywać i usuwać użytkowników z zespołów.
  - Może akceptować i odrzucać wnioski urlopowe.
  - Może definiować globalną liczbę dni urlopowych w roku.
  - Może definiować próg procentowy członków zespołu mogących przebywać na urlopie w tym samym czasie.
  - Ma podgląd grafików urlopowych wszystkich zespołów.
  - Może być członkiem zespołu i składać własne wnioski urlopowe (jeśli jest jedynym HR w systemie, sam je akceptuje).
- EMPLOYEE:
  - Może złożyć wniosek o urlop.
  - Może anulować swój wniosek, jeśli nie został on jeszcze rozpatrzony.
  - Może anulować zaakceptowany urlop najpóźniej w pierwszym dniu jego trwania.
  - Ma podgląd statusu swoich wniosków.
  - Ma podgląd liczby swoich wykorzystanych i dostępnych dni urlopowych (z podziałem na pulę bieżącą i zaległą).
  - Ma podgląd grafiku urlopowego zespołu (lub zespołów), do którego należy.

### 3.2. Zarządzanie użytkownikami

- Nowi użytkownicy są dodawani przez Administratora za pomocą formularza (imię, nazwisko, e-mail, rola).
- Administrator ustawia hasło początkowe; użytkownik jest zmuszony do jego zmiany przy pierwszym logowaniu.
- Usuwanie użytkownika odbywa się poprzez "soft-delete" (ustawienie flagi `deleted_at`). Usunięty użytkownik jest niewidoczny dla ról HR i EMPLOYEE.
- Przyszłe, zaplanowane urlopy usuniętego użytkownika są automatycznie anulowane.
- Usunięci użytkownicy nie są wliczani do liczby członków zespołu przy obliczaniu progu procentowego.
- Dane historyczne usuniętych użytkowników pozostają w bazie danych, ale nie są widoczne w interfejsie.

### 3.3. Zarządzanie zespołami

- Użytkownik może należeć do wielu zespołów jednocześnie.
- Pracownik należący do wielu zespołów ma możliwość przełączania widoku kalendarza między zespołami.
- Usunięcie zespołu, w którym są użytkownicy, powoduje, że stają się oni nieprzypisani do żadnego zespołu.
- Nie ma limitu liczby zespołów ani liczby członków w zespole.

### 3.4. Zarządzanie urlopami

- Wniosek urlopowy definiuje się przez datę początkową i końcową.
- Dni weekendowe (sobota, niedziela) nie mogą być datą początkową ani końcową wniosku.
- Dni weekendowe zawarte w okresie urlopu nie są wliczane do puli wykorzystanych dni.
- Nie można składać wniosków na daty przeszłe.
- Statusy wniosku: Zgłoszony, Zaakceptowany, Odrzucony. Odrzucony wniosek jest zamknięty i wymaga złożenia nowego.
- Niewykorzystane dni urlopowe z danego roku przechodzą na kolejny rok i muszą zostać wykorzystane do 31 marca.
- System w pierwszej kolejności wykorzystuje dni z puli zaległej. Po 31 marca niewykorzystane dni z poprzedniego roku przepadają.
- Pracownik może anulować zaakceptowany urlop do końca pierwszego dnia jego trwania. Anulowanie zwraca pełną liczbę dni do puli dostępnej.

### 3.5. Ustawienia

- HR może zdefiniować globalną, domyślną liczbę dni urlopu na dany rok (domyślnie 26).
- HR może zdefiniować globalny próg procentowy (0-100%, domyślnie 50%) określający, jaka część zespołu może jednocześnie przebywać na urlopie.
- Złożenie wniosku naruszającego próg jest możliwe, ale HR otrzymuje ostrzeżenie i musi dodatkowo potwierdzić akceptację.

### 3.6. Interfejs użytkownika i widoki

- Aplikacja musi być responsywna (desktop, tablet, mobile).
- Widok kalendarza zespołu:
  - Wyświetla listę pracowników (jeden pod drugim) i poziomy kalendarz dni.
  - Domyślnie pokazuje widok od tygodnia w przeszłość do dwóch tygodni w przyszłość.
  - Umożliwia filtrowanie po miesiącach.
  - Wyróżnia kolorami: aktualny dzień, weekendy, urlopy zaakceptowane i urlopy oczekujące.
  - Obok zaznaczonych dni urlopu widoczne jest imię i nazwisko pracownika.
- Strona "Mój urlop" (EMPLOYEE) wyświetla pulę dni urlopowych z podziałem na bieżące i zaległe.

## 4. Granice produktu

Poniższe funkcjonalności i cechy NIE wchodzą w zakres wersji MVP (Minimum Viable Product):

- Definiowanie zastępstwa na czas urlopu.
- Różnicowanie liczby dni urlopu w zależności od stażu pracy lub typu umowy.
- Automatyczne wykluczanie dni świątecznych (ustawowo wolnych od pracy) z obliczeń.
- Powiadomienia e-mail o statusie wniosków.
- Integracja z zewnętrznymi systemami (kadrowo-płacowe, kalendarze Google/Outlook, Jira itp.).
- Obsługa wielu języków.
- Dedykowana aplikacja mobilna.
- Zaawansowane raporty i statystyki.
- Różne typy urlopów (np. na żądanie, bezpłatny).
- Składanie wniosków na część dnia (np. pół dnia).
- Składanie wniosków z wyprzedzeniem na więcej niż jeden rok.
- Zaawansowane uprawnienia (np. menedżerowie zespołów akceptujący urlopy swoich podwładnych).
- Automatyczne przypomnienia o zbliżających się urlopach.
- Funkcja przywracania użytkownika usuniętego metodą "soft-delete".
- Obsługa scenariusza zmiany globalnej liczby dni urlopowych w trakcie roku.

## 5. Historyjki użytkowników

### Uwierzytelnianie i Dostęp

- ID: US-001
- Tytuł: Logowanie użytkownika
- Opis: Jako użytkownik (ADMINISTRATOR, HR, EMPLOYEE), chcę móc zalogować się do aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do moich uprawnień.
- Kryteria akceptacji:
  - 1. Formularz logowania zawiera pola na e-mail i hasło.
  - 2. Po podaniu poprawnych danych użytkownik zostaje zalogowany i przekierowany do odpowiedniego panelu.
  - 3. Po podaniu błędnych danych wyświetlany jest komunikat o nieprawidłowym loginie lub haśle.

- ID: US-002
- Tytuł: Wymuszona zmiana hasła przy pierwszym logowaniu
- Opis: Jako nowy użytkownik, po pierwszym zalogowaniu się hasłem tymczasowym nadanym przez Administratora, chcę być zmuszony do ustawienia nowego, własnego hasła, aby zabezpieczyć swoje konto.
- Kryteria akceptacji:
  - 1. Po pierwszym logowaniu system przekierowuje użytkownika do formularza zmiany hasła.
  - 2. Użytkownik nie może uzyskać dostępu do innych części aplikacji przed zmianą hasła.
  - 3. Po pomyślnej zmianie hasła użytkownik jest zalogowany i przekierowany na stronę główną.

### Rola: ADMINISTRATOR

- ID: US-003
- Tytuł: Dodawanie nowego użytkownika
- Opis: Jako ADMINISTRATOR, chcę móc dodać nowego użytkownika do systemu, podając jego imię, nazwisko, adres e-mail, rolę oraz hasło początkowe.
- Kryteria akceptacji:
  - 1. W panelu "Zarządzanie użytkownikami" dostępny jest formularz dodawania użytkownika.
  - 2. Formularz zawiera pola: imię, nazwisko, e-mail, rola (lista wyboru: ADMINISTRATOR, HR, EMPLOYEE), hasło początkowe.
  - 3. Po pomyślnym dodaniu, nowy użytkownik pojawia się na liście użytkowników.
  - 4. Nie można dodać użytkownika z adresem e-mail, który już istnieje w systemie.

- ID: US-004
- Tytuł: Zmiana roli użytkownika
- Opis: Jako ADMINISTRATOR, chcę móc zmienić rolę istniejącego użytkownika, aby dostosować jego uprawnienia.
- Kryteria akceptacji:
  - 1. Na liście użytkowników przy każdym koncie (oprócz własnego) dostępna jest opcja edycji roli.
  - 2. Po wybraniu nowej roli i zapisaniu zmian, uprawnienia użytkownika zostają zaktualizowane.
  - 3. Administrator nie może zmienić swojej własnej roli.

- ID: US-005
- Tytuł: Edycja danych użytkownika
- Opis: Jako ADMINISTRATOR, chcę móc edytować imię i nazwisko istniejącego użytkownika.
- Kryteria akceptacji:
  - 1. Na liście użytkowników dostępna jest opcja edycji danych.
  - 2. Formularz edycji pozwala na zmianę imienia i nazwiska.
  - 3. Pole z adresem e-mail jest widoczne, ale zablokowane do edycji.
  - 4. Zmiany są widoczne na liście użytkowników po zapisaniu.

- ID: US-006
- Tytuł: Usuwanie użytkownika (soft-delete)
- Opis: Jako ADMINISTRATOR, chcę móc usunąć użytkownika, aby dezaktywować jego konto w systemie.
- Kryteria akceptacji:
  - 1. Na liście użytkowników przy każdym koncie dostępna jest opcja "Usuń".
  - 2. Po potwierdzeniu, użytkownik zostaje oznaczony jako usunięty (soft-delete) i jest wizualnie wyróżniony na liście (np. wyszarzony).
  - 3. Usunięty użytkownik nie może się zalogować.
  - 4. Wszystkie przyszłe (jeszcze nierozpoczęte) urlopy tego użytkownika są automatycznie anulowane.

### Rola: HR

- ID: US-007
- Tytuł: Definiowanie liczby dni urlopowych
- Opis: Jako pracownik HR, chcę móc zdefiniować globalną liczbę dni urlopowych dostępnych dla pracowników w każdym roku, aby dostosować system do polityki firmy.
- Kryteria akceptacji:
  - 1. W panelu "Ustawienia" znajduje się pole do wprowadzenia liczby dni urlopowych.
  - 2. Wartość domyślna to 26.
  - 3. Zapisana wartość jest używana do obliczania puli urlopowej dla wszystkich użytkowników w kolejnych latach.

- ID: US-008
- Tytuł: Definiowanie progu obłożenia zespołu
- Opis: Jako pracownik HR, chcę móc zdefiniować próg procentowy określający, ilu członków zespołu może być na urlopie w tym samym czasie, aby lepiej zarządzać zasobami.
- Kryteria akceptacji:
  - 1. W panelu "Ustawienia" znajduje się pole do wprowadzenia wartości procentowej (0-100).
  - 2. Wartość domyślna to 50%.
  - 3. Ta wartość jest używana do wyświetlania ostrzeżenia podczas akceptacji wniosków.

- ID: US-009
- Tytuł: Tworzenie zespołu
- Opis: Jako pracownik HR, chcę móc tworzyć nowe zespoły, aby organizować pracowników w struktury firmowe.
- Kryteria akceptacji:
  - 1. W panelu "Zarządzanie zespołami" dostępna jest opcja "Utwórz zespół".
  - 2. Po podaniu nazwy i zapisaniu, nowy, pusty zespół pojawia się na liście zespołów.

- ID: US-010
- Tytuł: Przypisywanie użytkowników do zespołu
- Opis: Jako pracownik HR, chcę móc przypisywać użytkowników do istniejących zespołów.
- Kryteria akceptacji:
  - 1. W widoku zarządzania zespołem mogę wybrać użytkowników z listy wszystkich pracowników niebędących w tym zespole.
  - 2. Po zapisaniu, wybrani użytkownicy stają się członkami zespołu.
  - 3. Jeden użytkownik może być przypisany do wielu zespołów.

- ID: US-011
- Tytuł: Usuwanie użytkowników z zespołu
- Opis: Jako pracownik HR, chcę móc usuwać użytkowników z zespołu.
- Kryteria akceptacji:
  - 1. W widoku zarządzania zespołem, przy każdym członku zespołu jest opcja "Usuń z zespołu".
  - 2. Po usunięciu, użytkownik przestaje być członkiem tego zespołu, ale jego konto pozostaje aktywne.

- ID: US-012
- Tytuł: Przeglądanie wniosków urlopowych
- Opis: Jako pracownik HR, chcę widzieć listę wszystkich wniosków urlopowych oczekujących na decyzję, aby móc nimi zarządzać.
- Kryteria akceptacji:
  - 1. W panelu "Zarządzanie urlopami" wyświetlana jest lista wniosków ze statusem "Zgłoszony".
  - 2. Lista zawiera informacje: imię i nazwisko pracownika, daty urlopu, liczba dni roboczych.

- ID: US-013
- Tytuł: Akceptowanie/Odrzucanie wniosku urlopowego
- Opis: Jako pracownik HR, chcę móc zaakceptować lub odrzucić wniosek urlopowy pracownika.
- Kryteria akceptacji:
  - 1. Przy każdym wniosku na liście dostępne są przyciski "Akceptuj" i "Odrzuć".
  - 2. Po akceptacji status wniosku zmienia się na "Zaakceptowany", a dni urlopu są odejmowane z puli pracownika.
  - 3. Po odrzuceniu status wniosku zmienia się na "Odrzucony", a pula dni pracownika pozostaje bez zmian.
  - 4. Wniosek znika z listy oczekujących na decyzję.

- ID: US-014
- Tytuł: Ostrzeżenie o przekroczeniu progu obłożenia
- Opis: Jako pracownik HR, podczas akceptowania wniosku, który powoduje przekroczenie zdefiniowanego progu osób na urlopie w zespole, chcę zobaczyć wyraźne ostrzeżenie i móc świadomie potwierdzić decyzję.
- Kryteria akceptacji:
  - 1. Jeśli akceptacja wniosku narusza próg, system wyświetla modal/pop-up z ostrzeżeniem.
  - 2. Ostrzeżenie informuje o przekroczeniu limitu.
  - 3. Modal zawiera przyciski "Akceptuj mimo to" i "Anuluj".
  - 4. Akceptacja jest możliwa tylko po dodatkowym potwierdzeniu.

- ID: US-015
- Tytuł: Przeglądanie grafiku urlopowego zespołu
- Opis: Jako pracownik HR, chcę móc przeglądać grafik urlopowy dla wybranego zespołu lub wszystkich zespołów, aby mieć pełny obraz planowanych nieobecności.
- Kryteria akceptacji:
  - 1. W panelu "Zarządzanie urlopami" dostępny jest widok kalendarza.
  - 2. Kalendarz wyświetla pracowników w wierszach i dni w kolumnach.
  - 3. Urlopy zaakceptowane i oczekujące są oznaczone różnymi kolorami.
  - 4. Dostępne jest filtrowanie widoku po miesiącach.
  - 5. Widok jest responsywny.

### Rola: EMPLOYEE

- ID: US-016
- Tytuł: Składanie wniosku o urlop
- Opis: Jako pracownik, chcę móc złożyć wniosek o urlop, wybierając datę początkową i końcową, aby zaplanować swój wypoczynek.
- Kryteria akceptacji:
  - 1. W panelu "Mój urlop" dostępny jest formularz składania wniosku.
  - 2. Formularz zawiera pola wyboru daty "od" i "do".
  - 3. Kalendarz w formularzu nie pozwala na wybranie weekendu jako daty początkowej lub końcowej.
  - 4. Nie można wybrać dat z przeszłości.
  - 5. Po złożeniu, wniosek pojawia się na mojej liście wniosków ze statusem "Zgłoszony".

- ID: US-017
- Tytuł: Przeglądanie własnych wniosków urlopowych
- Opis: Jako pracownik, chcę widzieć listę moich wszystkich wniosków urlopowych wraz z ich statusami (Zgłoszony, Zaakceptowany, Odrzucony).
- Kryteria akceptacji:
  - 1. W panelu "Mój urlop" znajduje się lista moich wniosków.
  - 2. Każdy wniosek na liście pokazuje zakres dat oraz aktualny status.

- ID: US-018
- Tytuł: Anulowanie niezdecydowanego wniosku
- Opis: Jako pracownik, chcę móc anulować swój wniosek urlopowy, który nie został jeszcze rozpatrzony przez HR.
- Kryteria akceptacji:
  - 1. Przy wnioskach ze statusem "Zgłoszony" widoczny jest przycisk "Anuluj".
  - 2. Po anulowaniu wniosek znika z listy lub zmienia status na "Anulowany".

- ID: US-019
- Tytuł: Anulowanie zaakceptowanego urlopu
- Opis: Jako pracownik, chcę móc anulować zaakceptowany urlop, jeśli jego data rozpoczęcia jeszcze nie nadeszła lub jest to pierwszy dzień jego trwania.
- Kryteria akceptacji:
  - 1. Przycisk "Anuluj" jest widoczny przy zaakceptowanych urlopach, których data rozpoczęcia jest przyszła lub dzisiejsza.
  - 2. Po anulowaniu urlopu, odpowiednia liczba dni wraca do mojej puli dostępnych dni urlopowych.
  - 3. Przycisk "Anuluj" nie jest widoczny dla urlopów, które rozpoczęły się w poprzednich dniach.

- ID: US-020
- Tytuł: Podgląd dostępnych dni urlopowych
- Opis: Jako pracownik, chcę w każdej chwili widzieć, ile dni urlopu mi pozostało, z podziałem na pulę z bieżącego roku i pulę zaległą z poprzedniego roku.
- Kryteria akceptacji:
  - 1. W panelu "Mój urlop" widoczne jest podsumowanie dostępnych dni.
  - 2. Podsumowanie jasno rozdziela dni z puli bieżącej i zaległej (np. "Dostępne dni: 20, w tym 5 z poprzedniego roku").
  - 3. System informuje o terminie wykorzystania dni zaległych (do 31 marca).

- ID: US-021
- Tytuł: Przeglądanie grafiku urlopowego swojego zespołu
- Opis: Jako pracownik, chcę widzieć grafik urlopowy mojego zespołu, aby wiedzieć, kiedy moi koledzy planują nieobecności i lepiej koordynować pracę.
- Kryteria akceptacji:
  - 1. W panelu "Mój urlop" dostępny jest widok kalendarza zespołu.
  - 2. Kalendarz pokazuje urlopy (zaakceptowane i oczekujące) wszystkich członków mojego zespołu.
  - 3. Jeśli należę do wielu zespołów, mogę przełączać widok kalendarza za pomocą listy rozwijanej.

- ID: US-023: Bezpieczny dostęp i uwierzytelnianie

- Tytuł: Bezpieczny dostęp
- Opis: Jako użytkownik chcę mieć możliwość rejestracji i logowania się do systemu w sposób zapewniający bezpieczeństwo moich danych.
- Kryteria akceptacji:
  - Logowanie i rejestracja odbywają się na dedykowanych stronach.
  - Logowanie wymaga podania adresu email i hasła.
  - Rejestracja wymaga podania adresu email, hasła i potwierdzenia hasła.
  - Użytkownik MOŻE korzystać z tworzenia reguł "ad-hoc" bez logowania się do systemu (US-001, US-002).
  - Użytkownik NIE MOŻE korzystać z żadnych innych funkcji bez logowania się do systemu.
  - Użytkownik może logować się do systemu poprzez przycisk w prawym górnym rogu.
  - Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu w głównym @Layout.astro.
  - Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).
  - Odzyskiwanie hasła powinno być możliwe.
  -

## 6. Metryki sukcesu

- 100% użytkowników firmy korzysta z VacationPlanner do definiowania urlopów.
  - Miernik: Odsetek aktywnych pracowników, którzy złożyli co najmniej jeden wniosek urlopowy przez aplikację w ciągu roku.
- 80% użytkowników wykorzystuje przynajmniej raz w roku dwutygodniowy urlop.
  - Miernik: Odsetek użytkowników, którzy w ciągu roku kalendarzowego mieli co najmniej jeden zaakceptowany urlop trwający nieprzerwanie 10 lub więcej dni roboczych.
- 75% użytkowników wykorzystuje 80% swoich dni urlopowych w danym roku.
  - Miernik: Odsetek użytkowników, którzy na koniec roku kalendarzowego wykorzystali co najmniej 80% swojej całkowitej puli urlopowej (bieżącej i zaległej).
