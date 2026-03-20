

## Plano: Controles de tamanho dos Display Cards nas Configurações

### O que muda

Adicionar controles de **padding vertical**, **padding horizontal** e **espaçamento entre cards** (translate offsets) no painel de edição da seção "Serviços" em Configurações > Landing Page. Os valores são salvos no JSONB `config` da seção `services` e aplicados dinamicamente nos cards.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/configuracoes/LandingSettings.tsx` | Adicionar sliders/inputs numéricos no `ServicesEditor` para: `card_padding_x`, `card_padding_y`, `card_spacing_x`, `card_spacing_y` |
| `src/components/landing/ServiceCards.tsx` | Ler os valores de spacing/padding do config e passar para o `DisplayCards` como props |
| `src/components/ui/display-cards.tsx` | Aceitar props `paddingX`, `paddingY`, `spacingX`, `spacingY` e aplicar como inline styles em vez de classes fixas |

### Detalhes

**Novos campos no config JSONB de `services`:**
```json
{
  "card_padding_x": 24,
  "card_padding_y": 24,
  "card_spacing_x": 80,
  "card_spacing_y": 48
}
```

**No painel de configurações:** 4 sliders com label e valor em px, agrupados numa seção "Tamanho e Espaçamento dos Cards".

**No DisplayCards:** Cada card recebe `style={{ padding: \`${paddingY}px ${paddingX}px\` }}` e os translate offsets são calculados com `transform: translate(${i * spacingX}px, ${i * spacingY}px)` em vez de classes Tailwind fixas.

Valores padrão: padding 24px, spacing X=80px, Y=48px (equivalente ao atual `translate-x-20 translate-y-12` por step).

