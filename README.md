# Lumière Beauty

A full-stack luxury skincare and beauty e-commerce platform built as a pnpm monorepo. Features a full admin dashboard with Stripe payments and coupon discounts. 


## Tech Stack & Versions

### Core
| Tool | Version |
|---|---|
| Node.js | 24 |
| TypeScript | ~5.9.2 |
| pnpm (workspaces) | latest |

### Frontend (`artifacts/lumiere-beauty`)
| Package | Version |
|---|---|
| React | 19.1.0 |
| React DOM | 19.1.0 |
| Vite | ^7.3.2 |
| Tailwind CSS | ^4.1.14 |
| @tailwindcss/vite | ^4.1.14 |
| @tanstack/react-query | ^5.90.21 |
| framer-motion | ^12.23.24 |
| wouter (routing) | ^3.3.5 |
| lucide-react | ^0.545.0 |
| recharts | ^2.15.2 |
| react-hook-form | ^7.55.0 |
| @hookform/resolvers | ^3.10.0 |
| zod | ^3.25.76 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| tailwind-merge | ^3.3.1 |
| sonner | ^2.0.7 |
| next-themes | ^0.4.6 |
| @stripe/react-stripe-js | ^6.3.0 |
| @stripe/stripe-js | ^9.4.0 |
| react-icons | ^5.4.0 |
| embla-carousel-react | ^8.6.0 |
| vaul | ^1.1.2 |
| cmdk | ^1.1.1 |
| date-fns | ^3.6.0 |

### Backend (`artifacts/api-server`)
| Package | Version |
|---|---|
| Express | ^5 |
| drizzle-orm | ^0.45.2 |
| bcryptjs | ^3.0.3 |
| jsonwebtoken | ^9.0.3 |
| cookie-parser | ^1.4.7 |
| cors | ^2 |
| pino (logging) | ^9 |
| pino-http | ^10 |
| esbuild | 0.27.3 |
| stripe | ^22.1.0 |

### Database & Validation
| Package | Version |
|---|---|
| PostgreSQL | 16 |
| drizzle-orm | ^0.45.2 |
| drizzle-zod | (via drizzle-orm) |
| zod | ^3.25.76 |

### Auth
- JWT — access token in `localStorage`, refresh token in `httpOnly` cookie
- bcryptjs for password hashing

---

## Project Structure

```
.
├── artifacts/
│   ├── lumiere-beauty/       # React + Vite frontend (port 24667)
│   ├── api-server/           # Express 5 API server (port 8080)
│   └── mockup-sandbox/       # Design/mockup canvas
├── lib/
│   ├── db/                   # Drizzle ORM schema + migrations
│   ├── api-client-react/     # Generated API hooks (Orval)
│   ├── api-spec/             # OpenAPI spec + Orval config
│   └── api-zod/              # Generated Zod schemas (Orval)
├── scripts/                  # Workspace utility scripts
├── pnpm-workspace.yaml       # Monorepo catalog + package config
└── tsconfig.base.json        # Shared TypeScript config
```

---

## Frontend Pages

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero, featured products, bestsellers, new arrivals |
| `/products` | Products | Sidebar filters, animated category banners |
| `/products/:slug` | Product Detail | Images, accordion, reviews, related products |
| `/cart` | Cart | Line items, quantity edit, order summary, coupon codes |
| `/checkout` | Checkout | Shipping form, Stripe payment, coupon discount section |
| `/auth` | Auth | Sign in / Create Account |
| `/account` | Account | Orders, Profile, Addresses, Wishlist tabs |
| `/orders/:id` | Order Tracking | Animated 4-step timeline |
| `/admin` | Admin Dashboard | Charts, products, orders, customers, reviews, coupons |

---

## Database Schema

Tables: `users`, `products`, `categories`, `addresses`, `orders`, `order_items`, `cart_items`, `reviews`, `wishlist`, `coupons`

- 40 products seeded across 4 categories: Skincare, Hair Care, Body Care, Sets & Bundles


---

## Coupon / Discount System

- Coupon codes applied at cart and checkout
- Supports percentage and fixed-amount discounts
- Managed via the Admin Dashboard
- Applied via `POST /api/coupons/validate`

---

## Auth Flow

1. `POST /api/auth/login` returns `{ accessToken, user }`
2. `accessToken` stored in `localStorage` under key `lumiere_access_token`
3. Custom fetch in `lib/api-client-react/src/custom-fetch.ts` injects Bearer token into all API calls
4. Cart uses anonymous sessions via `x-session-id` header (UUID stored in `lumiere_cart_session`)

---

## Design Tokens

| Token | Value |
|---|---|
| Background | `#0a0a0a` (near-black, hsl 0 0% 4%) |
| Primary | Champagne gold — hsl(40 45% 61%) |
| Accent | Dusty rose — hsl(340 30% 65%) |
| Heading font | Cormorant Garamond (serif) |
| Body font | Jost (sans-serif) |
| Border radius | `0.125rem` (near-sharp, luxury feel) |

---

## Getting Started

### Prerequisites
- Node.js 24+
- pnpm
- PostgreSQL 16

### Install dependencies
```bash
pnpm install
```

### Environment variables

Create a `.env` file in `artifacts/api-server/`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/lumiere
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
STRIPE_SECRET_KEY=your_stripe_secret
```

Create a `.env` file in `artifacts/lumiere-beauty/` (or set via shell):
```env
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Push database schema
```bash
pnpm --filter @workspace/db run push
```

### Run in development
```bash
# API server
pnpm --filter @workspace/api-server run dev

# Frontend (separate terminal)
pnpm --filter @workspace/lumiere-beauty run dev
```

### Build all packages
```bash
pnpm run build
```

### Typecheck
```bash
pnpm run typecheck
```

### Regenerate API client from OpenAPI spec
```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Key Architecture Notes

- API client hooks are generated by **Orval** from the OpenAPI spec into `lib/api-client-react/src/generated/`
- `pnpm-workspace.yaml` catalog pins shared dependency versions across all packages
- All platform-specific native binaries (esbuild, rollup, lightningcss, tailwind oxide) are configured via `overrides` in `pnpm-workspace.yaml` — adjust for your OS if needed