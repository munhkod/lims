# LIMS — Laboratory Information Management System

> ISO 17025 compliant laboratory management platform built for Digital Medic LLC, Ulaanbaatar, Mongolia.

---

## Overview

LIMS is a full-stack web application for managing laboratory sample workflows from registration through analysis, review, approval, and client delivery. It supports multiple user roles, real-time dashboards, PDF/Excel exports, and bilingual (Mongolian/English) notifications.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Email | Resend |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Excel Export | ExcelJS |
| Charts | Recharts |
| Icons | Lucide React |
| Toast Notifications | Sonner |
| Deployment | Vercel |

---

## Features

### Sample Management
- Register samples with organization, sample type, analysis type, priority, and notes
- Auto-generate sample IDs (format: `YY-NNNN`)
- Assign analysts to samples
- Track status: `pending → in_progress → completed → approved / rejected`

### Analysis Module
- Analysts enter test results per parameter (value, unit, standard, compliance)
- Track equipment used per analysis
- Submit completed analyses for manager review

### Result Review
- Lab managers approve or reject completed analyses
- Rejection returns sample to analyst with reason
- Approval triggers email notification to client

### Reports & Export
- View all approved results
- Export Certificate of Analysis as PDF
- Export bulk data as Excel spreadsheet
- Clients only see their own organization's reports

### Organizations
- Add, edit, and delete client organizations
- Track contact person, email, phone, and address

### File Archive
- Upload files to Supabase Storage
- Download via secure signed URLs
- Filter by file type (document, report, certificate, image)

### Equipment Log
- Register laboratory instruments
- Track calibration dates
- Update equipment status (active, maintenance, retired)

### User Management
- Admin can create and manage user accounts
- Assign roles and organizations
- Activate or deactivate accounts

### Dashboard
- Real-time stats: total samples, approved, pending, in progress, rejected
- Monthly sample volume bar chart (live data)
- Status distribution pie chart
- Recent samples list
- Activity feed from audit logs

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access — all pages, user management, system settings |
| **Lab Manager** | Approve/reject analyses, manage equipment, view all samples |
| **Analyst** | Enter analysis results for assigned samples |
| **Client** | View only their organization's approved reports |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   └── (dashboard)/           # Protected dashboard routes
│       ├── dashboard/         # Overview & charts
│       ├── samples/           # Sample registration & management
│       ├── analysis/          # Analyst workspace
│       ├── results/           # Manager approval interface
│       ├── reports/           # Approved reports & export
│       ├── files/             # File archive
│       ├── equipment/         # Equipment tracking
│       ├── organizations/     # Client organizations
│       ├── users/             # User management
│       └── settings/          # Profile settings
├── components/
│   ├── layout/                # Sidebar, Topbar, DashboardLayout
│   └── shared/                # DataTable, StatusBadge, StatCard, FileUpload
├── hooks/                     # useAuth, useSamples, useAnalyses
├── lib/
│   ├── supabase/              # Client, server, middleware
│   ├── auth/                  # Role-based permissions
│   ├── email/                 # Resend notification templates
│   └── export/                # PDF and Excel generators
└── types/                     # TypeScript database types
```

---

## Getting Started

### Prerequisites
- Node.js v18 or higher
- Supabase account
- Resend account (for email notifications)
- Vercel account (for deployment)

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/your-username/lims.git
cd lims
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create a `.env.local` file in the root:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**4. Set up the database**

- Go to Supabase → SQL Editor
- Run the contents of `supabase/schema.sql`

**5. Create storage bucket**

- Go to Supabase → Storage
- Create a private bucket named `lims-files`

**6. Create your first admin user**

- Go to Supabase → Authentication → Add user
- Create user with email and password, check Auto Confirm
- Copy the User UID and run in SQL Editor:

```sql
INSERT INTO profiles (id, name, role, is_active)
VALUES ('your-user-uid', 'Your Name', 'admin', true);
```

**7. Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

**1.** Push your code to GitHub

**2.** Connect your GitHub repo to Vercel

**3.** Add environment variables in Vercel dashboard (same as `.env.local`)

**4.** Deploy — Vercel builds and deploys automatically on every push to `main`

---

## Database Schema

The database consists of 9 tables:

| Table | Description |
|---|---|
| `organizations` | Client companies and labs |
| `profiles` | User profiles extending Supabase auth |
| `equipment` | Laboratory instruments |
| `samples` | Registered test samples |
| `analyses` | Analysis sessions per sample |
| `results` | Individual test results per analysis |
| `files` | Uploaded documents and reports |
| `audit_logs` | System activity trail |
| `notifications` | User notifications |

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `RESEND_API_KEY` | Resend API key for email |
| `EMAIL_FROM` | Sender email address |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. https://lims.vercel.app) |

---

## License

Private — Digital Medic LLC. All rights reserved.
