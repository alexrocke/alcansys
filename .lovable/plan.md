

## Plano: Landing Page Alcansys na rota `/`

### Mudança de roteamento

A landing page será a rota raiz `/`. O dashboard interno (atual `Index.tsx`) será movido para `/dashboard`. Usuários autenticados serão redirecionados automaticamente para `/dashboard`.

```text
Fluxo:
  Visitante → /          → Landing Page (pública)
  Visitante → /auth      → Login
  Autenticado → /        → Redireciona para /dashboard
  Autenticado → /dashboard → Dashboard interno
```

### Estrutura

Mesma do plano anterior (Hero com Spline 3D, Cards interativos, Footer), mas agora em `/`.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Landing.tsx` | **Novo** — Landing page com robô 3D Spline + cards animados |
| `src/components/landing/SplineRobot.tsx` | **Novo** — Wrapper do Spline 3D |
| `src/components/landing/ServiceCards.tsx` | **Novo** — Cards com hover tilt/scale |
| `src/components/landing/LandingHeader.tsx` | **Novo** — Header com logo + botão "Entrar" → `/auth` |
| `src/components/landing/LandingFooter.tsx` | **Novo** — Footer |
| `src/App.tsx` | Rota `/` = Landing (pública, fora do ProtectedRoute). Dashboard move para `/dashboard`. Redirecionar `/` → `/dashboard` quando autenticado. |
| `src/components/app-sidebar.tsx` | Atualizar link "Dashboard" para `/dashboard` |
| `src/pages/Index.tsx` | Sem mudança (continua sendo o dashboard, só muda a rota) |

### Dependência nova
- `@splinetool/react-spline`

