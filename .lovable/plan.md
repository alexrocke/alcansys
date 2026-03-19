

## Plan: Workflow Marketplace + UAZAP WhatsApp Integration

### Overview

Transform the Automações page from a simple list into a **workflow template marketplace**. Admin creates pre-built workflow templates (e.g., "Atendimento Automático", "Follow-up de Leads"). These can be sold/assigned to clients. Each client connects their own WhatsApp instance via **UAZAP API** with QR code generation.

---

### Part 1: Database Changes (Migration)

**New table: `workflow_templates`** - Global catalog of pre-built workflows (admin-managed)
- `id`, `nome`, `descricao`, `categoria` (atendimento, vendas, marketing, suporte), `icone`, `preco` (monthly price), `features` (jsonb array of feature descriptions), `config_schema` (jsonb - defines what the client needs to configure), `ativo`, `created_at`, `updated_at`

**New table: `client_automations`** - Workflow instances sold/assigned to specific clients
- `id`, `company_id` (FK companies), `template_id` (FK workflow_templates), `whatsapp_instance_id` (FK whatsapp_instances, nullable), `config` (jsonb - client-specific settings), `status` (ativa, inativa, configurando), `created_at`, `updated_at`

**Alter `whatsapp_instances`**: Add `uazap_instance_id` (text, nullable) to store the UAZAP-side instance identifier.

**RLS**: Admin can manage templates. Company members can view/manage their `client_automations`. Existing `whatsapp_instances` RLS already covers instance access.

---

### Part 2: UAZAP Edge Function

**New edge function: `uazap-proxy`** - Proxies calls to UAZAP API securely.

Endpoints (via request body action):
- `create-instance`: POST to UAZAP `/instance/init` with instance name, returns instance ID
- `get-qrcode`: GET from UAZAP `/v1/instance/qr`, returns base64 QR code
- `get-status`: GET instance connection status
- `restart`: POST to restart/reconnect instance

**Secrets needed**: `UAZAP_API_URL` (default `https://api.uazapi.com`), `UAZAP_API_TOKEN`

Auth: Validates Supabase JWT + checks user belongs to the company owning the instance.

---

### Part 3: Admin Automações Page (Redesign)

Redesign `src/pages/Automacoes.tsx` with **two tabs**:

**Tab 1: "Templates de Workflow"** (admin catalog)
- Card grid showing each workflow template with icon, name, description, price, category badge
- "Novo Template" button opens form to create templates
- Each card has edit/delete/toggle active

**Tab 2: "Clientes Ativos"** (assigned automations)
- Table showing which clients have which workflows active
- Shows connected WhatsApp instance status per client
- Can assign a template to a client company from here

**New components**:
- `src/components/automacoes/WorkflowTemplateCard.tsx` - Visual card for template display
- `src/components/automacoes/WorkflowTemplateForm.tsx` - Create/edit template form
- `src/components/automacoes/ClientAutomationManager.tsx` - Assign workflows to clients + manage WhatsApp connection
- `src/components/automacoes/UazapInstanceSetup.tsx` - Create UAZAP instance + QR code scanning flow

---

### Part 4: Client Portal - Automações with UAZAP

Update `src/pages/portal/PortalAutomacoes.tsx`:
- Show only workflows assigned to the client (`client_automations` with `template_id` join)
- For each automation, show a "Conectar WhatsApp" button if no instance linked
- WhatsApp connection flow: create UAZAP instance -> show QR code -> poll status until connected
- Dashboard with message stats from connected instances

---

### Part 5: AutomationForm Update

Update or replace the existing `AutomationForm` to work as `WorkflowTemplateForm`:
- Fields: nome, descricao, categoria (select), preco, features (dynamic list), status
- Remove custo/retorno fields (those were per-company, templates have preco instead)

The existing `automations` table can remain for backward compatibility but the new workflow is based on `workflow_templates` + `client_automations`.

---

### Files to Create
- `supabase/migrations/..._workflow_templates.sql` (new tables + alter)
- `supabase/functions/uazap-proxy/index.ts` (edge function)
- `src/components/automacoes/WorkflowTemplateCard.tsx`
- `src/components/automacoes/WorkflowTemplateForm.tsx`
- `src/components/automacoes/ClientAutomationManager.tsx`
- `src/components/automacoes/UazapInstanceSetup.tsx`

### Files to Edit
- `src/pages/Automacoes.tsx` (full redesign with tabs)
- `src/pages/portal/PortalAutomacoes.tsx` (UAZAP QR code flow)
- `src/integrations/supabase/types.ts` (auto-updated after migration)

