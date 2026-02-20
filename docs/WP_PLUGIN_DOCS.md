# WP Pilot Connector — Plugin Documentation

## Overview

The **WP Pilot Connector** is a WordPress plugin that turns any WordPress/WooCommerce site into a remotely manageable node from the WP Pilot SaaS dashboard. It exposes secure REST API endpoints on the WordPress site and maintains an ongoing heartbeat connection to the SaaS backend.

---

## Architecture Diagram

```
┌─────────────────────────────┐        ┌─────────────────────────────────┐
│   WP Pilot SaaS Dashboard   │        │   WordPress Site                │
│   (app.nexneel.tools)       │        │   (client's WP installation)    │
│                              │        │                                 │
│  Frontend ◄── Backend ──────┼────────┼──► WP Pilot Connector Plugin    │
│                   │          │        │      ├─ REST API endpoints      │
│                   │          │  ◄─────┼──────┤─ Heartbeat (cron, 5min) │
│                   ▼          │        │      └─ Auto-handshake         │
│              Proxy Layer ────┼────────┼──► /wp-json/saas-connector/v1/ │
│                              │        │                                 │
└─────────────────────────────┘        └─────────────────────────────────┘
```

---

## File Structure

```
wp-pilot-connector/
├── wp-pilot-connector.php          # Main plugin entry point
├── readme.txt                       # WordPress.org plugin readme
└── includes/
    ├── class-auth.php               # Bearer token authentication
    ├── class-handshake.php          # Handshake verification endpoint
    ├── class-health.php             # Site health report
    ├── class-heartbeat.php          # Cron-based heartbeat to SaaS
    ├── class-orders.php             # WooCommerce orders (list, count)
    ├── class-posts.php              # Blog posts (CRUD + count)
    └── class-products.php           # WooCommerce products (CRUD + count)
```

---

## How It Works — Step by Step

### 1. Installation & Configuration

1. User downloads the plugin ZIP from the WP Pilot dashboard (served by the backend's `/api/onboarding/download-plugin` endpoint).
2. User installs and activates the plugin in WordPress.
3. In **Settings → WP Pilot**, user enters:
   - **API Token** — the connect token generated from the onboarding flow.
   - **SaaS URL** — the backend URL (e.g., `https://api.nexneel.tools`).
4. User clicks **Save Changes**.

### 2. Automatic Handshake

When the user saves settings, WordPress fires `update_option_wp_pilot_api_token` and `update_option_wp_pilot_saas_url` hooks. The plugin's `try_handshake()` method triggers automatically:

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
    │    wp_pilot_api_token → permanent token      │
    │    wp_pilot_site_id → assigned site ID       │
```

**Key details:**
- The connect token (temporary, 24h) is swapped for a permanent 48-byte API token.
- The `wp_pilot_site_id` option is set — this prevents future re-handshakes.
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

### 4. Data Access via REST API

The SaaS proxy layer calls the plugin's REST endpoints to read/write data on the WordPress site. All endpoints live under the `saas-connector/v1` namespace.

---

## REST API Endpoints

All endpoints require a `Bearer <api_token>` header (validated by `class-auth.php`).

Base URL: `https://your-wp-site.com/wp-json/saas-connector/v1`

### Authentication (`class-auth.php`)

Every request passes through `WP_Pilot_Auth::validate_token()`:
- Extracts the `Authorization: Bearer <token>` header
- Compares it with the stored `wp_pilot_api_token` option using `hash_equals()` (timing-safe comparison)
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
    { "name": "WP Pilot Connector", "version": "1.0.0" },
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
| `wp_pilot_api_token` | Initially the connect token, then replaced with the permanent API token after handshake | User (then overwritten by handshake) |
| `wp_pilot_saas_url` | The SaaS backend URL (e.g., `https://api.nexneel.tools`) | User |
| `wp_pilot_site_id` | The unique site ID assigned by the SaaS backend | Handshake response |

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
     │                │   Internal: postgres.railway.internal   │
     │                │   (ClientSite table for site lookup)    │
     │                │                                        │
     │                │◄──────── /api/sites/heartbeat ─────────│
     │                │   (every 5 min, updates status/health) │
```

1. **User views dashboard** → Frontend calls `GET /dashboard/stats` → Backend queries `ClientSite` table for connected sites + calls Proxy for product/order/post counts.
2. **User manages products** → Frontend calls Backend → Backend calls Proxy → Proxy looks up site `wpUrl` and `apiToken` from DB → Proxy calls `GET /wp-json/saas-connector/v1/products` on the WP site with Bearer token.
3. **Heartbeat** → WP cron fires every 5 min → Plugin POSTs to `/api/sites/heartbeat` → Backend updates `lastPing`, `status`, `healthScore`, `errorCount`.

---

## Security Model

- **Token-based auth**: All plugin REST endpoints require `Authorization: Bearer <token>` matching the stored `wp_pilot_api_token`.
- **Timing-safe comparison**: Uses `hash_equals()` to prevent timing attacks.
- **Token rotation**: The temporary connect token is replaced with a permanent 48-byte cryptographically random token after the handshake.
- **No WordPress user login required**: The plugin authenticates via its own token system, not WordPress user cookies.
- **ABSPATH guard**: Every PHP file checks `if (!defined('ABSPATH')) exit;` to prevent direct access.

---

## Cron Schedule

| Hook | Interval | Purpose |
|------|----------|---------|
| `wp_pilot_heartbeat_event` | Every 5 minutes (`wp_pilot_5min`) | Send heartbeat with health score and error count to SaaS backend |

> **Note:** WordPress cron is "pseudo-cron" — it only fires when someone visits the site. For reliable heartbeat delivery, the WP site should have traffic or use a real cron job (`wp-cron.php`).
