

## Plano: Ajustar visual da Landing + Painel de edição da Landing Page

### 1. Ajustes visuais imediatos

**Hero — Remover fundo preto do robô**
- Remover o `Card` wrapper com `bg-black/[0.96]` do hero
- Colocar o Spline diretamente no layout, sem card escuro, fazendo o robô "flutuar" sobre o fundo da página (`hsl(222,47%,11%)`)
- Manter o Spotlight como efeito sutil sobre o fundo da seção

**Display Cards — Aumentar tamanho**
- Aumentar o `p-4` dos cards para `p-6`, texto de `text-sm` para `text-base`
- Aumentar os `translate-x/y` entre cards para espalhar mais
- Reduzir o `min-h-[400px]` do container e `max-w-3xl` para ocupar mais espaço

### 2. Painel de edição da Landing Page (Configurações)

Criar uma nova aba "Landing Page" na página de Configurações (`/configuracoes`) que permite editar todo o conteúdo da landing page via banco de dados.

**Tabela no Supabase: `landing_config`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `company_id` | uuid | FK para companies |
| `section` | text | hero, services, stats, cta, footer |
| `config` | jsonb | Conteúdo da seção (título, subtítulo, cards, etc.) |
| `order` | int | Ordem de exibição |
| `visible` | boolean | Se a seção aparece |

**Funcionalidades do painel:**
- Editar textos do Hero (título, subtítulo, URL do Spline)
- CRUD de Service Cards (adicionar, editar, excluir cards de serviço)
- Editar stats (números/resultados)
- Editar CTA final (título, subtítulo, texto do botão)
- Editar footer (email, WhatsApp)
- Toggle de visibilidade por seção

**A Landing Page lê do banco:** Em vez de dados hardcoded, `Landing.tsx` busca `landing_config` e renderiza dinamicamente.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| Migration (nova) | Criar tabela `landing_config` com seed dos dados atuais |
| `src/pages/Landing.tsx` | Remover Card do hero, ler dados de `landing_config` |
| `src/components/landing/ServiceCards.tsx` | Ler cards do banco, aumentar tamanho |
| `src/components/ui/display-cards.tsx` | Aumentar padding/fontes dos cards |
| `src/components/configuracoes/LandingSettings.tsx` | **Novo** — Painel CRUD para editar toda a landing |
| `src/pages/Configuracoes.tsx` | Adicionar aba "Landing Page" |
| `src/integrations/supabase/types.ts` | Tipos da nova tabela |

### Detalhes técnicos

- O `config` JSONB do hero terá: `{ title, subtitle, spline_url, cta_primary, cta_secondary }`
- O `config` JSONB de services terá: `{ cards: [{ icon, title, description, subtitle }] }`
- O `config` JSONB de stats terá: `{ items: [{ icon, value, label }] }`
- Ícones serão salvos como string (`"Zap"`, `"Users"`) e mapeados para componentes Lucide em runtime
- RLS: leitura pública (landing é pública), escrita apenas para autenticados com role admin

