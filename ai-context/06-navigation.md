# 06 — Navigation

Fonte: `apps/web/src/components/Layout.tsx`, `apps/web/src/App.tsx`.

## Sidebar (`navItems`)

| Label | Path | Roles |
|-------|------|-------|
| Dashboard | `/` | todos autenticados |
| Base Mestre | `/base` | todos |
| Grupos | `/grupos` | todos |
| Funis comercial | `/funil` | todos |
| Operações | `/operacoes` | todos |
| Atividades funil | `/atividades` | todos |
| Relatórios | `/relatorios` | ADMIN, SUPERINTENDENTE |
| Configurações funis | `/configuracoes` | ADMIN, SUPERINTENDENTE |
| Administração | `/admin` | ADMIN |

Ativo: path exato `/` ou prefixo `path/` para demais.

## Rotas hash (`App.tsx`)

| Hash | Componente | Props especiais |
|------|------------|-----------------|
| `#/` | DashboardPage | |
| `#/base` | BaseMestrePage | |
| `#/grupos` | GruposPage | |
| `#/funil` | FunilPage | |
| `#/funil/aquisicao` | FunilPage | `initialPipeline=AQUISICAO` |
| `#/funil/expansao` | FunilPage | `initialPipeline=EXPANSAO` |
| `#/operacoes` | FunilPage | `fixedPipeline=OPERACOES` |
| `#/atividades` | AtividadesPage | |
| `#/relatorios` | RelatoriosPage | |
| `#/configuracoes` | ConfiguracoesPage | |
| `#/admin` | AdminUsuariosPage | |
| `#/admin/registradoras` | AdminRegistradorasPage | |
| `#/contas/:id` | ContaDetalhePage | |
| `#/contas/:id/eregistro` | ContaDetalhePage | `initialTab=eregistro` |
| `#/oportunidades/:id` | OportunidadeDetalhePage | |
| `#/oportunidades/:id/eregistro` | OportunidadeDetalhePage | `initialTab=eregistro` |

## Header global

- NotificacoesBell (navegação para destino da notificação)
- Avatar + nome + `roleLabels[role]`
- Botão Sair → logout

## Navegação implícita (fora da sidebar)

- Cards do funil → detalhe oportunidade
- Base mestre → detalhe conta
- Admin: tabs Usuários | Registradoras (`AdminTabs`) — registradoras **não** têm item próprio na sidebar
- Bell → oportunidade/atividade conforme payload da notificação

## Telas por persona (derivado do código)

| Persona | Telas principais |
|---------|------------------|
| COMERCIAL | Dashboard, Base, Grupos, Funis, Operações, Atividades, Conta, Oportunidade |
| SUPERINTENDENTE | + Relatórios, Configurações; visão ampla de owners |
| ADMIN | + Administração (usuários, registradoras) |
