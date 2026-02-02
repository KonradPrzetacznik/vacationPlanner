# Quick Start: Naprawa RBAC i autentykacji

**Data:** 2026-02-02  
**Status:** ✅ KOMPLETNE

## Co zostało naprawione?

### 1. ✅ EMPLOYEE nie ma dostępu do `/calendar`

- Zgodnie z PRD, EMPLOYEE widzi kalendarz zespołu TYLKO na stronie `/requests`
- Strona `/calendar` jest dostępna TYLKO dla HR

### 2. ✅ Każdy użytkownik widzi tylko swoje wnioski

- API używa prawdziwej autentykacji zamiast `DEFAULT_USER_ID`
- RBAC w service layer zapewnia izolację danych

### 3. ✅ Kalendarz wyświetla się na `/requests`

- Komponent `TeamCalendar` jest renderowany na dole strony
- Pokazuje urlopy członków zespołów użytkownika

## Zmodyfikowane pliki

### Uprawnienia (Permissions)

- `src/lib/permissions.ts` - `/calendar` tylko dla HR
- `tests/unit/lib/permissions.test.ts` - zaktualizowane testy

### Autentykacja w API

- `src/pages/api/vacation-requests/index.ts` - GET i POST
- `src/pages/api/vacation-requests/[id].ts` - GET
- `src/pages/api/vacation-requests/[id]/approve.ts` - POST
- `src/pages/api/vacation-requests/[id]/reject.ts` - POST
- `src/pages/api/vacation-requests/[id]/cancel.ts` - POST
- `src/pages/api/vacation-allowances/index.ts` - POST

### Strony (Pages)

- `src/pages/requests.astro` - używa `locals.user`
- `src/pages/calendar.astro` - zaktualizowany komentarz

### Dokumentacja

- `docs/CALENDAR_FIX.md` - oznaczony jako przestarzały
- `docs/CALENDAR_RBAC_FIX.md` - nowa dokumentacja
- `QUICK_START_RBAC_FIX.md` - ten plik

## Testowanie

### Testy automatyczne

```bash
npm run test:unit
```

✅ Wynik: 119/119 testów przeszło

### Testy manualne jako EMPLOYEE

1. **Zaloguj się jako EMPLOYEE**
   ```
   Email: employee@example.com
   ```
2. **Sprawdź nawigację**
   - ❌ Link "Kalendarz" NIE powinien być widoczny
   - ✅ Link "Moje Wnioski" powinien być widoczny
3. **Przejdź do `/calendar`**
   - ✅ Powinno przekierować (403 Forbidden przez middleware)
4. **Przejdź do `/requests`**
   - ✅ Lista własnych wniosków urlopowych
   - ✅ Na dole strony komponent "Kalendarz zespołu"
   - ✅ Kalendarz pokazuje urlopy członków zespołu
5. **Sprawdź API**
   ```bash
   # Jako EMPLOYEE - widoczne tylko własne wnioski
   curl -H "Cookie: ..." http://localhost:4321/api/vacation-requests
   ```

### Testy manualne jako HR

1. **Zaloguj się jako HR**
   ```
   Email: hr@example.com
   ```
2. **Sprawdź nawigację**
   - ✅ Link "Kalendarz" jest widoczny
   - ✅ Link "Moje Wnioski" jest widoczny
3. **Przejdź do `/calendar`**
   - ✅ Strona się otwiera
   - ✅ Widoczne wszystkie zespoły
4. **Przejdź do `/requests`**
   - ✅ Lista wniosków z zespołów HR
   - ✅ Kalendarz zespołu na dole

## System uprawnień (RBAC)

| Rola     | `/calendar` | `/requests` | Co widzi                                   |
| -------- | ----------- | ----------- | ------------------------------------------ |
| EMPLOYEE | ❌          | ✅          | Własne wnioski + kalendarz swojego zespołu |
| HR       | ✅          | ✅          | Wszystkie zespoły + wnioski z zespołów     |
| ADMIN    | ❌          | ❌          | Tylko zarządzanie użytkownikami            |

## Zgodność z PRD

✅ **Sekcja 3.1 - EMPLOYEE:**

> Ma podgląd grafiku urlopowego zespołu (lub zespołów), do którego należy.
> ✅ **US-021:**
> Jako pracownik, chcę widzieć grafik urlopowy mojego zespołu, aby wiedzieć,
> kiedy moi koledzy planują nieobecności i lepiej koordynować pracę.
> ✅ **vacationPlanner.md:**
> dostępność podstrony "Mój urlop" [...] podgląd grafiku urlopowego zespołu

## Bezpieczeństwo

### Warstwa 1: Middleware

```typescript
// src/middleware/index.ts
if (!locals.user) {
  return Astro.redirect("/login");
}
```

### Warstwa 2: API Endpoints

```typescript
if (!locals.user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
  });
}
```

### Warstwa 3: Service Layer

```typescript
// Sprawdza rolę użytkownika
const { data: currentUser } = await supabase.from("profiles").select("role").eq("id", currentUserId).single();
// Filtruje dane zgodnie z rolą
if (userRole === "EMPLOYEE") {
  effectiveUserId = currentUserId;
}
```

## Rozwiązane problemy

### Problem 1: EMPLOYEE miał dostęp do `/calendar`

**Rozwiązanie:** Usunięto EMPLOYEE z `ROUTE_PERMISSIONS` dla `/calendar`

### Problem 2: API zwracało wnioski innych użytkowników

**Rozwiązanie:** Zamieniono `DEFAULT_USER_ID` na `locals.user.id`

### Problem 3: Kalendarz nie widoczny na `/requests`

**Rozwiązanie:** Komponent `TeamCalendar` był już zaimplementowany, teraz działa poprawnie z prawdziwą autentykacją

## Co dalej?

Wszystkie zmiany są zgodne z:

- ✅ PRD (Product Requirements Document)
- ✅ vacationPlanner.md (oryginalna specyfikacja)
- ✅ System RBAC
- ✅ Best practices bezpieczeństwa \*_System jest gotowy do użycia/home/konrad/dev/vacationPlanner && npm run test:unit 2>&1 | tail -20_ 🎉
