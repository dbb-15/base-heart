# 01 — Arquitetura

Fonte: código em `apps/api`, `apps/web`, `packages/*`. Gerado a partir do repositório; não inventar.

## Visão geral

Monorepo npm workspaces + Turbo (`alias-crm`):

```
CRM/
├── apps/
│   ├── api/          # Fastify API (porta 3001)
│   └── web/          # React + Vite + Tailwind (hash routing)
├── packages/
│   ├── database/     # Prisma schema + migrations + seeds
│   ├── types/        # Tipos compartilhados
│   └── utils/        # Utilitários compartilhados
└── ai-context/       # Documentação viva para IAs
```

Scripts raiz (`package.json`): `dev`, `build`, `typecheck`, `prisma:generate`, `prisma:migrate`, `prisma:studio`.

## Stack

| Camada | Tecnologia |
|--------|------------|
| API | Fastify, `@fastify/jwt`, Zod, Prisma Client |
| Web | React, Vite, Tailwind CSS v4 (`@import "tailwindcss"`), hash router em `App.tsx` |
| DB | PostgreSQL via Prisma (`packages/database/schema.prisma`) |
| Auth | JWT access (15m) + refresh cookie HttpOnly (`alias_crm_refresh_token`, 7d) |

## Padrão de camadas da API

**Não há** pastas clássicas Controllers / Repositories / DTOs.

Padrão real por módulo em `apps/api/src/modules/<nome>/`:

```
*.routes.ts    → registra rotas Fastify + preHandler authenticate
*.schema.ts    → Zod (body/params/query) = “DTO”
*.service.ts   → regras de negócio + Prisma
```

Fluxo: **Route → Zod parse → Service → Prisma**.

Erros de domínio: classes `*Error` com `statusCode` (ex.: `OportunidadesError`).

## Bootstrap da API

`apps/api/src/app.ts` — `buildApp()` registra nesta ordem:

1. `auth` (plugin JWT + `app.authenticate`)
2. `authRoutes`
3. `usuariosRoutes`
4. `configuracoesRoutes`
5. `contasRoutes`
6. `contatosRoutes`
7. `gruposRoutes`
8. `registradorasRoutes`
9. `oportunidadesRoutes`
10. `notificacoesRoutes`
11. `notasRoutes`
12. `atendimentosRoutes`
13. `demandasRoutes`
14. `atividadesRoutes`
15. `eventosRoutes`
16. `dashboardRoutes`
17. `relatoriosRoutes`
18. `GET /health` → `{ status: 'ok' }` (público)

Porta: `process.env.PORT ?? 3001`, host `0.0.0.0`.

## Estrutura `apps/api/src`

```
lib/           # auth, motivos-perda, helpers
modules/       # um diretório por domínio
scripts/       # seeds/backfills
types/         # tipos internos da API
```

Módulos existentes: `auth`, `usuarios`, `configuracoes`, `contas`, `contatos`, `grupos`, `registradoras`, `oportunidades`, `notificacoes`, `notas`, `atendimentos`, `demandas`, `atividades`, `eventos`, `dashboard`, `relatorios`, `operacoes` (schemas auxiliares de registro, sem rotas próprias listadas em `app.ts`).

## Estrutura `apps/web/src`

```
App.tsx, main.tsx, styles.css
types.ts, labels.ts, domain.ts, format.ts
components/    # UI reutilizável
domain/        # regras de UI (funil filtros, jornadas, demanda…)
hooks/
pages/         # telas e modais
services/      # clientes HTTP (/api)
store/         # sessão
```

Proxy front: base URL `'/api'` (`services/api.ts`).

## Banco (Prisma)

- Provider: PostgreSQL
- Soft delete: campos `deletedAt` / `deletedBy` em Conta, Contato, GrupoFinanceiro, Registradora, Oportunidade, Nota, Atividade (listagens filtram `deletedAt: null`)
- Usuário: desativação via `ativo: false` (não soft-delete)
- IDs: `cuid()` em modelos principais
- Timestamps: `createdAt` / `updatedAt`

## Relacionamentos centrais (resumo)

```
User ──owns──► Conta ──► Contato
                 │
                 ├──► Oportunidade ──► Atividade / Workflow / Nota
                 │         │
                 │         └──► Oportunidade (origem/derivada; Operações pós-fechamento)
                 ├──► ProdutoContratado
                 ├──► Atendimento / Demanda
GrupoFinanceiro ◄── Conta (membros + titular opcional)
Registradora (catálogo admin; IDs em dadosQualificacao na UI)
TemplateWorkflow + TemplateWorkflowItem ──► Workflow + Atividade
```

Detalhes: ver `07-domain-glossary.md`.

## Convenções do projeto

1. Validação de entrada na rota com Zod (`*.schema.ts`).
2. Escopo COMERCIAL por `ownerId` nos services (contas, oportunidades, atividades, etc.).
3. Estágios de funil são **strings** (não enum Prisma), validados em `oportunidades.service.ts` (`estagiosPorPipeline`).
4. Avanço de funil predominante via `POST /oportunidades/:id/desfecho` (não drag livre sem regras).
5. Ações de atividade: enum Prisma `AcaoAtividade` + resolução por título no front (`resolveAcaoAtividade` em `domain.ts`).
6. Idioma de UI: português; labels em `labels.ts`.
7. Web usa hash routing (`#/funil`, `#/oportunidades/:id`, …).
