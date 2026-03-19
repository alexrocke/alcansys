

## Plan: Campo Fixo/Variável em Transações + Preview de Custos e Produtos em Projetos

### Resumo

Duas mudanças principais:
1. **Financeiro**: Adicionar campo "Natureza" (fixo/variável) nas transações
2. **Projetos**: Adicionar preview financeiro (custos acumulados) e conceito de "Produto" — quando projeto fica concluído, pode ser convertido em produto

---

### Parte 1: Campo Fixo/Variável nas Transações

**Migration**: Adicionar coluna `natureza` (tipo enum `finance_nature`: `fixo`, `variavel`) à tabela `finances`, default `variavel`.

**FinanceForm.tsx**: Adicionar Select "Natureza" com opções "Fixo" e "Variável" ao lado do campo Tipo.

**FinanceList.tsx**: Mostrar badge "Fixo" ou "Variável" na listagem.

**Financeiro.tsx**: Adicionar filtro por natureza (fixo/variável/todos).

---

### Parte 2: Preview Financeiro nos Projetos

**ProjectList.tsx**: Adicionar coluna "Custo Real" que soma todas as transações (`finances`) vinculadas ao `project_id`. Mostrar comparação orçamento vs custo real com cor (verde se abaixo, vermelho se acima).

**Projetos.tsx**: Na query de projetos, fazer join com `finances` para calcular o total de despesas por projeto.

---

### Parte 3: Produtos (Projetos Concluídos)

**Migration**: Criar tabela `products`:
- `id`, `nome`, `descricao`, `preco`, `project_id` (FK projects, nullable), `company_id`, `categoria`, `ativo`, `created_at`, `updated_at`
- RLS: admin pode gerenciar, authenticated pode visualizar ativos

**ProjectList.tsx**: Quando projeto tem status `concluido`, mostrar botão "Converter em Produto" no dropdown. Abre dialog para definir nome, preço e descrição do produto.

**Nova aba/seção em Projetos.tsx**: Adicionar tab "Produtos" mostrando lista de produtos criados a partir de projetos concluídos. Cards com nome, preço, projeto de origem, status ativo/inativo.

---

### Arquivos

**Migration SQL**: 
- Enum `finance_nature` + coluna `natureza` em `finances`
- Tabela `products` + RLS

**Editar**:
- `FinanceForm.tsx` — campo natureza
- `FinanceList.tsx` — badge natureza
- `Financeiro.tsx` — filtro natureza
- `ProjectList.tsx` — preview custo real + botão converter produto
- `Projetos.tsx` — tab produtos + query custos

**Criar**:
- `src/components/projetos/ProductList.tsx` — listagem de produtos
- `src/components/projetos/ConvertToProductForm.tsx` — form de conversão

