# ONSITE DASHBOARD - AI CONTEXT ARCHITECTURE DOCUMENT

> **PURPOSE:** Machine-readable architecture reference for AI assistants. Optimized for fast context loading and accurate code generation.

---

## METADATA

```yaml
project: onsite-dashboard
version: 3.0
framework: next@14.2.21
language: typescript@5.3.3
ui: react@18.3.1 + tailwindcss@3.4.1
database: supabase-postgresql
auth: supabase-auth
payments: stripe
deploy: vercel
domain: app.onsiteclub.ca
currency: CAD
locale: en-CA
trial_days: 180
subscription_price: 9.99/month
```

---

## FILE_MAP

### ROOT_CONFIG
```
middleware.ts           → Auth guard for /account/*, /admin/* routes
next.config.js          → Image domains: *.supabase.co
tailwind.config.js      → Brand colors: amber-500 (#f59e0b), amber-600 (#d97706)
tsconfig.json           → Path alias: @/* → ./*
package.json            → Dependencies manifest
```

### APP_ROUTER
```
app/
├── layout.tsx                              → RootLayout: html, body, Inter font
├── page.tsx                                → AUTH_PAGE: email-first login/signup flow
├── globals.css                             → Tailwind directives + custom scrollbar
├── reset-password/page.tsx                 → Password reset form (post-callback)
├── auth/callback/route.ts                  → OAuth/magic-link/reset callback handler
├── terms/page.tsx                          → Static: Terms of Use
├── privacy/page.tsx                        → Static: Privacy Policy
├── security/page.tsx                       → Static: Data Security
├── cancellation/page.tsx                   → Static: Cancellation Policy
│
├── (dashboard)/                            → ROUTE_GROUP: protected, shared layout
│   ├── layout.tsx                          → DashboardLayout: Sidebar + Header + main
│   └── account/
│       ├── page.tsx                        → HUB: app cards grid, trial banner
│       ├── profile/
│       │   ├── page.tsx                    → Server: fetch profile, render form
│       │   └── EditProfileForm.tsx         → Client: avatar upload, form fields
│       ├── settings/
│       │   ├── page.tsx                    → Server: fetch profile, render managers
│       │   ├── SubscriptionManager.tsx     → Client: Stripe checkout/portal/cancel
│       │   └── DeviceManager.tsx           → Client: device info, unlink action
│       ├── timekeeper/
│       │   ├── page.tsx                    → Server: fetch registros + locais
│       │   ├── TimekeeperDashboard.tsx     → Client: filters, chart, table, export
│       │   └── components/
│       │       ├── DateRangePicker.tsx     → Client: preset buttons + custom range
│       │       ├── EditableCell.tsx        → Client: inline time editing
│       │       ├── HoursChart.tsx          → Client: Recharts bar chart
│       │       ├── ReportHeader.tsx        → Hidden component for PDF header
│       │       └── index.ts                → Barrel export
│       ├── calculator/page.tsx             → Calculator access + voice unlock CTA
│       ├── shop/page.tsx                   → Shopify link + blades balance
│       ├── blades/page.tsx                 → Rewards dashboard + transactions
│       ├── courses/page.tsx                → Coming soon placeholder
│       └── checklist/page.tsx              → Coming soon placeholder
│
└── api/
    ├── auth/callback/route.ts              → Duplicate of app/auth/callback (legacy)
    ├── stripe/
    │   ├── checkout/route.ts               → POST: create checkout session
    │   ├── portal/route.ts                 → POST: create billing portal session
    │   └── cancel/route.ts                 → POST: cancel subscription at period end
    ├── webhooks/stripe/route.ts            → POST: Stripe event handler (service role)
    ├── profile/
    │   ├── update/route.ts                 → POST: update profile fields
    │   └── avatar/route.ts                 → POST: upload avatar to storage
    ├── device/unlink/route.ts              → POST: clear device fields
    └── timekeeper/
        ├── update/route.ts                 → PATCH: edit registro entrada/saida
        └── export/
            ├── excel/route.ts              → POST: generate XLSX report
            └── pdf/route.ts                → POST: generate PDF report
```

### COMPONENTS
```
components/
├── layout/
│   ├── Sidebar.tsx                         → Navigation menu + logout
│   └── Header.tsx                          → User avatar + subscription badge
├── ui/
│   ├── StatCard.tsx                        → Metric display card
│   └── EmptyState.tsx                      → No-data placeholder
└── auth/
    └── AuthModal.tsx                       → Alternative auth modal (unused?)
```

### LIB
```
lib/
├── supabase/
│   ├── types.ts                            → TypeScript interfaces for all tables
│   ├── client.ts                           → createBrowserClient() factory
│   └── server.ts                           → createServerClient() factory
├── stripe/
│   ├── client.ts                           → loadStripe() wrapper
│   └── server.ts                           → new Stripe() instance
└── utils.ts                                → Utility functions (see UTILS section)
```

---

## DATABASE_SCHEMA

### TABLE: profiles
```sql
-- Primary user table, synced with auth.users via trigger
id                      UUID PRIMARY KEY    -- = auth.users.id
email                   TEXT UNIQUE NOT NULL
nome                    TEXT                -- full name (legacy)
first_name              TEXT
last_name               TEXT
birthday                DATE
gender                  TEXT
trade                   TEXT                -- carpenter, framer, electrician, etc.
avatar_url              TEXT                -- supabase storage URL
phone                   TEXT
company                 TEXT
role                    TEXT
bio                     TEXT

-- Stripe Integration
stripe_customer_id      TEXT
stripe_subscription_id  TEXT
subscription_status     TEXT DEFAULT 'none' -- none|trialing|active|past_due|canceled
trial_ends_at           TIMESTAMPTZ         -- signup + 180 days
subscription_started_at TIMESTAMPTZ
subscription_canceled_at TIMESTAMPTZ
has_payment_method      BOOLEAN DEFAULT false

-- Device (mobile app)
device_id               TEXT
device_registered_at    TIMESTAMPTZ
device_model            TEXT
device_platform         TEXT                -- ios|android|web

-- Blades Rewards
blades_balance          INTEGER DEFAULT 0
blades_lifetime_earned  INTEGER DEFAULT 0
level                   TEXT DEFAULT 'rookie' -- rookie|apprentice|journeyman|master|legend

-- Feature Flags
voice_calculator_enabled BOOLEAN DEFAULT false
sync_enabled            BOOLEAN DEFAULT false

-- Admin
is_admin                BOOLEAN DEFAULT false
is_suspended            BOOLEAN DEFAULT false
suspension_reason       TEXT

-- Shopify
shopify_customer_id     TEXT

-- Timestamps
created_at              TIMESTAMPTZ DEFAULT now()
updated_at              TIMESTAMPTZ DEFAULT now()
last_seen_at            TIMESTAMPTZ
```

### TABLE: registros
```sql
-- Time tracking records (clock in/out)
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id                 UUID REFERENCES profiles(id) ON DELETE SET NULL
local_id                UUID REFERENCES locais(id)
entrada                 TIMESTAMPTZ NOT NULL    -- clock in
saida                   TIMESTAMPTZ             -- clock out (null = still clocked in)
local_nome              TEXT                    -- denormalized for perf
local_latitude          NUMERIC
local_longitude         NUMERIC
sync_status             TEXT                    -- pending|synced|error

-- Edit Tracking
edited_at               TIMESTAMPTZ             -- when manually edited
edited_by               TEXT                    -- manual|geofence
original_entrada        TIMESTAMPTZ             -- pre-edit value
original_saida          TIMESTAMPTZ             -- pre-edit value
edit_reason             TEXT

-- Timestamps
created_at              TIMESTAMPTZ DEFAULT now()
updated_at              TIMESTAMPTZ DEFAULT now()
```

### TABLE: locais
```sql
-- Job site locations for geofencing
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id                 UUID REFERENCES profiles(id) ON DELETE SET NULL
nome                    TEXT NOT NULL           -- location name
endereco                TEXT                    -- full address
latitude                NUMERIC NOT NULL
longitude               NUMERIC NOT NULL
raio                    INTEGER DEFAULT 100     -- geofence radius in meters
cor                     TEXT                    -- hex color for UI
ativo                   BOOLEAN DEFAULT true
created_at              TIMESTAMPTZ DEFAULT now()
updated_at              TIMESTAMPTZ DEFAULT now()
```

### TABLE: blades_transactions
```sql
-- Rewards ledger
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id                 UUID REFERENCES profiles(id) ON DELETE CASCADE
amount                  INTEGER NOT NULL        -- positive=earn, negative=redeem
type                    TEXT NOT NULL           -- earn|redeem|bonus|adjustment
reason                  TEXT
order_id                TEXT                    -- shopify order ref
product_id              TEXT
metadata                JSONB
created_at              TIMESTAMPTZ DEFAULT now()
```

### RLS_POLICIES
```sql
-- profiles: public read for email check, user write own
CREATE POLICY "public_email_check" ON profiles FOR SELECT USING (true);
CREATE POLICY "user_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- registros: user CRUD own records
CREATE POLICY "user_own_registros" ON registros FOR ALL USING (auth.uid() = user_id);

-- locais: user CRUD own locations
CREATE POLICY "user_own_locais" ON locais FOR ALL USING (auth.uid() = user_id);

-- blades_transactions: user read own
CREATE POLICY "user_read_blades" ON blades_transactions FOR SELECT USING (auth.uid() = user_id);
```

### TRIGGER: auto_create_profile
```sql
-- Creates profile when auth.users row inserted
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_status, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    'trialing',
    NOW() + INTERVAL '180 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## API_ROUTES

### POST /api/stripe/checkout
```typescript
// Creates Stripe checkout session
INPUT: none (uses session user)
PROCESS:
  1. getUser() → user.id
  2. getProfile() → stripe_customer_id
  3. if !stripe_customer_id → stripe.customers.create()
  4. stripe.checkout.sessions.create({
       customer,
       mode: 'subscription',
       line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
       subscription_data: { trial_period_days: TRIAL_PERIOD_DAYS },
       success_url: /account/settings?success=true,
       cancel_url: /account/settings?canceled=true
     })
OUTPUT: { url: string }
CALLER: SubscriptionManager.handleAddPaymentMethod()
```

### POST /api/stripe/portal
```typescript
// Creates billing portal session
INPUT: none
PROCESS:
  1. getProfile() → stripe_customer_id
  2. stripe.billingPortal.sessions.create({ customer, return_url })
OUTPUT: { url: string }
CALLER: SubscriptionManager.handleManageSubscription()
```

### POST /api/stripe/cancel
```typescript
// Cancels subscription at period end
INPUT: none
PROCESS:
  1. getProfile() → stripe_subscription_id
  2. stripe.subscriptions.update(id, { cancel_at_period_end: true })
  3. updateProfile({ subscription_canceled_at: now() })
OUTPUT: { success: true }
CALLER: SubscriptionManager.handleCancelSubscription()
```

### POST /api/webhooks/stripe
```typescript
// Handles Stripe webhook events
AUTH: signature verification (STRIPE_WEBHOOK_SECRET)
CLIENT: supabase service role (bypasses RLS)
EVENTS:
  - checkout.session.completed:
      → update profile: subscription_status, stripe_subscription_id, has_payment_method
  - customer.subscription.updated:
      → update profile: subscription_status from event.status
  - customer.subscription.deleted:
      → update profile: subscription_status='canceled', subscription_canceled_at
  - invoice.payment_succeeded:
      → update profile: subscription_status='active', subscription_started_at
  - invoice.payment_failed:
      → update profile: subscription_status='past_due'
OUTPUT: { received: true }
```

### POST /api/profile/update
```typescript
INPUT: { first_name?, last_name?, phone?, company?, role?, bio? }
PROCESS: supabase.from('profiles').update(data).eq('id', user.id)
OUTPUT: { success: true }
CALLER: EditProfileForm.handleSubmit()
```

### POST /api/profile/avatar
```typescript
INPUT: FormData with 'avatar' file
VALIDATION: jpg|png|webp, max 2MB
PROCESS:
  1. upload to supabase.storage.from('avatars')
  2. getPublicUrl()
  3. update profile.avatar_url
OUTPUT: { success: true, avatar_url: string }
CALLER: EditProfileForm.handleAvatarUpload()
```

### POST /api/device/unlink
```typescript
INPUT: none
PROCESS: update profile: device_id=null, device_registered_at=null, device_model=null, device_platform=null
OUTPUT: { success: true }
CALLER: DeviceManager.handleUnlink()
```

### PATCH /api/timekeeper/update
```typescript
INPUT: { id: string, field: 'entrada'|'saida', value: string (ISO datetime) }
PROCESS:
  1. fetch registro by id + user_id
  2. if !original_entrada → save current as original
  3. update field, set edited_at, edited_by='manual'
OUTPUT: updated registro object
CALLER: EditableCell.handleSave()
```

### POST /api/timekeeper/export/excel
```typescript
INPUT: {
  registros: Registro[],
  profile: Profile,
  dateRange: { start: string, end: string },
  stats: { totalMinutos, diasTrabalhados, totalSessoes, locaisUsados, registrosEditados }
}
PROCESS:
  1. create workbook with xlsx
  2. Sheet 1 "Summary": worker, period, totals
  3. Sheet 2 "Records": location, date, in, out, duration, edited
OUTPUT: binary xlsx file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
FILENAME: timekeeper-{start}-{end}.xlsx
CALLER: TimekeeperDashboard.handleExportExcel()
```

### POST /api/timekeeper/export/pdf
```typescript
INPUT: same as excel
PROCESS:
  1. create jsPDF document
  2. header with brand color bar
  3. worker info section
  4. stats boxes grid
  5. locations list
  6. records table (autoTable)
  7. highlight edited rows in amber
  8. footer disclaimer
OUTPUT: binary pdf file (application/pdf)
FILENAME: timekeeper-{start}-{end}.pdf
CALLER: TimekeeperDashboard.handleExportPDF()
```

---

## COMPONENT_SPECS

### app/page.tsx (AUTH_PAGE)
```typescript
'use client'
STATE:
  step: 'email' | 'login' | 'signup'
  email, password, nome: string
  loading, error: boolean/string

FUNCTIONS:
  checkEmail():
    → query profiles.email
    → setStep('login' if exists else 'signup')

  handleLogin():
    → supabase.auth.signInWithPassword()
    → router.push('/account')

  handleSignup():
    → supabase.auth.signUp()
    → update profile with nome
    → auto-login
    → router.push('/account')

  handleForgotPassword():
    → supabase.auth.resetPasswordForEmail()

RENDER:
  step=email: email input + Continue button
  step=login: password input + Login button + Forgot link
  step=signup: nome + password inputs + Create button
```

### app/(dashboard)/layout.tsx
```typescript
SERVER COMPONENT
FETCH: profile via supabase server client
RENDER:
  <div className="flex h-screen">
    <Sidebar profile={profile} />
    <div className="flex-1 flex flex-col">
      <Header profile={profile} />
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        {children}
      </main>
    </div>
  </div>
```

### components/layout/Sidebar.tsx
```typescript
'use client'
PROPS: { profile: Profile }
STATE: collapsed: boolean
FUNCTIONS:
  handleLogout():
    → supabase.auth.signOut()
    → router.push('/')

NAV_ITEMS:
  - /account (Home)
  - /account/timekeeper (Timekeeper)
  - /account/calculator (Calculator)
  - /account/shop (Shop)
  - /account/courses (Courses)
  - /account/checklist (Checklist)
  - /account/blades (Blades)
  - /account/profile (Profile)
  - /account/settings (Settings)
```

### components/layout/Header.tsx
```typescript
'use client'
PROPS: { profile: Profile }
RENDER:
  - Subscription badge (getSubscriptionBadge)
  - Notifications bell (placeholder)
  - User avatar (initials fallback) + dropdown
```

### account/timekeeper/TimekeeperDashboard.tsx
```typescript
'use client'
PROPS: { initialRegistros: Registro[], initialLocais: Local[], profile: Profile }

STATE:
  registros: Registro[]
  dateRange: { start: Date, end: Date, preset: string }
  showChart: boolean
  editingId: string | null
  isExporting: 'excel' | 'pdf' | null

MEMOS:
  filteredRegistros: filter by dateRange
  stats: { totalMinutos, diasTrabalhados, totalSessoes, locaisUsados, registrosEditados }
  chartData: aggregate hours by day for Recharts

FUNCTIONS:
  handleDateRangeChange(range):
    → setDateRange(range)

  handleUpdateRegistro(id, field, value):
    → fetch PATCH /api/timekeeper/update
    → update local state

  handleExportExcel():
    → fetch POST /api/timekeeper/export/excel
    → download blob

  handleExportPDF():
    → fetch POST /api/timekeeper/export/pdf
    → download blob

RENDER:
  - ReportHeader (hidden, for PDF)
  - Export buttons (Excel, PDF)
  - DateRangePicker
  - Stats cards grid (4 cards)
  - HoursChart (collapsible)
  - Records table with EditableCell
```

### account/timekeeper/components/DateRangePicker.tsx
```typescript
'use client'
PROPS: { value: DateRange, onChange: (range) => void }

STATE:
  isOpen: boolean
  showCustom: boolean
  tempStart, tempEnd: string

PRESETS:
  - Today
  - Yesterday
  - Last 7 days
  - Last 30 days
  - This month
  - Last month

FUNCTIONS:
  handlePreset(preset):
    → calculate start/end dates
    → onChange({ start, end, preset })

  handleCustomApply():
    → validate dates
    → onChange({ start, end, preset: 'custom' })
```

### account/timekeeper/components/EditableCell.tsx
```typescript
'use client'
PROPS: {
  registroId: string
  field: 'entrada' | 'saida'
  value: string | null
  isEdited: boolean
  onSave: (id, field, value) => Promise<void>
}

STATE:
  isEditing: boolean
  tempValue: string
  saving: boolean

RENDER:
  - Display mode: formatted time + edit icon
  - Edit mode: datetime-local input + save/cancel
  - Edited indicator (amber dot) if isEdited
```

### account/timekeeper/components/HoursChart.tsx
```typescript
'use client'
PROPS: { data: { date: string, hours: number }[] }

RENDER:
  <ResponsiveContainer>
    <BarChart data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="hours" fill="#f59e0b" />
    </BarChart>
  </ResponsiveContainer>
```

### account/settings/SubscriptionManager.tsx
```typescript
'use client'
PROPS: { profile: Profile }

STATE:
  loading: string | null
  error: string | null

FUNCTIONS:
  handleAddPaymentMethod():
    → fetch POST /api/stripe/checkout
    → window.location.href = url

  handleManageSubscription():
    → fetch POST /api/stripe/portal
    → window.location.href = url

  handleCancelSubscription():
    → confirm dialog
    → fetch POST /api/stripe/cancel
    → router.refresh()

RENDER:
  - Current plan display
  - Payment method status
  - Trial info (days remaining)
  - Feature status list
  - Action buttons based on status
```

### account/settings/DeviceManager.tsx
```typescript
'use client'
PROPS: { profile: Profile }

STATE:
  loading: boolean
  error: string | null

FUNCTIONS:
  handleUnlink():
    → confirm dialog
    → fetch POST /api/device/unlink
    → router.refresh()

RENDER:
  - Device info (model, platform, registered date)
  - Unlink button
  - Or "No device linked" message
```

### account/profile/EditProfileForm.tsx
```typescript
'use client'
PROPS: { profile: Profile }

STATE:
  formData: { first_name, last_name, phone, company, role, bio }
  loading: boolean
  uploadingAvatar: boolean
  message: { type: 'success'|'error', text: string } | null

FUNCTIONS:
  handleChange(e):
    → setFormData(...)

  handleSubmit(e):
    → fetch POST /api/profile/update
    → show success message

  handleAvatarUpload(e):
    → validate file
    → create FormData
    → fetch POST /api/profile/avatar
    → update UI with new avatar

RENDER:
  - Avatar with upload overlay
  - Form fields (first_name, last_name, phone, company, role, bio)
  - Save button
```

---

## MIDDLEWARE

### middleware.ts
```typescript
import { createServerClient } from '@supabase/ssr'

MATCHER: ['/account/:path*', '/admin/:path*']

LOGIC:
  1. Create Supabase client with request cookies
  2. getUser() to validate session
  3. If no user + protected route → redirect to /
  4. If /admin/* route:
     → query profile.is_admin
     → if !is_admin → redirect to /account
  5. If authenticated:
     → update profile.last_seen_at = now()
  6. Return response with updated cookies
```

---

## UTILS

### lib/utils.ts
```typescript
cn(...inputs: ClassValue[]): string
  → clsx + tailwind-merge for class composition

formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string
  → new Date(date).toLocaleDateString('pt-BR', options)
  → default: { year: 'numeric', month: 'long', day: 'numeric' }

formatDateTime(date: string | Date): string
  → DD/MM/YYYY HH:mm format

formatCurrency(amount: number, currency = 'CAD'): string
  → Intl.NumberFormat('en-CA', { style: 'currency', currency })

formatMinutesToHours(minutes: number): string
  → "Xh Ymin" format

getInitials(nome?: string | null): string
  → First letter of first + last name, uppercase

getFirstName(nome?: string | null): string
  → Split by space, return first part

getLevelColor(level: string): string
  → Returns Tailwind classes for blades level badge

getSubscriptionBadge(status: string): { label: string, color: string }
  → Returns display label and Tailwind classes for status
```

---

## TYPES

### lib/supabase/types.ts
```typescript
export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled'

export type UserLevel = 'rookie' | 'apprentice' | 'journeyman' | 'master' | 'legend'

export type BladesTransactionType = 'earn' | 'redeem' | 'bonus' | 'adjustment'

export interface Profile {
  id: string
  email: string
  nome: string | null
  first_name: string | null
  last_name: string | null
  birthday: string | null
  gender: string | null
  trade: string | null
  avatar_url: string | null
  phone: string | null
  company: string | null
  role: string | null
  bio: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  subscription_started_at: string | null
  subscription_canceled_at: string | null
  has_payment_method: boolean
  device_id: string | null
  device_registered_at: string | null
  device_model: string | null
  device_platform: string | null
  blades_balance: number
  blades_lifetime_earned: number
  level: UserLevel
  voice_calculator_enabled: boolean
  sync_enabled: boolean
  is_admin: boolean
  is_suspended: boolean
  shopify_customer_id: string | null
  created_at: string
  updated_at: string
  last_seen_at: string | null
}

export interface Local {
  id: string
  user_id: string
  nome: string
  endereco: string | null
  latitude: number
  longitude: number
  raio: number
  cor: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Registro {
  id: string
  user_id: string
  local_id: string | null
  entrada: string
  saida: string | null
  local_nome: string | null
  local_latitude: number | null
  local_longitude: number | null
  sync_status: string | null
  edited_at: string | null
  edited_by: string | null
  original_entrada: string | null
  original_saida: string | null
  edit_reason: string | null
  created_at: string
  updated_at: string
}

export interface BladesTransaction {
  id: string
  user_id: string
  amount: number
  type: BladesTransactionType
  reason: string | null
  order_id: string | null
  product_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}
```

---

## ENV_VARS

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...                    # Only for webhooks

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
TRIAL_PERIOD_DAYS=180

# URLs
NEXT_PUBLIC_APP_URL=https://app.onsiteclub.ca
NEXT_PUBLIC_SHOPIFY_URL=https://onsiteclub.ca/shop
NEXT_PUBLIC_CALCULATOR_URL=https://calc.onsiteclub.ca
```

---

## AUTH_FLOW

```
ENTRY: app/page.tsx

1. EMAIL_CHECK
   User enters email → checkEmail()
   → supabase.from('profiles').select('email').eq('email', input).single()
   → EXISTS: step='login' | NOT_EXISTS: step='signup'

2a. LOGIN
   → supabase.auth.signInWithPassword({ email, password })
   → SUCCESS: router.push('/account')
   → FAIL: show error

2b. SIGNUP
   → supabase.auth.signUp({ email, password })
   → TRIGGER: handle_new_user() creates profile with trial
   → supabase.from('profiles').update({ nome }).eq('id', user.id)
   → supabase.auth.signInWithPassword() (auto-login)
   → router.push('/account')

3. PASSWORD_RESET
   → supabase.auth.resetPasswordForEmail({ email, redirectTo: /auth/callback })
   → User clicks email link
   → /auth/callback?token_hash=XXX&type=recovery
   → exchangeCodeForSession()
   → redirect to /reset-password
   → supabase.auth.updateUser({ password })
   → redirect to /account

4. MIDDLEWARE_PROTECTION
   Every request to /account/* or /admin/*:
   → supabase.auth.getUser()
   → NO_USER: redirect to /
   → HAS_USER: allow + update last_seen_at
   → /admin/*: additional is_admin check
```

---

## DATA_FLOW

```
PAGE_LOAD (Server Component):
  app/(dashboard)/account/timekeeper/page.tsx
  → createServerClient()
  → supabase.auth.getUser()
  → supabase.from('registros').select().eq('user_id', user.id)
  → supabase.from('locais').select().eq('user_id', user.id)
  → <TimekeeperDashboard registros={registros} locais={locais} profile={profile} />

CLIENT_ACTION (Edit Time):
  EditableCell.handleSave()
  → fetch('/api/timekeeper/update', { method: 'PATCH', body: { id, field, value } })
  → API: createServerClient() → getUser() → update registro → return updated
  → TimekeeperDashboard: setRegistros(updated)

CLIENT_ACTION (Export):
  TimekeeperDashboard.handleExportPDF()
  → fetch('/api/timekeeper/export/pdf', { method: 'POST', body: { registros, profile, stats } })
  → API: generate PDF with jsPDF → return blob
  → Client: create download link → click → cleanup

STRIPE_WEBHOOK:
  Stripe → POST /api/webhooks/stripe
  → Verify signature
  → createClient() with SERVICE_ROLE_KEY (bypasses RLS)
  → Update profile based on event type
  → Return { received: true }
```

---

## STYLING

```css
/* Brand Colors */
--brand-primary: #f59e0b;     /* amber-500 */
--brand-hover: #d97706;       /* amber-600 */
--brand-light: #fef3c7;       /* amber-100 */
--brand-dark: #92400e;        /* amber-800 */

/* Usage */
.bg-brand-500     /* Primary backgrounds, buttons */
.text-brand-500   /* Highlighted text, icons */
.border-brand-500 /* Active borders, focus rings */
.hover:bg-brand-600 /* Button hover states */

/* Tailwind Config Extension */
colors: {
  brand: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  }
}
```

---

## DEPENDENCIES

```json
{
  "dependencies": {
    "next": "14.2.21",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.47.0",
    "@supabase/ssr": "^0.5.2",
    "stripe": "^14.21.0",
    "@stripe/stripe-js": "^2.4.0",
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.460.0",
    "recharts": "^2.x",
    "jspdf": "^3.0.4",
    "jspdf-autotable": "^5.0.2",
    "xlsx": "^0.18.5",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/node": "^20",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}
```

---

## FEATURE_STATUS

| Feature | Status | Files |
|---------|--------|-------|
| Auth (login/signup/reset) | ✅ LIVE | app/page.tsx, auth/callback |
| Dashboard Hub | ✅ LIVE | account/page.tsx |
| Profile Management | ✅ LIVE | account/profile/* |
| Subscription (Stripe) | ✅ LIVE | account/settings/*, api/stripe/* |
| Device Management | ✅ LIVE | account/settings/DeviceManager |
| Timekeeper Dashboard | ✅ LIVE | account/timekeeper/* |
| Timekeeper Edit | ✅ LIVE | api/timekeeper/update |
| Export Excel | ✅ LIVE | api/timekeeper/export/excel |
| Export PDF | ✅ LIVE | api/timekeeper/export/pdf |
| Blades Rewards | ✅ LIVE | account/blades/page.tsx |
| Shop Integration | ✅ LIVE | account/shop/page.tsx |
| Calculator Access | ✅ LIVE | account/calculator/page.tsx |
| Courses | 🚧 SOON | account/courses/page.tsx |
| Checklist | 🚧 SOON | account/checklist/page.tsx |
| Admin Dashboard | 📋 PLANNED | /admin/* routes |

---

## COMMON_PATTERNS

### Server Component Page
```typescript
// app/(dashboard)/account/[feature]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientComponent from './ClientComponent'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data } = await supabase
    .from('table')
    .select('*')
    .eq('user_id', user.id)

  return <ClientComponent data={data} />
}
```

### API Route
```typescript
// app/api/[feature]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Process...

  return NextResponse.json({ success: true })
}
```

### Client Component with API Call
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ClientComponent({ data }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction() {
    setLoading(true)
    try {
      const res = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ... })
      })
      if (!res.ok) throw new Error('Failed')
      router.refresh() // Refresh server data
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (...)
}
```

---

## NOTES

- All timestamps in database are TIMESTAMPTZ (UTC)
- Frontend displays dates in pt-BR locale (legacy) but app UI is in English
- Currency is CAD, formatted with en-CA locale
- Geofencing happens in mobile app (React Native), data syncs to Supabase
- PDF export uses OnSite brand colors (#f59e0b header bar)
- Edited time records are visually highlighted in amber
- Trial period is 180 days (6 months)
- Subscription auto-created on Stripe checkout completion via webhook
- Service role key only used in webhook handler to bypass RLS

---

*Generated for AI context. Last updated: January 2025*
