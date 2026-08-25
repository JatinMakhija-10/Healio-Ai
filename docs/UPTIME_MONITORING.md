# Uptime Monitoring

External uptime monitors ping public endpoints on a schedule and alert you
when they fail. Arovia.AI exposes three endpoints designed for this purpose.

---

## Endpoints to monitor

| URL                              | What it checks                              | Frequency  | Expected status |
|----------------------------------|---------------------------------------------|-----------|-----------------|
| `https://YOUR_DOMAIN/api/ping`   | Next.js process alive (Edge runtime, <5ms)  | 1 min     | 200 OK          |
| `https://YOUR_DOMAIN/api/health` | DB connectivity + pgvector index warm-up    | 5 min     | 200 OK          |
| `https://YOUR_DOMAIN/api/py/`    | FastAPI backend root health                 | 5 min     | 200 OK          |

`/api/ping` is the cheapest and should be your primary "is the site up?" monitor.
`/api/health` doubles as a Postgres warm-up cron — having it pinged externally
saves you a separate Vercel cron job.

---

## Service comparison

| Feature                | UptimeRobot Free        | Better Stack Free      |
|------------------------|-------------------------|------------------------|
| Monitors               | 50                      | 10                     |
| Min interval           | 5 minutes               | **3 minutes**          |
| Status page            | 1 free                  | 1 free, custom domain  |
| Alerts                 | Email, Slack, Discord   | Email, Slack, SMS, Discord, Teams, PagerDuty |
| Incident timeline      | Basic                   | Excellent (post-mortems) |
| HTTPS / keyword check  | ✅                      | ✅                      |
| HEAD / POST methods    | ✅ (Pro)                | ✅                      |

**Recommendation**: Start with **UptimeRobot** (50 monitors free, simple).
Switch to Better Stack later if you want the slick status page or 1-min checks.

---

## Setup — UptimeRobot

1. Sign up at <https://uptimerobot.com>.
2. **Add New Monitor** → type **HTTPS**.
3. Configure:
   - **Friendly Name**: `Arovia Web — Ping`
   - **URL**: `https://your-vercel-domain.com/api/ping`
   - **Monitoring Interval**: 5 minutes
   - **Monitor Timeout**: 30 seconds
4. Repeat for `/api/health` (interval: 5 min) and `/api/py/` (interval: 5 min).
5. Under **My Settings → Alert Contacts**, add your email + Slack webhook.
6. Optional: create a public status page at **Status Pages → Add New**.

## Setup — Better Stack

1. Sign up at <https://betterstack.com/uptime>.
2. **Monitors → Create Monitor**.
3. Configure:
   - **URL**: `https://your-vercel-domain.com/api/ping`
   - **Check frequency**: 3 minutes
   - **Request HTTP method**: GET (or HEAD for `/api/ping`)
   - **Expected status code**: 200
   - **Verify SSL**: yes
   - **Required keyword**: `"status":"ok"` (Better Stack does keyword matching)
4. Set **alert escalation**: notify after 1 failed check (~3 min downtime).
5. Add an integration (Slack / email / SMS).
6. Repeat for `/api/health` and `/api/py/`.

---

## Alert routing recommendation

```
/api/ping fails        →  Email + Slack #ops          (site is hard-down)
/api/health fails      →  Email + Slack #engineering  (DB issue)
/api/py/ fails         →  Email + Slack #engineering  (backend issue)
```

Set escalation: alert immediately on the first failure, repeat every 30 min
until resolved. Don't wake people for `/api/health` — DB hiccups self-recover.

---

## What about Sentry?

Sentry catches **errors that happen during requests** (5xx, exceptions,
slow transactions). Uptime monitors catch **the site being unreachable**
(DNS, SSL expiry, region outage, deploy crash, OOM). You need both:

- Sentry → "errors are happening to real users"
- Uptime → "the site is unreachable from the internet"

If your Next.js process crashes, Sentry can't tell you because Sentry runs
inside that process. Uptime monitors run outside.

---

## Status page (optional, recommended)

Create a public page at e.g. `status.arovia.ai` showing current health.
Both services include this on the free tier. Useful for:
- Customer transparency during incidents
- Internal SRE dashboard
- Linkable from your support email auto-reply
