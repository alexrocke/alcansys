# Plano: Gestão Completa de Projetos

Expandir `ProjetoDetalhe.tsx` com 10 novas abas/seções, cada uma com CRUD próprio, RLS e vínculo ao `project_id`.

## Novas abas a adicionar

1. **Credenciais** — Acessos específicos do projeto (login painel cliente, FTP, Git, servidor). Criptografia AES-256-GCM via `vault-crypto` (padrão do Cofre Interno).
2. **Milestones** — Marcos com data prevista × entregue, status, % de conclusão.
3. **Contratos** — Vincular contratos assinados, aditivos, SLA. Reusa `contract_templates`.
4. **Reuniões / Atas** — Timeline de reuniões: data, participantes, decisões, link gravação.
5. **Riscos** — Lista com impacto (baixo/médio/alto), probabilidade, mitigação, responsável, status.
6. **Stakeholders** — Contatos do cliente (nome, cargo, email, telefone, papel: PM/técnico/financeiro).
7. **Ambientes & Repos** — URLs de dev/staging/prod, branch principal, link repo, provider de deploy.
8. **KPIs / Objetivos** — Metas mensuráveis, valor alvo, valor atual, % de progresso.
9. **Faturas** — Reusa tabela `invoices` filtrada por `project_id` (adicionar coluna se faltar) + status pagamento.
10. **Suporte Pós-Entrega** — Data início garantia, horas contratadas, horas consumidas, chamados abertos.

## Migrations (SQL)

Criar tabelas com padrão idêntico: `id`, `project_id`, `company_id`, campos específicos, `created_at`, `updated_at`, RLS (membros lêem, admin/gestor escreve), GRANTs, trigger `update_updated_at_column`.

- `project_credentials` (nome, tipo, usuario, senha_encrypted, url, observacoes)
- `project_milestones` (titulo, descricao, data_prevista, data_entrega, status, ordem)
- `project_contracts` (titulo, tipo, template_id?, url_arquivo, data_assinatura, valor, status)
- `project_meetings` (titulo, data, participantes[], ata, link_gravacao)
- `project_risks` (titulo, descricao, impacto, probabilidade, mitigacao, responsavel_id, status)
- `project_stakeholders` (nome, cargo, email, telefone, papel)
- `project_environments` (nome, tipo [dev/staging/prod], url, branch, repo_url, deploy_provider)
- `project_kpis` (titulo, descricao, valor_alvo, valor_atual, unidade, prazo)
- `project_support` (data_inicio_garantia, data_fim_garantia, horas_contratadas, horas_consumidas, observacoes) — 1 linha por projeto
- Adicionar `project_id UUID REFERENCES projects(id)` em `invoices` se não existir

## Componentes React

Criar em `src/components/projetos/`:
- `ProjectCredentials.tsx` (usa vault-crypto)
- `ProjectMilestones.tsx`
- `ProjectContracts.tsx`
- `ProjectMeetings.tsx`
- `ProjectRisks.tsx`
- `ProjectStakeholders.tsx`
- `ProjectEnvironments.tsx`
- `ProjectKPIs.tsx`
- `ProjectInvoices.tsx`
- `ProjectSupport.tsx`

Cada um: `useQuery` para listar, `useMutation` para create/update/delete, Dialog com formulário, `isAdmin || isGestor` para escrita.

## UI: ProjetoDetalhe.tsx

Reorganizar `TabsList` em grupos horizontais roláveis (14 abas ficam muitas). Agrupar visualmente:
- **Execução:** Tarefas, Milestones, Riscos, KPIs
- **Pessoas:** Equipe, Stakeholders, Reuniões
- **Comercial:** Financeiro, Faturas, Contratos, Suporte
- **Técnico:** Documentos, Infraestrutura, Ambientes, Credenciais

Usar `TabsList` com `overflow-x-auto` e ícones lucide compactos.

## Segurança

- Todas as tabelas: RLS via `user_belongs_to_company` + `has_role('admin')` / `user_has_company_role(gestor)`.
- `project_credentials.senha_encrypted`: nunca retornar em plaintext no SELECT — só via edge function `vault-crypto` sob demanda.
- GRANTs explícitos para `authenticated` e `service_role`.

## Ordem de execução

1. Migration única com as 10 tabelas + coluna em invoices + RLS/GRANTs/triggers.
2. Aguardar aprovação e regeneração de `types.ts`.
3. Criar 10 componentes em paralelo.
4. Atualizar `ProjetoDetalhe.tsx` com nova estrutura de abas agrupadas.

## Fora do escopo

- Notificações automáticas (milestone atrasado, garantia expirando) — fase futura.
- Dashboard consolidado multi-projeto — fase futura.
- Exportação PDF por seção — fase futura.
