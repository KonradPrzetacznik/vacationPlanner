# Aplikacja - VacationPlanner (MVP)

### Główny problem

Zarządzanie urlopami w pracy jest trudne. Dzięki wykorzystaniu potencjału, kreatywności i wiedzy AI, w VacationPlanner możesz w prosty sposób zarządzać urlopami pracowników. Pracownicy mogą zgłaszać dni urlop. Następnie pracownik HR ma możliwość zarządzania i podglądu urlopów.

### Najmniejszy zestaw funkcjonalności

- Role użytkowników:
  - ADMINISTRATOR: umożliwia dodawanie, usuwanie użytkowników i nadawanie im ról. Nie ma możliwości decydowania o żadnych akcjach związanych z urlopami.
  - HR: umożliwia definiowanie zespołów z dostepnych użytkowników, akceptację/odrzucanie zgłoszonego urlopu, podgląd urlopów dla użytkownika i dla całego zespołu, definiowanie ile dni urlopu jest dostępnych,
  - EMPLOYEE: użytkownik może wybrać, w jakich dniach planuje urlop (data od i data do), może podglądać grafik urlopowy swojego zespołu, może podglądać swoje urlopy i ilość dni niewykorzystanych i wykorzystanych.
- w formularzu definiowania urlopu można wybrać zakres urlopu (datę od i do kiedy planowany jest urlop)
- w formularzu definiowania urlopu nie można wybrać dni weekendowych jako data początkowa i końcowa
- liczba dni zdefiniowanych w zakresie urlopu jest wliczana do dni wykorzystanych
- gdy zakres dni urlopu zawiera w sobie dni weekendowe to nie są wliczane jako dni wykorzystane
- dla każdego roku dostępne jest tyle dni urlopu ile zostało zdefiniowane przez użytkownika HR w ustawieniach
- podsumowanie wykorzystanych dni urlopowych obliczane jest dla każdego roku osobno
- dostępność podstrony "Zarządzanie użytkownikami" (dostęp tylko dla użytkownika o roli ADMINISTRATOR)
  - możliwość dodawania nowych użytkowników (imię, nazwisko, email, rola)
  - możliwość usuwania użytkowników
  - możliwość zmiany roli użytkownika (ADMINISTRATOR, HR, EMPLOYEE)
- dostępność podstrony "Ustawienia" gdzie można zdefiniować (dostęp tylko dla użytkownika o roli HR)
  - liczbę dni urlopowych dostępnych w każdym roku (domyślnie 26 dni)
- dostępność podstrony "Zarządzanie zespołami" (dostęp tylko dla użytkownika o roli HR)
  - możliwość tworzenia zespołów z dostępnych użytkowników
  - możliwość przypisania użytkowników do zespołów
  - możliwość usuwania zespołów, jeśli istnieją w nim użytkownicy, użytkownicy ci zostają bez zespołu
  - brak limitu na ilość osob w zespole
  - brak limitu na ilość zespołów
  - użytkownik może należeć do wielu zespołów jednocześnie
- dostępność podstrony "Zarządzanie urlopami" (dostęp tylko dla użytkownika o roli HR)
  - podgląd zgłoszonych urlopów przez pracowników
  - możliwość akceptacji/odrzucenia zgłoszonych urlopów
  - podgląd ilości dni urlopowych wykorzystanych i niewykorzystanych przez pracowników
  - podgląd grafiku urlopowego zespołów (kolejne zespoły powinny być oddzielone od siebie)
- dostępność podstrony "Mój urlop" (dostęp tylko dla użytkownika o roli EMPLOYEE)
  - podgląd zgłoszonych urlopów przez zalogowanego użytkownika
  - podgląd ilości dni urlopowych wykorzystanych i niewykorzystanych przez zalogowanego użytkownika
  - podgląd grafiku urlopowego zespołu, do którego należy zalogowany użytkownik
  - możliwość zgłoszenia nowego urlopu (wybór zakresu dat)
  - możliwość anulowania zgłoszonego urlopu, który nie został jeszcze zaakceptowany lub odrzucony
  - możliwość anulowania wniosku, nawet jeśli został zaakceptowany, ale tylko jeśli data rozpoczęcia urlopu jest w przyszłości
- w przypadku podglądu grafiku urlopowego zespołu kolejne osoby powinny być wyświetlane jedna pod drugą a kalendarz, powinien być wyświetlany obok jako poziomy ciąg dni w miesiącu z automatycznym podglądem na tydzień do tyłu i 2 tygodnie do przodu, tak żeby można było łatwo porównać urlopy wielu osób jednocześnie.
- możliwość filtrowania podglądu grafiku urlopowego zespołu po miesiącach
- aplikacja powinna być responsywna i działać na różnych rozdzielczościach ekranu (desktop, tablet, mobile)
- aplikacja powinna mieć prosty i intuicyjny interfejs użytkownika
- aplikacja powinna być zabezpieczona przed nieautoryzowanym dostępem (np. poprzez logowanie)
- aplikacja powinna być wydajna i działać płynnie nawet przy dużej liczbie użytkowników i zgłoszonych urlopów
- wyświetlanie pracownikowi odpowiedniego statusu, w jakim jest wniosek urlopowy (zgłoszony, zaakceptowany, odrzucony)
- w przypadku kalendarza obecny dzień, dni urlopowe i dni wolne od pracy powinny być wyróżnione innymi kolorami
- nie powinno być możliwości składania wniosków urlopowych na dni przeszłe

### Co NIE wchodzi w zakres MVP

- możliwość definiowania zastępstwa na czas urlopu
- możliwość definiowania różnej ilości dni urlopu dla różnych typów pracowników w zależności np. od stażu
- wykluczenie dni świątecznych podczas obliczania wykorzystanych dni
- możliwość skorzystania z niewykorzystanych dni urlopowych z danego roku w następnym roku
- informowanie pracownika HR o wnioskach do akceptacji i pracowników o zaakceptowanych/odrzuconych urlopach za pomocą maili
- integracja z systemem kadrowo-płacowym firmy
- aplikacja wielojęzyczna
- aplikacja mobilna
- zaawansowane raporty i statystyki dotyczące urlopów
- możliwość definiowania różnych typów urlopów (np. urlop wypoczynkowy, urlop na żądanie, urlop bezpłatny itp.)
- możliwość definiowania urlopów częściowych (np. pół dnia)
- integracja z kalendarzami zewnętrznymi (np. Google Calendar, Outlook itp.)
- możliwość definiowania urlopów z wyprzedzeniem na więcej niż jeden rok
- możliwość definiowania urlopów dla pracowników tymczasowych lub kontraktowych
- zaawansowane uprawnienia dostępu (np. menedżerowie mogą zarządzać urlopami swoich podwładnych itp.)
- automatyczne przypomnienia o zbliżających się urlopach dla pracowników i HR
- możliwość definiowania urlopów w trybie offline
- integracja z systemami do zarządzania projektami (np. Jira, Trello itp.)
- integracja z innymi systemami pracowniczymi
- panel analityczny podsumowujący kryteria sukcesu

### Kryteria sukcesu

- 100% użytkowników firmy korzysta z definiowania urlopów przy pomocy VacationPlanner
- 80% użytkowników wykorzystuje przynajmniej raz w roku dwutygodniowy urlop
- 75% użytkowników wykorzystuje 80% swoich dni urlopowych w danym roku
