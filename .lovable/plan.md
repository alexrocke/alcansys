

## Plan: Popular Catálogo de Workflow Templates + Campo de Prompt

### O que será feito

Inserir **8 templates de workflow pré-configurados** diretamente na tabela `workflow_templates` via SQL insert, e adicionar um **campo "Prompt da IA"** ao formulário de template para que cada empresa possa ter seu prompt personalizado quando o workflow for atribuído.

### Templates a criar

| Nome | Categoria | Preço | Features |
|------|-----------|-------|----------|
| Agente SDR | vendas | R$ 297/mês | Qualificação automática de leads, Agendamento de reuniões, Follow-up inteligente, Integração com CRM |
| Atendimento com IA 24h | atendimento | R$ 397/mês | Respostas automáticas 24/7, Entendimento de linguagem natural, Handoff para humano, Histórico de conversas |
| Follow-up Automático | vendas | R$ 197/mês | Sequências de follow-up personalizadas, Gatilhos por tempo e evento, Templates de mensagem, Relatórios de conversão |
| Pesquisa de Satisfação (NPS) | suporte | R$ 147/mês | Envio automático pós-atendimento, Escala NPS configurável, Dashboard de resultados, Alertas de detratores |
| Recuperação de Carrinho | marketing | R$ 247/mês | Detecção de abandono, Sequência de recuperação, Cupons automáticos, Métricas de recuperação |
| Agendamento Inteligente | atendimento | R$ 197/mês | Calendário integrado, Confirmação automática, Lembretes antes do horário, Reagendamento por WhatsApp |
| Cobrança Automática | vendas | R$ 197/mês | Lembretes de vencimento, Envio de boleto/PIX, Escalonamento de cobrança, Relatório de inadimplência |
| Onboarding de Clientes | suporte | R$ 247/mês | Boas-vindas automatizadas, Tutoriais em sequência, Checklist de ativação, Acompanhamento de progresso |

### Mudanças no banco

1. **Adicionar coluna `prompt_template`** (text, nullable) à tabela `workflow_templates` — campo para o prompt padrão da IA do template
2. **Adicionar coluna `prompt`** (text, nullable) à tabela `client_automations` — prompt personalizado por empresa/cliente
3. **INSERT** dos 8 templates acima com features e prompt_template padrão

### Mudanças no código

**`WorkflowTemplateForm.tsx`**: Adicionar campo `Textarea` para "Prompt da IA" (`prompt_template`) no formulário de criação/edição de templates.

**`ClientAutomationManager.tsx`**: No dialog de atribuição, adicionar campo `Textarea` para "Prompt personalizado" (`prompt`). Ao atribuir, copiar o `prompt_template` do template como valor inicial do prompt do cliente, permitindo edição.

**`PortalAutomacoes.tsx`**: Mostrar indicação de que o prompt está configurado. O cliente não edita o prompt (apenas admin).

### Fluxo funcional

1. Admin vê os 8 templates no catálogo (já criados)
2. Admin atribui template a uma empresa, personaliza o prompt para aquele cliente
3. Cliente vê o workflow no portal, gera QR Code via UAZAP para conectar WhatsApp
4. Sistema usa o prompt configurado para a IA daquele cliente

### Arquivos
- **Migration SQL**: adicionar colunas + insert dos 8 templates
- **Editar**: `WorkflowTemplateForm.tsx`, `ClientAutomationManager.tsx`

