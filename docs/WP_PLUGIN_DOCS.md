# OBMAT Connector — Plugin Documentation

> **Last Updated:** March 2026 · v1.0.0

## Overview

The **OBMAT Connector** (Online Business Manager Tool) is a WordPress plugin that turns any WordPress/WooCommerce site into a remotely manageable node from the OBMAT SaaS dashboard. It exposes secure REST API endpoints on the WordPress site, maintains an ongoing heartbeat connection to the SaaS backend, and pushes real-time webhook events for orders, products, posts, and comments.

---

## Architecture Diagram

```
┌─────────────────────────────┐        ┌─────────────────────────────────┐
│   OBMAT SaaS Dashboard      │        │   WordPress Site                │
│   (app.nexneel.tools)       │        │   (client's WP installation)    │
│                              │        │                                 │
│  Frontend ◄── Backend ──────┼────────┼──► OBMAT Connector Plugin       │
│                   │          │        │      ├─ REST API endpoints      │
│                   │          │  ◄─────┼──────┤─ Heartbeat (cron, 5min) │
│                   ▼          │        │      ├─ Auto-handshake         │
│              Proxy Layer ────┼────────┼──► /wp-json/obmat-connector/v1/│
│                              │        │      └─ Webhooks (real-time)   │
└─────────────────────────────┘        └─────────────────────────────────┘
```

---

## File Structure

```
obmat-connector/
├── wp-pilot-connector.php           # Main plugin entry point (OBMAT_Connector class)
├── readme.txt                        # WordPress.org plugin readme
└── includes/
    ├── class-auth.php                # Bearer token authentication (OBMAT_Auth)
    ├── class-handshake.php           # Handshake verification endpoint (OBMAT_Handshake)
    ├── class-health.php              # Site health report (OBMAT_Health)
    ├── class-heartbeat.php           # Cron-based heartbeat to SaaS (OBMAT_Heartbeat)
    ├── class-orders.php              # WooCommerce orders (list, count) (OBMAT_Orders)
    ├── class-posts.php               # Blog posts (CRUD + count) (OBMAT_Posts)
    ├── class-products.php            # WooCommerce products (CRUD + count) (OBMAT_Products)
    └── class-webhooks.php            # Real-time event push system (OBMAT_Webhooks)
```

---

## How It Works — Step by Step

### 1. Installation & Configuration

1. User downloads the plugin ZIP from the OBMAT dashboard (served by the backend's `/api/onboarding/download-plugin` endpoint).
2. User installs and activates the plugin in WordPress.
3. In **Settings → OBMAT**, user enters:
   - **API Token** — the connect token generated from the onboarding flow.
   - **Backend URL** — the SaaS backend URL (e.g., `https://api.nexneel.tools`). Can also be set via `OBMAT_API_URL` constant in `wp-config.php`.
4. User clicks **Save Changes**.

> **Backend URL resolution order:** `OBMAT_API_URL` constant (wp-config.php) → `obmat_saas_url` option (settings page) → hardcoded default (`https://api.nexneel.tools`).

### 2. Automatic Handshake

When the user saves settings, WordPress fires `update_option_obmat_api_token` and `update_option_obmat_saas_url` hooks. The plugin's `try_handshake()` method triggers automatically:

```
WordPress                                    SaaS Backend
    │                                             │
    │  POST /api/onboarding/handshake             │
    │  {                                          │
    │    token: "<connect-token>",                │
    │    wpUrl: "https://mysite.com",             │
    │    wpVersion: "6.7",                        │
    │    siteName: "My WordPress Site"             │
    │  }                                          │
    │ ──────────────────────────────────────────► │
    │                                             │
    │  ◄──────────────────────────────────────── │
    │  {                                          │
    │    success: true,                           │
    │    data: {                                  │
    │      siteId: "cuid_xxx",                    │
    │      apiToken: "<permanent-48-byte-token>", │
    │      status: "ONLINE"                       │
    │    }                                        │
    │  }                                          │
    │                                             │
    │  Plugin stores:                              │
    │    obmat_api_token → permanent token         │
    │    obmat_site_id → assigned site ID          │
```

**Key details:**
- The connect token (temporary, 24h) is swapped for a permanent 48-byte API token.
- The `obmat_site_id` option is set — this prevents future re-handshakes.
- The backend marks the `ConnectToken` as used and sets the `Client` status to `ACTIVE`.

### 3. Ongoing Heartbeat

After connection, the plugin sends a heartbeat every **5 minutes** via WordPress cron:

```
WordPress                                    SaaS Backend
    │                                             │
    │  POST /api/sites/heartbeat                  │
    │  {                                          │
    │    siteId: "cuid_xxx",                      │
    │    apiToken: "<permanent-token>",           │
    │    wpVersion: "6.7",                        │
    │    healthScore: 100,                        │
    │    errorCount: 0                            │
    │  }                                          │
    │ ──────────────────────────────────────────► │
    │                                             │
    │  Backend updates ClientSite:                │
    │    lastPing = now()                         │
    │    status = "ONLINE"                        │
    │    healthScore = 100                        │
    │    errorCount = 0                           │
```

**Health score calculation:**
- Starts at **100**
- **-10** if PHP version < 8.0
- **-15** if SSL is not enabled
- Result is clamped to 0 minimum

**Error count:** Counts the last 100 lines of `wp-content/debug.log` (if it exists).

### 4. Webhooks — Real-Time Event Push

The `OBMAT_Webhooks` class hooks into WordPress and WooCommerce actions to push events to the SaaS backend instantly (no polling required):

| Event | WordPress/WooCommerce Hook | Webhook Type |
|-------|---------------------------|--------------|
| New order | `woocommerce_new_order` | `order.created` |
| Order status change | `woocommerce_order_status_changed` | `order.status_changed` |
| New product | `woocommerce_new_product` | `product.created` |
| Product update | `woocommerce_update_product` | `product.updated` |
| Product delete | `before_delete_post` | `product.deleted` |
| Post published | `publish_post` | `post.published` |
| Post updated | `save_post` | `post.updated` |
| New comment | `wp_insert_comment` | `comment.created` |
| Comment status change | `transition_comment_status` | `comment.status_changed` |

Webhook payload is POSTed to `{saas_url}/api/sites/webhook` with Bearer token authentication. The backend processes these events and pushes them to the frontend via **Server-Sent Events (SSE)** for real-time UI updates.

### 5. Data Access via REST API

The SaaS proxy layer calls the plugin's REST endpoints to read/write data on the WordPress site. All endpoints live under the `obmat-connector/v1` namespace.

---

## REST API Endpoints

All endpoints require a `Bearer <api_token>` header (validated by `class-auth.php`).

Base URL: `https://your-wp-site.com/wp-json/obmat-connector/v1`

### Authentication (`class-auth.php`)

Every request passes through `OBMAT_Auth::validate_token()`:
- Extracts the `Authorization: Bearer <token>` header
- Compares it with the stored `obmat_api_token` option using `hash_equals()` (timing-safe comparison)
- Returns `401` if missing/invalid

### Handshake (`class-handshake.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/handshake` | Verify connection from SaaS proxy |

**Response:**
```json
{
  "status": "ok",
  "wpUrl": "https://mysite.com",
  "wpVersion": "6.7",
  "woocommerceActive": true,
  "pluginVersion": "1.0.0"
}
```

### Products (`class-products.php`)

Requires **WooCommerce** to be active. Returns error `400` if WooCommerce is not installed.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | List products (paginated) |
| `POST` | `/products` | Create a new product |
| `PUT` | `/products/{id}` | Update an existing product |
| `GET` | `/products/count` | Get total product count |

**List params:** `limit` (default 50), `page` (default 1)

**Create/Update params:** `title`, `description`, `price`, `status`

**Product response format:**
```json
{
  "id": 123,
  "title": "Product Name",
  "description": "...",
  "price": "29.99",
  "status": "publish",
  "image": "https://mysite.com/wp-content/uploads/product.jpg",
  "created_at": "2026-02-20T12:00:00+00:00",
  "updated_at": "2026-02-20T12:00:00+00:00"
}
```

### Orders (`class-orders.php`)

Requires **WooCommerce** to be active.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/orders` | List orders (paginated) |
| `GET` | `/orders/count` | Get total order count |

**List params:** `limit` (default 50), `page` (default 1)

**Order response format:**
```json
{
  "id": 456,
  "number": "456",
  "status": "processing",
  "total": "59.99",
  "currency": "USD",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "items_count": 2,
  "created_at": "2026-02-20T12:00:00+00:00"
}
```

### Posts (`class-posts.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/posts` | List posts (published + drafts) |
| `POST` | `/posts` | Create a new post |
| `PUT` | `/posts/{id}` | Update an existing post |
| `GET` | `/posts/count` | Get total post count |

**List params:** `limit` (default 50), `page` (default 1)

**Create/Update params:** `title`, `content`, `status` (default: `draft`)

**Post response format:**
```json
{
  "id": 789,
  "title": "Hello World",
  "content": "<p>Post content...</p>",
  "excerpt": "Post excerpt...",
  "status": "publish",
  "author": "admin",
  "created_at": "2026-02-20T12:00:00+00:00",
  "updated_at": "2026-02-20T12:00:00+00:00"
}
```

### Health (`class-health.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Full site health report |

**Response:**
```json
{
  "wp_version": "6.7",
  "php_version": "8.2.0",
  "theme": "Twenty Twenty-Five",
  "active_plugins": [
    { "name": "OBMAT Connector", "version": "1.0.0" },
    { "name": "WooCommerce", "version": "9.5.0" }
  ],
  "woocommerce_active": true,
  "woocommerce_version": "9.5.0",
  "memory_limit": "256M",
  "max_execution_time": "30",
  "server_software": "Apache/2.4",
  "ssl": true,
  "site_url": "https://mysite.com",
  "timestamp": "2026-02-20T12:00:00+00:00"
}
```

---

## WordPress Options (Stored in `wp_options`)

| Option Key | Description | Set By |
|-----------|-------------|--------|
| `obmat_api_token` | Initially the connect token, then replaced with the permanent API token after handshake | User (then overwritten by handshake) |
| `obmat_saas_url` | The SaaS backend URL (e.g., `https://api.nexneel.tools`). Overridden by `OBMAT_API_URL` constant if defined in `wp-config.php` | User (settings page) |
| `obmat_site_id` | The unique site ID assigned by the SaaS backend | Handshake response |

---

## PHP Constants (Optional — `wp-config.php`)

| Constant | Description | Example |
|----------|-------------|---------|
| `OBMAT_API_URL` | Override the backend URL (takes priority over the settings page value) | `define('OBMAT_API_URL', 'https://api.nexneel.tools');` |

---

## Data Flow Summary

```
┌──────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────────────┐
│ Frontend │────►│ Backend  │────►│ Proxy Layer │────►│ WP Plugin REST   │
│ Dashboard│◄────│ (Express)│◄────│  (Express)  │◄────│ API on WP Site   │
└──────────┘     └──────────┘     └─────────────┘     └──────────────────┘
     │                │                                        │
     │   /dashboard/  │   /proxy/sites/:id/products            │
     │   stats        │   (JWT-authenticated)                  │
     │                │                                        │
     │   SSE stream   │   Internal: postgres.railway.internal   │
     │  ◄─────────────│   (ClientSite table for site lookup)    │
     │                │                                        │
     │                │◄──────── /api/sites/heartbeat ─────────│
     │                │   (every 5 min, updates status/health) │
     │                │                                        │
     │                │◄──────── /api/sites/webhook ───────────│
     │                │   (real-time events, pushed via SSE)   │
```

1. **User views dashboard** → Frontend calls `GET /dashboard/stats` → Backend queries `ClientSite` table for connected sites + calls Proxy for product/order/post counts.
2. **User manages products** → Frontend calls Backend → Backend calls Proxy → Proxy looks up site `wpUrl` and `apiToken` from DB → Proxy calls `GET /wp-json/obmat-connector/v1/products` on the WP site with Bearer token.
3. **Heartbeat** → WP cron fires every 5 min → Plugin POSTs to `/api/sites/heartbeat` → Backend updates `lastPing`, `status`, `healthScore`, `errorCount`.
4. **Webhooks** → WordPress/WooCommerce action fires → Plugin POSTs event to `/api/sites/webhook` → Backend pushes SSE event to connected frontend clients for real-time UI updates.

---

## Security Model

- **Token-based auth**: All plugin REST endpoints require `Authorization: Bearer <token>` matching the stored `obmat_api_token`.
- **Timing-safe comparison**: Uses `hash_equals()` to prevent timing attacks.
- **Token rotation**: The temporary connect token is replaced with a permanent 48-byte cryptographically random token after the handshake.
- **No WordPress user login required**: The plugin authenticates via its own token system, not WordPress user cookies.
- **ABSPATH guard**: Every PHP file checks `if (!defined('ABSPATH')) exit;` to prevent direct access.

---

## Cron Schedule

| Hook | Interval | Purpose |
|------|----------|---------|
| `obmat_heartbeat_event` | Every 5 minutes (`obmat_5min`) | Send heartbeat with health score and error count to SaaS backend |

> **Note:** WordPress cron is "pseudo-cron" — it only fires when someone visits the site. For reliable heartbeat delivery, the WP site should have traffic or use a real cron job (`wp-cron.php`).

---

## Class Reference

| Class | File | Role |
|-------|------|------|
| `OBMAT_Connector` | `wp-pilot-connector.php` | Main plugin bootstrap, settings UI, handshake logic |
| `OBMAT_Auth` | `class-auth.php` | Bearer token validation for REST endpoints |
| `OBMAT_Handshake` | `class-handshake.php` | Handshake verification endpoint |
| `OBMAT_Health` | `class-health.php` | Full site health report |
| `OBMAT_Heartbeat` | `class-heartbeat.php` | Cron-based heartbeat to SaaS backend |
| `OBMAT_Products` | `class-products.php` | WooCommerce product CRUD + count |
| `OBMAT_Orders` | `class-orders.php` | WooCommerce order listing + count |
| `OBMAT_Posts` | `class-posts.php` | WordPress post CRUD + count |
| `OBMAT_Webhooks` | `class-webhooks.php` | Real-time event push via webhooks |
