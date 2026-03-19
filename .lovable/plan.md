

## Plan: Página Dedicada de Tarefas com Controle de Acesso

### Resumo

Criar uma página `/tarefas` que lista todas as tarefas (`project_tasks`) com visibilidade baseada em role:
- **Admin/Gestor**: veem todas as tarefas da empresa
- **Outros usuários**: veem apenas tarefas atribuídas a eles (`responsavel_id = auth.uid()`)

### Parte 1: Página de Tarefas

**Criar `src/pages/Tarefas.tsx`**:
- Query `project_tasks` com join em `projects` (nome do projeto) e `profiles` (nome do responsável)
- Se `userRole` é `admin` ou `gestor`: busca todas as tarefas da empresa (filtro por `company_id`)
- Caso contrário: filtra por `responsavel_id = user.id`
- Filtros: status (pendente/em andamento/concluída), prioridade, projeto
- Cada tarefa mostra: título, projeto vinculado, responsável, prioridade, prazo, status
- Click abre dialog para editar (reutiliza lógica do TaskForm existente)
- Botão "Nova Tarefa" com seleção de projeto

### Parte 2: Roteamento e Sidebar

**Editar `src/App.tsx`**: Adicionar rota `/tarefas` no `InternalLayout`.

**Editar `src/components/app-sidebar.tsx`**: Adicionar item "Tarefas" (ícone `ListChecks`) visível para todas as roles, posicionado após "Projetos".

### Arquivos

- **Criar**: `src/pages/Tarefas.tsx`
- **Editar**: `src/App.tsx` (rota), `src/components/app-sidebar.tsx` (menu item)

