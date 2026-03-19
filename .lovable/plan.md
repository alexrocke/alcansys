

## Problema Identificado

As tarefas criadas dentro de um projeto (via `ProjectTasks.tsx`) **não incluem o `company_id`** no insert. A página Tarefas filtra por `company_id`, então essas tarefas nunca aparecem.

## Solução

### 1. Corrigir `ProjectTasks.tsx` — adicionar `company_id` ao criar/editar tarefas

O componente precisa receber o `companyId` como prop e incluí-lo no objeto `taskData` no insert e update.

**Editar `src/components/projetos/ProjectTasks.tsx`**:
- Adicionar `companyId` à interface de props
- Incluir `company_id: companyId` no `taskData` do `handleSubmit`

### 2. Passar `companyId` de onde `ProjectTasks` é usado

**Editar `src/pages/Projetos.tsx`** (ou onde ProjectTasks é renderizado): passar `companyId={currentCompany?.id}` como prop.

### 3. Corrigir tarefas existentes sem `company_id`

**Migration SQL**: Atualizar tarefas existentes que têm `company_id = NULL` preenchendo com o `company_id` do projeto vinculado:

```sql
UPDATE project_tasks 
SET company_id = projects.company_id 
FROM projects 
WHERE project_tasks.project_id = projects.id 
  AND project_tasks.company_id IS NULL;
```

### Arquivos

- **Editar**: `src/components/projetos/ProjectTasks.tsx` — adicionar `companyId` prop e incluir no insert/update
- **Editar**: arquivo que renderiza `<ProjectTasks>` — passar `companyId`
- **Migration**: corrigir registros existentes sem `company_id`

