# Melhorias de funcionalidade e usabilidade

Levantamento feito lendo o código atual. Abaixo o que falta, em ordem de impacto. Marque o que quer que eu faça (ou aprove tudo e eu executo por fases).

## Fase 1 — Usabilidade imediata (maior ganho, menor risco)

1. **Busca global (Cmd/Ctrl + K)**
   Um comando único para buscar clientes, projetos, leads, tarefas e navegar entre páginas. Hoje só existe busca isolada dentro de cada tela.

2. **Skeletons no lugar de "Carregando..."**
   14 telas mostram texto puro enquanto carregam. Trocar por skeletons dá sensação de app rápido e evita "pulos" de layout.

3. **Diálogos de confirmação decentes**
   Existem ~10 lugares usando `confirm()` nativo do navegador (feio, fora da identidade, bloqueia a aba). Trocar por AlertDialog padronizado.

4. **Breadcrumbs + títulos de página**
   Em telas de detalhe (projeto, cliente) não há caminho de volta claro nem indicação de onde você está.

5. **Estados vazios com ação**
   Padronizar: ícone + frase + botão "Criar primeiro X" em todas as listas.

## Fase 2 — Funcionalidade que falta

6. **Paginação e ordenação nas listas**
   Financeiro carrega 5000 linhas de uma vez; atividades limita em 200 sem "carregar mais". Listas grandes vão travar. Adicionar paginação por servidor + ordenar por coluna.

7. **Filtros salvos e persistência de estado**
   Filtros de período/status se perdem ao navegar. Guardar na URL (`?status=&periodo=`) para poder compartilhar link e voltar sem reconfigurar.

8. **Exportação padronizada (CSV/PDF)**
   Hoje só finanças e relatório de projeto exportam. Estender para clientes, leads, tarefas e comissões.

9. **Ações em massa**
   Selecionar várias linhas para mudar status, atribuir responsável ou excluir — hoje tudo é um a um.

10. **Central de tarefas com visão de calendário/kanban por responsável**
    Tarefas hoje é lista; falta visão por semana e por pessoa.

## Fase 3 — Robustez e performance

11. **Error Boundary global + tela de erro amigável**
    Hoje um erro de render deixa a tela branca (já aconteceu com o contexto de auth).

12. **Code splitting por rota (`React.lazy`)**
    Tudo está num bundle só; o portal do cliente baixa o painel admin inteiro. Divide o carregamento inicial.

13. **Feedback de mutação consistente**
    Botões com estado de "salvando", bloqueio de duplo clique e toast único de sucesso/erro em todos os formulários.

14. **Acessibilidade e mobile**
    Revisar foco de teclado, labels em botões só-ícone e tabelas que estouram no celular.

## Fase 4 — Diferenciais de produto

15. **Notificações com página dedicada e "marcar todas como lidas"**
16. **Onboarding do painel** (checklist de primeiros passos por empresa)
17. **Log de auditoria por registro** (quem alterou o quê dentro de projeto/cliente)
18. **Métricas de tempo** (tempo médio de resposta em conversas, ciclo de venda de leads)

## Notas técnicas

- Busca global: componente `Command` do shadcn já disponível, com queries paralelas limitadas a 5 resultados por entidade.
- Paginação: `range()` do Supabase + `keepPreviousData` no React Query.
- Persistência de filtros: `useSearchParams` do react-router, sem novo estado global.
- Code splitting: `React.lazy` nos elementos de rota em `App.tsx`, com `Suspense` mostrando o mesmo skeleton do layout.
- Error boundary: componente de classe envolvendo `AppRoutes`, com botão de recarregar.
- Nada disso exige mudança de banco, exceto (17) que precisaria de tabela de auditoria.
