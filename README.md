# OnSite Dashboard v2

Central de autenticação e gerenciamento (SSO Hub) para o ecossistema OnSite Club.

## 🎯 O Que Mudou na v2

- **Landing Page** com popup de login/signup
- **Hub com Cards** como página principal (não sidebar navigation)
- **Sidebar Lateral** apenas para config e páginas legais
- **6 Cards**: Timekeeper, Calculator, Shop, Courses, Checklist, Blades
- **Páginas Legais** públicas (Terms, Privacy, Cancellation, Security)

## 📐 Layout

```
Antes do Login (/)
┌──────────────────────────────────────────┐
│  Landing Page + [Entrar] [Criar Conta]   │
│  ↓                                       │
│  Popup de Login/Signup                   │
└──────────────────────────────────────────┘

Após Login (/account)
┌────────────┬─────────────────────────────┐
│  SIDEBAR   │  HUB COM CARDS              │
│            │                             │
│  Profile   │  ┌────────┐ ┌────────┐     │
│  Settings  │  │Timekpr │ │ Calc   │     │
│  ────────  │  └────────┘ └────────┘     │
│  Terms     │  ┌────────┐ ┌────────┐     │
│  Privacy   │  │ Shop   │ │Courses │     │
│  Cancel    │  └────────┘ └────────┘     │
│  Security  │  ┌────────┐ ┌────────┐     │
│  ────────  │  │Checklist│ │Blades │     │
│  Logout    │  └────────┘ └────────┘     │
└────────────┴─────────────────────────────┘
```

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env.local
# Editar .env.local com suas chaves

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🔧 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App URLs
NEXT_PUBLIC_APP_URL=https://app.onsite.ca
NEXT_PUBLIC_CALCULATOR_URL=https://calc.onsite.ca
NEXT_PUBLIC_SHOPIFY_URL=https://onsite.ca/shop
```

## 📁 Estrutura

```
app/
├── page.tsx                    # Landing page (público)
├── terms/page.tsx              # Termos de uso (público)
├── privacy/page.tsx            # Privacidade (público)
├── cancellation/page.tsx       # Cancelamento (público)
├── security/page.tsx           # Segurança (público)
├── auth/callback/              # OAuth callback
├── (dashboard)/
│   ├── layout.tsx              # Layout com Sidebar
│   └── account/
│       ├── page.tsx            # Hub com Cards
│       ├── timekeeper/         # Dashboard Timekeeper
│       ├── calculator/         # Dashboard Calculator
│       ├── shop/               # Blades + link Shopify
│       ├── courses/            # Coming Soon
│       ├── checklist/          # Coming Soon
│       ├── blades/             # Rewards detalhado
│       ├── profile/            # Editar perfil
│       └── settings/           # Assinatura, device
└── api/
    ├── stripe/                 # Checkout, Portal, Cancel
    ├── webhooks/stripe/        # Stripe webhooks
    ├── profile/                # Update, Avatar
    └── device/                 # Unlink

components/
├── auth/AuthModal.tsx          # Popup login/signup
└── layout/
    ├── Sidebar.tsx             # Sidebar com config + legal
    └── Header.tsx              # Header com avatar + blades
```

## 🔐 Autenticação

- **Supabase Auth** para login/signup
- **Popup modal** na landing page
- **Middleware** protege `/account/*`
- **Trial automático** de 6 meses no signup

## 💳 Stripe

### Webhook Events
- `checkout.session.completed` → Ativa subscription
- `customer.subscription.updated` → Atualiza status
- `customer.subscription.deleted` → Cancela + bloqueia features
- `invoice.payment_succeeded` → Marca como ativo
- `invoice.payment_failed` → Marca como past_due

### Configurar Webhook
1. Deploy na Vercel
2. Stripe Dashboard → Developers → Webhooks
3. Add endpoint: `https://app.onsite.ca/api/webhooks/stripe`
4. Copiar signing secret para `STRIPE_WEBHOOK_SECRET`

## 📱 Integração Mobile

O mobile (React Native/Expo) pode usar:
- **Supabase Auth direto** (recomendado)
- Mesmas tabelas: profiles, locais, registros
- RLS garante isolamento de dados por user_id

## ✅ Checklist Deploy

- [ ] `.env.local` configurado
- [ ] `npm run build` sem erros
- [ ] Deploy na Vercel
- [ ] Domínio `app.onsite.ca` configurado
- [ ] Webhook Stripe apontando para produção
- [ ] Bucket `avatars` no Supabase Storage
- [ ] RLS ativo em todas as tabelas
- [ ] Testar fluxo: signup → trial → settings → Stripe

## 🎨 Cards do Hub

| Card | Status | Descrição |
|------|--------|-----------|
| ⏱️ Timekeeper | Ativo | Horas, sessões, locais |
| 🧮 Calculator | Ativo | Voice status, trial info |
| 🛒 Shop | Ativo | Link externo Shopify |
| 📚 Courses | Coming Soon | Placeholder |
| ✅ Checklist | Coming Soon | Placeholder |
| 🔪 Blades | Ativo | Balance, levels, history |

## 📞 Suporte

- support@onsite.ca
- security@onsite.ca (vulnerabilities)
- privacy@onsite.ca (data requests)

---

© 2025 OnSite Club. All rights reserved.
