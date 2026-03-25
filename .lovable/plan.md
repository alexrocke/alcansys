

## Plano de Implementacao Completo - Recursos Pendentes

Organizados por prioridade de impacto no negocio.

---

### FASE 1 - Alta Prioridade

#### 1.1 Envio de Mensagens WhatsApp pelo Painel

Atualmente o painel de Conversas salva mensagens no banco mas nao envia para o WhatsApp real.

**Mudancas:**
- Criar Edge Function `send-whatsapp` que recebe `instance_id`, `phone`, `message` e chama a API UAZAP `/message/send-text`
- Alterar `Conversas.tsx` > `sendMessage` para chamar a Edge Function antes de salvar no banco
- Buscar o `api_token` e `instance_name` da tabela `whatsapp_instances` vinculada a conversa

**Arquivos:** `supabase/functions/send-whatsapp/index.ts`, `src/pages/Conversas.tsx`

#### 1.2 Dashboard do Portal do Cliente

O portal do cliente nao tem tela inicial com resumo.

**Mudancas:**
- Criar pagina `src/pages/portal/PortalDashboard.tsx` com cards resumo: projetos ativos, faturas pendentes, automacoes ativas, sistemas
- Adicionar rota `/portal` no `App.tsx`
- Adicionar link "Inicio" no `PortalSidebar.tsx`

**Arquivos:** `src/pages/portal/PortalDashboard.tsx`, `src/App.tsx`, `src/components/portal/PortalSidebar.tsx`

---

### FASE 2 - Media Prioridade

#### 2.1 Notificacoes Automaticas (Triggers)

O `NotificationBell` existe mas alertas so sao criados manualmente. Faltam triggers automaticos.

**Mudancas:**
- Migration com triggers para criar alertas automaticamente:
  - Novo lead criado → alerta para admins/gestores
  - Tarefa vencida → alerta para responsavel
  - Fatura vencendo em 3 dias → alerta para financeiro
  - Nova conversa WhatsApp → alerta para atendentes
- Adicionar realtime subscription no `useNotifications` para atualizar em tempo real

**Arquivos:** Migration SQL, `src/hooks/useNotifications.tsx`

#### 2.2 Relatorios e Exportacoes

Apenas financeiro tem exportacao PDF. Faltam relatorios para outras areas.

**Mudancas:**
- Criar componente `ReportGenerator` reutilizavel com jsPDF
- Relatorio de Projetos: status, progresso, custos vs orcamento
- Relatorio de Leads: funil de conversao, origem, taxa de conversao
- Relatorio de Vendas: performance por vendedor, comissoes, metas
- Relatorio de Equipe: tarefas concluidas, produtividade
- Adicionar botao "Exportar Relatorio" nas paginas Projetos, Leads, Vendedores

**Arquivos:** `src/lib/reportGenerator.ts`, modificacoes em `Projetos.tsx`, `Leads.tsx`, `Vendedores.tsx`

---

### FASE 3 - Complementar

#### 3.1 Audit Log / Historico de Atividades

**Mudancas:**
- Criar tabela `activity_logs` (user_id, action, entity_type, entity_id, details, created_at)
- Trigger generico para INSERT/UPDATE/DELETE nas tabelas principais (projects, clients, finances, leads)
- Criar pagina `src/pages/AtividadeLog.tsx` com listagem filtrada por entidade/usuario/data
- Adicionar no sidebar em Configuracoes ou como pagina propria

**Arquivos:** Migration SQL, `src/pages/AtividadeLog.tsx`, `src/App.tsx`, `src/components/app-sidebar.tsx`

#### 3.2 Email Transacional

**Mudancas:**
- Usar Supabase Auth email hooks ou Edge Function para enviar emails via Resend/SMTP
- Casos: convite de membro aceito, fatura criada, lead atribuido, lembrete de vencimento
- Criar Edge Function `send-email` com templates HTML
- Configurar secret `RESEND_API_KEY` ou similar

**Arquivos:** `supabase/functions/send-email/index.ts`, migration para tabela `email_templates` (opcional)

#### 3.3 Filtros e Busca Avancada Padronizados

**Mudancas:**
- Criar componente reutilizavel `FilterBar` com busca por texto, filtro por status, data e area
- Aplicar em paginas que nao tem: Marketing, Documentos, Equipe
- Padronizar o visual com as que ja tem (Leads, Financeiro)

**Arquivos:** `src/components/ui/filter-bar.tsx`, modificacoes em paginas afetadas

#### 3.4 Responsividade Mobile

**Mudancas:**
- Revisar todas as paginas para breakpoints mobile
- Corrigir `Conversas.tsx` que usa `window.innerWidth` inline (trocar por hook `useMobile`)
- Ajustar tabelas para layout card em mobile
- Testar sidebar collapse em telas pequenas

**Arquivos:** Multiplas paginas

---

### Resumo de Esforco

| Fase | Item | Complexidade |
|------|------|-------------|
| 1.1 | Envio WhatsApp | Media - 1 Edge Function + ajuste no frontend |
| 1.2 | Dashboard Portal Cliente | Baixa - 1 pagina nova com queries |
| 2.1 | Notificacoes Triggers | Media - Migration + realtime |
| 2.2 | Relatorios | Media - Componente + jsPDF |
| 3.1 | Audit Log | Media - Tabela + triggers + pagina |
| 3.2 | Email Transacional | Alta - Edge Function + provider externo |
| 3.3 | Filtros Padronizados | Baixa - Componente reutilizavel |
| 3.4 | Responsividade | Baixa - Ajustes CSS |

### Ordem recomendada de implementacao

1. Envio WhatsApp (impacto direto no uso diario)
2. Dashboard Portal Cliente (experiencia do cliente)
3. Notificacoes automaticas (produtividade)
4. Relatorios (gestao)
5. Filtros padronizados (UX)
6. Responsividade (acessibilidade)
7. Audit log (compliance)
8. Email transacional (automacao)

