# Corrigir loop de carregamento e volta para a LP após o login

## O que está acontecendo

Confirmei a causa no código:

1. `src/main.tsx` **registra** os workers de limpeza `/sw.js` e `/service-worker.js` em **todo carregamento** da página.
2. Esses dois arquivos (`public/sw.js` e `public/service-worker.js`), ao ativar, chamam `client.navigate(client.url)` — ou seja, **recarregam todas as abas abertas** — e depois se desregistram.
3. Como o `main.tsx` registra de novo no carregamento seguinte, o ciclo se repete: registra → ativa → recarrega → registra → ativa → recarrega. É exatamente o "página em carregamento em looping".
4. Esse recarregamento forçado também explica o "clico em entrar e volta pra LP": logo após o login o app navega para `/dashboard`, mas o worker recarrega a aba na URL que ele capturou (`/`), jogando o usuário de volta na landing.

Os dados de usuário estão corretos (perfis `ativo` com roles `admin`/`marketing`), então não é problema de conta nem de RLS.

## Correção

**1. `src/main.tsx` — parar de registrar workers**
- Remover o bloco que faz `navigator.serviceWorker.register("/sw.js")` e `("/service-worker.js")`.
- No lugar, apenas uma limpeza idempotente: percorrer `getRegistrations()` e chamar `unregister()` somente nos workers cujo `scriptURL` termina em `/sw.js` ou `/service-worker.js`, preservando workers de mensageria (Firebase/OneSignal).
- Sem `location.reload()` em nenhuma hipótese.

**2. `public/sw.js` e `public/service-worker.js` — remover o recarregamento**
- Manter o kill-switch (limpar apenas os caches Workbox do próprio escopo + `unregister()` no `finally`), que é o que evita HTML antigo em navegadores que ainda têm o worker instalado.
- Remover o `clients.matchAll` + `client.navigate(...)`, que é a fonte do loop. A limpeza vale a partir da próxima navegação natural do usuário.

**3. Verificação**
- Rodar o preview com Playwright: carregar `/`, medir se há recarregamentos repetidos, fazer login e confirmar que a rota final é `/dashboard` e permanece lá.
- Conferir o console em busca de erros novos.

## Detalhes técnicos

- Não há `vite-plugin-pwa` ativo hoje; os dois arquivos em `public/` são só workers de limpeza, então removê-los da rotina de registro não tira funcionalidade offline (não existe).
- Usuários que já têm o worker antigo instalado continuam sendo limpos: o navegador revalida o script do worker já registrado e roda o `activate` atualizado (agora sem navegação forçada).
- Nenhuma alteração em autenticação, rotas ou RLS é necessária.
