# OBMAT — Online Business Manager Tool

## Architecture & Implementation Documentation

**Version:** 2.0  
**Developer:** NEXNEEL  
**Last Updated:** 2025

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Authentication & Security](#authentication--security)
5. [Real-Time Sync Architecture](#real-time-sync-architecture)
6. [WordPress Plugin (OBMAT Connector)](#wordpress-plugin-obmat-connector)
7. [Backend API Modules](#backend-api-modules)
8. [Frontend Application](#frontend-application)
9. [Proxy Layer](#proxy-layer)
10. [Database Schema](#database-schema)
11. [Deployment](#deployment)

---

## Overview

OBMAT (Online Business Manager Tool) is a multi-tenant SaaS platform that connects to WordPress/WooCommerce sites, providing centralized management of products, orders, posts, and real-time monitoring through a modern dashboard.

### Key Capabilities

- **Multi-site management** — Connect and manage multiple WordPress/WooCommerce sites from a single dashboard
- **Real-time sync** — Webhook-driven event push from WordPress to the dashboard via SSE (Server-Sent Events)
- **Product/Order/Post CRUD** — Full create, read, update, delete operations proxied to WordPress sites
- **Health monitoring** — Automated heartbeat system with health scores and error tracking
- **Multi-tenant isolation** — Row-level tenant scoping ensures clients only see their own data
- **Internationalization** — Full EN/FR language support
- **Remember Me** — 30-day persistent sessions with secure token rotation

---

## System Architecture

```
┌─────────────────────────────────┐
│         Frontend (Next.js)      │
│         Port 3000               │
│  ┌──────────┐  ┌─────────────┐  │
│  │ Dashboard │  │  SSE Client │  │
│  │   React   │  │  EventSource│  │
│  └─────┬─────┘  └──────┬──────┘  │
│        │               │         │
└────────┼───────────────┼─────────┘
         │               │
         ▼               ▼
┌─────────────────────────────────┐
│        Backend (Express 5)      │
│        Port 5000                │
│  ┌──────────┐  ┌─────────────┐  │
│  │ REST API │  │  SSE Stream  │  │
│  │ Modules  │  │ /api/events  │  │
│  └─────┬────┘  └──────▲──────┘  │
│        │               │        │
│  ┌─────┴────┐  ┌───────┴──────┐ │
│  │ Prisma   │  │  Event Bus   │ │
│  │ ORM      │  │  (in-memory) │ │
│  └─────┬────┘  └──────▲───────┘ │
│        │               │        │
└────────┼───────────────┼────────┘
         │               │
    ┌────▼────┐   ┌──────┴───────┐
    │PostgreSQL│   │   Webhook    │
    │  Redis   │   │   Receiver   │
    └─────────┘   │/api/webhooks │
                  └──────▲───────┘
                         │
┌────────────────────────┼────────┐
│     Proxy Layer        │        │
│     Port 4000          │        │
│  (Forward to WP sites) │        │
└────────────────────────┼────────┘
                         │
┌────────────────────────┼────────┐
│   WordPress Sites      │        │
│  ┌──────────────┐      │        │
│  │ OBMAT Plugin │──────┘        │
│  │ (Connector)  │  Webhooks     │
│  │  - REST API  │  push events  │
│  │  - Webhooks  │               │
│  │  - Heartbeat │               │
│  └──────────────┘               │
└─────────────────────────────────┘
```

### Data Flow

1. **Read operations:** Frontend → Backend API → Proxy Layer → WordPress REST API → Response
2. **Write operations:** Frontend → Backend API → Proxy Layer → WordPress → Cache invalidation
3. **Real-time events:** WordPress Plugin → Webhook POST → Backend Receiver → Event Bus → SSE → Frontend
4. **Health monitoring:** WordPress Cron (every 5 min) → Heartbeat POST → Backend → Update site status

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16 |
| UI Framework | React | 19 |
| Styling | Tailwind CSS | v4 |
| State Management | Zustand | Latest |
| Data Fetching | TanStack React Query | Latest |
| i18n | next-intl | v4 |
| Backend | Express | 5 |
| Language | TypeScript | Throughout |
| ORM | Prisma | Latest |
| Database | PostgreSQL | 15 |
| Cache | Redis (ioredis) | 7 |
| Auth | JWT (jsonwebtoken) | — |
| Password Hashing | bcryptjs | — |
| Validation | Zod | — |
| Email | Resend | — |
| WordPress Plugin | PHP | 7.4+ |
| Containerization | Docker Compose | — |

---

## Authentication & Security

### JWT Token System

- **Access Token:** 15-minute expiry, stored in Zustand state
- **Refresh Token:** 7-day expiry (default), 30-day with "Remember Me"
- **Token Rotation:** Automatic refresh on 401 response via `api()` helper

### Remember Me (30 Days)

The "Remember Me" feature is fully implemented:

1. **Frontend:** Login page checkbox → sends `rememberMe: true` to `/api/auth/login`
2. **Backend:** `auth.service.ts` generates refresh token with 30d expiry when `rememberMe` is true
3. **Storage:** `authStore` uses `localStorage` when rememberMe is true, `sessionStorage` when false
4. **Persist Key:** `obmat-auth`

### Security Middleware Stack

- `helmet()` — HTTP security headers
- `cors()` — Origin-restricted to `FRONTEND_URL`
- `rateLimit()` — 100 requests per 15 minutes per IP
- `authenticate` — JWT Bearer token verification
- `authorize(role)` — Role-based access (OWNER, CLIENT)
- `tenantScope` — Injects `clientId` filter for row-level isolation

---

## Real-Time Sync Architecture

### Webhook Flow (WordPress → Dashboard)

```
WordPress Event (e.g., new order)
    │
    ▼
OBMAT_Webhooks::push_event()
    │ POST /api/webhooks/receive
    │ Headers: Authorization: Bearer {apiToken}
    │          X-OBMAT-Event: order.created
    │ Body: { event, site_id, timestamp, data }
    │ blocking: false (non-blocking)
    ▼
Backend webhooksController.receive()
    │
    ├─ Validate apiToken against ClientSite table
    ├─ Log Activity record
    ├─ Create GlobalEvent record
    ├─ Update site lastPing + status = ONLINE
    │
    ▼
eventBus.emit('webhook', { clientId, siteId, event, data })
    │
    ▼
SSE eventsController.stream()
    │ Filters events by clientId
    │ Sends: event: webhook, data: JSON
    ▼
Frontend EventSource listener
    │ Invalidates React Query cache
    │ Dashboard auto-refreshes
    ▼
Updated dashboard UI
```

### Supported Webhook Events

| Event | Trigger | Data |
|-------|---------|------|
| `order.created` | New WooCommerce order | order_id, total, status, items |
| `order.status_changed` | Order status transition | order_id, old_status, new_status |
| `product.created` | New product published | product_id, name, price, type |
| `product.updated` | Product edited | product_id, name, price |
| `product.deleted` | Product trashed/deleted | product_id |
| `post.published` | Post published | post_id, title, author |
| `post.updated` | Post edited | post_id, title |
| `comment.created` | New comment | comment_id, post_id, author |
| `comment.status_changed` | Comment approved/spam | comment_id, old_status, new_status |

### SSE Connection

- **Endpoint:** `GET /api/events/stream` (requires JWT)
- **Keep-alive:** Ping every 30 seconds
- **Reconnection:** Automatic via `EventSource` API
- **Client filtering:** Events are only sent to the matching `clientId`

---

## WordPress Plugin (OBMAT Connector)

### Plugin Structure

```
wp-pilot-connector/
├── wp-pilot-connector.php    # Main plugin file
├── readme.txt                # WordPress readme
└── includes/
    ├── class-auth.php        # Bearer token authentication
    ├── class-handshake.php   # Initial site connection
    ├── class-health.php      # Health check endpoint
    ├── class-heartbeat.php   # WP-Cron heartbeat (5 min)
    ├── class-webhooks.php    # Real-time event push
    ├── class-products.php    # WooCommerce products CRUD
    ├── class-orders.php      # WooCommerce orders read
    └── class-posts.php       # WordPress posts CRUD
```

### REST API Namespace

`obmat-connector/v1`

### Endpoints

| Method | Endpoint | Class | Description |
|--------|----------|-------|-------------|
| POST | `/handshake` | OBMAT_Handshake | Initial connection |
| GET | `/health` | OBMAT_Health | Health check |
| GET | `/products` | OBMAT_Products | List products |
| GET | `/products/count` | OBMAT_Products | Product count |
| POST | `/products` | OBMAT_Products | Create product |
| PUT | `/products/{id}` | OBMAT_Products | Update product |
| DELETE | `/products/{id}` | OBMAT_Products | Delete product |
| GET | `/orders` | OBMAT_Orders | List orders |
| GET | `/orders/count` | OBMAT_Orders | Order count |
| GET | `/posts` | OBMAT_Posts | List posts |
| POST | `/posts` | OBMAT_Posts | Create post |
| PUT | `/posts/{id}` | OBMAT_Posts | Update post |
| DELETE | `/posts/{id}` | OBMAT_Posts | Delete post |
| GET | `/posts/count` | OBMAT_Posts | Post count |

### WP Options

| Option Key | Description |
|-----------|-------------|
| `obmat_site_id` | Backend-assigned site UUID |
| `obmat_api_token` | Bearer token for auth |
| `obmat_api_url` | Backend URL (e.g., https://api.obmat.com) |

---

## Backend API Modules

### Route Map

| Route | Module | Auth | Description |
|-------|--------|------|-------------|
| `/api/health` | health | Public/Owner | System health checks |
| `/api/auth` | auth | Public | Login, register, refresh, password reset |
| `/api/users` | users | Authenticated | User profile management |
| `/api/onboarding` | onboarding | Mixed | Plugin download, handshake, token generation |
| `/api/sites` | sites | Authenticated | List, get, delete connected sites |
| `/api/products` | products | Client | Product CRUD via proxy |
| `/api/orders` | orders | Client | Order listing via proxy |
| `/api/posts` | posts | Client | Post CRUD via proxy |
| `/api/dashboard` | dashboard | Client | Dashboard statistics |
| `/api/activity` | activity | Client | Activity log |
| `/api/admin` | admin | Owner | Admin panel data |
| `/api/webhooks` | webhooks | API Token | Receive WordPress webhooks |
| `/api/events` | events | JWT | SSE stream for real-time updates |

### Site Removal

- **Endpoint:** `DELETE /api/sites/:id`
- **Auth:** JWT (CLIENT role, tenant-scoped)
- **Behavior:** Deletes site + cascading cleanup (activities, events), logs deletion activity
- **Frontend:** Confirmation modal with site name/URL preview

---

## Frontend Application

### Key Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing page | Public marketing page |
| `/login` | Login page | Auth with Remember Me checkbox |
| `/app/dashboard` | Dashboard | Stats, connected sites, real-time |
| `/app/products` | Products | Product management table |
| `/app/orders` | Orders | Order listing |
| `/app/posts` | Posts | Post management |
| `/app/onboarding` | Onboarding | Connect WordPress site wizard |
| `/admin/*` | Admin pages | Owner-only admin panel |

### State Stores (Zustand)

| Store | Persist Key | Purpose |
|-------|------------|---------|
| `authStore` | `obmat-auth` | JWT tokens, user data, rememberMe |
| `siteStore` | `obmat-site` | Selected site, sidebar collapse |

### Dashboard Features

- **Summary stats cards:** Products, Orders, Posts counts (clickable links)
- **Connected Sites list:** Per-site details with:
  - Site name and URL
  - Health score percentage
  - Connection status badge (ONLINE/OFFLINE/PENDING)
  - Per-site preview stats (products, orders, posts counts)
  - Last sync time (relative: "5m ago", "2h ago")
  - Error count indicator
  - Remove button with confirmation modal
- **Real-time updates:** SSE connection auto-refreshes stats on webhook events

### Sidebar Branding

- **Top:** OBMAT logo + "Online Business Manager Tool" tagline
- **Bottom:** "© NEXNEEL" credit with border separator
- Both Client and Admin sidebars follow this pattern
- Collapsed state shows "OB" abbreviation

---

## Proxy Layer

### Purpose

Acts as a secure intermediary between the backend and WordPress sites:
- Forwards requests to WordPress REST API at `/wp-json/obmat-connector/v1/`
- Caches GET responses in Redis (60-second TTL)
- Invalidates cache on write operations
- Uses in-memory site config cache (30-second TTL)
- Authenticated via internal JWT (service-to-service)

### Port: 4000

---

## Database Schema

### Models

| Model | Table | Description |
|-------|-------|-------------|
| User | `users` | Email, passwordHash, role (OWNER/CLIENT), preferences |
| Client | `clients` | Plan (STARTER/GROWTH/ELITE), status |
| ClientSite | `client_sites` | WordPress site connection (wpUrl, apiToken, status, health) |
| ConnectToken | `connect_tokens` | One-time handshake tokens (24h expiry) |
| Activity | `activities` | Audit log (action, details, timestamps) |
| GlobalEvent | `global_events` | System events (INFO/WARNING/ERROR) |
| PasswordResetToken | `password_reset_tokens` | Password reset flow |
| SystemSettings | `system_settings` | Key-value system config |

### Key Relationships

```
User 1──1 Client 1──N ClientSite
                  1──N ConnectToken
                  1──N Activity
ClientSite 1──N Activity
           1──N GlobalEvent
```

---

## Deployment

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) |
| `FRONTEND_URL` | Frontend origin for CORS |
| `BACKEND_URL` | Backend base URL |
| `PROXY_URL` | Proxy layer base URL |
| `RESEND_API_KEY` | Email service API key (optional) |

### Docker Compose Services

| Service | Image | Port |
|---------|-------|------|
| `obmat-backend` | Node.js | 5000 |
| `obmat-frontend` | Node.js | 3000 |
| `obmat-proxy` | Node.js | 4000 |
| `obmat-postgres` | PostgreSQL 15 | 5432 |
| `obmat-redis` | Redis 7 (Alpine) | 6379 |

---

*Built by NEXNEEL — Online Business Manager Tool (OBMAT)*
