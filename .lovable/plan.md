

## Plano: CRUD de Serviços no Painel Admin + Catálogo no Portal

### Problema atual
A tabela `services` existe mas está vazia — não há interface para o admin cadastrar serviços. O portal mostra "Nenhum serviço disponível" porque não há dados.

### O que será construído

**1. Página/aba de gestão de Serviços no painel admin (Configurações ou nova rota)**
- CRUD completo para a tabela `services`
- Campos: nome, descrição, categoria (select com opções: Automação, Desenvolvimento, Consultoria, Chatbot, Marketing, Outro), preço base, ativo (toggle)
- Lista com filtro por categoria e busca
- Botão "Novo Serviço" abre formulário (dialog ou drawer)
- Editar/excluir existentes

**2. Melhorar o catálogo no portal**
- Agrupar serviços por categoria com seções visuais
- Mostrar badge de categoria com cores distintas
- Manter botão "Solicitar Orçamento" existente

### Detalhes técnicos

**Arquivos novos:**
- `src/components/configuracoes/ServicosSettings.tsx` — CRUD de serviços (formulário + lista)

**Arquivos editados:**
- `src/pages/Configuracoes.tsx` — adicionar nova aba "Serviços" com ícone ShoppingBag
- `src/pages/portal/PortalServicos.tsx` — agrupar por categoria

### Fluxo
1. Admin acessa Configurações > Serviços
2. Cadastra serviços com nome, descrição, categoria, preço
3. Cliente no portal vê automaticamente os serviços ativos agrupados por categoria

