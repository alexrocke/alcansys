

## Plano: Correções e Melhorias (Modelos GPT-5, Áreas/Segmentos, Automações vinculadas a Clientes)

### 1. Adicionar modelos GPT-5 ao seletor

Adicionar os modelos GPT-5 da OpenAI na lista de `OPENAI_MODELS` em `GeralSettings.tsx`:
- `gpt-5` — Modelo mais poderoso, raciocínio avançado
- `gpt-5-mini` — Equilíbrio custo/qualidade (recomendado)
- `gpt-5-nano` — Mais rápido e barato, alto volume

**Arquivo**: `src/components/configuracoes/GeralSettings.tsx`

---

### 2. Página de Conversas

A página "Conversas" existe para gerenciar as **conversas de WhatsApp** geradas pelas automações (quando um cliente final interage via WhatsApp, a conversa aparece ali). Ela está vazia porque ainda não há instâncias WhatsApp conectadas enviando/recebendo mensagens. Quando as automações estiverem ativas com WhatsApp conectado, as conversas aparecerão automaticamente. Nenhuma alteração necessária por enquanto.

---

### 3. Campo "Área" no cadastro de cliente → Segmentos de mercado

Atualmente o campo "Área" no formulário de cliente puxa de `settings.areas_ativas`, que são áreas internas da empresa (Desenvolvimento, Marketing, etc.). O usuário quer que esse campo represente **segmentos de mercado** do cliente.

**Solução**: Criar uma nova configuração `segmentos` na aba de Configurações (ou renomear "Áreas" para "Segmentos") com valores como Varejo, Atacado, Material de Construção, etc. Ajustar o `ClientForm` para usar essa nova configuração.

**Alternativa mais simples**: Manter a mesma estrutura de `AreasSettings`, mas renomear o conceito para "Segmentos" e atualizar o placeholder/label no `ClientForm`. Vou adicionar segmentos pré-definidos sugeridos.

**Arquivos editados**:
- `src/components/configuracoes/AreasSettings.tsx` — Renomear para "Segmentos de Mercado", atualizar placeholder
- `src/components/clientes/ClientForm.tsx` — Ajustar para ler da chave `areas` (corrigir a inconsistência com `areas_ativas`), renomear label para "Segmento"
- `src/pages/Configuracoes.tsx` — Atualizar label da aba para "Segmentos"
- Outros arquivos que usam `areas_ativas` precisarão ser ajustados para consistência

---

### 4. Automações: vincular somente a clientes cadastrados

Atualmente o `ClientAutomationManager` lista **companies** (empresas/tenants) para atribuir workflows. O correto é listar **clients** (clientes cadastrados na tabela `clients`).

**Mudanças**:
- Trocar a query de `companies` para `clients` no dialog de atribuição
- Salvar o `client_id` em vez de `company_id` (ou usar `company_id` do cliente selecionado)
- Na listagem, mostrar o nome do cliente em vez da empresa
- Ao processar IA, buscar todos os dados do cliente (nome, email, telefone, área, plano) e incluir no contexto do prompt

**Arquivos editados**:
- `src/components/automacoes/ClientAutomationManager.tsx` — Query de `clients` em vez de `companies`, ajustar atribuição
- `supabase/functions/ai-assistant/index.ts` — Quando tipo for `workflow`, buscar dados do cliente atribuído e injetar no contexto da IA

---

### Resumo de arquivos

| Arquivo | Mudança |
|---------|---------|
| `GeralSettings.tsx` | Adicionar GPT-5, GPT-5 Mini, GPT-5 Nano |
| `AreasSettings.tsx` | Renomear para Segmentos, ajustar placeholder |
| `Configuracoes.tsx` | Renomear aba "Áreas" → "Segmentos" |
| `ClientForm.tsx` | Corrigir chave settings, renomear label |
| `ClientAutomationManager.tsx` | Usar tabela `clients` em vez de `companies` |
| `ai-assistant/index.ts` | Injetar dados do cliente no contexto do workflow |

