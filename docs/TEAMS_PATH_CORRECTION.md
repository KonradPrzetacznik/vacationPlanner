# Poprawka: Ścieżka do widoku zarządzania zespołami

**Data:** 1 lutego 2026  
**Typ:** Korekta routingu

## Problem

Widok zarządzania zespołami został błędnie zaimplementowany pod ścieżką `/admin/teams`, podczas gdy w oryginalnym UI planie (`.ai/ui-plan.md`) był określony jako `/teams`.

## Różnica między ścieżkami

### `/admin/users` - Zarządzanie użytkownikami

- **Dostęp:** Tylko ADMINISTRATOR
- **Uzasadnienie:** Zarządzanie kontami użytkowników to operacje wymagające najwyższych uprawnień

### `/teams` - Zarządzanie zespołami

- **Dostęp:** HR i ADMINISTRATOR
- **Uzasadnienie:** Zarządzanie zespołami jest funkcją HR, nie tylko administracyjną

## Wykonane zmiany

### 1. Przeniesienie pliku

```bash
src/pages/admin/teams.astro → src/pages/teams.astro
```

### 2. Aktualizacja nawigacji

```typescript
// src/components/Navigation.astro
{ href: "/admin/teams", label: "Zespoły" }  // ❌ Przed
{ href: "/teams", label: "Zespoły" }        // ✅ Po
```

### 3. Aktualizacja dokumentacji

Zaktualizowano wszystkie pliki dokumentacji:

- `docs/TEAMS_MANAGEMENT_VIEW.md`
- `docs/TEAMS_MANAGEMENT_QUICK_START.md`
- `docs/TEAMS_MANAGEMENT_IMPLEMENTATION_SUMMARY.md`
- `TEAMS_MANAGEMENT_IMPLEMENTATION_COMPLETE.md`
- `.ai/teams-management-view-implementation-plan.md`

## Potwierdzenie zgodności

✅ Zgodnie z UI planem (`.ai/ui-plan.md`):

```markdown
### Widok: Zarządzanie Zespołami (Teams Management)

- **Ścieżka:** `/teams`
- **Główny cel:** Tworzenie, edycja i usuwanie zespołów oraz zarządzanie ich członkami
  (dla Menedżerów i Administratorów).
```

## Wpływ na użytkowników

### Przed poprawką

- URL: `http://localhost:3002/admin/teams` ❌
- Mylące, bo sugerowało dostęp tylko dla administratorów

### Po poprawce

- URL: `http://localhost:3002/teams` ✅
- Zgodne z oryginalnym planem
- Jasne, że dostęp mają HR i ADMINISTRATOR

## Status

✅ **Poprawka wdrożona i przetestowana**

Wszystkie linki, dokumentacja i routing zostały zaktualizowane. Widok jest teraz dostępny pod poprawną ścieżką `/teams` zgodnie z oryginalną specyfikacją.
