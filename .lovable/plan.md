

## Plano: Corrigir listagem de Clientes Ativos + Adicionar email de portal no cadastro de cliente

### Problemas identificados

1. **Listagem vazia em "Clientes Ativos"**: A query usa `clients:company_id(...)` para fazer join, mas `company_id` é FK para a tabela `companies`, não `clients`. Resultado: mostra o nome da *empresa* (Alcansys), não do *cliente*. E como o client_id real está no campo `config` (JSONB), a listagem não consegue mostrar os dados corretos do cliente.

2. **Dois "Alcansys" no dropdown**: São dois registros distintos na tabela `clients` — "Alcansys" e "Alcansys Sistemas", ambos com segmento "Desenvolvimento". Isso é dado, não bug. Se quiser remover o duplicado, basta deletar um dos registros em Clientes.

3. **Email de acesso ao portal**: O usuário quer um campo separado `email_portal` no cadastro do cliente. Esse email será usado para dar acesso ao Portal do Cliente, onde ele verá apenas informações da empresa dele.

### Mudanças

**1. Corrigir `ClientAutomationManager.tsx` — listagem de clientes ativos**

- Mudar a query principal para não depender do join `clients:company_id` (que aponta para `companies`)
- Ler o nome do cliente do campo `config` (JSONB) onde `client_nome`, `client_email`, `client_area` já são salvos na atribuição
- Mostrar corretamente o nome do cliente na listagem

**2. Adicionar campo `email_portal` na tabela `clients`**

- Migration: `ALTER TABLE clients ADD COLUMN email_portal text;`
- Este email será o login do cliente no portal

**3. Atualizar `ClientForm.tsx`**

- Adicionar campo "Email do Portal" com descrição explicando que é o email de acesso ao portal
- Salvar no campo `email_portal`

**4. Vincular portal ao cliente via `email_portal`**

- No `useAuth` ou na lógica do portal, quando o usuário logado não tem `app_role`, buscar na tabela `clients` pelo `email_portal` = email do usuário logado
- Filtrar dados do portal (automações, faturas, sistemas) pelo `company_id` do cliente encontrado

### Arquivos editados

| Arquivo | Mudança |
|---------|---------|
| `ClientAutomationManager.tsx` | Ler nome do cliente do `config` JSONB em vez de join errado |
| `ClientForm.tsx` | Adicionar campo `email_portal` |
| Migration (nova) | `ALTER TABLE clients ADD COLUMN email_portal text` |
| `src/integrations/supabase/types.ts` | Atualizar tipos para incluir `email_portal` |

