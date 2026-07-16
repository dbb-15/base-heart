# 03 — API Reference

Base: `apps/api` (porta 3001). Front consome via `/api`. Auth: header `Authorization: Bearer <accessToken>` salvo em `preHandler: app.authenticate`, exceto login/refresh/logout/health.

## Auth

| Method | Path | Auth | Body / notas | Resposta |
|--------|------|------|--------------|----------|
| POST | `/auth/login` | — | `{ email, password }` (≥8) | `{ accessToken, user: { id, nome, email, role } }` + cookie refresh |
| POST | `/auth/refresh` | cookie | — | `{ accessToken, user }` |
| POST | `/auth/logout` | — | — | 204, limpa cookie |

JWT access: `{ id, role }`, 15m. Refresh: 7d, HttpOnly `alias_crm_refresh_token`.

## Health

| GET | `/health` | `{ status: 'ok' }` |

## Erros

| Caso | Status | Body |
|------|--------|------|
| Zod | 400 | `{ error: 'Invalid request', details: <flatten> }` |
| Domínio | `statusCode` | `{ error: string, details?: string[] }` |
| JWT | 401 | `{ error: 'Unauthorized' }` |

## Usuários

| Method | Path | Role | Body chave |
|--------|------|------|------------|
| GET | `/usuarios/select` | autenticado | — |
| GET | `/usuarios` | ADMIN | — |
| GET | `/usuarios/:id` | ADMIN | — |
| POST | `/usuarios` | ADMIN | `nome`, `email`, `password`, `role?`, `ativo?` |
| PUT | `/usuarios/:id` | ADMIN | parciais |
| PATCH | `/usuarios/:id/desativar` | ADMIN | — |

Roles: `COMERCIAL` \| `SUPERINTENDENTE` \| `ADMIN`.

## Configurações

| Method | Path | Role |
|--------|------|------|
| GET | `/configuracoes/cadencia` | autenticado |
| PUT | `/configuracoes/cadencia` | ADMIN \| SUPERINTENDENTE |

Body PUT: `templateItems?[{id,diasVencimento}]`, `followUps?[{acao,diasVencimento}]`, `recalcularPendentes?`.

## Contas

| Method | Path | Notas |
|--------|------|-------|
| GET | `/contas` | scope COMERCIAL |
| GET | `/contas/:id` | |
| POST | `/contas` | `cnpj`, `razaoSocial`, `segmento`, `segmentoCarteira`, `ownerId`, `origemPrimeiroContato`, + endereço/grupo opcionais |
| PUT | `/contas/:id` | COMERCIAL sem transferir owner |
| DELETE | `/contas/:id` | soft delete |

## Contatos

| Method | Path |
|--------|------|
| GET | `/contas/:contaId/contatos` |
| POST | `/contas/:contaId/contatos` | body: `nome`, `cargo?`, `email?`, `telefone?`, `principal?`, `anotacoes?`, `oportunidadeId?` |
| GET | `/contatos/:id` |
| PUT | `/contatos/:id` |
| DELETE | `/contatos/:id` |

## Grupos

| Method | Path | Body |
|--------|------|------|
| GET/POST | `/grupos` | create: `nomeGrupo`, `observacoes?`, `origemAgrupamento?`, `contaTitularId?` |
| GET/PUT/DELETE | `/grupos/:id` | DELETE soft; 409 se contas ativas |

## Registradoras

| Method | Path | Role mutação |
|--------|------|--------------|
| GET | `/registradoras`, `/registradoras/:id` | leitura autenticada |
| POST/PUT/DELETE | `/registradoras`, `/:id` | ADMIN |

Create: `cnpj`, `nomeEmpresarial`, + CNAE/endereço opcionais.

## Oportunidades

### Query listagem (`GET /oportunidades`)

`contaId?`, `ownerId?`, `produto?`, `pipeline?`, `status?`, `estagio?`, `search?`

Também: `GET /contas/:contaId/oportunidades` com mesmos filters.

### CRUD e ações

| Method | Path | Body chave |
|--------|------|------------|
| GET | `/oportunidades/:id` | |
| GET | `/oportunidades/:id/workflow` | |
| POST | `/oportunidades` | `contaId`, `produto`, `pipeline`, `motivoOportunidade`, `estagio`, `ownerId`, + UFs/volumes/proposta opcionais; `tipoExpansao?` |
| PUT | `/oportunidades/:id` | parcial + `motivoPerda?`, `motivoGanho?` |
| PATCH | `/oportunidades/:id/estagio` | `{ estagio }` |
| POST | `/oportunidades/:id/desfecho` | ver abaixo |
| PATCH | `/oportunidades/:id/closed-won` | `motivoGanho`, `ufsContratadas[]`, `ufsRealizadas?`, `volumeNegociado?`, `dataFechamento?` |
| PATCH | `/oportunidades/:id/closed-lost` | `motivoPerda`, `observacao?`, `dataFechamento?` |
| PATCH | `/oportunidades/:id/previsao-fechamento` | ADMIN/SUPER: `dataPrevistaFechamento` (date\|null), `observacao` |
| PATCH | `/oportunidades/:id/owner` | ADMIN/SUPER: `{ ownerId }` |
| PATCH | `/oportunidades/:id/reabrir-standby` | — |
| DELETE | `/oportunidades/:id` | soft |

### Desfecho body (`aplicarDesfechoSchema`)

```
atividadeId: cuid
resultado: AVANCAR | PERMANECER | LOST
concluirAtividade?: boolean
criarFollowUp?: boolean
criarFollowNegociacao?: boolean
criarRodadaNegociacao?: boolean
criarAtividades?: { titulo, tipo?, acao?, obrigatoria?, descricao? }[]
criarOportunidadeOperacoes?: boolean
operacoesOwnerId?: cuid
diasVencimentoCadastro?: 1..30
chamadoJuridicoId?: string
motivoPerda?: string   // obrigatório se LOST
dadosQualificacao?: record
metadata?: record
valorEstimadoMensal?, ufsNegociadas?, ufsPretendidas?, ufsRealizadas?
propostaPdfUrl?, tipoExpansao?, motivoStandby?
dataRetorno?, dataReuniaoVolume?, dataPrevisaoInicioRegistros?, dataPrimeiroRegistro?
volumeAtual?, volumePretendido?, volumeNegociado?
```

SuperRefine: LOST exige motivo; follow negociação exige `dataRetorno`.

## Notas

| Method | Path | Body |
|--------|------|------|
| GET/POST | `/oportunidades/:oportunidadeId/notas` | create: `{ texto }` |
| PUT | `/notas/:id` | `texto`, `contatoId?` |
| DELETE | `/notas/:id` | soft |

## Atividades

| Method | Path | Body |
|--------|------|------|
| GET | `/atividades`, `/atividades/:id` | |
| POST | `/atividades` | `tipo`, `dataHora`, `ownerId`, `resultado?`, `proximoPasso?`, `observacao?`, `contaId?`, `oportunidadeId?` |
| PUT | `/atividades/:id` | parcial |
| PATCH | `/atividades/:id/status` | `status`, `houveRetorno?`, `contato?`, `nota?` |
| DELETE | `/atividades/:id` | soft |

## Atendimentos / Demandas

| Method | Path | Body chave |
|--------|------|------------|
| GET/POST | `/atendimentos` | `dataInicio`, `classificacao`, `canalAtendimento`, `tipoDemanda`, `dataFim?`, `detranUf?`, `contaId?`, `numeroChassi?`, `observacoes?`, `camposNa?` |
| GET/POST | `/demandas` | base operações + `dificuldade`, `impacto` (`BAIXO`\|`MEDIO`\|`ALTO`) |

## Timeline / Dashboard / Relatórios

| Method | Path | Query |
|--------|------|-------|
| GET | `/contas/:contaId/timeline` | `fonte?`, `limit?` |
| GET | `/oportunidades/:oportunidadeId/timeline` | idem |
| GET | `/dashboard/comercial` | `ownerId?`, `pipeline?`, `de?`, `ate?` |
| GET | `/relatorios/oportunidades` (+ `/export` CSV) | filtros período/owner/pipeline |
| GET | `/relatorios/atividades` (+ `/export`) | |
| GET | `/relatorios/contas` (+ `/export`) | |

COMERCIAL: dashboard/relatórios forçam escopo próprio.

## Notificações

| Method | Path |
|--------|------|
| GET | `/notificacoes` |
| GET | `/notificacoes/atividades` | (mesmo handler) |
| PATCH | `/notificacoes/:id/lida` | body resposta pode usar `{ message }` (exceção ao padrão `error`) |
