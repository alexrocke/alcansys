# ScalefySistemas

Crie um sistema corporativo completo chamado Alcansys em português, com o objetivo de gerenciar projetos, finanças, marketing, automações, clientes e equipe interna.

Tema visual: azul escuro (#1E3A8A) com azul secundário (#3B82F6), cantos arredondados 2xl e fonte Inter.

Autenticação: por e-mail e senha, com aprovação manual de usuários pelo administrador antes do acesso.

Perfis: Admin, Gestor, Colaborador, Financeiro e Marketing.

Layout: navegação lateral (sidebar).

Páginas e funcionalidades:

Dashboard: métricas de projetos ativos, receita mensal, custo operacional e ROI médio, além de gráficos de linha (receita x custo) e pizza (distribuição por área).

Projetos: CRUD completo com campos nome, cliente, área, status, gestor, orçamento e datas; relação com checklist, finanças e documentação.

Financeiro: gráficos e tabelas de receitas e despesas, distribuição de custos, exportação em PDF e meta mensal ajustável.

Marketing e Tráfego: controle de campanhas com campos de orçamento, ROI e status.

Automação: catálogo de automações (n8n, WhatsApp, e-mail) com custo, retorno e status.

Clientes: cadastro, plano, área, status e envio de relatórios automáticos.

Documentação: lista com upload, tipo, autor, data e tags.

Equipe: gerenciamento de colaboradores com status e nível de acesso.

Configurações: logotipo, tema, custos fixos, áreas ativas e meta mensal.

Triggers automáticos:

Ao cadastrar usuário → definir como pendente e notificar admin.

Ao vencer tarefa → criar alerta de atraso.

Ao expirar domínio (menos de 7 dias) → alerta crítico.

Ao custo exceder orçamento → alerta de risco financeiro.

Ao faturamento cair abaixo de 80% da meta → alerta de receita baixa.

Relatório mensal automático: gerar resumo financeiro com receitas, custos e ROI, enviar PDF para o admin por e-mail.

Relatórios automáticos:

Financeiro mensal (resumo, gráficos, tabelas de custos e receitas por área).

Configure todos os relacionamentos de dados via Supabase e ative criação automática de tabelas.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://alcansys.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/81650d91-a5e6-44f9-9237-1c461af89e18).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
