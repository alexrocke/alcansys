# Landing page: limpeza visual, projetos editáveis e páginas legais

## 1. Ajustes visuais imediatos (LP)

- Remover os textos sobrepostos à foto no hero (logo Scalefy no canto superior e a linha "Software · Automação · IA" no rodapé da imagem). A composição fica só foto + luz âmbar + barras de crescimento.
- Corrigir botões cujo texto some no hover: os botões `outline` ("Conhecer projetos reais", "Preciso de uma solução parecida") herdam um hover que troca a cor do texto para um tom quase igual ao fundo. Passam a usar cor de texto explícita em token (`text-foreground` → `hover:text-primary`) com borda âmbar no hover, mantendo contraste em todos os estados. Mesma revisão nos chips de produto e nos links do rodapé.

## 2. Seção "Projetos desenvolvidos" reorganizada

- Faixa de produtos vira uma linha compacta de logos (com fallback para o nome quando não houver logo).
- Cada projeto passa a ter: logo, nome, descrição, tags, imagem de preview do sistema, link opcional e ordem.
- Layout em grade de cards (2 colunas no desktop, 1 no mobile) com preview em destaque e logo no topo do card — mais organizado que os blocos alternados atuais e melhor no mobile.

## 3. Tudo editável pelo superadmin

- A landing volta a ler o conteúdo do banco (`landing_config`), com o texto atual como valor inicial — nada de conteúdo antigo reaparecendo, pois a seed grava exatamente a versão publicada hoje.
- Nova seção `projects` em `landing_config` com a lista de projetos (logo, preview, nome, descrição, tags, ordem, visível).
- Em Configurações → Landing: editor de Hero, Serviços, Processo, Diferenciais, Comparativo, Experiência, CTA e Rodapé, mais um editor de Projetos com arrastar para reordenar, adicionar/remover e upload de **logo** e **preview do sistema**.
- Upload via novo bucket público de Storage `landing-assets` (leitura pública; escrita apenas admin), com preview da imagem no formulário.
- Aviso atual de "conteúdo fixo" removido do painel.

## 4. Política de Privacidade e Termos de Uso

- Duas páginas públicas novas: `/politica-de-privacidade` e `/termos-de-uso`, com a mesma identidade Amber Noir (header e rodapé da LP, tipografia display, fundo escuro).
- Conteúdo base LGPD-oriented redigido para a Scalefy (dados coletados, finalidade, cookies, retenção, direitos do titular, contato) e Termos (escopo dos serviços, propriedade intelectual, responsabilidades, suporte, alterações).
- Texto também editável pelo superadmin (seções `privacy` e `terms` no `landing_config`), para você ajustar sem depender de código.
- Links do rodapé passam a apontar para as rotas reais.

## Detalhes técnicos

- Migração: upsert das seções `hero`, `services`, `projects`, `process`, `diferenciais`, `comparativo`, `experiencia`, `cta`, `footer`, `privacy`, `terms` em `landing_config` com o conteúdo atual; RLS já existente mantida (leitura pública, escrita admin).
- Bucket `landing-assets` criado como público com políticas de INSERT/UPDATE/DELETE restritas a admin.
- `src/pages/Landing.tsx` refatorado para consumir um hook `useLandingContent()` com fallback local (a LP nunca quebra se o banco estiver indisponível).
- Novas páginas em `src/pages/legal/` registradas em `App.tsx` como rotas públicas com lazy loading.
- `LandingSettings.tsx` ganha editores por seção + componente de upload reutilizável.

## Observação

O número de WhatsApp ainda é o placeholder `5500000000000` — ele também passa a ser editável no painel; me passe o número real quando quiser.
