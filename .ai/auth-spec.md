### Specyfikacja Architektoniczna: Moduł Uwierzytelniania

Poniższy dokument opisuje architekturę modułu rejestracji, logowania i odzyskiwania hasła dla aplikacji VacationPlanner, opartą na Astro, React i Supabase.

---

### 1. Architektura Interfejsu Użytkownika (Frontend)

#### 1.1. Nowe Strony (Astro)

-   **`/login`**: Strona publiczna zawierająca formularz logowania.
    -   **Komponent React**: `<LoginForm />`
    -   **Logika**: Strona będzie renderowana przez Astro. W przypadku, gdy użytkownik jest już zalogowany (sesja jest aktywna), zostanie automatycznie przekierowany na stronę główną (`/`).
-   **`/forgot-password`**: Strona publiczna z formularzem do zainicjowania procesu odzyskiwania hasła.
    -   **Komponent React**: `<ForgotPasswordForm />`
    -   **Logika**: Umożliwia użytkownikowi podanie adresu e-mail, na który zostanie wysłany link do resetowania hasła.
-   **`/set-password`**: Strona publiczna do ustawiania/resetowania hasła.
    -   **Komponent React**: `<SetPasswordForm />`
    -   **Logika**: Strona będzie przyjmować token z parametrów URL (np. `?token=...`), który jest niezbędny do weryfikacji tożsamości użytkownika podczas procesu zmiany hasła (zarówno przy pierwszym logowaniu po otrzymaniu zaproszenia, jak i przy odzyskiwaniu hasła).

#### 1.2. Nowe Komponenty (React)

-   **`src/components/forms/LoginForm.tsx`**:
    -   **Pola**: `email`, `password`.
    -   **Walidacja (client-side + Zod)**: Sprawdzenie formatu e-mail i obecności hasła.
    -   **Logika**: Po submisji, komponent wywołuje endpoint API `/api/auth/login`. W przypadku sukcesu, nawiguje użytkownika do strony głównej (`/`). W przypadku błędu, wyświetla komunikat (np. "Nieprawidłowy e-mail lub hasło").
-   **`src/components/forms/ForgotPasswordForm.tsx`**:
    -   **Pola**: `email`.
    -   **Walidacja (client-side + Zod)**: Sprawdzenie formatu e-mail.
    -   **Logika**: Po submisji, wywołuje endpoint API `/api/auth/forgot-password`. Po pomyślnym wysłaniu, wyświetla komunikat informujący o wysłaniu instrukcji na podany adres e-mail.
-   **`src/components/forms/SetPasswordForm.tsx`**:
    -   **Pola**: `password`, `confirmPassword`.
    -   **Walidacja (client-side + Zod)**: Sprawdzenie, czy hasła są identyczne i spełniają wymogi bezpieczeństwa (np. minimalna długość).
    -   **Logika**: Komponent odczytuje token z URL. Po submisji, wysyła żądanie do endpointu API `/api/auth/set-password` wraz z nowym hasłem i tokenem. Po sukcesie, nawiguje do strony logowania (`/login`) z komunikatem o pomyślnej zmianie hasła.

#### 1.3. Modyfikacje Istniejących Komponentów i Layoutów

-   **`src/layouts/Layout.astro`**:
    -   **Zmiany**: Należy dodać logikę warunkowego renderowania przycisków w prawym górnym rogu.
    -   **Użytkownik niezalogowany**: Wyświetlany jest przycisk "Zaloguj się", prowadzący do `/login`.
    -   **Użytkownik zalogowany**: Wyświetlana jest nazwa użytkownika (lub e-mail) oraz przycisk/link "Wyloguj się". Kliknięcie "Wyloguj się" powinno wywołać endpoint `/api/auth/logout`.
-   **`src/middleware/index.ts`**:
    -   **Zmiany**: Middleware będzie kluczowym elementem systemu. Będzie przechwytywać wszystkie żądania.
    -   **Logika**:
        1.  Sprawdza obecność i ważność tokena sesji (ciasteczka) przy użyciu `Astro.cookies` i Supabase SDK.
        2.  Jeśli sesja jest ważna, dane użytkownika (ID, rola, e-mail) są pobierane i umieszczane w `context.locals.user`, aby były dostępne w każdej stronie renderowanej po stronie serwera.
        3.  Jeśli sesja jest nieważna lub jej brak, a użytkownik próbuje uzyskać dostęp do strony chronionej (np. `/calendar`, `/teams`, `/requests`, `/admin`), jest przekierowywany na stronę logowania (`/login`).
        4.  Strony publiczne (`/`, `/login`, `/set-password`, `/forgot-password`) będą wykluczone z tej reguły przekierowania.

### 2. Logika Backendowa

#### 2.1. Endpointy API (Astro Server Endpoints)

Wszystkie endpointy będą zlokalizowane w `src/pages/api/auth/` i będą używać metody `POST`. Zgodnie z dobrymi praktykami, dla każdego endpointu ustawimy `export const prerender = false;`. Walidacja danych wejściowych po stronie serwera będzie realizowana przy użyciu biblioteki Zod.

-   **`src/pages/api/auth/login.ts`**:
    -   **Model Danych (Request Body)**: `{ email: string, password: string }`
    -   **Walidacja (Zod)**: Sprawdzenie, czy `email` jest poprawnym adresem e-mail i czy `password` nie jest pusty.
    -   **Logika**:
        1.  Wywołuje `supabase.auth.signInWithPassword()` z przekazanymi danymi.
        2.  W przypadku sukcesu, Supabase automatycznie zarządza sesją i ustawia odpowiednie ciasteczka. Endpoint zwraca status `200 OK`.
        3.  W przypadku błędu (np. nieprawidłowe dane), zwraca status `401 Unauthorized` z komunikatem błędu.
-   **`src/pages/api/auth/logout.ts`**:
    -   **Logika**:
        1.  Wywołuje `supabase.auth.signOut()`.
        2.  Supabase usuwa ciasteczka sesyjne.
        3.  Endpoint zwraca status `200 OK` i przekierowuje na stronę główną.
-   **`src/pages/api/auth/forgot-password.ts`**:
    -   **Model Danych (Request Body)**: `{ email: string }`
    -   **Walidacja (Zod)**: Sprawdzenie formatu `email`.
    -   **Logika**:
        1.  Wywołuje `supabase.auth.resetPasswordForEmail()`.
        2.  Supabase wysyła e-mail z linkiem do resetowania hasła na podany adres. Link ten będzie prowadził do strony `/set-password` w naszej aplikacji.
        3.  Endpoint zawsze zwraca `200 OK`, aby uniemożliwić odgadnięcie, czy dany e-mail istnieje w bazie.
-   **`src/pages/api/auth/set-password.ts`**:
    -   **Model Danych (Request Body)**: `{ password: string, token: string }`
    -   **Walidacja (Zod)**: Sprawdzenie, czy hasło spełnia wymogi bezpieczeństwa i czy token jest obecny.
    -   **Logika**:
        1.  Najpierw następuje weryfikacja tokenu za pomocą `supabase.auth.verifyOtp()` z typem `recovery` lub `invite`.
        2.  Jeśli token jest poprawny, wywoływana jest funkcja `supabase.auth.updateUser()` w celu ustawienia nowego hasła.
        3.  Zwraca `200 OK` w przypadku sukcesu lub `400 Bad Request` / `401 Unauthorized` w przypadku błędu (np. nieważny token).

#### 2.2. Renderowanie po stronie serwera

Zgodnie z `astro.config.mjs`, aplikacja działa w trybie `output: "server"`. Dzięki temu middleware i endpointy API będą działać poprawnie, a my będziemy mogli dynamicznie renderować zawartość stron w oparciu o stan zalogowania użytkownika (dane z `context.locals.user`).

### 3. System Uwierzytelniania (Supabase Auth)

-   **Konfiguracja Supabase**:
    -   Należy skonfigurować szablony e-mail w panelu Supabase dla funkcji odzyskiwania hasła oraz zaproszenia użytkownika. Linki w e-mailach muszą wskazywać na odpowiednie strony w naszej aplikacji (`/set-password`).
-   **Integracja z Astro**:
    -   Klient Supabase (`supabase.client.ts`) będzie używany zarówno po stronie klienta (w komponentach React), jak i serwera (w middleware i endpointach API).
    -   W middleware, `Astro.cookies` posłużą do przekazania informacji o sesji do instancji Supabase SDK na serwerze, co pozwoli na bezpieczne uwierzytelnienie każdego żądania.
-   **Proces "Rejestracji" (Pierwsze Logowanie) - US-002 & US-003**:
    1.  Administrator tworzy użytkownika w panelu administracyjnym aplikacji, podając jego dane (imię, nazwisko, e-mail, rola).
    2.  Podczas tworzenia konta, wywoływana jest funkcja `supabase.auth.admin.inviteUserByEmail()`. Ta metoda nie wymaga ustawiania hasła tymczasowego, a zamiast tego wysyła bezpieczny link do jednorazowego ustawienia hasła. Jest to bezpieczniejsza i rekomendowana praktyka, która jednocześnie spełnia wymaganie zmuszenia użytkownika do ustawienia własnego hasła.
    3.  Supabase wysyła e-mail z zaproszeniem na podany adres. Link w e-mailu prowadzi do `/set-password?token=...`.
    4.  Użytkownik klika link, przechodzi do formularza `<SetPasswordForm />` i ustawia swoje hasło.
    5.  Po ustawieniu hasła jest przekierowywany do strony logowania (`/login`), gdzie może się zalogować nowo utworzonymi danymi. Ten proces eliminuje potrzebę zarządzania hasłami tymczasowymi.
