# E2E Tests (Playwright)

## Status

⚠️ **E2E tests are not yet configured in this project.**

This directory is prepared for future Playwright E2E tests.

## Setup

To enable E2E tests:

### 1. Install Playwright

```bash
npm install -D @playwright/test
```

### 2. Install browsers

```bash
npx playwright install --with-deps chromium firefox webkit
```

### 3. Configure Playwright

Rename the example configuration:

```bash
mv playwright.config.example.ts playwright.config.ts
```

### 4. Create your first test

Rename the example test or create a new one:

```bash
# Rename example
mv tests/e2e/login.example.spec.ts tests/e2e/login.spec.ts

# Or create new test
touch tests/e2e/my-feature.spec.ts
```

### 5. Update GitHub Actions

Edit `.github/workflows/pull-request.yml` and uncomment the E2E test sections in the `e2e-tests` job.

## Running Tests

### Local development

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test login.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View test report

```bash
npx playwright show-report
```

### Update snapshots

```bash
npx playwright test --update-snapshots
```

## Writing Tests

### Basic test structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test code
    await expect(page.getByRole('button')).toBeVisible();
  });
});
```

### Common patterns

#### Authentication

```typescript
test.beforeEach(async ({ page }) => {
  // Login before each test
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('/');
});
```

#### Waiting for elements

```typescript
// Wait for selector
await page.waitForSelector('.my-element');

// Wait for URL
await page.waitForURL('/dashboard');

// Wait for network
await page.waitForResponse(resp => resp.url().includes('/api/'));
```

#### Form interactions

```typescript
await page.getByLabel('Email').fill('test@example.com');
await page.getByRole('button', { name: 'Submit' }).click();
await expect(page.getByText('Success')).toBeVisible();
```

## Test Organization

Organize tests by feature:

```
tests/e2e/
  ├── auth/
  │   ├── login.spec.ts
  │   ├── logout.spec.ts
  │   └── forgot-password.spec.ts
  ├── calendar/
  │   ├── view.spec.ts
  │   └── create-request.spec.ts
  ├── requests/
  │   ├── list.spec.ts
  │   ├── approve.spec.ts
  │   └── reject.spec.ts
  └── admin/
      ├── users.spec.ts
      └── teams.spec.ts
```

## CI/CD Integration

E2E tests run automatically in GitHub Actions:
- On every pull request
- After linting passes
- In parallel with unit and API tests
- Uses environment secrets from `integration` environment

## Best Practices

1. **Use data-testid for stable selectors**: `<button data-testid="submit-btn">`
2. **Prefer user-facing queries**: `getByRole`, `getByLabel`, `getByText`
3. **Keep tests independent**: Each test should be able to run alone
4. **Clean up after tests**: Reset state between tests
5. **Use Page Object Model** for complex pages
6. **Mock external APIs** when appropriate
7. **Set reasonable timeouts**: Default is 30s per test

## Troubleshooting

### Tests are flaky

```typescript
// Add explicit waits
await page.waitForLoadState('networkidle');

// Use retry
test.describe.configure({ retries: 2 });
```

### Screenshot on failure

Screenshots are automatically captured on failure and saved in `test-results/`.

### View traces

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
