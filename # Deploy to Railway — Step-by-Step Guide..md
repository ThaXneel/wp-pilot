# Deploy to Railway — Step-by-Step Guide

## Prerequisites

- [Railway account](https://railway.app/) (sign up with GitHub)
- GitHub repository with your project pushed
- Domain name (optional, Railway provides free `.up.railway.app` subdomains)

---

## Step 1: Install Railway CLI

```bash
# Windows (PowerShell)
npm install -g @railway/cli

# Verify installation
railway --version

# Login
railway login
```

---

## Step 2: Create a New Railway Project

1. Go to [https://railway.app/dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Empty Project"**
4. Name it: `wp-pilot` (or whatever you prefer)

---

## Step 3: Provision PostgreSQL

1. Inside your project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Wait for it to spin up (~30 seconds)
3. Click on the PostgreSQL service → **"Variables"** tab
4. Copy the `DATABASE_URL` — you'll need it later

> It looks like: `postgresql://postgres:xxxx@containers-us-west-xxx.railway.app:5432/railway`

---

## Step 4: Provision Redis

1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Wait for it to spin up
3. Click on the Redis service → **"Variables"** tab
4. Copy the `REDIS_URL`

> It looks like: `redis://default:xxxx@containers-us-west-xxx.railway.app:6379`

---

## Step 5: Deploy the Backend

### 5a. Create the backend service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Railway will auto-detect the project — **wait, don't deploy yet**

### 5b. Configure the backend service

1. Click on the service → **"Settings"** tab
2. Set the following:

| Setting | Value |
|---|---|
| **Root Directory** | `saas-platform/apps/backend` |
| **Builder** | Dockerfile |
| **Dockerfile Path** | `Dockerfile` |

3. Go to the **"Variables"** tab and add:

```env
NODE_ENV=production
PORT=5000

# Database (use the Railway PostgreSQL internal URL)
DATABASE_URL=postgresql://postgres:xxxx@postgres.railway.internal:5432/railway

# Redis (use the Railway Redis internal URL)
REDIS_URL=redis://default:xxxx@redis.railway.internal:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://your-frontend.up.railway.app

# Admin seed
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!
```

> **Important**: Use the **internal** Railway URLs (`*.railway.internal`) for PostgreSQL and Redis — they're faster and free (no egress charges).

### 5c. Set the start command

In **Settings** → **Deploy** section:

| Setting | Value |
|---|---|
| **Custom Start Command** | `npx prisma migrate deploy && npx prisma db seed && npm start` |

### 5d. Expose the backend publicly

1. **Settings** → **Networking** → **Generate Domain**
2. You'll get something like: `wp-pilot-backend.up.railway.app`
3. Note this URL — it's your `BACKEND_URL`

### 5e. Deploy

Click **"Deploy"** or push to your GitHub repo — Railway auto-deploys.

---

## Step 6: Deploy the Proxy Layer

### 6a. Create another service

1. Click **"+ New"** → **"GitHub Repo"** → Select same repo

### 6b. Configure

| Setting | Value |
|---|---|
| **Root Directory** | `saas-platform/services/proxy-layer` |
| **Builder** | Dockerfile |
| **Dockerfile Path** | `Dockerfile` |

### 6c. Add variables

```env
NODE_ENV=production
PORT=4000
REDIS_URL=redis://default:xxxx@redis.railway.internal:6379
```

### 6d. Generate domain

**Settings** → **Networking** → **Generate Domain**

> e.g., `wp-pilot-proxy.up.railway.app`

---

## Step 7: Deploy the Frontend

### Option A: Deploy on Railway

1. Click **"+ New"** → **"GitHub Repo"** → Select same repo
2. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `saas-platform/apps/frontend` |
| **Builder** | Dockerfile |
| **Dockerfile Path** | `Dockerfile` |

3. Add variables:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://wp-pilot-backend.up.railway.app
NEXT_PUBLIC_APP_URL=https://wp-pilot-frontend.up.railway.app
```

4. Generate domain → e.g., `wp-pilot-frontend.up.railway.app`

### Option B: Deploy on Vercel (Recommended — Free)

1. Go to [vercel.com](https://vercel.com) → **"Add New Project"**
2. Import your GitHub repo
3. Set **Root Directory**: `saas-platform/apps/frontend`
4. Add environment variables:

```env
NEXT_PUBLIC_API_URL=https://wp-pilot-backend.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

5. Deploy

---

## Step 8: Update Cross-Service URLs

Now that all services have URLs, go back and update the environment variables:

### Backend Variables (update)

```env
FRONTEND_URL=https://wp-pilot-frontend.up.railway.app
# OR if using Vercel:
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend Variables (update)

```env
NEXT_PUBLIC_API_URL=https://wp-pilot-backend.up.railway.app
```

---

## Step 9: Run Database Migrations

Railway runs the start command which includes `prisma migrate deploy`, but if you need to run it manually:

```bash
# From your local machine
cd saas-platform/apps/backend
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

---

## Step 10: Verify Everything Works

### Check backend health

```bash
curl https://wp-pilot-backend.up.railway.app/api/health
# Expected: { "status": "ok", "database": "connected", "redis": "connected" }
```

### Check frontend

Open `https://wp-pilot-frontend.up.railway.app` in your browser.

### Test WordPress plugin connection

1. Install the WP Pilot Connector plugin on your WordPress site
2. Go to **Settings → WP Pilot**
3. Set **SaaS URL** to: `https://wp-pilot-backend.up.railway.app`
4. Paste your connect token
5. Click **Save Changes** — the handshake should succeed!

---

## Step 11: Custom Domain (Optional)

### On Railway

1. Click on a service → **Settings** → **Networking**
2. Click **"+ Custom Domain"**
3. Enter your domain: `api.wppilot.com`
4. Add the CNAME record shown in your DNS provider
5. Railway auto-provisions SSL

### Recommended domain structure

| Subdomain | Service |
|---|---|
| `app.wppilot.com` | Frontend |
| `api.wppilot.com` | Backend |
| `proxy.wppilot.com` | Proxy Layer |

---

## Architecture on Railway

```
┌─────────────────────────────────────────────────┐
│                 Railway Project                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │PostgreSQL│  │  Redis   │  │ Proxy Layer  │  │
│  │ (managed)│  │(managed) │  │  :4000       │  │
│  └────┬─────┘  └────┬─────┘  └──────────────┘  │
│       │              │                           │
│       └──────┬───────┘                           │
│              │                                   │
│       ┌──────┴─────┐      ┌──────────────────┐  │
│       │  Backend   │      │    Frontend      │  │
│       │  :5000     │      │    :3000         │  │
│       │  (Express) │      │    (Next.js)     │  │
│       └────────────┘      └──────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
         ▲                          ▲
         │                          │
    WordPress Sites            User Browsers
    (WP Plugin)
```

---

## Cost Estimate

| Service | Railway Cost |
|---|---|
| PostgreSQL | ~$5/month |
| Redis | ~$3/month |
| Backend | ~$5/month |
| Proxy Layer | ~$3/month |
| Frontend | ~$5/month (or $0 on Vercel) |
| **Total** | **~$16-21/month** |

> Railway charges based on usage (CPU + RAM + storage). These are estimates for low-traffic MVP. You only pay for what you use.

---

## Useful Railway Commands

```bash
# Check logs
railway logs

# Open shell in service
railway shell

# Run one-off command
railway run npx prisma studio

# Check status
railway status

# Set environment variable
railway variables set KEY=value

# Link local project to Railway
cd saas-platform
railway link
```

---

## CI/CD — Automatic Deployments

Railway auto-deploys when you push to your connected GitHub branch. To configure which branch triggers deploys:

1. Click on a service → **Settings**
2. Under **Source** → set **Branch**: `main` (or `production`)

Your existing GitHub Actions in `.github/workflows/deploy.yml` can be simplified since Railway handles deployment.

---

## Troubleshooting

### Build fails
- Check the build logs in Railway dashboard
- Ensure `Root Directory` and `Dockerfile Path` are correct
- Verify all environment variables are set

### Database connection fails
- Use internal URLs (`postgres.railway.internal`) not public URLs
- Check that `DATABASE_URL` format is correct

### Frontend can't reach backend
- Ensure `NEXT_PUBLIC_API_URL` points to the **public** backend URL (not internal)
- Check CORS settings in backend allow the frontend domain

### WordPress plugin can't connect
- Ensure backend is using the **public** Railway domain (not internal)
- Check that `/api/onboarding/handshake` endpoint is accessible
- Test with: `curl -X POST https://wp-pilot-backend.up.railway.app/api/onboarding/handshake`