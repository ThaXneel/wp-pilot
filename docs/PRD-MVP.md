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
- Client login
- Owner login
- Role-based access (CLIENT / OWNER)

### Internationalization (i18n)
- English and French UI
- Language preference saved per user

### Theme Modes
- System mode (follows OS)
- Dark mode
- Light mode
- Preference saved per user

### WordPress Connection
- Generate connection token
- WordPress connector plugin
- Verify and store connection

### Products
- List products
- Create product
- Edit product

### Orders
- Read-only orders list

### Blog
- List posts
- Create post
- Edit post

### Owner Dashboard
- List clients
- Site connection status

---

## Out of Scope (NOT NOW)
- Automated billing
- Advanced analytics
- AI features
- Marketing automations
- Multi-tenant teams
- Advanced permissions
- Pixel-perfect design system

---

## Acceptance Criteria
- A client can connect a WordPress site
- A client can create/edit a product
- A client can view orders
- A client can manage blog posts
- UI supports English and French
- Theme supports System / Dark / Light
- No wp-admin access required for normal usage
