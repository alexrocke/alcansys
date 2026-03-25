

## Plano: Notificacoes Sonoras/Visuais + Conversas no Portal do Cliente

### Duas funcionalidades

**1. Notificacoes sonoras e visuais para novas conversas**
- Quando uma nova conversa chega (INSERT na tabela `conversations`), os atendentes online recebem:
  - Notificacao visual: toast/badge piscando na aba de Conversas
  - Notificacao sonora: som de alerta (audio HTML5)
- Implementado via realtime subscription que ja existe em `Conversas.tsx`, adicionando som + toast ao detectar nova conversa

**2. Pagina de Conversas no Portal do Cliente**
- Adicionar rota `/portal/conversas` com interface de chat similar ao painel interno
- Reutilizar os componentes `ConversationList` e `ChatArea` ja existentes
- Incluir o `SupervisaoPanel` para o cliente ver atendentes online
- Incluir controle de concorrencia (lock) para multiplos atendentes do cliente
- Incluir `useAgentPresence` para registrar presenca dos atendentes do portal
- Adicionar link "Conversas" no `PortalSidebar`

### Detalhes tecnicos

**Notificacao sonora (novo hook `useConversationNotifier`):**
- Subscribe a INSERT em `conversations` filtrado por `company_id`
- Ao receber nova conversa, toca som via `new Audio('/notification.mp3').play()`
- Mostra toast com nome do contato e botao para abrir conversa
- Usar um arquivo de som embutido (base64 data URI ou gerar via Web Audio API - um beep simples)
- Hook usado em `Conversas.tsx` (painel interno) e `PortalConversas.tsx` (portal)

**Portal do Cliente - Conversas:**
- Criar `src/pages/portal/PortalConversas.tsx` - wrapper que usa os mesmos componentes
  - Filtra conversas pelo `company_id` do cliente (ja funciona assim)
  - Inclui `SupervisaoPanel` para ver atendentes
  - Inclui lock de concorrencia (mesmo codigo do `Conversas.tsx`)
  - Inclui `useAgentPresence` para heartbeat
- Adicionar rota `/portal/conversas` em `App.tsx` (tanto no `PortalLayout` quanto no `InternalLayout`)
- Adicionar item "Conversas" com icone `MessageCircle` no `PortalSidebar`

**Arquivos afetados:**
- **Novo**: `src/hooks/useConversationNotifier.tsx` (som + toast para novas conversas)
- **Novo**: `src/pages/portal/PortalConversas.tsx` (pagina de conversas do portal)
- **Editado**: `src/pages/Conversas.tsx` (adicionar hook de notificacao)
- **Editado**: `src/components/portal/PortalSidebar.tsx` (adicionar link Conversas)
- **Editado**: `src/App.tsx` (adicionar rota `/portal/conversas`)

