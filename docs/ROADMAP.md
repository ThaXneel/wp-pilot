# Development Roadmap (MVP)

## Phase 1 — Foundation ✅
- [x] Project setup (frontend + backend)
- [x] Database setup
- [x] Authentication (Client + Owner)
- [x] Role-based access
- [x] Base dashboard layout

## Phase 2 — UX Core ✅
- [x] Add bilingual support (EN / FR)
- [x] Add theme modes (System / Dark / Light)
- [x] Save user preferences

## Phase 3 — WordPress Connection ✅
- [x] Build OBMAT Connector plugin
- [x] Token generation
- [x] Site connection flow (handshake)
- [x] Online/offline site status
- [x] Heartbeat monitoring (5-min cron)
- [x] Webhook-driven real-time sync (SSE)

## Phase 4 — Core Features ✅
- [x] Products: list / create / edit / delete
- [x] Orders: read-only list
- [x] Blog: list / create / edit / delete
- [x] Dashboard stats (product/order/post counts via proxy)
- [x] Multi-site selector (works on all pages)

## Phase 5 — Owner Control ✅
- [x] Clients list
- [x] Connected sites overview
- [x] Activity stream
- [x] Error logs
- [x] Create client + connect token

## Phase 6 — MVP Validation ✅
- [x] Deploy to Railway (backend, proxy, postgres, redis)
- [x] Fix critical bugs (site selector, login retention, proxy routing)
- [x] Integration test suite (35 tests passing)
- [x] WP plugin handshake fix (Backend URL configurable in settings)
- [x] MVP ready

## Phase 7 — Post-MVP (Future)
- [ ] Redis Pub/Sub for EventBus (multi-instance scaling)
- [ ] Rate limiting per tenant
- [ ] Advanced analytics dashboard
- [ ] Automated billing (Stripe integration)
- [ ] Multi-tenant team features
- [ ] Plugin auto-update mechanism
