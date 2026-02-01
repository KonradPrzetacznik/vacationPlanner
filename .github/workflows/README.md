# GitHub Actions CI/CD

## Workflows

### 1. Pull Request CI (`pull-request.yml`)

Automatyczny workflow uruchamiany przy każdym Pull Requestcie.

#### Struktura workflow:

```
lint (lintowanie kodu)
  ↓
├─→ unit-tests (testy jednostkowe)
├─→ api-tests (testy integracyjne API)  
└─→ e2e-tests (testy E2E Playwright)
  ↓
status-comment (komentarz z podsumowaniem)
```

#### Funkcjonalność:

1. **Lint** - Sprawdza kod ESLintem i formatowanie Prettierem
2. **Unit Tests** - Testy jednostkowe (obecnie przygotowane na przyszłość)
3. **API Tests** - Uruchamia istniejące testy API z `tests/api/`
4. **E2E Tests** - Testy end-to-end z Playwright (obecnie przygotowane na przyszłość)
5. **Status Comment** - Dodaje/aktualizuje komentarz na PR z wynikami wszystkich testów

#### Wymagane sekrety (environment: integration):

- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_KEY` - Klucz API Supabase (anon key)
- `OPENROUTER_API_KEY` - Klucz API dla OpenRouter

#### Jak dodać sekrety:

1. Przejdź do: Settings → Secrets and variables → Actions
2. Utwórz environment o nazwie `integration`
3. Dodaj powyższe sekrety do tego environment

## Przyszłe rozszerzenia

### Dodanie testów jednostkowych (Vitest)

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

Dodaj do `package.json`:
```json
"scripts": {
  "test:unit": "vitest run --coverage"
}
```

Następnie odkomentuj sekcje z coverage w `pull-request.yml`.

### Dodanie testów E2E (Playwright)

```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

Utwórz `playwright.config.ts` - przykładowa konfiguracja znajduje się w pliku `playwright.config.example.ts`.

Dodaj do `package.json`:
```json
"scripts": {
  "test:e2e": "playwright test"
}
```

Następnie odkomentuj sekcje Playwright w `pull-request.yml` w jobie `e2e-tests`.

## Status Badge

Możesz dodać badge do README.md:

```markdown
[![Pull Request CI](https://github.com/YOUR_USERNAME/vacationPlanner/actions/workflows/pull-request.yml/badge.svg)](https://github.com/YOUR_USERNAME/vacationPlanner/actions/workflows/pull-request.yml)
```

## Lokalne testowanie

Przed wysłaniem PR możesz przetestować lokalnie:

```bash
# Linting
npm run lint

# Formatowanie
npm run format

# Wszystkie testy
npm test

# Tylko testy API
npm run test:api
```
