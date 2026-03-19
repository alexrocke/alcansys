

## Build Error Fix + Status Overview

### 1. Immediate Build Error

The build is broken because `@vitejs/plugin-react@^6.0.1` requires **Vite 6**, but the project uses **Vite 5**. The fix is to move `@vitejs/plugin-react` back to a compatible version (`^4.3.4`) or switch back to `@vitejs/plugin-react-swc@^3.x`. This is a one-line fix in `package.json`.

---

### 2. What Already Exists (Phases 1-3 Done)

| Phase | Status |
|-------|--------|
| Phase 1: Multi-tenancy (companies, memberships, RLS) | Done |
| Phase 2: Project tasks (checklist, progress, alerts) | Done |
| Phase 3: WhatsApp channels & instances | Done |

---

### 3. What's Still Missing (from the audit roadmap)

| Phase | Module | Description |
|-------|--------|-------------|
| **4** | **Leads & CRM** | Tables: `leads`, `contacts`. Funnel, tags, origin tracking, responsible assignment, interaction history |
| **5** | **Conversations** | Tables: `conversations`, `messages`. Real-time chat view, IA vs human responses, handoff, pending messages |
| **6** | **AI Monitoring** | Tables: `ai_agents`, `ai_events`. IA active/inactive status, failure rate, response audit, error alerts per client/channel |
| **7** | **Client Dashboard** | Dedicated view for clients: leads received, messages, response rate, IA status, integration health, follow-up stats |
| **8** | **Alcansys Master Panel** | Internal admin view: all clients, active projects, connected channels, error clients, volume metrics, deployment progress |
| **9** | **Integrations & API** | Tables: `webhook_events`, `integration_logs`, `error_logs`. Edge functions for webhooks, external API endpoints, subscription management |
| **10** | **UX/UI Premium** | Onboarding flow, dark mode, responsive polish, loading skeletons, empty states, branding customization |

### 4. Other Pending Items

- **All existing modules** (Dashboard, Projetos, Financeiro, Clientes, Marketing, Automações, Documentos, Equipe) still need their queries updated to **filter by `company_id`** from the CompanySelector. Currently most queries don't filter by the selected company.
- **Onboarding flow** — no way to create a company from the UI yet (requires SQL manually).
- **Real WhatsApp API integration** — current QR code / reconnect is simulated.
- Tables `followups`, `subscriptions` not yet created.

### 5. Recommended Next Steps (in priority order)

1. **Fix the build error** (plugin version mismatch)
2. **Update all module queries to filter by company_id** (critical for multi-tenancy to actually work)
3. **Phase 4: Leads & CRM** — most impactful new module for the WhatsApp/automation use case
4. **Phase 5: Conversations** — core to the product vision

