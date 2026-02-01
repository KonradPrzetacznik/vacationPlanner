# Unit Tests (Vitest)

## Status

⚠️ **Unit tests are not yet configured in this project.**

This directory is prepared for future Vitest unit tests.

## Setup

To enable unit tests:

### 1. Install Vitest

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

### 2. Create Vitest configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/unit/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.{js,ts}',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### 3. Install testing libraries

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 4. Create setup file

Create `tests/unit/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

### 5. Update package.json

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest watch",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage"
  }
}
```

### 6. Update GitHub Actions

Edit `.github/workflows/pull-request.yml` and uncomment the unit test sections in the `unit-tests` job.

## Running Tests

### Local development

```bash
# Run all tests once
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run with UI
npm run test:unit:ui

# Run with coverage
npm run test:unit:coverage
```

## Writing Tests

### Basic test structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Testing React components

```typescript
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick handler', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Testing hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '@/components/hooks/useMyHook';

describe('useMyHook', () => {
  it('returns initial value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates value', async () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.setValue('new value');
    });
    
    await waitFor(() => {
      expect(result.current.value).toBe('new value');
    });
  });
});
```

### Testing services

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myService } from '@/lib/services/myService';

describe('myService', () => {
  it('processes data correctly', async () => {
    const input = { foo: 'bar' };
    const result = await myService.process(input);
    
    expect(result).toEqual({ processed: true });
  });

  it('handles errors', async () => {
    await expect(
      myService.process(null)
    ).rejects.toThrow('Invalid input');
  });
});
```

### Mocking

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' })),
}));

// Mock Supabase
vi.mock('@/db/supabase.client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));
```

## Test Organization

Organize tests to mirror source structure:

```
tests/unit/
  ├── components/
  │   ├── ui/
  │   │   ├── Button.test.tsx
  │   │   └── Input.test.tsx
  │   ├── users/
  │   │   └── UsersList.test.tsx
  │   └── hooks/
  │       └── useAuth.test.ts
  ├── lib/
  │   ├── services/
  │   │   ├── userService.test.ts
  │   │   └── requestService.test.ts
  │   └── utils.test.ts
  └── setup.ts
```

## Coverage

Run with coverage to see which code is tested:

```bash
npm run test:unit:coverage
```

Coverage reports are generated in `coverage/` directory.

Aim for:
- **Statements**: > 80%
- **Branches**: > 80%
- **Functions**: > 80%
- **Lines**: > 80%

## CI/CD Integration

Unit tests run automatically in GitHub Actions:
- On every pull request
- After linting passes
- In parallel with API and E2E tests
- Coverage reports are uploaded as artifacts

## Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how
2. **Use meaningful test names**: Describe what should happen
3. **Keep tests simple**: One assertion per test (generally)
4. **Mock external dependencies**: APIs, timers, random values
5. **Test edge cases**: Empty states, errors, loading states
6. **Don't test external libraries**: Trust that React, Zod, etc. work
7. **Use data-testid sparingly**: Prefer semantic queries

## Common Queries

```typescript
// Prefer these (semantic)
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByText('Welcome')
screen.getByPlaceholderText('Enter email')

// Use when semantic queries don't work
screen.getByTestId('custom-element')
```

## Debugging Tests

```typescript
// Print DOM
import { screen } from '@testing-library/react';
screen.debug(); // Prints entire DOM
screen.debug(screen.getByRole('button')); // Prints specific element

// Pause test execution
await screen.findByText('text', {}, { timeout: 50000 }); // Long timeout to inspect
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
