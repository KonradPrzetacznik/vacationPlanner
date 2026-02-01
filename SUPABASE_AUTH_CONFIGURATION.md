# Konfiguracja Supabase dla Autentykacji

## 🚀 Szybki Start

Ten dokument opisuje niezbędne kroki konfiguracji w panelu Supabase, aby autentykacja działała poprawnie.

## 1. Konfiguracja URL-i

### Site URL

Przejdź do: **Authentication → URL Configuration → Site URL**

**Development:**

```
http://localhost:3000
```

**Production:**

```
https://vacationplanner.com
```

### Redirect URLs

Przejdź do: **Authentication → URL Configuration → Redirect URLs**

Dodaj następujące URL-e:

**Development:**

```
http://localhost:3000/**
http://localhost:3000/set-password
```

**Production:**

```
https://vacationplanner.com/**
https://vacationplanner.com/set-password
```

## 2. Szablony Email

### Szablon: Invite user (Zaproszenie nowego użytkownika)

Przejdź do: **Authentication → Email Templates → Invite user**

**Temat:**

```
Witaj w VacationPlanner!
```

**Treść:**

```html
<h2>Witaj w VacationPlanner!</h2>

<p>Zostałeś zaproszony do dołączenia do systemu zarządzania urlopami VacationPlanner.</p>

<p>Aby aktywować swoje konto, kliknij poniższy link i ustaw swoje hasło:</p>

<p><a href="{{ .SiteURL }}/set-password#access_token={{ .Token }}&type=invite">Ustaw hasło</a></p>

<p>Link jest ważny przez 24 godziny.</p>

<p>Jeśli nie spodziewałeś się tej wiadomości, zignoruj ją.</p>

<p>
  Pozdrawiamy,<br />
  Zespół VacationPlanner
</p>
```

### Szablon: Reset password (Resetowanie hasła)

Przejdź do: **Authentication → Email Templates → Reset password**

**Temat:**

```
Resetowanie hasła do VacationPlanner
```

**Treść:**

```html
<h2>Resetowanie hasła</h2>

<p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w VacationPlanner.</p>

<p>Aby ustawić nowe hasło, kliknij poniższy link:</p>

<p><a href="{{ .SiteURL }}/set-password#access_token={{ .Token }}&type=recovery">Zresetuj hasło</a></p>

<p>Link jest ważny przez 1 godzinę.</p>

<p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość. Twoje hasło pozostanie bez zmian.</p>

<p>
  Pozdrawiamy,<br />
  Zespół VacationPlanner
</p>
```

### Szablon: Confirm signup (Opcjonalnie)

Jeśli planujesz włączyć potwierdzanie email przy rejestracji:

Przejdź do: **Authentication → Email Templates → Confirm signup**

**Temat:**

```
Potwierdź swój adres email w VacationPlanner
```

**Treść:**

```html
<h2>Potwierdź swój adres email</h2>

<p>Dziękujemy za rejestrację w VacationPlanner!</p>

<p>Aby dokończyć proces rejestracji, kliknij poniższy link:</p>

<p><a href="{{ .SiteURL }}/set-password#access_token={{ .Token }}&type=signup">Potwierdź email i ustaw hasło</a></p>

<p>Link jest ważny przez 24 godziny.</p>

<p>
  Pozdrawiamy,<br />
  Zespół VacationPlanner
</p>
```

## 3. Ustawienia Email Provider

### Dla Development (Local)

Supabase automatycznie używa **Inbucket** do przechwytywania emaili lokalnie.

Aby zobaczyć wysłane emaile:

1. Uruchom `npx supabase start`
2. Otwórz: `http://localhost:54324`
3. Wszystkie emaile będą tam widoczne

### Dla Production

Skonfiguruj zewnętrzny dostawcę SMTP:

Przejdź do: **Project Settings → Authentication → SMTP Settings**

**Opcje:**

- **SendGrid** (rekomendowane)
- **AWS SES**
- **Custom SMTP**

**Konfiguracja SendGrid:**

1. Załóż konto na SendGrid.com
2. Wygeneruj API Key
3. W Supabase:
   - Enable Custom SMTP: ON
   - SMTP Host: `smtp.sendgrid.net`
   - SMTP Port: `587`
   - SMTP User: `apikey`
   - SMTP Password: `[twój-api-key]`
   - Sender Email: `noreply@vacationplanner.com`
   - Sender Name: `VacationPlanner`

## 4. Rate Limiting

Przejdź do: **Authentication → Rate Limits**

Rekomendowane ustawienia:

```
Password reset requests: 3 per hour
Email verification requests: 3 per hour
SMS requests: 3 per hour
```

## 5. Polityki Haseł

Przejdź do: **Authentication → Policies**

Rekomendowane ustawienia:

```
Minimum length: 8 characters
Require lowercase: ON
Require uppercase: ON
Require numbers: ON
Require special characters: OFF (opcjonalnie)
```

## 6. Session Management

Przejdź do: **Authentication → Settings**

Rekomendowane ustawienia:

```
JWT expiry: 3600 seconds (1 hour)
Refresh token expiry: 2592000 seconds (30 days)
```

## 7. Testowanie Konfiguracji

### Test 1: Sprawdź Site URL

```bash
curl https://[your-project].supabase.co/auth/v1/settings
```

Powinieneś zobaczyć:

```json
{
  "external": {
    "email": true,
    ...
  }
}
```

### Test 2: Wyślij testowy email invite

W projekcie uruchom:

```typescript
// W Supabase SQL Editor lub przez admin API
SELECT auth.admin.invite_user_by_email('test@example.com');
```

Sprawdź Inbucket (local) lub skrzynkę email (production).

### Test 3: Sprawdź redirect URLs

Kliknij link z emaila i sprawdź czy:

1. Przekierowuje na `/set-password`
2. URL zawiera `#access_token=...`
3. Formularz się wyświetla poprawnie

## 8. Zmienne Środowiskowe

Upewnij się, że masz w `.env`:

```env
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

Klucze znajdziesz w: **Project Settings → API**

⚠️ **NIGDY nie commituj `.env` do repozytorium!**

## 9. Troubleshooting

### Problem: Emaile nie są wysyłane

**Rozwiązanie:**

1. Sprawdź SMTP configuration w panelu Supabase
2. Sprawdź logi w: **Logs → Edge Functions**
3. Dla local: Sprawdź Inbucket pod `http://localhost:54324`

### Problem: Link z emaila nie działa

**Rozwiązanie:**

1. Sprawdź czy Redirect URL jest dodany w konfiguracji
2. Sprawdź szablon email - musi zawierać `#access_token={{ .Token }}`
3. Sprawdź czy Site URL jest poprawny

### Problem: Token expired

**Rozwiązanie:**

1. Token invite jest ważny 24h
2. Token recovery jest ważny 1h
3. Użytkownik musi poprosić o nowy link

### Problem: Invalid token

**Rozwiązanie:**

1. Sprawdź czy token nie został zużyty (są jednorazowe)
2. Sprawdź logi Supabase Auth
3. Sprawdź czy URL nie został zmodyfikowany

## 10. Checklist Produkcyjny

Przed wdrożeniem na production:

- [ ] Skonfigurowany SMTP provider (nie Inbucket)
- [ ] Ustawiony production Site URL
- [ ] Dodane production Redirect URLs
- [ ] Szablony email przetestowane
- [ ] Polityki haseł odpowiednio ustawione
- [ ] Rate limiting włączony
- [ ] `.env` zawiera production keys
- [ ] Service Role Key jest bezpieczny (nie w kodzie!)
- [ ] Domena email jest zweryfikowana (dla SMTP)
- [ ] Testy autentykacji przeprowadzone

## 11. Bezpieczeństwo

### Najlepsze praktyki:

1. **Nigdy nie udostępniaj Service Role Key** w kodzie klienta
2. **Używaj HTTPS** dla production
3. **Regularnie rotuj klucze API**
4. **Monitoruj nieudane próby logowania** w logach
5. **Włącz Captcha** dla endpointów publicznych (opcjonalnie)
6. **Ogranicz rate limiting** odpowiednio do ruchu

### Captcha (Opcjonalnie)

Przejdź do: **Authentication → Settings → Enable Captcha protection**

Wspierane:

- Google reCAPTCHA v2
- hCaptcha
- Turnstile

## 12. Monitoring

### Metryki do monitorowania:

1. **Liczba wysłanych emaili**
   - Sprawdź w: Logs → Edge Functions

2. **Nieudane logowania**
   - Sprawdź w: Logs → Auth

3. **Aktywne sesje**
   - Sprawdź w: Authentication → Users

4. **Token expiry rate**
   - Monitoruj ile tokenów wygasa nieużytych

## Gotowe! 🎉

Twoja konfiguracja Supabase dla autentykacji jest kompletna.

Jeśli masz problemy, sprawdź [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
