# System Uprawnień - Quick Start

## Szybki przegląd

System kontroli dostępu oparty na rolach (RBAC) dla VacationPlanner.

## Role

- **ADMINISTRATOR** - Zarządzanie użytkownikami
- **HR** - Zarządzanie zespołami, urlopami i ustawieniami
- **EMPLOYEE** - Składanie wniosków urlopowych i przeglądanie grafiku

## Jak używać?

### 1. Sprawdzenie uprawnień w kodzie

```typescript
import { hasAccessToPath, type Role } from "@/lib/permissions";

const userRole: Role = Astro.locals.user.role;
const canAccess = hasAccessToPath("/admin/users", userRole);
```

### 2. Generowanie nawigacji

```typescript
import { getNavItemsForRole } from "@/lib/permissions";

const navItems = getNavItemsForRole(Astro.locals.user.role);
```

### 3. Dodanie nowej chronionej ścieżki

Edytuj `src/lib/permissions.ts`:

```typescript
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // ...existing routes...
  { path: "/nowa-sciezka", allowedRoles: ["HR", "EMPLOYEE"] },
];
```

### 4. Dodanie linku w nawigacji

```typescript
export const NAV_ITEMS: NavItem[] = [
  // ...existing items...
  { href: "/nowa-sciezka", label: "Nowa funkcja", roles: ["HR", "EMPLOYEE"] },
];
```

## Mapa dostępu

| Ścieżka           | ADMINISTRATOR | HR  | EMPLOYEE |
| ----------------- | ------------- | --- | -------- |
| `/`               | ✅            | ✅  | ✅       |
| `/admin/users`    | ✅            | ❌  | ❌       |
| `/admin/settings` | ❌            | ✅  | ❌       |
| `/teams`          | ❌            | ✅  | ❌       |
| `/requests`       | ❌            | ✅  | ✅       |
| `/requests/new`   | ❌            | ✅  | ✅       |
| `/calendar`       | ❌            | ✅  | ✅       |

## Ochrona

System zapewnia 3 warstwy ochrony:

1. **Middleware** - Blokuje dostęp na poziomie serwera (403)
2. **UI** - Ukrywa niedostępne linki w nawigacji
3. **API** - Weryfikuje uprawnienia w endpointach

## Testy

```bash
# Wszystkie testy
npm run test:unit

# Tylko testy uprawnień
npm run test:unit -- tests/unit/lib/permissions.test.ts
```

## Dokumentacja

Pełna dokumentacja: [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md)
