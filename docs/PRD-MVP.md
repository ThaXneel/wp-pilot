# PRD — MVP (Product Requirements Document)

## MVP Goal
Allow a client to connect a WordPress site and manage essential content without accessing wp-admin.

---

## User Roles

### CLIENT
- Login
- Connect WordPress site via plugin + token
- View / create / edit products
- View orders
- View / create / edit blog posts
- Switch language (EN/FR)
- Switch theme mode (System / Dark / Light)

### OWNER (Super Admin)
- Login
- View clients list
- View connected sites
- Monitor site status (online/offline)

---

## MVP Features (IN SCOPE)

### Authentication
- Client login with email/password
- Owner (super admin) login
- Role-based access (CLIENT / OWNER)
- "Remember Me" option — persists session via `localStorage` (30 days) or `sessionStorage`
- JWT access + refresh token flow with automatic renewal

### Internationalization (i18n)
- English and French UI
- Language preference saved per user

### Theme Modes
- System mode (follows OS)
- Dark mode
- Light mode
- Preference saved per user

### WordPress Connection
- Generate connection token (24h expiry)
- OBMAT Connector plugin (download from dashboard)
- Automatic handshake on plugin settings save
- Backend URL configurable in plugin settings UI or via `OBMAT_API_URL` constant
- Heartbeat (5min cron) for status/health monitoring

### Multi-Site Management
- Connect multiple WordPress sites per client
- Site selector in dashboard header
- Site removal with confirmation modal
- Per-site product/order/post counts

### Products
- List products (via WooCommerce REST proxy)
- Create product
- Edit product

### Orders
- Read-only orders list

### Blog
- List posts
- Create post
- Edit post

### Real-Time Sync
- Webhooks from WP plugin → SaaS backend (orders, products, posts, comments)
- Server-Sent Events (SSE) from backend → frontend for live UI updates

### Owner Dashboard
- List clients
- View connected sites per client
- Site connection status (online/offline)
- Health score and error count monitoring

---

## Out of Scope (NOT NOW)
- Automated billing (Stripe)
- Advanced analytics / reporting
- AI features
- Marketing automations
- Multi-tenant teams / team invites
- Advanced permissions / granular roles
- Pixel-perfect design system
- Redis Pub/Sub for multi-instance SSE
- Rate limiting / abuse prevention

---

## Acceptance Criteria
- A client can connect one or more WordPress sites
- A client can switch between connected sites
- A client can remove a connected site
- A client can create/edit a product
- A client can view orders
- A client can manage blog posts
- Product/order/post counts display on dashboard
- Real-time updates appear via webhooks + SSE
- Login persists for 30 days when "Remember Me" is checked
- UI supports English and French
- Theme supports System / Dark / Light
- No wp-admin access required for normal usage
