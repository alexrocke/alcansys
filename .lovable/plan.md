

## Plano: Painel de Supervisao + Controle de Concorrencia

### Contexto
O sistema de conversas atual permite que qualquer atendente assuma qualquer conversa sem verificacao. Nao ha visibilidade sobre quem esta online ou quantas conversas cada atendente atende.

### O que sera construido

**1. Tabela `agent_presence` (nova migracao)**
- Registra presenca online dos atendentes com heartbeat
- Colunas: `id`, `user_id`, `company_id`, `last_seen_at`, `status` (online/away/offline)
- Um cron ou logica client-side atualiza `last_seen_at` a cada 30s
- Agente e considerado offline se `last_seen_at` > 2 minutos atras

**2. Coluna `locked_by` + `locked_at` na tabela `conversations`**
- Quando um atendente abre uma conversa, ela fica "travada" para ele
- Outros atendentes veem que a conversa esta sendo atendida e por quem
- Lock expira automaticamente apos 5 minutos sem atividade (heartbeat do lock)

**3. Componente `SupervisaoPanel` (novo)**
- Painel acessivel via tab ou botao no topo da pagina de Conversas
- Mostra lista de atendentes com: nome, status (online/away/offline), quantidade de conversas ativas
- Dados vem de: join `agent_presence` + count de `conversations` onde `atendente_id = user_id` e `status IN ('aberta', 'em_atendimento')`

**4. Controle de concorrencia no `Conversas.tsx`**
- Ao selecionar uma conversa, faz UPDATE com condicao `WHERE locked_by IS NULL OR locked_by = user_id OR locked_at < now() - interval '5 minutes'`
- Se o UPDATE retorna 0 rows, mostra toast "Conversa sendo atendida por [nome]"
- Heartbeat: a cada 30s enquanto conversa esta aberta, atualiza `locked_at`
- Ao sair da conversa (desselecionar ou navegar), limpa o lock

### Detalhes tecnicos

**Migracao SQL:**
```sql
-- Tabela de presenca
CREATE TABLE agent_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  last_seen_at timestamptz DEFAULT now(),
  status text DEFAULT 'online',
  UNIQUE(user_id, company_id)
);
ALTER TABLE agent_presence ENABLE ROW LEVEL SECURITY;
-- RLS: company members can view, authenticated can upsert own

-- Lock na conversa
ALTER TABLE conversations 
  ADD COLUMN locked_by uuid,
  ADD COLUMN locked_at timestamptz;
```

**Presenca client-side:**
- Hook `useAgentPresence(companyId)` que faz upsert na `agent_presence` a cada 30s
- Usado na pagina de Conversas
- Cleanup no `beforeunload` e unmount

**SupervisaoPanel:**
- Query: `agent_presence` com join em `profiles` para nome, + subquery count de conversas ativas por atendente
- Indicador visual: verde (online <2min), amarelo (away 2-5min), cinza (offline >5min)
- Renderizado como drawer/sheet ou secao colapsavel no topo da lista de conversas

**Lock flow no Conversas.tsx:**
- `selectConversation` -> tenta lock via update condicional
- Se falha -> toast + nao abre
- Heartbeat interval de 30s atualizando `locked_at`
- Cleanup: update `locked_by = null` ao desselecionar

### Arquivos afetados
- **Novo**: `src/components/conversas/SupervisaoPanel.tsx`
- **Novo**: `src/hooks/useAgentPresence.tsx`
- **Editado**: `src/pages/Conversas.tsx` (lock logic + painel de supervisao + presenca)
- **Migracao**: nova migracao para `agent_presence` + colunas lock em `conversations`

