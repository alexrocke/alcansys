# Landing page mais curta e focada em conversão

Hoje a página tem 8 blocos de conteúdo (hero, faixa de produtos, serviços, projetos, processo, diferenciais, comparativo, experiência, CTA) com espaçamento vertical de 96–128px cada. No mobile isso vira uma rolagem muito longa antes do primeiro ponto de decisão — e o único CTA forte depois do hero está lá no fim.

## O que muda

1. **Reduzir de 8 para 5 blocos**
   - Manter: Hero, Faixa de produtos, Projetos reais, Processo, CTA final.
   - Fundir "Diferenciais" + "Comparativo" em um único bloco enxuto ("Por que a Scalefy") com 4 itens curtos.
   - Fundir "Serviços" dentro do bloco de Projetos como uma linha de chips acima dos cases (o que fazemos), em vez de 4 cards de 280px.
   - "Experiência prática" vira uma faixa fina de 3 números logo abaixo do hero (prova social cedo, não no fim).

2. **Espaçamento responsivo mais apertado**
   - Seções: `py-14` no mobile / `py-24` no desktop (hoje 24/32).
   - Cards de projeto e processo com padding menor no mobile.

3. **CTA recorrente**
   - Botão de WhatsApp fixo (barra inferior) no mobile, aparecendo depois que o hero sai da tela.
   - Um CTA intermediário logo após a seção de Projetos, além do final.

4. **Projetos com "ver mais"**
   - Mostrar 2 cases por padrão no mobile e um botão "Ver todos os projetos" que expande o restante, em vez de rolagem infinita.

5. **Nada de conteúdo perdido**
   - Todo texto fundido continua editável no CMS (`landing_config`); as chaves das seções removidas passam a alimentar os blocos fundidos, sem apagar dados.

## Detalhes técnicos

- Edições concentradas em `src/pages/Landing.tsx` (composição das seções), `src/lib/landingContent.ts` (mapeamento das chaves fundidas nos defaults) e `src/components/configuracoes/LandingSettings.tsx` (refletir os blocos novos no editor).
- Novo componente pequeno `src/components/landing/MobileCtaBar.tsx` usando o mesmo `whatsapp` resolvido hoje na Landing (com fallback para `#contato`).
- Ordem final: Hero → Números (faixa) → Produtos → Projetos (+CTA) → Como funciona → Por que a Scalefy → CTA final → Footer.
- Sem mudanças de backend, tokens de cor ou tipografia — identidade Amber Noir intacta.
