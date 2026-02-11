# Deployment Guide

## EstateMind Production Deployment

---

## Prerequisites

1. **Vercel Account** - For Next.js frontend
2. **Railway/Render Account** - For Python AI service
3. **PostgreSQL Database** - Vercel Postgres, Neon, or Supabase
4. **Domain** (optional) - estatemind.tn

---

## Part 1: Database Setup

### Option A: Vercel Postgres

1. Go to Vercel Dashboard → Storage → Create Database
2. Select Postgres
3. Copy connection strings:
   - `DATABASE_URL` (pooled)
   - `DATABASE_URL_UNPOOLED` (direct)

### Option B: Neon

1. Create account at neon.tech
2. Create new project
3. Copy connection string
4. Add `?sslmode=require` to connection string

### Option C: Supabase

1. Create project at supabase.com
2. Go to Settings → Database
3. Copy connection string (Transaction mode for pooling)

---

## Part 2: Deploy Python AI Service

### Railway Deployment

1. **Create Railway account** at railway.app

2. **Create new project:**
   ```bash
   railway login
   cd ai-service
   railway init
   ```

3. **Set environment variables in Railway dashboard:**
   ```env
   AI_SERVICE_API_KEY=your-secure-api-key-here
   NODE_ENV=production
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Get deployment URL:** Copy from Railway dashboard (e.g., `https://your-app.railway.app`)

### Render Deployment

1. Create Render account
2. New → Web Service
3. Connect GitHub repo
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

---

## Part 3: Deploy Next.js App to Vercel

### 1. Prepare Repository

Ensure these files are committed:
- `.env.example` (template)
- `prisma/schema.prisma`
- All application code

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or use Vercel Dashboard:
1. Import Git Repository
2. Select estatemind- repo
3. Configure project

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

**Required:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require&pgbouncer=true
DATABASE_URL_UNPOOLED=postgresql://user:pass@host:5432/db?sslmode=require
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://estatemind.tn
AI_SERVICE_URL=https://your-railway-app.railway.app
AI_SERVICE_API_KEY=your-secure-api-key
```

**Optional:**
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
```

**Production Settings:**
```env
NODE_ENV=production
NEXT_PUBLIC_BYPASS_AUTH=false
```

### 4. Run Database Migrations

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma db push
npx prisma db seed
```

Or in Vercel dashboard, add build command:
```bash
npx prisma generate && npx prisma db push && npm run build
```

### 5. Configure Domain

1. Vercel Dashboard → Domains
2. Add custom domain: estatemind.tn
3. Configure DNS at your registrar:
   ```
   A Record: @ → 76.76.19.19
   CNAME: www → cname.vercel-dns.com
   ```

---

## Part 4: Post-Deployment

### 1. Verify Health Checks

```bash
curl https://estatemind.tn/api/health
curl https://your-ai-service.railway.app/health
```

### 2. Test Core Features

- [ ] User registration/login
- [ ] Property search
- [ ] AI valuation
- [ ] Saved properties
- [ ] Dashboard access

### 3. Monitor Performance

- Vercel Analytics (automatic)
- Check logs in Vercel/Railway dashboards
- Set up error tracking (optional: Sentry)

---

## Environment Variables Reference

### Critical (Must Set)
- `DATABASE_URL` - Pooled connection for serverless
- `DATABASE_URL_UNPOOLED` - Direct connection for migrations
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production domain
- `AI_SERVICE_URL` - Python service URL
- `AI_SERVICE_API_KEY` - Secure random string

### Production Flags
- `NODE_ENV=production`
- `NEXT_PUBLIC_BYPASS_AUTH=false` (disable dev bypass!)

### Optional Features
- `NEXT_PUBLIC_MAPBOX_TOKEN` - For maps
- `RESEND_API_KEY` - For emails
- `STRIPE_SECRET_KEY` - For payments
- `OPENAI_API_KEY` - For legal assistant

---

## Troubleshooting

### Build Fails
```bash
# Check Prisma generation
npx prisma generate

# Check TypeScript
npm run build
```

### Database Connection Issues
- Ensure connection string has `?sslmode=require`
- For serverless, use pooled connection
- Check firewall/whitelist settings

### AI Service Not Responding
- Verify AI_SERVICE_URL is correct
- Check AI_SERVICE_API_KEY matches
- Test health endpoint directly

### Performance Issues
- Enable edge caching in Vercel
- Use connection pooling
- Monitor database query performance

---

## Security Checklist

- [ ] Set strong NEXTAUTH_SECRET
- [ ] Disable auth bypass in production
- [ ] Use secure API keys
- [ ] Enable HTTPS only
- [ ] Set up rate limiting (optional)
- [ ] Configure CORS properly
- [ ] Review database permissions

---

## Maintenance

### Database Backups
- Vercel Postgres: Automatic backups
- Neon: Point-in-time recovery
- Supabase: Daily backups

### Updates
```bash
# Update dependencies
npm update
cd ai-service && pip install --upgrade -r requirements.txt

# Database migrations
npx prisma migrate dev
```

### Monitoring
- Set up uptime monitoring (UptimeRobot, etc.)
- Monitor error rates in Vercel
- Check Python service logs in Railway

---

## Cost Estimates

### Free Tier
- **Vercel:** Free for hobby projects
- **Railway:** $5/month credit (AI service ~$3-5/mo)
- **Neon:** Free tier: 0.5GB storage
- **Total:** ~$5-10/month

### Production Scale
- **Vercel Pro:** $20/month
- **Railway:** $10-20/month
- **Database:** $10-25/month
- **Total:** ~$40-65/month

---

## Support

Issues? Check:
1. Vercel logs
2. Railway/Render logs
3. Database connection
4. Environment variables
5. GitHub Actions (if configured)

---

**Ready for production! 🚀**
