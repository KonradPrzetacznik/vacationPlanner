<conversation_summary>
<decisions>

1.  Użytkownicy są dodawani do systemu ręcznie przez Administratora za pomocą formularza.
2.  Odrzucony wniosek urlopowy jest zamykany. Pracownik musi utworzyć nowy wniosek.
3.  MVP nie będzie zawierać żadnych funkcjonalności opartych na AI.
4.  Pracownik HR nie może edytować zaakceptowanego wniosku urlopowego.
5.  Niewykorzystane dni urlopowe przechodzą na kolejny rok i muszą zostać wykorzystane do 31 marca. W pierwszej kolejności wykorzystywane są dni z puli zaległej. Po 31 marca niewykorzystane dni z poprzedniego roku przepadają.
6.  Wprowadzono konfigurowalny (0-100%, domyślnie 50%) próg procentowy określający, jaka część zespołu może przebywać na urlopie. Złożenie wniosku naruszającego ten próg jest możliwe, ale HR otrzymuje ostrzeżenie i musi dodatkowo potwierdzić chęć akceptacji takiego wniosku.
7.  Hasło początkowe dla nowego użytkownika jest ustawiane przez Administratora. Użytkownik jest zmuszony do zmiany tego hasła przy pierwszym logowaniu.
8.  Użytkownik z rolą HR może być członkiem zespołu. Jeśli w systemie jest tylko jeden pracownik HR, może on sam sobie akceptować urlopy (włącznie z obsługą progu procentowego).
9.  W kalendarzu wyróżnione kolorami będą weekendy, aktualny dzień oraz urlopy (oczekujące i zaakceptowane różnymi kolorami). Święta nie są obsługiwane.
10. Wszyscy pracownicy firmy są zobowiązani do korzystania z aplikacji do składania wniosków urlopowych.
11. Użytkownicy są usuwani poprzez "soft-delete" (flaga `deleted_at`). Są niewidoczni w systemie dla ról innych niż Administrator, który widzi ich jako "wyszarzonych". Nie ma funkcji przywracania użytkownika w MVP.
12. Przyszłe, zaplanowane urlopy usuniętego użytkownika (soft-delete) są automatycznie anulowane.
13. Usunięci użytkownicy (soft-delete) nie wliczają się do liczby członków zespołu przy obliczaniu progu procentowego.
14. Pracownik może anulować urlop do dnia poprzedzającego jego rozpoczęcie oraz w pierwszym dniu jego trwania. W przypadku anulowania w pierwszym dniu, cała pula dni wraca do dostępnych.
15. Administrator może edytować imię i nazwisko użytkownika, ale nie może edytować adresu e-mail.
16. Historyczne dane o urlopach usuniętego użytkownika pozostają w bazie danych, ale nie są widoczne w interfejsie.
17. Pracownik należący do wielu zespołów będzie miał możliwość przełączania widoku kalendarza między zespołami za pomocą listy rozwijanej.
18. Administrator nie może edytować swojej własnej roli.
19. Nowo utworzony użytkownik nie jest domyślnie przypisany do żadnego zespołu.
20. Nie ma wymagań co do złożoności hasła na etapie MVP.
    </decisions>

<matched_recommendations>

1.  Wprowadzenie zasady, że przeniesione dni urlopowe muszą zostać wykorzystane do 31 marca kolejnego roku, a system powinien jasno komunikować ten termin użytkownikowi.
2.  System powinien automatycznie blokować możliwość złożenia wniosku naruszającego regułę procentową, ale ostatecznie zmieniono to na ostrzeżenie dla HR z możliwością nadpisania decyzji.
3.  Zdefiniowano ścieżkę akceptacji dla pracownika HR (może sam sobie akceptować urlop, jeśli jest jedyny).
4.  Anulowanie zaakceptowanego wniosku jest możliwe tylko do dnia rozpoczęcia urlopu włącznie.
5.  Usunięcie użytkownika jest operacją typu "soft delete", a jego dane historyczne są zachowywane.
6.  Domyślna liczba dni urlopu (26) jest wartością globalną, stosowaną automatycznie.
7.  Widok kalendarza dla ról EMPLOYEE i HR powinien pokazywać zarówno urlopy zaakceptowane, jak i oczekujące, z wyraźnym rozróżnieniem wizualnym.
8.  Na stronie "Mój urlop" należy wyraźnie rozdzielić pulę dni urlopowych z bieżącego roku oraz pulę dni przeniesionych z roku poprzedniego.
9.  W widoku kalendarza zespołu, obok zaznaczonych dni urlopu, powinno być widoczne imię i nazwisko pracownika.
10. W celu zwiększenia bezpieczeństwa, system powinien wymuszać na użytkowniku zmianę hasła ustawionego przez Administratora podczas pierwszego logowania.
    </matched_recommendations>

<prd_planning_summary>

### Podsumowanie Planowania PRD dla VacationPlanner (MVP)

#### 1. Główne Wymagania Funkcjonalne

- **Role Użytkowników:**
  - **ADMINISTRATOR:** Zarządza użytkownikami (dodawanie przez formularz, edycja imienia/nazwiska, usuwanie "soft delete", zmiana ról). Nie może edytować własnej roli ani adresów e-mail użytkowników. Widzi usuniętych użytkowników.
  - **HR:** Zarządza zespołami (tworzenie, usuwanie, przypisywanie użytkowników). Zarządza wnioskami urlopowymi (akceptacja/odrzucenie). Definiuje globalne ustawienia (domyślna liczba dni urlopu, procent zespołu na urlopie). Przegląda grafiki urlopowe zespołów. Może być członkiem zespołu i składać wnioski.
  - **EMPLOYEE:** Składa wnioski urlopowe (wybór dat, weekendy wykluczone z obliczeń). Anuluje wnioski (do pierwszego dnia urlopu włącznie). Przegląda swoje urlopy, dostępną pulę dni (z podziałem na bieżące i zaległe) oraz grafik urlopowy swoich zespołów.

- **Zarządzanie Urlopami:**
  - Wnioski mają statusy: Zgłoszony, Zaakceptowany, Odrzucony.
  - Niewykorzystane dni przechodzą na kolejny rok z terminem wykorzystania do 31 marca.
  - Kolejność wykorzystania urlopu: najpierw pula zaległa, potem bieżąca.
  - Anulowanie urlopu w pierwszym dniu jego trwania zwraca całą pulę dni.

- **Zarządzanie Zespołami i Użytkownikami:**
  - Użytkownik może należeć do wielu zespołów.
  - Usunięcie zespołu z członkami powoduje, że stają się oni bez przypisanego zespołu.
  - Użytkownicy usuwani są za pomocą "soft delete". Ich przyszłe urlopy są automatycznie anulowane.

- **Interfejs Użytkownika i Widoki:**
  - Responsywny interfejs (desktop, tablet, mobile).
  - Widok kalendarza zespołu pokazuje urlopy zaakceptowane i oczekujące (różne kolory) wraz z imionami i nazwiskami pracowników.
  - Użytkownik należący do wielu zespołów może przełączać widok kalendarza.
  - Pracownik widzi podział swojej puli urlopowej na dni bieżące i zaległe.

#### 2. Kluczowe Historie Użytkownika

- **Jako Administrator:** Chcę dodać nowego pracownika do systemu, podając jego dane i ustawiając hasło początkowe, aby mógł zacząć korzystać z aplikacji.
- **Jako Pracownik (EMPLOYEE):** Chcę złożyć wniosek o urlop na wybrane dni, aby zaplanować swój wypoczynek.
- **Jako Pracownik (EMPLOYEE):** Chcę widzieć w kalendarzu, kto z mojego zespołu ma zaplanowany urlop, aby lepiej koordynować pracę.
- **Jako Pracownik HR:** Chcę przejrzeć listę wniosków urlopowych oczekujących na akceptację i zobaczyć grafik zespołu, aby podjąć świadomą decyzję o akceptacji lub odrzuceniu.
- **Jako Pracownik HR:** Chcę otrzymać ostrzeżenie, jeśli akceptacja wniosku spowoduje przekroczenie limitu osób na urlopie w zespole, ale chcę mieć możliwość świadomego zignorowania tego limitu.

#### 3. Kryteria Sukcesu i Mierzenie

- **100% użytkowników firmy korzysta z VacationPlanner:** Mierzone poprzez sprawdzenie, czy wszyscy aktywni pracownicy firmy złożyli co najmniej jeden wniosek urlopowy w ciągu roku za pośrednictwem aplikacji.
- **80% użytkowników wykorzystuje przynajmniej raz w roku dwutygodniowy urlop:** Mierzone przez analizę historycznych danych urlopowych pod kątem ciągłych okresów urlopowych trwających 10 dni roboczych lub więcej.
- **75% użytkowników wykorzystuje 80% swoich dni urlopowych w danym roku:** Mierzone przez porównanie liczby dni wykorzystanych do całkowitej puli dostępnej dla każdego użytkownika na koniec roku kalendarzowego.

</prd_planning_summary>

<unresolved_issues>

- **Zmiana globalnej liczby dni urlopowych w trakcie roku:** Zdecydowano, że ten przypadek nie będzie obsługiwany w MVP, ponieważ wartość ta nie będzie edytowana. Jednakże, brak zdefiniowanej logiki na ten scenariusz stanowi potencjalne ryzyko techniczne, jeśli w przyszłości zajdzie potrzeba edycji tej wartości w trakcie roku.
- **Przywracanie użytkownika:** Funkcja przywracania usuniętego użytkownika została jawnie odrzucona dla MVP. Należy to odnotować jako potencjalną funkcjonalność do rozwoju w przyszłości.
  </unresolved_issues>
  </conversation_summary>
