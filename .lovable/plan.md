# Limpeza dos resíduos da versão antiga

Verifiquei o código atual. O preview local já renderiza a versão nova ("Tecnologia que faz seu negócio crescer", tema âmbar/preto). A tela azul com o robô que aparece no seu print vem de build publicado/cache antigo, não do código atual. Mesmo assim, sobraram resíduos reais no repositório.

## O que encontrei

**1. Arquivos órfãos da LP antiga (não são usados por nada)**
- `src/components/landing/SplineRobot.tsx` — o robô 3D da versão antiga.
- `src/components/landing/ServiceCards.tsx` — componente que lê o CMS e não é importado em lugar nenhum.
- `src/hooks/useLandingConfig.tsx` — só é usado pelo ServiceCards órfão.
- `src/components/ui/display-cards.tsx` — componente sem nenhum uso.
- `src/assets/logo-alcansys.png` — logo da marca abandonada.

**2. Marca "Alcansys" ainda presente**
- `wrangler.toml`: nome do projeto `alcansys`.
- `README.md`: descrição e link `alcansys.lovable.app`.
- `supabase/functions/invite-member/index.ts`: e-mail de convite diz "Bem-vindo à Alcansys" (isso vai para clientes reais).

**3. CMS da landing desconectado**
- `src/components/configuracoes/LandingSettings.tsx` ainda edita a tabela `landing_config` (inclusive campos do Spline), mas a `Landing.tsx` hoje usa conteúdo fixo. Ou seja: quem editar por lá não vê efeito nenhum.

**4. Service workers de limpeza ainda no ar**
- `public/sw.js` e `public/service-worker.js` existem apenas para apagar caches antigos, e `src/main.tsx` desregistra workers a cada carregamento. Isso já cumpriu o papel; manter indefinidamente é dívida.

## O que proponho fazer

**Fase A — remoção segura (sem risco visual)**
1. Apagar os 5 arquivos órfãos listados acima.
2. Trocar "Alcansys" por "Scalefy" no `wrangler.toml`, `README.md` e no e-mail do `invite-member`.

**Fase B — CMS da landing**
3. Ajustar `LandingSettings.tsx`: remover os campos do robô 3D e sinalizar claramente quais seções ainda têm efeito. (Alternativa, se preferir: religar a `Landing.tsx` ao `landing_config` usando o conteúdo novo como padrão — diga qual caminho quer.)

**Fase C — cache**
4. Manter os kill-switch workers por mais um ciclo de publicação e então removê-los junto com o bloco de limpeza no `main.tsx`, deixando só uma versão sem service worker.

## Notas técnicas

- Nenhuma mudança de banco. A tabela `landing_config` permanece intacta.
- As classes `blue/indigo/purple` que aparecem em telas internas (status de tarefas, badges) são semânticas de status, não resíduo de tema — deixo como estão salvo pedido contrário.
- Após publicar, um refresh forçado ainda pode ser necessário uma única vez para derrubar o bundle antigo em cache no seu navegador.
