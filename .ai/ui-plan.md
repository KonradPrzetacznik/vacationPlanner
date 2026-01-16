# Architektura UI dla Vacation Planner

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji Vacation Planner została zaprojektowana w celu zapewnienia intuicyjnej, wydajnej i bezpiecznej obsługi dla wszystkich ról użytkowników: Pracowników, Menedżerów i Administratorów. Struktura opiera się na podejściu zorientowanym na zadania, gdzie każdy widok jest zoptymalizowany pod kątem konkretnych działań, takich jak składanie wniosków urlopowych, zarządzanie zespołem czy konfiguracja systemu.

Główne założenia architektury:
- **Modularność:** Wykorzystanie reużywalnych komponentów w celu zapewnienia spójności i przyspieszenia rozwoju.
- **Responsywność:** Zapewnienie pełnej funkcjonalności i czytelności na różnych urządzeniach, od komputerów stacjonarnych po telefony komórkowe.
- **Dostępność:** Stosowanie się do standardów WCAG w celu zapewnienia dostępności dla osób z niepełnosprawnościami.
- **Bezpieczeństwo:** Implementacja mechanizmów kontroli dostępu w oparciu o role (RBAC) bezpośrednio w interfejsie użytkownika, ukrywając lub blokując funkcje niedostępne dla danej roli.

Architektura opiera się na głównym pulpicie nawigacyjnym (Dashboard), który stanowi centralny punkt dostępu do kluczowych modułów: wniosków urlopowych, kalendarza, zarządzania zespołami i ustawień. Nawigacja jest prosta i konsekwentna, umożliwiając użytkownikom łatwe odnajdywanie potrzebnych funkcji.

## 2. Lista widoków

### Widok: Logowanie (Login)
- **Ścieżka:** `/login`
- **Główny cel:** Uwierzytelnienie użytkownika w systemie.
- **Kluczowe informacje do wyświetlenia:** Formularz logowania.
- **Kluczowe komponenty widoku:**
    - Pole na adres e-mail.
    - Pole na hasło.
    - Przycisk "Zaloguj się".
    - Link do odzyskiwania hasła.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Jasne komunikaty o błędach (np. "Nieprawidłowy e-mail lub hasło"). Autouzupełnianie.
    - **Dostępność:** Poprawne etykiety dla pól formularza (`<label>`), walidacja po stronie klienta z komunikatami ARIA.
    - **Bezpieczeństwo:** Komunikacja przez HTTPS. Ochrona przed atakami typu brute-force (np. poprzez limit prób logowania).

### Widok: Pulpit (Dashboard)
- **Ścieżka:** `/`
- **Główny cel:** Zapewnienie szybkiego przeglądu kluczowych informacji i dostępu do głównych funkcji.
- **Kluczowe informacje do wyświetlenia:**
    - Podsumowanie dostępnych dni urlopu.
    - Status ostatnich wniosków urlopowych.
    - Widok nadchodzących nieobecności w zespole (dla Menedżerów).
    - Skróty do najczęstszych akcji (np. "Złóż wniosek").
- **Kluczowe komponenty widoku:**
    - Komponent `VacationBalanceSummary`.
    - Lista `RecentRequests`.
    - Komponent `TeamCalendarTeaser`.
    - Przyciski akcji (`CallToAction`).
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Personalizacja widoku w zależności od roli. Czytelna wizualizacja danych.
    - **Dostępność:** Użycie nagłówków do strukturyzacji treści. Zapewnienie, że wszystkie interaktywne elementy są dostępne z klawiatury.
    - **Bezpieczeństwo:** Dane wyświetlane są zgodnie z uprawnieniami zalogowanego użytkownika.

### Widok: Moje Wnioski (My Requests)
- **Ścieżka:** `/requests`
- **Główny cel:** Zarządzanie własnymi wnioskami urlopowymi przez pracownika.
- **Kluczowe informacje do wyświetlenia:** Lista wszystkich wniosków użytkownika z ich statusami (oczekujący, zatwierdzony, odrzucony, anulowany).
- **Kluczowe komponenty widoku:**
    - Tabela/lista wniosków z opcjami sortowania i filtrowania.
    - Przycisk "Złóż nowy wniosek".
    - Szczegóły wniosku (po kliknięciu).
    - Przycisk "Anuluj wniosek" dla przyszłych urlopów.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Wyróżnienie statusów kolorami. Łatwe filtrowanie i wyszukiwanie.
    - **Dostępność:** Tabela z odpowiednimi nagłówkami (`<th>`). Dostępne z klawiatury akcje dla każdego wniosku.
    - **Bezpieczeństwo:** Użytkownik widzi tylko swoje wnioski.

### Widok: Składanie/Edycja Wniosku (Request Form)
- **Ścieżka:** `/requests/new`, `/requests/:id/edit`
- **Główny cel:** Umożliwienie użytkownikowi złożenia nowego wniosku urlopowego lub edycji istniejącego.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na typ urlopu, datę początkową i końcową, komentarz.
- **Kluczowe komponenty widoku:**
    - Selektor typu urlopu.
    - Selektory daty (`DatePicker`).
    - Pole tekstowe na komentarz.
    - Informacja o dostępnej liczbie dni urlopu.
    - Przycisk "Wyślij" / "Zapisz zmiany".
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Walidacja dat w czasie rzeczywistym (data końcowa nie może być wcześniejsza niż początkowa). Automatyczne obliczanie liczby dni roboczych.
    - **Dostępność:** Poprawne etykiety, obsługa walidacji błędów przez ARIA. `DatePicker` dostępny z klawiatury.
    - **Bezpieczeństwo:** Walidacja po stronie serwera jest kluczowa, aby zapobiec manipulacji danymi.

### Widok: Kalendarz Zespołu (Team Calendar)
- **Ścieżka:** `/calendar`
- **Główny cel:** Wizualizacja nieobecności w zespole (dla Menedżerów) lub w całej firmie (dla Administratorów).
- **Kluczowe informacje do wyświetlenia:** Kalendarz miesięczny/tygodniowy z zaznaczonymi nieobecnościami członków zespołu.
- **Kluczowe komponenty widoku:**
    - Komponent kalendarza (`FullCalendar` lub podobny).
    - Filtr pozwalający wybrać zespół/zespoły.
    - Legenda typów nieobecności.
    - Szczegóły nieobecności po najechaniu/kliknięciu.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Kolorowe oznaczenia urlopów. Intuicyjna nawigacja między miesiącami.
    - **Dostępność:** Zapewnienie, że informacje z kalendarza są dostępne dla czytników ekranu (np. jako alternatywna lista).
    - **Bezpieczeństwo:** Menedżerowie widzą tylko swoje zespoły. Administratorzy widzą wszystkich.

### Widok: Zarządzanie Zespołami (Teams Management)
- **Ścieżka:** `/teams`
- **Główny cel:** Tworzenie, edycja i usuwanie zespołów oraz zarządzanie ich członkami (dla Menedżerów i Administratorów).
- **Kluczowe informacje do wyświetlenia:** Lista zespołów. Po wybraniu zespołu - lista jego członków i menedżera.
- **Kluczowe komponenty widoku:**
    - Lista zespołów.
    - Przycisk "Dodaj zespół".
    - Formularz edycji nazwy zespołu.
    - Lista członków zespołu z opcją dodawania/usuwania.
    - Wyszukiwarka użytkowników do dodania do zespołu.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Przejrzysty interfejs "master-detail". Potwierdzenia akcji krytycznych (np. usunięcie zespołu).
    - **Dostępność:** Listy i przyciski poprawnie oetykietowane. Modal do dodawania użytkowników zarządzalny z klawiatury.
    - **Bezpieczeństwo:** Menedżer może zarządzać tylko swoimi zespołami. Administrator może zarządzać wszystkimi.

### Widok: Zarządzanie Użytkownikami (Users Management)
- **Ścieżka:** `/admin/users`
- **Główny cel:** Zarządzanie kontami użytkowników (dla Administratorów).
- **Kluczowe informacje do wyświetlenia:** Tabela wszystkich użytkowników z ich rolami i statusami.
- **Kluczowe komponenty widoku:**
    - Tabela użytkowników z filtrowaniem i sortowaniem.
    - Przycisk "Dodaj użytkownika".
    - Akcje dla użytkownika: edycja (zmiana roli, danych), dezaktywacja.
    - Formularz dodawania/edycji użytkownika.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Wyszukiwarka ułatwiająca znalezienie użytkownika. Jasne oznaczenie ról.
    - **Dostępność:** Tabela z odpowiednimi nagłówkami. Dostępne akcje.
    - **Bezpieczeństwo:** Widok dostępny wyłącznie dla Administratorów.

### Widok: Ustawienia (Settings)
- **Ścieżka:** `/admin/settings`
- **Główny cel:** Konfiguracja globalnych ustawień aplikacji (dla Administratorów).
- **Kluczowe informacje do wyświetlenia:** Formularze do zarządzania typami urlopów, dniami wolnymi od pracy, limitami urlopowymi.
- **Kluczowe komponenty widoku:**
    - Sekcja zarządzania typami urlopów (dodawanie, edycja).
    - Kalendarz do zarządzania świętami i dniami wolnymi.
    - Formularz do ustawiania domyślnego rocznego limitu urlopu.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Pogrupowanie ustawień w logiczne sekcje. Jasne opisy poszczególnych opcji.
    - **Dostępność:** Wszystkie kontrolki formularzy muszą być dostępne i poprawnie oetykietowane.
    - **Bezpieczeństwo:** Widok dostępny wyłącznie dla Administratorów. Zmiany powinny być logowane.

## 3. Mapa podróży użytkownika

**Główny przypadek użycia: Pracownik składa wniosek urlopowy**

1.  **Logowanie:** Użytkownik (Pracownik) wchodzi na stronę `/login` i podaje swoje dane uwierzytelniające.
2.  **Przekierowanie na Pulpit:** Po pomyślnym zalogowaniu, system przekierowuje go na Pulpit (`/`).
3.  **Inicjacja wniosku:** Na pulpicie użytkownik widzi podsumowanie dostępnych dni urlopu i przycisk "Złóż wniosek". Klika go.
4.  **Wypełnienie formularza:** Użytkownik jest przenoszony do widoku `Składanie Wniosku` (`/requests/new`). Wybiera typ urlopu (np. "Wypoczynkowy"), datę początkową i końcową. System automatycznie oblicza liczbę dni roboczych. Użytkownik może dodać opcjonalny komentarz.
5.  **Wysłanie wniosku:** Użytkownik klika "Wyślij". System waliduje dane i wysyła wniosek do zatwierdzenia przez menedżera.
6.  **Potwierdzenie i powrót:** System wyświetla komunikat o pomyślnym złożeniu wniosku i przekierowuje użytkownika do widoku `Moje Wnioski` (`/requests`), gdzie nowy wniosek jest widoczny na górze listy ze statusem "Oczekujący".

**Inne kluczowe przepływy:**
- **Menedżer zatwierdza wniosek:** Menedżer otrzymuje powiadomienie, loguje się, przechodzi do sekcji "Wnioski do akceptacji" (element pulpitu lub osobny widok), przegląda wniosek (sprawdzając kalendarz zespołu pod kątem konfliktów) i klika "Zatwierdź" lub "Odrzuć".
- **Administrator konfiguruje święta:** Administrator przechodzi do `Ustawień` (`/admin/settings`), wybiera opcję zarządzania dniami wolnymi i dodaje nowe święto w kalendarzu, które będzie automatycznie wyłączone z obliczania dni roboczych dla wszystkich wniosków.

## 4. Układ i struktura nawigacji

Struktura nawigacji będzie oparta na stałym, pionowym menu bocznym, które zapewnia spójny dostęp do głównych sekcji aplikacji.

**Główny układ strony:**
- **Nagłówek (Header):** Zawiera logo aplikacji, menu użytkownika (z opcjami "Mój profil", "Wyloguj") oraz ewentualne powiadomienia.
- **Menu boczne (Sidebar Navigation):** Główne menu nawigacyjne. Jego zawartość jest dynamicznie dostosowywana w zależności od roli użytkownika.
- **Obszar treści (Main Content):** Główny obszar, w którym renderowane są poszczególne widoki.

**Elementy nawigacji w zależności od roli:**

- **Pracownik (Employee):**
    - Pulpit (`/`)
    - Moje Wnioski (`/requests`)
    - Kalendarz Zespołu (`/calendar`) - z widokiem tylko na swój zespół.

- **Menedżer (Manager):**
    - Pulpit (`/`)
    - Moje Wnioski (`/requests`)
    - Wnioski Zespołu (`/team-requests`) - do akceptacji
    - Kalendarz Zespołu (`/calendar`)
    - Zespoły (`/teams`)

- **Administrator (Admin):**
    - Pulpit (`/`)
    - Kalendarz (`/calendar`) - z opcją widoku całej firmy
    - Zarządzanie Użytkownikami (`/admin/users`)
    - Zarządzanie Zespołami (`/teams`)
    - Ustawienia (`/admin/settings`)

Taka struktura zapewnia, że użytkownicy widzą tylko te opcje, które są dla nich relevantne, co upraszcza interfejs i zwiększa bezpieczeństwo.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić podstawę interfejsu użytkownika.

- **`Button`:** Standardowy komponent przycisku z wariantami (główny, drugorzędny, niebezpieczny) i stanami (aktywny, nieaktywny, ładowanie).
- **`Input`:** Komponent pola tekstowego z obsługą etykiet, ikon i komunikatów o błędach.
- **`DatePicker`:** Komponent do wyboru daty i zakresów dat, zintegrowany z logiką biznesową (np. podświetlanie dni wolnych). Musi być w pełni dostępny z klawiatury.
- **`Table`:** Komponent tabeli z wbudowanymi funkcjami sortowania, filtrowania i paginacji.
- **`Modal`:** Komponent okna modalnego do wyświetlania formularzy (np. edycja, dodawanie) lub potwierdzeń akcji.
- **`Select`:** Komponent listy rozwijanej do wyboru opcji (np. typ urlopu, rola użytkownika).
- **`Calendar`:** Komponent do wizualizacji danych w widoku miesięcznym/tygodniowym, używany w Kalendarzu Zespołu.
- **`Badge`:** Mały komponent do wyświetlania statusów (np. "Oczekujący", "Zatwierdzony") w sposób wizualny.
- **`Notification`:** Komponent do wyświetlania globalnych powiadomień (np. "Wniosek został złożony", "Wystąpił błąd").
- **`UserAvatar`:** Komponent wyświetlający awatar użytkownika z jego inicjałami lub zdjęciem.

