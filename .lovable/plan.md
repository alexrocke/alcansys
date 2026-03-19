

## Plan: Módulo de Vendedores + Portal do Vendedor + Comissões

### Resumo

Criar um sistema completo de gestão de vendedores com:
1. **Página admin "Vendedores"** — cadastro, metas, e controle de comissões
2. **Portal do Vendedor** — interface separada para vendedores verem seus leads, clientes e comissões
3. **Sistema de comissões** — vinculado a leads ganhos e transações

---

### Parte 1: Banco de Dados

**Nova role `vendedor`** no enum `app_role`.

**Nova tabela `salespeople`**:
- `id`, `user_id` (FK profiles), `company_id`, `nome`, `email`, `telefone`, `meta_mensal` (numeric), `percentual_comissao` (numeric, default 10), `status` (ativo/inativo), `created_at`, `updated_at`
- RLS: admins gerenciam, vendedores veem o próprio registro

**Nova tabela `commissions`**:
- `id`, `salesperson_id` (FK salespeople), `lead_id` (FK leads, nullable), `company_id`, `descricao`, `valor_venda`, `percentual`, `valor_comissao`, `status` (pendente/aprovada/paga), `data_venda`, `data_pagamento`, `created_at`
- RLS: admins gerenciam tudo, vendedores veem as próprias

**Alterar tabela `leads`**: adicionar coluna `salesperson_id` (uuid, nullable) para vincular lead ao vendedor.

---

### Parte 2: Página Admin "Vendedores" (`/vendedores`)

Cards de resumo: Total de vendedores, Vendas do mês, Comissões pendentes, Comissões pagas.

**Abas**:
- **Vendedores**: Lista com nome, meta, vendas no mês, comissão acumulada. CRUD completo.
- **Comissões**: Lista de todas as comissões com filtro por vendedor, status (pendente/aprovada/paga), período. Ações: aprovar, marcar como paga.

**Form de vendedor**: Nome, email, telefone, meta mensal, percentual de comissão, vincular a um user_id (opcional — para dar acesso ao portal).

---

### Parte 3: Portal do Vendedor

Usuários com role `vendedor` (sem outras roles admin/gestor) são direcionados a um **layout separado** (`VendedorLayout`) com sidebar própria.

**Páginas do portal**:
- **Dashboard**: Resumo de vendas, meta vs realizado, comissões do mês
- **Meus Leads**: Leads atribuídos ao vendedor, com ações de atualizar status
- **Minhas Comissões**: Histórico de comissões com status de pagamento
- **Meus Clientes**: Clientes vinculados aos leads ganhos

**Roteamento**: No `AppRoutes`, se `userRole === 'vendedor'`, renderiza `VendedorLayout` em vez de `InternalLayout` ou `PortalLayout`.

---

### Parte 4: Integração com Leads

No `LeadForm`, adicionar campo "Vendedor" (select de salespeople da empresa). Quando lead muda para status `ganho`, criar automaticamente um registro em `commissions` com o percentual do vendedor.

---

### Arquivos

**Migration SQL**: 
- Adicionar `vendedor` ao enum `app_role`
- Criar tabelas `salespeople` e `commissions` com RLS
- Adicionar `salesperson_id` à tabela `leads`

**Criar**:
- `src/pages/Vendedores.tsx` — página admin com abas
- `src/components/vendedores/SalespersonForm.tsx` — form CRUD
- `src/components/vendedores/SalespersonList.tsx` — listagem
- `src/components/vendedores/CommissionList.tsx` — listagem de comissões
- `src/pages/vendedor-portal/VendedorDashboard.tsx` — dashboard do vendedor
- `src/pages/vendedor-portal/VendedorLeads.tsx` — leads do vendedor
- `src/pages/vendedor-portal/VendedorComissoes.tsx` — comissões do vendedor
- `src/pages/vendedor-portal/VendedorClientes.tsx` — clientes do vendedor
- `src/components/vendedor-portal/VendedorSidebar.tsx` — sidebar do portal
- `src/components/vendedor-portal/VendedorLayout.tsx` — layout wrapper

**Editar**:
- `src/App.tsx` — adicionar rota `/vendedores` + `VendedorLayout` quando role é vendedor
- `src/components/app-sidebar.tsx` — adicionar item "Vendedores" (admin/gestor)
- `src/components/leads/LeadForm.tsx` — adicionar campo vendedor
- `src/pages/Leads.tsx` — mostrar coluna vendedor
- `src/hooks/useAuth.tsx` — lógica de roteamento para vendedor

