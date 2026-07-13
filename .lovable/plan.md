# Redesign Alcansys — Amber Noir

## Direção fechada
- **Paleta Amber Noir**: `#08080A` (bg), `#1C1917` (surface), `#F59E0B` (âmbar/accent secundário), `#FF7A29` (laranja marca/primary), `#F4E6D2` (cream foreground).
- **Tipografia**: DM Serif Display (headings) + Fira Sans (body/UI).
- **Layout LP**: Split-screen editorial.
- **Escopo**: LP pública + painéis admin/vendedor + portal cliente.

## Fase 1 — Fundação de design tokens (base de tudo)
Reescrever `src/index.css` e `tailwind.config.ts`:
- Tokens HSL semânticos: `--background`, `--foreground`, `--primary` (laranja), `--accent` (âmbar), `--surface`, `--surface-elevated`, `--border`, `--muted`.
- Gradientes: `--gradient-ember` (laranja→âmbar), `--gradient-noir` (preto→grafite).
- Shadows quentes: `--shadow-ember` (glow laranja), `--shadow-noir`.
- Dark mode = default. Light mode = cream sobre off-white com laranja preservado.
- Registrar fontes DM Serif Display + Fira Sans via `@import` no `index.css` e mapear em `tailwind.config.ts` (`font-display`, `font-sans`).
- Remover qualquer resquício azul dos tokens atuais.

## Fase 2 — Landing Page (redesign completo)
Reconstruir `src/pages/Index.tsx` (ou LP equivalente) com estrutura split-screen editorial:
1. **Hero split** — Esquerda: título serif enorme + subtítulo + CTAs. Direita: mockup/visual com glow âmbar (substitui robô Spline atual, que dá "cara de IA").
2. **Prova social** — logos em faixa noir sutil.
3. **Features split alternado** — 3-4 blocos zigzag, cada um com número serif gigante + texto Fira Sans.
4. **Como funciona** — timeline vertical com marcadores âmbar.
5. **Pricing** — cards noir, um destacado com borda ember.
6. **FAQ + CTA final** — fundo gradient noir com CTA laranja sólido.
7. **Footer** — minimalista, tipografia editorial.

Remover: Spotlight glassmorphism azul, Spline robô, qualquer gradient roxo/azul.
Preservar: CMS `landing_config` (só troca a apresentação).

## Fase 3 — Painéis (admin + vendedor)
Sem mudar lógica de negócio. Apenas presentation:
- `AppSidebar`/`DashboardLayout`: fundo `--surface`, accent laranja no item ativo, tipografia Fira Sans.
- Cards (`Card`, `StatCard`): borda sutil `--border`, hover com `--shadow-ember` leve.
- Botões primários: laranja sólido. Secundários: outline cream.
- Headings de página: DM Serif Display.
- Tabelas: linhas com hover âmbar transparente.
- Charts (Recharts): paleta ember (laranja/âmbar/cream/grafite) em vez de azul.

## Fase 4 — Portal cliente
- `PortalLayout` e `PortalSidebar`: mesma paleta noir, headings serif.
- Cards de projeto, faturas, KPIs: consistentes com painel admin mas com densidade menor (portal é read-only).
- Login/onboarding do portal: tela split-screen (visual esquerda + form direita) espelhando a LP.

## Detalhes técnicos
- **Ordem de execução**: tokens → LP → shared components (Button/Card/Sidebar) → páginas admin → portal.
- **Sem regressão funcional**: nenhum handler, rota, query ou RLS é tocado.
- **Componentes shadcn**: reestilizados via variantes/tokens, não reescritos.
- **Fontes**: `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Fira+Sans:wght@300;400;500;600;700&display=swap')` no topo do `index.css`.
- **Verificação**: após cada fase, screenshot via Playwright de rotas-chave (`/`, `/dashboard`, `/portal`) para validar que nada quebrou visualmente.

## Entrega
Uma fase por turno para conseguirmos revisar. Começo pela **Fase 1 + Fase 2** (tokens + LP) — é onde o impacto visual é maior e onde a "cara de IA" mora. Painéis e portal vêm em seguida.
