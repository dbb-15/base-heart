# 04 — Frontend Context

Contexto para construir/manter UI. Só o que o frontend precisa. Fonte: `apps/web`.

## Base HTTP

- Prefixo: `/api`
- Bearer access token em memória (`setAccessToken`)
- Refresh automático via cookie em `POST /auth/refresh` (`credentials: 'include'`)
- Erro: `ApiError(message, status, details)` a partir de `{ error, details? }`

## Telas necessárias (rotas existentes)

| Rota hash | Página | Quem vê (nav) |
|-----------|--------|----------------|
| `#/` | Dashboard | todos |
| `#/base` | Base Mestre (contas) | todos |
| `#/grupos` | Grupos | todos |
| `#/funil` / `#/funil/aquisicao` / `#/funil/expansao` | Funil comercial | todos |
| `#/operacoes` | Funil Operações (pipeline fixo) | todos |
| `#/atividades` | Atividades | todos |
| `#/relatorios` | Relatórios | ADMIN, SUPERINTENDENTE |
| `#/configuracoes` | Cadência funis | ADMIN, SUPERINTENDENTE |
| `#/admin` | Usuários | ADMIN |
| `#/admin/registradoras` | Registradoras | ADMIN (aba) |
| `#/contas/:id` (+ `/eregistro`) | Detalhe conta | |
| `#/oportunidades/:id` (+ `/eregistro`) | Detalhe oportunidade | |
| (sem path) | LoginPage | não autenticado |

## Modais / drawers (não são rotas)

LeadCadastroDrawer, ContatoModal, GrupoDrawer, UsuarioDrawer, RegistradoraDrawer, AtividadeDrawer, NovaAtividadeModal, ConcluirAtividadeModal, DesfechoAtividadeModal, CloseWonModal, CloseLostModal.

## Componentes reutilizáveis

| Componente | Uso |
|------------|-----|
| Layout | shell + nav + bell + logout |
| Modal / Drawer | shells overlay |
| Badge (+ variantes StatusConta, SegmentoCarteira, …) | chips |
| Avatar | iniciais |
| NotificacoesBell | inbox |
| FunilFiltrosBar | filtros kanban/lista |
| FasesSubTabs / Jornada*Stepper | jornada visual |
| MotivoPerdaSelect | perda estruturada |
| UfSelect | UFs BR |
| RegistradorasPicker | multi-select registradoras |
| OportunidadeDadosEditaveis | campos editáveis conta/opp |
| OperacoesRegistroFormFields / CampoComNa | registro ops + N/A |
| AtendimentoOperacoesPanel / DemandasOperacoesPanel / EregistroProducaoPanel / OrigemComercialPanel | painéis detalhe |
| AdminTabs | Usuários \| Registradoras |
| DemandaMatrizFormFields | dificuldade/impacto |

## Serviços → endpoints

| Service | Funções principais | Paths |
|---------|-------------------|-------|
| auth | login, restoreSession, logout | `/auth/*` |
| contas | list, get, create, update, findByCnpj, timeline | `/contas`, timeline |
| contatos | CRUD | `/contas/:id/contatos`, `/contatos/:id` |
| grupos | list/create/update/delete | `/grupos` |
| oportunidades | list, get, workflow, timeline, create, update, estagio, previsao, owner, reabrirStandby, closeWon/Lost, aplicarDesfecho | `/oportunidades/*` |
| atividades | list, create, status, dataHora | `/atividades` |
| notas | list/create/update/delete | notas sob opp |
| notificacoes | list, marcar lida | `/notificacoes` |
| usuarios | CRUD admin + select | `/usuarios` |
| configuracoes | get/update cadência | `/configuracoes/cadencia` |
| dashboard | getDashboardComercial | `/dashboard/comercial` |
| relatorios | list + export CSV | `/relatorios/*` |
| registradoras | CRUD | `/registradoras` |
| atendimentos / demandas | list/create | `/atendimentos`, `/demandas` |
| viacep | buscarEnderecoPorCep | externo ViaCEP |

## Enums / tipos que a UI usa

```
RoleUsuario: COMERCIAL | SUPERINTENDENTE | ADMIN
Pipeline: AQUISICAO | EXPANSAO | OPERACOES
TipoExpansao: UF | VOLUME
StatusOportunidade: ABERTA | CLOSED_WON | CLOSED_LOST
TipoAtividade: LIGACAO | EMAIL | WHATSAPP | DEMO | REUNIAO | TAREFA
StatusAtividade: PENDENTE | EM_ANDAMENTO | CONCLUIDA | IGNORADA | CANCELADA
Produto: E_REGISTRO | E_BUSCAR
Segmento, SegmentoCarteira, StatusConta, StatusRelacionamento, OrigemContato
ClassificacaoDemanda, CanalDemanda, TipoDemanda, NivelMatrizDemanda
AcaoAtividade: (lista completa em glossary / Prisma)
```

Labels PT-BR: `labels.ts` (`pipelineLabels`, `produtoLabels`, `roleLabels`, …).

## Filtros do funil (client-side + query API)

Estado `FunilFiltrosState` (`domain/funilFiltros.ts`):

| Campo | Valores |
|-------|---------|
| search | string (também enviado à API) |
| ownerId | cuid \| '' |
| produto | Produto \| '' |
| previsao | todas \| vencidas \| esta_semana \| no_prazo \| sem_previsao |
| status | ABERTAS \| TODAS \| GANHAS \| PERDIDAS |
| ganho | todas \| ultimos_30 \| ultimos_90 \| sem_data |
| origemOperacoes | todas \| aquisicao \| expansao_uf |

Kanban default: `status=ABERTAS`. Lista default: `TODAS`.

API list: `pipeline`, `status`, `ownerId`, `produto`, `estagio`, `search`, `contaId`.

**Paginação:** listagens atuais não usam page/limit padrão de API no schema de oportunidades; timelines aceitam `limit?`.

## Ordenação

Não há parâmetro genérico `orderBy` no `listOportunidadesQuerySchema`. Ordenação visual é responsabilidade da página (colunas kanban por estágio).

## Desfecho — ações com UI dedicada

`DesfechoAtividadeModal` trata (lista do código):

QUALIFICACAO_FORM, ANEXAR_PROPOSTA, DESFECHO_NEGOCIACAO, DESFECHO_FOLLOW_NEGOCIACAO, REGISTRAR_CHAMADO_JURIDICO, DESFECHO_SOLICITACAO_CADASTRO, DESFECHO_SONDAGEM_EXPANSAO, CONFERIR_UFS_EXPANSAO, DESFECHO_ABORDAGEM_VOLUME, DESFECHO_REUNIAO_VOLUME, DESFECHO_STANDBY_EXPANSAO, CONFIRMAR_BOAS_VINDAS_OPERACOES, DESFECHO_ACOMPANHAMENTO_REGISTROS, DESFECHO_CONFIRMACAO_INICIO_REGISTROS, DESFECHO_PRIMEIRO_CONTATO, DESFECHO_RECUPERACAO_LEAD, DESFECHO_RETORNO_EMAIL, DESFECHO_DEMO, DESFECHO_PROPOSTA, DESFECHO_FORMALIZACAO, DESFECHO_CHAMADO_JURIDICO.

### Regras de exibição / validação (UI)

- Resultado escolhido via OutcomeCards (success/primary/warn/danger).
- LOST: `MotivoPerdaSelect` + detalhe se “Outro”; mensagem `Selecione o motivo.` / `Descreva o motivo quando selecionar Outro.`
- Negociação (`DESFECHO_NEGOCIACAO`): não AVANCAR; exige data retorno para follow (`criarFollowNegociacao`).
- Follow negociação: AVANCAR só no follow com “Cliente aprovou” (fluxo do modal + API).
- Registradoras: picker multi na sondagem/demo (`registradoraIds` em `dadosQualificacao`).
- Chamado jurídico: exigir ID ao concluir.

## Mensagens / erros

- Preferir `error` da API; exibir `details` (array) quando 409 de pendências de workflow.
- Sessão expirada: callback `setOnSessionExpired` → logout/login.

## Permissões na UI

- Nav filtra por `roles` em `Layout` (ver `06-navigation.md`).
- Previsão/owner/cadência/relatórios: esconder ou desabilitar se role ≠ ADMIN/SUPERINTENDENTE.
- Admin registradoras: só ADMIN.

## Campos críticos por fluxo

### Cadastro lead / conta

CNPJ, razão social, segmento, segmento carteira, origem, owner, endereço (CEP → ViaCEP).

### Oportunidade

pipeline, produto, motivo, estágio, owner, UFs/volumes conforme tipo expansão, valor estimado, previsão fechamento.

### Close won

motivo ganho, UFs contratadas (obrigatório), volume opcional.

### Close lost / desfecho LOST

motivo estruturado da lista canônica.

### Atendimento / demanda (ops)

classificação, canal, tipo demanda; demanda: dificuldade + impacto (BAIXO/MEDIO/ALTO); campos N/A via `CampoComNa`.
