# 02 — Regras de negócio

Fonte: `apps/api/src/modules/**`, `apps/web/src/domain.ts`, `packages/database/schema.prisma`. Apenas o que o código implementa.

## Papéis (RBAC)

| Role | Comportamento típico no service |
|------|----------------------------------|
| `COMERCIAL` | Escopo por `ownerId` (contas, opps, atividades, notas, timelines, dashboard, relatórios). Não cria/transfere owner para outro. Notas: editar só se autor. |
| `SUPERINTENDENTE` | Visão ampla. Altera cadência, previsão de fechamento e owner de oportunidade. |
| `ADMIN` | Como superintendente + CRUD usuários + mutações de registradoras. |

Sem assert de role em: grupos (qualquer autenticado); GET registradoras; GET cadência; demandas (sem filtro por role no service explorado); `GET /usuarios/select`.

Owners de conta/oportunidade/atividade devem ser usuários **COMERCIAL** ativos (conforme asserts nos services).

## Pipelines e estágios

Definidos em `oportunidades.service.ts` (`estagiosPorPipeline`, `estagiosExpansaoPorTipo`).

### Aquisição (`AQUISICAO`)

1. Prospecção  
2. Qualificação  
3. Apresentação comercial  
4. Proposta  
5. Negociação  
6. Fechamento  
7. Aguardando registros  

### Expansão (`EXPANSAO`) — união de estágios

Mapeamento, Proposta, Negociação, Fechamento, Sem contato, Em contato, Negociando, Fechado, Aguardando registros, Standby.

Por `tipoExpansao`:

- **UF:** Mapeamento → Proposta → Negociação → Fechamento → Aguardando registros  
- **VOLUME:** Mapeamento → Sem contato → Em contato → Negociando → Fechado → Aguardando registros  

### Operações (`OPERACOES`)

1. Cadastro  
2. Cadastro realizado  

## Motivos de oportunidade (por pipeline)

| Pipeline | Motivos válidos |
|----------|-----------------|
| AQUISICAO | Prospecção ativa, Indicação, Evento, Parceiro, Associação, Inbound, Outro |
| EXPANSAO | Mapeamento de expansão, Nova UF, Novo produto, Reativação, Aumento de volume, Solicitação do cliente, Outro |
| OPERACOES | Encaminhamento pós-fechamento comercial, Cadastro, Implantação, Outro |

Estágio/motivo inválidos → `400` com mensagem de domínio.

## Status de oportunidade

`ABERTA` | `CLOSED_WON` | `CLOSED_LOST`

## Produtos

`E_REGISTRO` | `E_BUSCAR`

## Conta × pipeline

Regras observadas no create de oportunidade:

- Expansão exige conta `statusConta === CLIENTE` (erro se não).
- Aquisição/Expansão atualizam `segmentoCarteira` conforme helpers (`PROSPECCAO_NOVO` vs `PROSPECCAO_BASE`).

## Desfecho de atividade (`POST /oportunidades/:id/desfecho`)

### Resultado

| Valor | Efeito |
|-------|--------|
| `AVANCAR` | Exige workflow sem pendências obrigatórias (`409` + `details[]`). Conclui workflow do estágio, move para próximo, instancia novo workflow. Em Operações, chegar em “Cadastro realizado” libera lado comercial conforme service. |
| `PERMANECER` | Não avança estágio; aplica updates pontuais; atividade conclui só se `concluirAtividade === true` (default: true se resultado ≠ PERMANECER). |
| `LOST` | `status/estagio = CLOSED_LOST`, `motivoPerda`, `dataFechamento`. Em pipelines com recuperação, cria atividade `DESFECHO_RECUPERACAO_LEAD`. |

### Flags comuns no body

- `criarFollowUp` — follow genérico  
- `criarFollowNegociacao` / `criarRodadaNegociacao` — **exigem `dataRetorno`**  
- `criarAtividades[]` — atividades ad-hoc  
- `criarOportunidadeOperacoes` + `operacoesOwnerId?` + `diasVencimentoCadastro?` (1–30)  
- `chamadoJuridicoId` — obrigatório ao concluir `REGISTRAR_CHAMADO_JURIDICO`  
- `motivoPerda` — **obrigatório se LOST**  
- `dadosQualificacao` / `metadata` — merge JSON  

### Bloqueios observados no service

- `DESFECHO_NEGOCIACAO` + `AVANCAR` → 400 (negociar condições não avança; usa follow de negociação).  
- Opp encerrada: desfecho só se `CLOSED_LOST` + ação `DESFECHO_RECUPERACAO_LEAD`.  
- Conferência de UFs (`CONFERIR_UFS_EXPANSAO`) antes de formalização/ops conforme ramos do service.  
- Standby expansão: ramos `DESFECHO_STANDBY_EXPANSAO` com AVANCAR/PERMANECER e reabertura via `PATCH .../reabrir-standby`.

## Motivo de perda (estruturado)

Lista canônica (`apps/api/src/lib/motivos-perda.ts` e `apps/web/src/domain.ts`):

1. Concorrente com prática irregular (ex.: gravame em nome do cliente na B3)  
2. Contrato com integradora limita escolha da registradora  
3. Sem credenciamento em UF de operação da instituição  
4. Recusa em mudar o sistema que já utiliza  
5. Sem interesse / sem fit comercial  
6. Outro  

Válido também string `Outro: <detalhe>` com detalhe não vazio. Validação: `isMotivoPerdaValido`.

## Close Won / Close Lost

- **Won** (`PATCH .../closed-won`): `motivoGanho`, `ufsContratadas[]` (min 1), opcionais volume/data. Side-effects: produto contratado, possível criação de oportunidade OPERACOES / EXPANSAO conforme pipeline (ver service).  
- **Lost** (`PATCH .../closed-lost`): `motivoPerda` válido + opcionais.

## Workflow por estágio

- `TemplateWorkflow` único por `(pipeline, estagio)`.  
- Ao entrar no estágio, instancia `Workflow` + `Atividade`s a partir de `TemplateWorkflowItem` (ação, obrigatoriedade, dias vencimento).  
- Cadência de follow-ups: `CadenciaFollowUp` + `PUT /configuracoes/cadencia` (ADMIN | SUPERINTENDENTE).

## Soft delete

| Entidade | Como |
|----------|------|
| Conta, Contato, Grupo, Registradora, Oportunidade, Nota, Atividade | `DELETE` → `deletedAt` / `deletedBy` |
| Grupo | 409 se há contas ativas no grupo |
| Usuário | `PATCH .../desativar` → `ativo: false` (admin não desativa a si) |
| Atendimento / Demanda | `deletedAt` no modelo; sem rota DELETE pública explorada |

## Resolução de ação no frontend

`resolveAcaoAtividade` (`domain.ts`) deriva `AcaoAtividade` do título (ex.: “Follow-up: Negociação” → `DESFECHO_FOLLOW_NEGOCIACAO`), senão usa `metadata.acao` / `templateItem.acao`, senão `NENHUMA`.

## Notas

- CRUD sob oportunidade.  
- Update pode alterar `contatoId` (vínculo ao contato da conta).  
- COMERCIAL só edita nota própria.
