# Schema History

> Histórico de alterações no banco de dados Supabase.
> Mantido por Blueprint (Blue).

---

## Banco Atual

**Supabase Project:** OnSite Intelligence
**URL:** `https://[project-id].supabase.co`
**Versão:** v1.0 + migrations 001-017

---

## Timeline

### 2025-01-17 — Schema v1.0 (Criação)

**Arquivo:** `migrations/001_schema.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso

**O que foi criado:**
- 35+ tabelas organizadas em camadas:
  - **Reference:** `ref_trades`, `ref_provinces`, `ref_units`
  - **Core:** `core_profiles`, `core_devices`, `core_consents`
  - **Timekeeper:** `app_timekeeper_projects`, `app_timekeeper_geofences`, `app_timekeeper_entries`
  - **Calculator:** `app_calculator_templates`, `app_calculator_calculations`
  - **Shop:** `app_shop_categories`, `app_shop_products`, `app_shop_product_variants`, `app_shop_orders`, `app_shop_order_items`, `app_shop_carts`
  - **Logs:** `log_voice`, `log_events`, `log_errors`, `log_locations`
  - **Analytics:** `agg_user_daily`, `agg_platform_daily`, `agg_trade_weekly`
  - **Intelligence:** `int_voice_patterns`, `int_behavior_patterns`
  - **Billing:** `billing_products`, `billing_subscriptions`
  - **Admin:** `admin_users`, `admin_logs`

- Views de compatibilidade: `profiles`, `records`, `locations`, `subscriptions`, `analytics_daily`
- Triggers de `updated_at` automático
- Função `handle_new_user()` para criar profile no signup
- Função `calculate_entry_duration()` para calcular duração de entries
- RLS básico em todas as tabelas principais
- Seed data: 18 trades, 13 províncias, 21 unidades

**Problemas identificados após execução:**
- Algumas tabelas/views marcadas como UNRESTRICTED (sem RLS adequado)

---

### 2025-01-17 — Fix RLS (Executado)

**Arquivo:** `migrations/002_fix_rls.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso

**O que corrigiu:**
- `admin_users`: Adiciona políticas de INSERT/UPDATE (somente super_admin)
- `admin_logs`: Adiciona políticas SELECT/INSERT para admins
- `agg_platform_daily`: RLS para somente admins/analysts
- `agg_trade_weekly`: RLS para somente admins/analysts
- `int_voice_patterns`: RLS (validados públicos, resto para admins)
- `int_behavior_patterns`: RLS para somente admins/analysts
- Views: Recriadas com `SECURITY INVOKER` para herdar RLS das tabelas base

---

### 2026-01-17 — Add Admins (Executado)

**Arquivo:** `migrations/003_add_admins.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso

**O que fez:**
- Adicionou super_admins à tabela `admin_users`:
  - `cristony.bruno@gmail.com` → Cristony Silva
  - `framing@shabba.ca` → Joelmir Martins
  - `dev@onsiteclub.ca` → Onsite Dev

**Nota:** Usuários precisam existir em `auth.users` antes de executar (fazer signup primeiro)

---

### 2026-01-17 — Calculator Tables (Executado)

**Arquivo:** `migrations/004_calculator_tables.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** Schemas definidos por Ceulen, centralizados por Blue

**O que cria:**
- **`consents`** — Gerenciamento de consentimentos (LGPD/GDPR)
  - Tipos: `voice_training`, `data_analytics`, `marketing`, `terms_of_service`, `privacy_policy`
  - RLS: usuário vê/gerencia apenas seus próprios consentimentos

- **`voice_logs`** — Logs de interações por voz (SÓ se consentimento ativo)
  - Campos de OURO: `entities`, `informal_terms`, `user_correction`
  - Índices GIN para busca em JSONB
  - RLS: usuário vê apenas seus logs + service_role full access

- **`calculations`** — Histórico de cálculos do Calculator
  - FK para `voice_logs` quando input_method = 'voice'
  - Tipos: `length`, `area`, `volume`, `material`, `conversion`, `custom`
  - RLS: usuário vê apenas seus cálculos

**Nota:** Migration idempotente (IF NOT EXISTS). Arquivos SQL em `Calculator/database/` devem ser deletados.

---

### 2026-01-17 — App Logs (Executado)

**Arquivo:** `migrations/005_app_logs.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** Necessidade identificada por Ceulen durante implementação

**O que criou:**
- **`app_logs`** — Tabela central de logging para todos os apps
  - Níveis: `debug`, `info`, `warn`, `error`
  - Campos: `module`, `action`, `message`, `context` (JSONB)
  - Device info: `device_info` (JSONB), `ip`, `user_agent`
  - Performance: `duration_ms`, `success`
  - App: `app_name`, `app_version`
  - RLS: INSERT aberto (para logs de auth), SELECT apenas próprios logs

---

### 2026-01-18 — Billing Address + UPSERT Constraint (Executado)

**Arquivo:** `migrations/006_billing_address_columns.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** Integração CEULEN ↔ HERMES ↔ Stripe

**Contexto:**
- Webhook do Stripe enviava dados de endereço que estavam sendo descartados
- UPSERT falhava com erro 42P10 (falta de unique constraint)
- Decisão: expandir schema para capturar todos os dados (não sacrificar dados)

**O que criou:**

1. **Unique Constraint** para UPSERT funcionar:
   ```sql
   UNIQUE (user_id, app_name)
   ```

2. **Colunas de endereço de cobrança** em `billing_subscriptions`:
   - `billing_address_line1` — Endereço linha 1
   - `billing_address_line2` — Apt, suite, etc
   - `billing_address_city` — Cidade
   - `billing_address_state` — Estado/Província
   - `billing_address_postal_code` — CEP/Código Postal
   - `billing_address_country` — País (código ISO 2 letras)

3. **Índice para analytics** por localização de clientes pagantes:
   ```sql
   idx_billing_subscriptions_location (country, state, city) WHERE status = 'active'
   ```

**Primeiro registro validado:**
- `user_id`: b6994dc4-ed87-4f46-a178-27deeab649e3
- `app_name`: calculator
- `status`: active
- `customer_email`: contact@shabba.ca
- `billing_address_city`: Ottawa, ON, CA

**Lição aprendida:** Nunca sacrificar dados para "fazer passar". Expandir schema é a solução correta.

---

### 2026-01-18 — Product Images Storage Bucket (Executado)

**Arquivo:** `migrations/007_product_images_bucket.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** MERCATOR (Shop)

**O que cria:**

1. **Políticas para bucket `products`** (bucket criado manualmente no Dashboard):
   - SELECT: Público
   - INSERT/UPDATE/DELETE: Apenas admins (`admin_users`)

---

### 2026-01-18 — Add Shop Admins (Executado)

**Arquivo:** `migrations/008_add_shop_admins.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** MERCATOR (Shop)

**O que fez:**
- Adicionou super_admins para gerenciar Shop:
  - `cristony.bruno@gmail.com`
  - `dev@onsite.ca`
  - `contact@shabba.ca`

---

### 2026-01-18 — Admin Users Read Policy (Executado)

**Arquivo:** `migrations/009_admin_users_read_policy.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** MERCATOR (Shop)

**O que corrigiu:**
- RLS bloqueava usuário de verificar seu próprio status de admin
- Adicionou policy: usuário autenticado pode ver apenas seu próprio registro em `admin_users`

---

### 2026-01-18 — Seed Categories (Executado)

**Arquivo:** `migrations/010_seed_categories.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** MERCATOR (Shop)

**O que criou:**
- Tabela `categories` (faltou na execução original do 001)
- Seed data: Mens, Womens, Members

---

### 2026-01-19 — Checkout Codes (Executado)

**Arquivo:** `migrations/011_checkout_codes.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** HERMES (Auth Hub) + CEULEN (Calculator)

**Contexto:**
- Capacitor Browser plugin trunca URLs com JWT longo
- Solução: código curto de 8 chars no PATH que redireciona para checkout

**O que criou:**
- **`checkout_codes`** — Códigos temporários para checkout
  - `code` TEXT PRIMARY KEY (8 chars, sem 0/O/1/I/L)
  - `user_id`, `email`, `app`
  - `expires_at` (TTL 60 segundos)
  - `used` BOOLEAN (one-time use)
  - RLS: apenas service_role pode acessar
- Funções: `generate_checkout_code()`, `cleanup_expired_checkout_codes()`

---

### 2026-01-19 — Payment History (Executado)

**Arquivo:** `migrations/012_payment_history.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** HERMES (Auth Hub)

**O que cria:**
- **`payment_history`** — Histórico completo de pagamentos
  - `billing_subscriptions` = estado atual (última compra)
  - `payment_history` = cada pagamento é um registro
  - Stripe IDs, amount (centavos), status
  - Snapshot de billing address no momento do pagamento
  - RLS: usuário vê apenas seus pagamentos

---

### 2026-01-19 — Checkout Codes Redirect URL (Executado)

**Arquivo:** `migrations/013_checkout_codes_redirect_url.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** CEULEN (Calculator v4.9)

**O que adicionou:**
- Coluna `redirect_url` em `checkout_codes`
- Permite deep link de retorno ao app após pagamento
- Exemplo: `onsitecalculator://auth-callback`

**Fluxo completo funcionando:**
```
Calculator → POST /api/checkout-code (salva redirect_url)
    ↓
Auth Hub /r/:code → 302 → /checkout/calculator
    ↓
Stripe Checkout → Pagamento OK
    ↓
/checkout/success → window.location.href = redirect_url
    ↓
Android deep link → Calculator onCheckoutReturn()
    ↓
Retry loop → refreshProfile() → hasAccess=true
    ↓
Botão de voz DESBLOQUEADO ✅
```

---

### 2026-01-19 — Fix Shop Products FK (Executado)

**Arquivo:** `migrations/014_fix_shop_products_fk.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** MERCATOR (Shop)

**O que corrigiu:**
- FK `app_shop_products.category_id` apontava para `app_shop_categories` (vazia)
- Alterado para apontar para `categories` (tabela correta com dados)

---

### 2026-01-19 — Shop Orders RLS (Executado)

**Arquivo:** `migrations/015_shop_orders_rls.sql`
**Executado por:** Cristony
**Status:** ✅ Sucesso
**Origem:** MERCATOR (Shop)

**Contexto:**
- E-commerce precisa de RLS para orders, carts, products
- Migration idempotente (DROP IF EXISTS antes de CREATE)

**O que cria:**

1. **RLS em `app_shop_orders`:**
   - Users: SELECT/INSERT próprios pedidos
   - Anon: INSERT (guest checkout)
   - Service role: bypassa RLS (webhook Stripe)

2. **RLS em `app_shop_order_items`:**
   - Users: SELECT/INSERT em seus pedidos
   - Anon: INSERT em pedidos anônimos

3. **RLS em `app_shop_carts`:**
   - Users: CRUD próprio carrinho

4. **RLS em `app_shop_products`:**
   - Public: SELECT produtos ativos/publicados
   - Admins: ALL

5. **RLS em `app_shop_product_variants`:**
   - Public: SELECT variantes de produtos ativos
   - Admins: ALL

6. **RLS em `categories`:**
   - Public: SELECT categorias ativas
   - Admins: ALL

**IMPORTANTE:** Tabelas usam prefixo `app_shop_*` (não nomes curtos).

---

### 2026-01-19 — ARGUS Conversations (Pendente)

**Arquivo:** `migrations/016_argus_conversations.sql`
**Executado por:** —
**Status:** ⏳ Pendente
**Origem:** ARGUS (Analytics Intelligence System)

**Contexto:**
- ARGUS precisa salvar histórico de conversas do chat de analytics
- Interface minimalista tipo ChatGPT com sidebar de histórico

**O que cria:**

1. **Tabela `argus_conversations`:**
   - `id` UUID PRIMARY KEY
   - `user_id` UUID → auth.users
   - `title` TEXT (auto-gerado ou editável)
   - `messages` JSONB (array de {role, content, data})
   - `starred` BOOLEAN
   - `archived` BOOLEAN
   - `created_at`, `updated_at` TIMESTAMPTZ

2. **Índices:**
   - `idx_argus_conversations_user` (user_id)
   - `idx_argus_conversations_created` (created_at DESC)
   - `idx_argus_conversations_starred` (user_id, starred) WHERE starred = true

3. **RLS:**
   - Users: CRUD apenas suas próprias conversas
   - Admins (super_admin, admin, analyst): SELECT em todas

---

### 2026-01-19 — ARGUS Views (Pendente)

**Arquivo:** `migrations/017_argus_views.sql`
**Executado por:** —
**Status:** ⏳ Pendente
**Origem:** ARGUS (Analytics Intelligence System)

**Contexto:**
- Views pré-calculadas para queries frequentes do Teletraan9
- Métricas de churn, saúde do usuário, receita, adoção de features

**O que cria:**

1. **`v_churn_risk`** — Score de risco de churn por usuário
   - Baseado em dias de inatividade, trial status, payment method
   - Níveis: healthy, low, medium, high
   - Flag: trial_expiring_soon

2. **`v_user_health`** — Score de saúde e segmentação
   - Atividade 30 dias: cálculos, voice, timekeeper
   - Health score com peso 2x para voice
   - Segmentos: power_user, active, casual, dormant

3. **`v_revenue_by_province`** — Receita por província
   - Pagantes, total de pagamentos, revenue total/médio
   - JOIN com ref_provinces para nomes

4. **`v_voice_adoption_by_trade`** — Adoção de voice por ofício
   - Taxa de adoção e sucesso por trade
   - JOIN com ref_trades para categorias

5. **`v_daily_platform_metrics`** — Métricas diárias
   - Signups, usuários ativos por feature, erros
   - Últimos 90 dias

6. **`v_top_errors`** — Top 50 erros (7 dias)
   - Agrupado por tipo, mensagem, app, versão
   - Severidade: critical, high, medium, low

7. **`v_subscription_funnel`** — Funil de conversão
   - Por app: trialing, active, past_due, canceled
   - Conversion rate e churn rate

8. **`v_mrr`** — Monthly Recurring Revenue
   - Por app: assinaturas ativas, MRR, ARR
   - Baseado em $9.99/mês

---

## Arquivos Deletados

| Arquivo | Motivo | Data |
|---------|--------|------|
| `migrations/002_rls.sql` | Versão anterior, nunca executada | 2025-01-17 |
| `migrations/003_functions.sql` | Versão anterior, nunca executada | 2025-01-17 |
| `migrations/004_seed.sql` | Versão anterior, nunca executada | 2025-01-17 |

---

## Estrutura Atual

```
migrations/
├── 001_schema.sql                    ← Schema completo v1.0 (executado)
├── 002_fix_rls.sql                   ← Correção de RLS (executado)
├── 003_add_admins.sql                ← Adiciona super_admins (executado)
├── 004_calculator_tables.sql         ← Tabelas do Calculator (executado)
├── 005_app_logs.sql                  ← Tabela de logs centralizada (executado)
├── 006_billing_address_columns.sql   ← Billing address + UPSERT (executado)
├── 007_product_images_bucket.sql     ← Storage bucket policies (executado)
├── 008_add_shop_admins.sql           ← Shop admins (executado)
├── 009_admin_users_read_policy.sql   ← RLS fix para admin check (executado)
├── 010_seed_categories.sql           ← Categories table + seed (executado)
├── 011_checkout_codes.sql            ← Códigos curtos para checkout (executado)
├── 012_payment_history.sql           ← Histórico de pagamentos (executado)
├── 013_checkout_codes_redirect_url.sql ← Deep link redirect (executado)
├── 014_fix_shop_products_fk.sql      ← FK para categories (executado)
├── 015_shop_orders_rls.sql           ← RLS para shop (executado)
├── 016_argus_conversations.sql       ← Histórico de conversas ARGUS (pendente)
└── 017_argus_views.sql               ← Views de métricas ARGUS (pendente)
```

---

## Convenções

1. **Nomenclatura:** `NNN_descricao.sql` (ex: `003_add_notifications.sql`)
2. **Nunca alterar migrations já executadas** — criar nova migration
3. **Documentar aqui** cada execução com data e status
4. **Blue mantém** este arquivo e os SQLs
5. **Cristony executa** no Supabase SQL Editor e confirma

---

## Próximas Alterações Planejadas

- [x] Executar `002_fix_rls.sql` ✅
- [x] Criar usuários no Supabase Dashboard (Auth → Users → Add user) ✅
- [x] Executar `003_add_admins.sql` ✅
- [x] Executar `004_calculator_tables.sql` ✅
- [x] Executar `005_app_logs.sql` ✅
- [x] Deletar SQLs avulsos em `Calculator/database/` (duplicados) ✅
- [x] Executar `006_billing_address_columns.sql` ✅ — Integração Stripe
- [x] Executar `007_product_images_bucket.sql` ✅ — Storage para Shop
- [x] Executar `008_add_shop_admins.sql` ✅ — Admins do Shop
- [x] Executar `009_admin_users_read_policy.sql` ✅ — RLS fix
- [x] Executar `010_seed_categories.sql` ✅ — Categories para Shop
- [x] Executar `011_checkout_codes.sql` ✅ — Códigos curtos
- [x] Executar `012_payment_history.sql` ✅ — Histórico de pagamentos (HERMES)
- [x] Executar `013_checkout_codes_redirect_url.sql` ✅ — Deep link redirect
- [x] Executar `014_fix_shop_products_fk.sql` ✅ — FK para categories
- [x] Executar `015_shop_orders_rls.sql` ✅ — RLS para shop (MERCATOR)
- [ ] Executar `016_argus_conversations.sql` — Histórico de conversas (ARGUS)
- [ ] Executar `017_argus_views.sql` — Views de métricas (ARGUS)
- [ ] (futuro) Tabela de notificações
- [ ] (futuro) Tabela de templates compartilhados

---

## Marcos do Projeto

### Calculator v4.9 — Checkout Completo ✅
**Data:** 2026-01-19
**Status:** Funcionando satisfatoriamente

Fluxo de pagamento end-to-end operacional:
- Código curto resolve truncamento de URL do Capacitor
- Deep link retorna ao app após pagamento
- Retry loop garante sincronização do status
- Botão de voz desbloqueia automaticamente

**APK:** `onsite-calculator-v4.9-checkout-redundancy.apk`

---

### ARGUS — Analytics Intelligence System (Em Desenvolvimento)
**Data:** 2026-01-19
**Status:** Migrations criadas, pendente execução

Sistema de analytics com 3 camadas de inteligência:
- **VISÃO:** Métricas em tempo real
- **ANÁLISE:** Cruzamento de dados cross-domain
- **PRÉ-COGNIÇÃO:** Modelos preditivos (churn, conversão, crescimento)

**Componentes:**
- `argus_conversations` — Histórico de conversas do chat
- 8 Views SQL para métricas calculadas
- Interface chat minimalista com Teletraan9 AI
- Plugins de export (PDF, Excel, Charts)

**Documentação:** `ARGUS.md`

---

*Última atualização: 2026-01-19*
