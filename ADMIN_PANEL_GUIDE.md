# Admin Panel Development Guide

## Overview

Build a React admin panel for Anvogue e-commerce using the existing backend APIs.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework |
| **Tailwind CSS** | Styling |
| **ShadcnUI** | Component library |
| **TanStack Query** | Data fetching |
| **Zustand** | State management |
| **Recharts** | Charts/Analytics |

---

## Setup

```bash
npx create-next-app@latest admin --typescript --tailwind --eslint --app
cd admin
npx shadcn@latest init
npm install @tanstack/react-query axios zustand recharts
```

---

## Project Structure

```
admin/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar layout
│   │   ├── page.tsx            # Dashboard home
│   │   ├── products/
│   │   │   ├── page.tsx        # Products list
│   │   │   ├── new/page.tsx    # Add product
│   │   │   └── [id]/page.tsx   # Edit product
│   │   ├── orders/
│   │   │   ├── page.tsx        # Orders list
│   │   │   └── [id]/page.tsx   # Order details
│   │   ├── users/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── brands/page.tsx
│   │   ├── coupons/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── shipping/page.tsx
│   │   └── settings/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                     # ShadcnUI components
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── data-table.tsx
│   └── charts/
├── lib/
│   ├── api.ts                  # Axios instance
│   ├── auth.ts                 # Auth utilities
│   └── utils.ts
├── hooks/
│   ├── use-auth.ts
│   └── use-products.ts
└── stores/
    └── auth-store.ts
```

---

## API Configuration

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## Pages to Build

### 1. Dashboard (`/`)
| Component | API |
|-----------|-----|
| Revenue Card | `/analytics/sales` |
| Orders Card | `/orders/admin/stats` |
| Users Card | `/admin/users/stats` |
| Sales Chart | `/analytics/sales` |
| Top Products | `/analytics/top-products` |
| Recent Orders | `/orders/admin/all?limit=5` |

### 2. Products (`/products`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/products` |
| Create | POST | `/admin/products` |
| Update | PUT | `/admin/products/:id` |
| Delete | DELETE | `/admin/products/:id` |

### 3. Orders (`/orders`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/orders/admin/all` |
| View | GET | `/orders/admin/:id` |
| Update Status | PUT | `/orders/admin/:id/status` |
| Cancel | PUT | `/orders/admin/:id/cancel` |

### 4. Users (`/users`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/admin/users` |
| View | GET | `/admin/users/:id` |
| Update Role | PUT | `/admin/users/:id/role` |
| Deactivate | PUT | `/admin/users/:id/deactivate` |
| Delete | DELETE | `/admin/users/:id` |

### 5. Categories (`/categories`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/cms/categories` |
| Create | POST | `/admin/categories` |
| Update | PUT | `/admin/categories/:id` |
| Delete | DELETE | `/admin/categories/:id` |

### 6. Brands (`/brands`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/cms/brands` |
| Create | POST | `/admin/brands` |
| Update | PUT | `/admin/brands/:id` |
| Delete | DELETE | `/admin/brands/:id` |

### 7. Coupons (`/coupons`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/coupons/admin/all` |
| Create | POST | `/coupons/admin` |
| Update | PUT | `/coupons/admin/:id` |
| Delete | DELETE | `/coupons/admin/:id` |

### 8. Reviews (`/reviews`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/reviews/admin/all` |
| Moderate | POST | `/reviews/admin/:id/moderate` |

### 9. Shipping Zones (`/shipping`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/shipping/zones` |
| Create | POST | `/shipping/zones` |
| Update | PUT | `/shipping/zones/:id` |
| Delete | DELETE | `/shipping/zones/:id` |

### 10. Tax Rates (`/tax`)
| Action | Method | API |
|--------|--------|-----|
| List | GET | `/tax` |
| Create | POST | `/tax/admin` |
| Update | PUT | `/tax/admin/:id` |
| Delete | DELETE | `/tax/admin/:id` |

---

## Key Components

### Sidebar Menu
```tsx
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Package, label: 'Products', href: '/products' },
  { icon: ShoppingCart, label: 'Orders', href: '/orders' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: FolderTree, label: 'Categories', href: '/categories' },
  { icon: Building2, label: 'Brands', href: '/brands' },
  { icon: Ticket, label: 'Coupons', href: '/coupons' },
  { icon: Star, label: 'Reviews', href: '/reviews' },
  { icon: Truck, label: 'Shipping', href: '/shipping' },
  { icon: Receipt, label: 'Tax Rates', href: '/tax' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];
```

### Data Table
Use ShadcnUI DataTable with:
- Pagination
- Sorting
- Filtering
- Row actions (Edit/Delete)

---

## Authentication Flow

1. Login → POST `/auth/login`
2. Store tokens in localStorage
3. Redirect to dashboard
4. Check role === 'ADMIN'
5. Auto-refresh on token expiry

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Order Status Values

```typescript
const orderStatuses = [
  'pending',
  'confirmed', 
  'processing',
  'shipped',
  'delivered',
  'cancelled'
];
```

---

## Quick Start Checklist

- [ ] Setup Next.js project
- [ ] Install dependencies
- [ ] Configure API client
- [ ] Build auth flow
- [ ] Create sidebar layout
- [ ] Build dashboard page
- [ ] Products CRUD
- [ ] Orders management
- [ ] Users management
- [ ] Categories CRUD
- [ ] Brands CRUD
- [ ] Coupons CRUD
- [ ] Reviews moderation
- [ ] Shipping zones
- [ ] Tax rates
