# Architecture (MVP)

## High-Level Flow

Frontend Dashboard
        ↓
Backend API
        ↓
Proxy Layer
        ↓
WordPress Connector Plugin
        ↓
WordPress (WooCommerce / Blog)

---

## Components

### Frontend (App)
- Client Dashboard
- Owner Dashboard
- i18n layer (EN / FR)
- Theme system (System / Dark / Light)

Suggested stack:
- Next.js
- React
- i18n library (e.g., next-intl or i18next)

### Backend API
- Auth module
- Clients module
- Products module
- Orders module
- Blog module
- User preferences (language + theme)

### Proxy Layer
- Routes requests to the correct WordPress site
- Handles secure authentication
- Normalizes responses
- Logs errors

### WordPress Plugin (Connector)
- Receives requests from Proxy Layer
- Validates token
- Executes WordPress/WooCommerce actions
- Returns structured responses

---

## Database (Simplified)

### USERS
- id
- email
- password_hash
- role
- language_preference (en | fr)
- theme_preference (system | dark | light)

### CLIENTS
- id
- user_id
- plan
- status

### CLIENT_SITES
- id
- client_id
- wp_url
- api_token
- status
- last_ping

---

## Security
- HTTPS only
- Unique token per site
- Proxy validates all requests
- No direct frontend-to-WordPress calls
