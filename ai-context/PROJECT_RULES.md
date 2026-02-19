# PROJECT_RULES.md

## Purpose
This file defines how AI assistants should work inside this project.

## Tech Stack (Actual Versions)
- **Frontend**: Next.js 16 + React 19, App Router, `[locale]` segments
- **Backend**: Express 5 + TypeScript, compiled with tsx
- **Database**: PostgreSQL 15 via Prisma ORM
- **Cache**: Redis 7 via ioredis
- **i18n**: next-intl v4 (EN/FR)
- **Themes**: next-themes v0.4.6 (System/Dark/Light, CSS variables)
- **State**: Zustand v5 (client), React Query v5 (server)
- **UI**: Custom Tailwind v4 components (no shadcn/ui)
- **Auth**: JWT (access 15m + refresh 7d), bcryptjs
- **Email**: Resend (transactional)
- **WordPress**: Custom REST plugin + Express proxy with Redis cache
- **Testing**: Vitest + supertest
- **Deploy**: Docker multi-stage, GitHub Actions, Vercel

## Core Rules
1. Use English for all code, file names, variables, commits, and comments.
2. The product UI must support English (en) and French (fr).
3. Theme modes must support: system, dark, light.
4. Keep solutions simple and MVP-focused.
5. Prefer clarity over cleverness.

## Product Context
- SaaS dashboard that hides WordPress complexity.
- Users: CLIENT and OWNER.
- WordPress is connected through a plugin + proxy layer.
- Clients should not need wp-admin.

## Architectural Rules
- Frontend never calls WordPress directly.
- Frontend -> Backend API -> Proxy Layer -> WordPress Plugin.
- Store language and theme preferences per user.

## Coding Priorities
1. Security
2. Simplicity
3. Maintainability
4. Performance (only when needed)

## What NOT to add (unless explicitly requested)
- Billing systems
- Advanced analytics
- AI features
- Complex abstractions
- Premature optimization
