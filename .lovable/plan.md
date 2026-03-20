

## Plano: Seletor de Modelo OpenAI em Configurações + Criador Visual de Workflow em Automações

### 1. Seletor de Modelo OpenAI nas Configurações Gerais

**O que muda**: Na aba "Geral" de Configurações, adicionar um campo para escolher o modelo OpenAI padrão do sistema. O modelo selecionado será salvo na tabela `settings` (chave `configuracoes_gerais`) e lido pela edge function `ai-assistant`.

**Modelos disponíveis** (OpenAI atualizados):
- `gpt-4o` — Modelo principal, multimodal, rápido
- `gpt-4o-mini` — Equilíbrio entre custo e qualidade (padrão atual)
- `gpt-4.1` — Último modelo, melhor raciocínio
- `gpt-4.1-mini` — Versão compacta do 4.1
- `gpt-4.1-nano` — Mais rápido e barato, alto volume
- `o4-mini` — Modelo de raciocínio avançado, compacto

**Arquivos editados**:
- `src/components/configuracoes/GeralSettings.tsx` — Adicionar Select com os modelos, salvar junto com as outras configs
- `supabase/functions/ai-assistant/index.ts` — Ler o modelo da tabela `settings` via Supabase client (com service role key) ao invés de usar hardcoded `gpt-4o-mini`

### 2. Criador Visual de Workflow em Automações

**O que muda**: Na aba "Templates" da página de Automações, o formulário existente (`WorkflowTemplateForm`) será expandido para incluir um **construtor de etapas do workflow** — permitindo montar visualmente a sequência de ações que a automação vai executar.

**Funcionalidade do criador**:
- Lista ordenável de **etapas** (steps) do workflow
- Cada etapa tem: tipo (ex: "Enviar mensagem", "Aguardar resposta", "Consultar IA", "Condicional", "Transferir atendente"), configuração específica, e delay opcional
- Botão para adicionar/remover etapas
- As etapas ficam salvas no campo `config_schema` (jsonb) do `workflow_templates`
- Tipos de etapas disponíveis:
  - **Mensagem**: Enviar texto fixo ou template
  - **IA**: Processar com prompt da IA
  - **Aguardar**: Esperar resposta do cliente (com timeout)
  - **Condição**: If/else baseado em palavra-chave ou intent
  - **Transferir**: Encaminhar para atendente humano
  - **Webhook**: Chamar URL externa
  - **Delay**: Aguardar X minutos/horas antes da próxima etapa

**Arquivos editados/criados**:
- `src/components/automacoes/WorkflowStepBuilder.tsx` — **Novo** componente com lista de etapas, drag-and-drop simplificado (botões subir/descer), formulário de cada tipo de etapa
- `src/components/automacoes/WorkflowTemplateForm.tsx` — Integrar o `WorkflowStepBuilder` para editar as etapas junto com o template

**Nenhuma migration necessária** — o campo `config_schema` (jsonb) já existe na tabela `workflow_templates` e será usado para armazenar as etapas.

### Resumo técnico

```text
Configurações (GeralSettings)
├── Campos existentes (nome, email, tel)
└── NOVO: Select "Modelo OpenAI" → salva em settings.configuracoes_gerais.modeloIA

Edge Function (ai-assistant)
└── Lê settings.configuracoes_gerais.modeloIA → usa como model na chamada OpenAI

Automações (WorkflowTemplateForm)
├── Formulário existente (nome, desc, categoria, prompt, features)
└── NOVO: WorkflowStepBuilder
    ├── Etapa 1: Mensagem de boas-vindas
    ├── Etapa 2: Aguardar resposta
    ├── Etapa 3: Processar com IA
    └── ... (salvo em config_schema jsonb)
```

