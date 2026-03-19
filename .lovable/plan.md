

## Plan: Functional Roles + Client Portal

### Overview

Two major changes: (1) make all internal roles control sidebar visibility and page access, and (2) create a dedicated Client Portal for external clients with 4 sections.

---

### Part 1: Functional Role-Based Access

**Current state**: `app_role` enum has `admin`, `gestor`, `colaborador`, `financeiro`, `marketing`. The sidebar shows everything to everyone.

**Changes**:

- **`src/components/app-sidebar.tsx`**: Add role-based filtering to `mainItems`. Each menu item gets an `allowedRoles` array:
  - Admin: all pages
  - Gestor: Dashboard, Projetos, Leads, Conversas, Clientes, Equipe, Documentos
  - Financeiro: Dashboard, Financeiro, Clientes, Documentos
  - Marketing: Dashboard, Marketing, Leads, Automações, Conversas
  - Colaborador/Membro: Dashboard, Projetos, Documentos
  - Configurações: admin only

- **`src/components/ProtectedRoute.tsx`**: Add optional `allowedRoles` prop to restrict route access (redirect to dashboard if unauthorized).

- **`src/hooks/useAuth.tsx`**: Already exposes `userRole`. No changes needed.

---

### Part 2: Client Portal

For external client users (identified by `membership_role` = `'viewer'` or a new concept), create a separate portal experience.

**New Database Tables** (migration):

1. **`services`** - Alcansys service catalog
   - `id`, `nome`, `descricao`, `categoria`, `preco_base`, `ativo`, `company_id` (nullable, global if null), `created_at`

2. **`quote_requests`** - Quote/budget requests from clients
   - `id`, `company_id`, `service_id`, `nome_contato`, `email`, `telefone`, `mensagem`, `status` (enum: pendente, em_analise, respondido, fechado), `created_at`

3. **`invoices`** - Client invoices/payments
   - `id`, `company_id`, `descricao`, `valor`, `status` (enum: pendente, pago, vencido, cancelado), `data_vencimento`, `data_pagamento`, `created_at`

4. **`client_systems`** - Contracted systems per client
   - `id`, `company_id`, `nome`, `tipo` (landing_page, sistema, automacao, etc.), `url`, `status` (ativo, inativo, em_desenvolvimento), `created_at`

**New Pages**:

5. **`src/pages/portal/PortalServicos.tsx`** - Service cards with "Solicitar Orçamento" button opening a Dialog form
6. **`src/pages/portal/PortalAutomacoes.tsx`** - Shows only active automations for the client's company, with message counters from `whatsapp_instances` and `conversations`
7. **`src/pages/portal/PortalFaturas.tsx`** - Invoice list with status badges (pendente, pago, vencido)
8. **`src/pages/portal/PortalSistemas.tsx`** - Contracted systems list with links and status

**New Components**:

9. **`src/components/portal/PortalSidebar.tsx`** - Simplified sidebar with only: Serviços, Automações, Faturas, Sistemas, Sair
10. **`src/components/portal/QuoteRequestForm.tsx`** - Form for requesting quotes

**Routing Logic** (`src/App.tsx`):

11. Detect if user is a client (membership_role = `'viewer'` or `'member'` AND no `app_role`). If so, render the Portal layout with PortalSidebar instead of AppSidebar. Internal users (with `app_role`) get the regular admin layout.

---

### Technical Details

- Role detection uses existing `useAuth().userRole` (app_role) and `useCompany().currentMembership.role` (membership_role)
- Client portal users: those WITHOUT an `app_role` in `user_roles` table (they only have a `membership` entry)
- RLS on new tables uses existing `user_belongs_to_company()` and `get_user_company_ids()` functions
- The quote request form fields will be stored in the `quote_requests` table so you can later configure which services appear
- Invoice status enum: `CREATE TYPE invoice_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado')`
- System type enum: `CREATE TYPE client_system_type AS ENUM ('landing_page', 'sistema', 'automacao', 'chatbot', 'outro')`

### Files to Create
- `supabase/migrations/..._client_portal.sql` (4 tables + enums + RLS)
- `src/pages/portal/PortalServicos.tsx`
- `src/pages/portal/PortalAutomacoes.tsx`
- `src/pages/portal/PortalFaturas.tsx`
- `src/pages/portal/PortalSistemas.tsx`
- `src/components/portal/PortalSidebar.tsx`
- `src/components/portal/QuoteRequestForm.tsx`

### Files to Edit
- `src/App.tsx` (dual layout routing)
- `src/components/app-sidebar.tsx` (role filtering)
- `src/components/ProtectedRoute.tsx` (role guard)

