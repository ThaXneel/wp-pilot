# ARCHITECTURE_GUARDRAILS.md

## Non-Negotiables
- Owner and Client experiences are separated.
- Proxy Layer is mandatory between SaaS and WordPress.
- WordPress plugin is a connector, not business logic.

## Data Boundaries
- WordPress stores products/orders/posts.
- SaaS stores users, clients, connections, preferences, and metadata.

## Security Guardrails
- Never expose WordPress tokens to the frontend.
- Validate permissions on the backend.
- Use HTTPS-only assumptions.

## Scalability Guardrails
- Avoid direct coupling between frontend and WordPress schemas.
- Normalize responses in the proxy layer.
