

## Plano: Integrar componentes 21st.dev na Landing Page

### O que muda

Substituir os componentes atuais da landing pelos dois componentes do 21st.dev:

1. **Spline Scene (robô 3D)** — Usar a cena `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode` (do componente serafim/splite) dentro de um Card com efeito Spotlight. O hero passa a ter o layout do componente: texto gradiente à esquerda + robô 3D à direita, dentro de um card escuro com spotlight.

2. **Display Cards (cards empilhados)** — Substituir os TiltCards atuais por cards empilhados com efeito grayscale-to-color no hover, usando `[grid-area:stack]` + translate para criar o efeito de sobreposição. Cada card representa um serviço da Alcansys.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/ui/spotlight.tsx` | **Novo** — Componente Spotlight (efeito de luz que segue o mouse) |
| `src/components/ui/display-cards.tsx` | **Novo** — Componente DisplayCards com layout stacked + grayscale hover |
| `src/components/landing/SplineRobot.tsx` | Atualizar para usar a cena do 21st.dev (`kZDDjO5HuC9GJUM2`) dentro de Card + Spotlight |
| `src/components/landing/ServiceCards.tsx` | Substituir TiltCards pelo DisplayCards com os 4 serviços Alcansys |
| `src/pages/Landing.tsx` | Ajustar hero para usar o novo layout (Card com Spline + Spotlight) |

### Detalhes técnicos

- **Spotlight**: Componente que renderiza um div com gradiente radial posicionado via props, criando efeito de luz ambiente no card.
- **DisplayCards**: Grid CSS com `[grid-area:stack]` para empilhar cards. Cada card tem `translate-x/y` diferente, `grayscale-[100%]` por padrão, e remove grayscale + translada no hover. Usa pseudo-elemento `before` para overlay semitransparente.
- **Spline Scene**: Mesma lib `@splinetool/react-spline`, só muda a URL da cena para a do robô interativo do 21st.dev.
- Sem dependências novas (já tem `@splinetool/react-spline` e `lucide-react`).

