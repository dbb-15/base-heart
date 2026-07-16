# 07 — Domain Glossary

Fonte: `packages/database/schema.prisma` + enums espelhados no front.

## Entidades

| Modelo | Significado no CRM |
|--------|-------------------|
| User | Usuário autenticado (role, ativo) |
| Conta | Empresa/cliente (CNPJ único); dono comercial |
| Contato | Pessoa na conta |
| GrupoFinanceiro | Agrupamento de contas (titular opcional) |
| Registradora | Catálogo de registradoras (dados CNPJ/CNAE) |
| Oportunidade | Negócio em um pipeline/estágio |
| ProdutoContratado | Produto ativo pós-won (UFs) |
| TemplateWorkflow / Item | Modelo de tarefas por estágio |
| CadenciaFollowUp | Dias de vencimento por ação de follow |
| Workflow | Instância do template na oportunidade |
| Atividade | Tarefa/ligação/follow (pode ter `acao`) |
| Nota | Anotação em oportunidade (opcional contato) |
| Notificacao | Alerta ao usuário |
| Atendimento | Registro de atendimento (ops) |
| Demanda | Demanda com matriz dificuldade/impacto |
| Event | Timeline imutável |
| SystemSetting | Configurações chave/valor |

## Relacionamentos principais

- User 1—N Conta, Oportunidade, Atividade, Atendimento, Nota, Notificacao; Demanda via `registradaPor`
- Conta N—1 GrupoFinanceiro; 1—N Contato, Oportunidade, ProdutoContratado, Atividade, Atendimento, Demanda
- GrupoFinanceiro 1—0..1 Conta titular (`contaTitularId`)
- Oportunidade N—1 Conta, User(owner); self-relation origem/derivadas; 1—0..1 ProdutoContratado
- Workflow N—1 Oportunidade, TemplateWorkflow; 1—N Atividade
- Atividade N—1 Conta?, Oportunidade?, User, TemplateWorkflowItem?, Workflow?
- Nota N—1 Oportunidade, User(autor), Contato?

## Enums Prisma (valores)

### Segmento
BANCO, FINANCEIRA, COOPERATIVA, CONSORCIO, CONCESSIONARIA, REVENDA, OUTROS

### SegmentoCarteira
DENTRO_DE_CASA, PROSPECCAO_BASE, PROSPECCAO_NOVO

### StatusConta
PROSPECT, CLIENTE, INATIVO

### StatusRelacionamento
FORTE, MEDIO, FRACO

### OrigemContato
DETRAN_UF, ABAC, ACREFI, BCB, LISTA_COOPERATIVA, BASE_ATIVA, INDICACAO, PARCEIRO, OUTRO

### Produto
E_REGISTRO, E_BUSCAR

### Pipeline
AQUISICAO, EXPANSAO, OPERACOES

### TipoExpansao
UF, VOLUME

### StatusOportunidade
ABERTA, CLOSED_WON, CLOSED_LOST

### TipoAtividade
LIGACAO, EMAIL, WHATSAPP, DEMO, REUNIAO, TAREFA

### StatusAtividade
PENDENTE, EM_ANDAMENTO, CONCLUIDA, IGNORADA, CANCELADA

### StatusWorkflow
EM_ANDAMENTO, CONCLUIDO, CANCELADO

### AcaoAtividade
NENHUMA, CONFIRMAR_RETORNO, REGISTRAR_CONTATO, REGISTRAR_NOTA, OBSERVAR_FLUXO_EREGISTRO, DESFECHO_PRIMEIRO_CONTATO, QUALIFICACAO_FORM, DESFECHO_RETORNO_EMAIL, DESFECHO_DEMO, DESFECHO_PROPOSTA, DESFECHO_NEGOCIACAO, DESFECHO_FOLLOW_NEGOCIACAO, ANEXAR_PROPOSTA, DESFECHO_FORMALIZACAO, DESFECHO_CHAMADO_JURIDICO, DESFECHO_SOLICITACAO_CADASTRO, REGISTRAR_CHAMADO_JURIDICO, DESFECHO_RECUPERACAO_LEAD, DESFECHO_SONDAGEM_EXPANSAO, CONFERIR_UFS_EXPANSAO, DESFECHO_ABORDAGEM_VOLUME, DESFECHO_REUNIAO_VOLUME, DESFECHO_STANDBY_EXPANSAO, CONFIRMAR_BOAS_VINDAS_OPERACOES, DESFECHO_ACOMPANHAMENTO_REGISTROS, DESFECHO_CONFIRMACAO_INICIO_REGISTROS

### RoleUsuario
COMERCIAL, SUPERINTENDENTE, ADMIN

### ClassificacaoDemanda
INFORMACAO, SOLICITACAO, RECLAMACAO

### CanalDemanda
TELEFONE, WHATSAPP, CHAT, EMAIL, NAO_SE_APLICA

### TipoDemanda
BAIXA_CANCELAMENTO_CONTRATO, CADASTRO, FINANCEIRO, ERRO_REGISTRO, INSTABILIDADE_DETRAN, INSTABILIDADE_INFRA, INSTABILIDADE_EREGISTRO, DUVIDAS_AUXILIO_EREGISTRO, DEMANDAS_INTERNAS_SOLICITADAS, OUTROS

### NivelMatrizDemanda
BAIXO, MEDIO, ALTO

### OrigemAgrupamento
MANUAL, IMPORT_BI

### TipoEstabelecimento
MATRIZ, FILIAL

## Campos JSON / arrays notáveis

| Campo | Onde | Uso |
|-------|------|-----|
| `dadosQualificacao` | Oportunidade | Qualificação, registradoraIds, etc. |
| `metadata` | Atividade | acao, flags de follow |
| `ufsNegociadas` / `ufsPretendidas` / `ufsRealizadas` | Oportunidade | UFs string[2] |
| `ufsContratadas` | ProdutoContratado | pós-won |
| `camposNa` | Atendimento (API) | campos marcados N/A |

## Estágios (não-enum)

Strings livres validadas por pipeline — ver `02-business-rules.md`.

## Termos de produto ↔ código

| Termo falado | Código |
|--------------|--------|
| Funil / pipeline | `Pipeline` + `estagio` |
| Lead / conta | `Conta` |
| Card do kanban | `Oportunidade` ABERTA |
| Máquina de receita | branding UI |
| e-Registro | produto `E_REGISTRO` + painéis eregistro |
| Desfecho | `POST .../desfecho` + `AcaoAtividade` |
| Follow-up Negociação | ação `DESFECHO_FOLLOW_NEGOCIACAO` |
| Base mestre | listagem de contas |
| Operações | pipeline `OPERACOES` + atendimentos/demandas |
