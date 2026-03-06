# LIMS — Laboratory Information Management System
### Digital Medic LLC · ISO 17025 Compliant · Next.js 14 + Supabase

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/yourorg/lims.git
cd lims
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.

# 3. Setup database
# Go to Supabase Dashboard → SQL Editor
# Paste and run: supabase/schema.sql

# 4. Create storage bucket
# Supabase Dashboard → Storage → New bucket: "lims-files" (private)

# 5. Seed demo data
npm run seed

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lims.mn | password123 |
| Lab Manager | manager@lims.mn | password123 |
| Analyst | analyst1@lims.mn | password123 |
| Client | client@mf.mn | password123 |

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Email**: Resend
- **PDF**: jsPDF + jspdf-autotable
- **Excel**: ExcelJS
- **Validation**: Zod
- **Deployment**: Vercel + Supabase

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard pages
│   │   ├── dashboard/         # Analytics & overview
│   │   ├── samples/           # Sample management
│   │   ├── analysis/          # Analyst workspace
│   │   ├── results/           # Review & approval
│   │   ├── reports/           # Final results / CoA
│   │   ├── files/             # File archive
│   │   ├── equipment/         # Equipment log
│   │   ├── users/             # User management
│   │   └── settings/          # System settings
│   └── api/
│       ├── samples/           # REST API
│       ├── analyses/          # With approve/reject
│       └── export/            # PDF & Excel
├── components/
│   ├── layout/                # Sidebar, Topbar
│   └── shared/                # DataTable, StatusBadge, StatCard
├── hooks/                     # useAuth, useSamples, useAnalyses
├── lib/
│   ├── supabase/              # Client, Server, Middleware
│   ├── auth/                  # RBAC permissions
│   ├── email/                 # Resend templates
│   └── export/                # PDF & Excel generators
└── types/                     # TypeScript types
```

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel deploy --prod
```

Set environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

---

## Roles & Permissions

| Feature | Admin | Lab Manager | Analyst | Client |
|---------|-------|-------------|---------|--------|
| Register Sample | ✅ | ✅ | ✅ | ❌ |
| Assign Analyst | ✅ | ✅ | ❌ | ❌ |
| Enter Results | ✅ | ✅ | ✅ | ❌ |
| Approve Results | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ (own) |
| Manage Users | ✅ | view | ❌ | ❌ |

---

*Digital Medic LLC · Сүхбаатар дүүрэг, Улаанбаатар · info@digitalmedic.mn*
