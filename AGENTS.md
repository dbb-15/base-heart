# CONTEXTO E PAPEL

Você vai construir/refinar o **FRONTEND** do **Alias CRM** — CRM interno B2B para financeiras e registradoras (produtos e-Registro / e-BusCar). É uma SPA autenticada de uso diário, focada em **velocidade operacional** e em **guiar o comercial pelo funil via atividades**, não via arrastar cards ou mudar estágio manualmente.

O backend **já existe** (API REST Fastify + PostgreSQL). Seu trabalho é UI/UX conectada à API via `src/services/`.

> **Última atualização:** 16/07/2026 — Prompt com arquitetura front plugável + contrato/arquitetura backend (API) para o Lovable.

> **Como usar este prompt:** descreve produto, UX, **arquitetura do front (`apps/web`)** e **contrato/arquitetura da API (`apps/api`)** para gerar UI que pluga sem reinventar regra. Em dúvida: **ARQUITETURA DO FRONT** + **BACKEND E CONTRATO DE API** + **Mapa ação → UI** + **O que NÃO fazer**.

> **Execução no Lovable:** **não** cole o doc inteiro pedindo “faça tudo”. Use o roteiro em camadas → **[LOVABLE-Camadas.md](./LOVABLE-Camadas.md)** (Camadas 0–8, texto pronto para colar).

---

# RESTRIÇÕES ARQUITETURAIS (OBRIGATÓRIAS)

1. Stack: **React + TypeScript + Vite + Tailwind CSS**. Sem Next.js.
2. **Não** criar backend, Supabase, Prisma, auth própria nem Edge Functions.
3. Dados via `fetch` para `/api` (proxy Vite). Camada `src/services/` tipada.
4. Auth JWT: `Authorization: Bearer <accessToken>`; refresh em `POST /api/auth/refresh` (cookie httpOnly); 401 → refresh uma vez → login.
5. Mock só para layout; estruturar para trocar por API real sem refatorar componentes.
6. Estado global mínimo (`src/store/` sessão). Context + hooks. Sem Redux/Zustand pesado.
7. Estrutura: `pages/`, `components/`, `services/`, `hooks/`, `domain.ts` / `domain/*` (enums/constantes), `labels.ts` (rótulos PT-BR).
8. **Routing por hash** (`window.location.hash`): rotas como `#/`, `#/funil/aquisicao`, `#/oportunidades/:id`, `#/admin/registradoras`. Não assumir React Router path-based como padrão — espelhar `useHashRoute` (hashchange + `navigate(path)`).

---

# PRIORIDADE DE ENTREGA (LOVABLE)

Ordem detalhada com prompts prontos: **[LOVABLE-Camadas.md](./LOVABLE-Camadas.md)**.

Resumo:
0. Fundação (hash, api.ts, sessão, shell)
1. Funil Aquisição
2. Opp + desfecho genérico + perda
3. Negociação/Follow + Sondagem/Picker + Recuperação/Won  ← crítico
4. Expansão
5. Operações
6. Base / Conta / Grupos / Notas
7. Admin Registradoras + Config
8. Dashboard / Relatórios / polish

**MVP plugável:** camadas **0 → 1 → 2 → 3**.

**Não** reescrever regras de negócio no frontend. UI chama `POST /oportunidades/:id/desfecho` e reflete o que a API retorna.

---

# ARQUITETURA DO FRONT ATUAL (CONTRATO PARA PLUGAR)

> **Objetivo:** gerar código que **encaixe em `apps/web`** do monorepo, não um SPA paralelo. Sem este contrato, o front “parece certo” mas exige adaptação grande.

## Monorepo e app

```
CRM/
├── apps/web/          ← FRONT (alvo deste prompt)
├── apps/api/          ← Fastify REST (já existe; não recriar)
└── packages/database/ ← Prisma (não tocar no Lovable)
```

- Stack: Vite + React + TS + Tailwind v4 (`@tailwindcss/vite`)
- Dev: proxy `/api` → `http://localhost:3001` (API sem o prefixo `/api`)
- Entry: `main.tsx` → `App.tsx` → `SessionProvider` → `Layout` + `RouteView`

## Camadas obrigatórias (não inventar outra)

| Camada | Pasta | Regra |
|--------|-------|-------|
| Páginas | `src/pages/` | Telas e drawers/modais grandes |
| Componentes | `src/components/` | UI reutilizável (Badge, Modal, Drawer, OutcomeCard…) |
| Services | `src/services/` | **Única** porta HTTP; uma função por endpoint |
| Tipos | `src/types.ts` | Enums/DTOs do front; espelhar API |
| Domínio | `src/domain.ts` + `src/domain/*` | Regras puras (estágios, resolveAcao, filtros) |
| Labels | `src/labels.ts` | Rótulos PT-BR |
| Format | `src/format.ts` | CNPJ, data, moeda |
| Sessão | `src/store/session.tsx` | Context: user, login, logout, status |
| Hooks | `src/hooks/` | Ex.: `useHashRoute` |

## Cliente HTTP (padrão a preservar)

`src/services/api.ts`:

- Base URL: `'/api'`
- Helpers: `api.get` / `post` / `put` / `patch` / `delete`
- `credentials: 'include'`
- Bearer em memória (`setAccessToken`); 401 → `POST /api/auth/refresh` uma vez → se falhar, `onSessionExpired`
- Erro: `ApiError(message, status, details?)` — UI mostra `error.message`

Forma dos services:

```ts
// src/services/oportunidades.ts
import { api } from './api'
import type { OportunidadeListItem } from '../types'

export function listOportunidades(filters?: Record<string, string | undefined>) {
  return api.get<OportunidadeListItem[]>('/oportunidades', filters)
}

export function aplicarDesfecho(id: string, input: AplicarDesfechoInput) {
  return api.post<OportunidadeListItem>(`/oportunidades/${id}/desfecho`, input)
}
```

Nova feature = arquivo em `services/` + tipos em `types.ts`. **Proibido** `fetch` solto na page.

## Auth / sessão

- `SessionProvider` + `useSession()`
- Login guarda accessToken + user; restore na subida do app
- Só renderiza app autenticado se `status === 'authenticated'`
- RBAC visual via `user.role`: `COMERCIAL` | `SUPERINTENDENTE` | `ADMIN`

## Routing (hash — obrigatório)

- `useHashRoute`: lê `#/path`, `navigate(path)` escreve hash
- `App.tsx` faz match manual (`startsWith`, regex `:id`) — **não** introduzir React Router neste ciclo

| Hash | Página |
|------|--------|
| `#/` | Dashboard |
| `#/base` | Base Mestre |
| `#/grupos` | Grupos |
| `#/funil`, `#/funil/aquisicao`, `#/funil/expansao` | Funil |
| `#/operacoes` | Operações |
| `#/atividades` | Agenda |
| `#/oportunidades/:id` | Detalhe oportunidade |
| `#/contas/:id` | Detalhe conta |
| `#/relatorios` | Relatórios |
| `#/configuracoes` | Config funis |
| `#/admin` | Usuários |
| `#/admin/registradoras` | Registradoras |

## Convenções visuais (mesmo design system)

- Claro: slate + azul primário; utilities Tailwind (sem CSS-in-JS)
- Input: `rounded-lg border-slate-300 text-sm` + focus ring azul
- Painel: `rounded-xl border border-slate-200 bg-white`
- Reutilizar `Modal` / `Drawer` / `Badge` / `OutcomeCard` existentes
- Funil: kanban **read-only**; Admin/Base: tabelas densas

## Contratos de dados (não renomear sem mapear API)

Tipos centrais em `types.ts`:

- `OportunidadeListItem`, `AtividadeListItem` (`templateItem?`, `metadata?`)
- `DadosQualificacao` (JSON bag da sondagem/expansão/recuperação)
- `AcaoAtividade` (inclui `DESFECHO_FOLLOW_NEGOCIACAO`)
- `WorkflowAtual`, timeline, `Registradora`, `Contato`, `Nota`

Atividade → UI:

```ts
resolveAcaoAtividade(atividade) // em domain.ts
// metadata.acao > heurística de título > templateItem.acao > NENHUMA
```

Desfecho → API:

```ts
aplicarDesfecho(oportunidadeId, {
  atividadeId,
  resultado: 'AVANCAR' | 'PERMANECER' | 'LOST',
  concluirAtividade?,
  criarFollowUp?,
  criarFollowNegociacao?,
  dataRetorno?, // ISO datetime
  metadata?,
  dadosQualificacao?,
  motivoPerda?,
})
```

**Backend** decide avanço de estágio, follows e Won. Front só manda payload certo e recarrega dados.

## O que pluga bem vs o que quebra

**Pode gerar:** pages/components no padrão; services/types novos; polish visual mantendo props/services.

**Não fazer:**
- ❌ Outro client HTTP / axios / React Query como camada padrão (só se encapsulado atrás de `services/`)
- ❌ Rotas path-based sem hash
- ❌ Enums duplicados fora de `types.ts` / `labels.ts`
- ❌ Avançar estágio no front (fluxo = desfecho)
- ❌ Renomear `DesfechoAtividadeModal`, `aplicarDesfecho` ou chaves de `DadosQualificacao` sem 1:1 com API
- ❌ SPA “do zero” com estrutura diferente e “adaptamos depois”

## Estratégia de entrega (encaixe máximo)

1. Ideal: Lovable recebe/cola o `apps/web` e **refina** telas (não reescreve o esqueleto).
2. Greenfield: gerar a **mesma árvore `src/`** e os **mesmos nomes** de files/services para copiar por cima com diff mínimo.
3. Critério de pronto: sobe com `apps/api` em `:3001`, login funciona, funil lista oportunidades reais, desfecho chama `/desfecho` sem mudar backend.

---

# FILOSOFIA DE PRODUTO (CRÍTICO — LEIA ANTES DE DESENHAR)

## O funil é conduzido por **atividades com desfecho**

- Cada oportunidade aberta tem um **workflow por estágio** (checklist de atividades obrigatórias).
- O comercial **conclui atividades** na aba Atividades da oportunidade.
- Atividades “inteligentes” abrem um **modal de desfecho** com **cards de resultado** (verde = avanço/positivo, âmbar = continuar/follow-up, vermelho = perda).
- **O estágio avança automaticamente** quando o desfecho manda avançar e todas as obrigatórias do estágio estão concluídas — **não há botão “Avançar estágio”**.
- **Perda só via decisão negativa** em uma atividade (nunca botão solto “Fechar perdida” no header).
- **Kanban é somente leitura**: clicar no card abre a oportunidade. **Sem drag-and-drop** entre colunas.
- **Estágio não é editável** manualmente (sem select/dropdown para pular etapas). Exibir estágio atual como texto/badge.
- Atividades aparecem **ordenadas** (ordem do template + follow-ups intercalados). A ordem guia o fluxo; **não** exibir bloqueios visuais do tipo “Conclua antes: …”.
- Follow-ups automáticos (D+N configurável) para: retomar contato, retorno de e-mail, retorno de proposta, abordagem volume, recuperação de lead, standby expansão.
- **Negociação:** a atividade **Negociar condições** **não** avança o estágio. Em “Cliente aprovou” ou “Continua negociando” o comercial **escolhe data de retorno** e o sistema cria **Follow-up: Negociação**. É o **follow** (mesmas 3 decisões) que **avança o funil** quando “Cliente aprovou”.

## Recuperação de lead perdido

- Ao marcar perdido via desfecho → motivo estruturado (select) → oportunidade vai para **Perdida** (`CLOSED_LOST`).
- Sistema cria **“Follow-up: recuperar lead”**.
- Desfecho da recuperação:
  - **Lead reativou** → reabre no **próximo estágio após o estágio da perda** (nunca pousar em estágio já 100% concluído).
  - **Ainda tentando** → permanece perdida + novo follow.
  - **Sem interesse** → permanece perdida (definitivo).
- Banner na perdida: motivo, estágio onde perdeu, destino se reativar.

## Won comercial (regra vigente)

- **Não** fechar como ganha ao concluir Cadastro em Operações.
- Sequência: Comercial (Fechamento) → solicita cadastro → **Ops Cadastro realizado** libera comercial para **Aguardando registros** → desfecho “Cliente iniciou registros?” **Sim** → `CLOSED_WON`.
- No Won: atualiza Produto Contratado + conta CLIENTE; cria/abre **Expansão em Mapeamento** se não houver Expansão aberta.

---

# PERFIS (RBAC)

| Role | Escopo |
|------|--------|
| **COMERCIAL** | Só contas/oportunidades/atividades onde é owner |
| **SUPERINTENDENTE** | Leitura global + dashboards |
| **ADMIN** | Usuários + Registradoras + configurações |

> Gap conhecido: perfil **OPERACOES** ainda não existe — quem acessa `/operacoes` hoje usa os roles acima (escopo comercial por owner). Desenhar UI pronto para um 4º role futuro.

Esconder menu/ações conforme `user.role`.

---

# VOCABULÁRIO (enums — rótulos PT-BR na UI)

**Segmento:** BANCO, FINANCEIRA, COOPERATIVA, CONSORCIO, CONCESSIONARIA, REVENDA, OUTROS

**SegmentoCarteira:** DENTRO_DE_CASA (50%), PROSPECCAO_BASE (30%), PROSPECCAO_NOVO (20%)

**StatusConta:** PROSPECT, CLIENTE, INATIVO

**StatusRelacionamento:** FORTE, MEDIO, FRACO

**Produto:** E_REGISTRO ("e-Registro"), E_BUSCAR ("e-BusCar")

**Pipeline:** AQUISICAO, EXPANSAO, **OPERACOES**

**TipoExpansao:** UF ("Aumento de UF"), VOLUME ("Aumento de volume")

**StatusOportunidade:** ABERTA, CLOSED_WON, CLOSED_LOST

**TipoAtividade:** LIGACAO, EMAIL, WHATSAPP, DEMO, REUNIAO, TAREFA

**Estágios AQUISICAO:** Prospecção → Qualificação → Apresentação comercial → Proposta → Negociação → Fechamento → **Aguardando registros**

**Estágios EXPANSAO (Mapeamento):** Mapeamento → (sondagem) → ramo UF | VOLUME | Standby

**Estágios EXPANSAO (UF):** Mapeamento → Proposta → Negociação → Fechamento → Aguardando registros

**Estágios EXPANSAO (VOLUME):** Mapeamento → Sem contato → Em contato → Negociando → Fechado → Aguardando registros

**Estágio EXPANSAO (Standby):** Standby

**Estágios OPERACOES (Cadastro):** Cadastro → Cadastro realizado

**Motivo da oportunidade (criação):**
- AQUISICAO: Prospecção ativa, Indicação, Evento, Parceiro, Associação, Inbound, Outro
- EXPANSAO: Nova UF, Novo produto, Reativação, Aumento de volume, Solicitação do cliente, Outro
- OPERACOES: Encaminhamento pós-fechamento comercial, Cadastro, Implantação, Outro

**Motivo de ganho (Closed Won):** Cliente iniciou registros (fluxo principal); demais motivos estruturados (Cobertura de UF, Preço, Relacionamento, …) quando aplicável no modal.

**Motivo de perda (select obrigatório ao perder):**
1. Concorrente com prática irregular
2. Contrato com integradora limita escolha da registradora
3. Sem credenciamento em UF de operação da instituição
4. Recusa em mudar o sistema que já utiliza
5. Sem interesse / sem fit comercial
6. Outro → campo texto obrigatório

**Atendimento / Demanda:** classificação (Informação / Solicitação / Reclamação), canal, tipo demanda, UF Detran opcional, chassi opcional; Demanda + dificuldade × impacto (Baixo/Médio/Alto).

---

# COMO A UI DESCOBRE A AÇÃO DA ATIVIDADE

Antes de abrir o modal, resolver a ação assim (`resolveAcaoAtividade`):

1. Heurísticas de título (ex.: título contém `follow-up` + `negocia` → `DESFECHO_FOLLOW_NEGOCIACAO`)
2. Senão: `metadata.acao` (preferir sempre — follow dinâmicos gravam a ação aqui)
3. Senão: `templateItem.acao`
4. Senão: `NENHUMA` → conclusão simples (checkbox / `ConcluirAtividadeModal`), sem OutcomeCards

> **Crítico:** Follow-up de Negociação herda o template de “Negociar condições”, mas `metadata.acao = DESFECHO_FOLLOW_NEGOCIACAO`. Se a UI olhar só o template, mostra o desfecho errado e pode tentar avançar no lugar errado.

Atividades com ação de desfecho abrem `DesfechoAtividadeModal`. Demais usam conclusão direta / formulário leve.

---

# MAPA AÇÃO → UI (`DesfechoAtividadeModal` / conclusão)

| Ação | UI | Resultado típico |
|------|----|------------------|
| `DESFECHO_PRIMEIRO_CONTATO` | 3 OutcomeCards | Interesse→AVANCAR; Tentando→PERMANECER+follow; Sem interesse→LOST |
| `QUALIFICACAO_FORM` | Form: e-mail apresentação + sugestão agenda (+ anotação) | AVANCAR / LOST |
| `DESFECHO_RETORNO_EMAIL` | 3 OutcomeCards | Aceitou→AVANCAR; Acompanhar→follow; Recusou→LOST |
| `DESFECHO_DEMO` | **Form sondagem** (ver abaixo) + cards Quer proposta / Sem interesse | AVANCAR / LOST |
| `ANEXAR_PROPOSTA` | Input URL proposta | conclui / follow se acompanhando no desfecho seguinte |
| `DESFECHO_PROPOSTA` | 3 OutcomeCards | Aceitou / Acompanhar / Recusou |
| `DESFECHO_NEGOCIACAO` | 3 cards + **data retorno** se Aprovou/Continua | PERMANECER + cria Follow (**nunca** AVANCAR) |
| `DESFECHO_FOLLOW_NEGOCIACAO` | Mesmos 3 cards; data só se Continua | Aprovou→**AVANCAR**; Continua→novo follow; Sem fit→LOST |
| `CONFERIR_UFS_EXPANSAO` | Multi-select UFs realizadas | AVANCAR |
| `DESFECHO_FORMALIZACAO` | Docs recebidos? Sim/Não (+ fluxo pasta/chamado) | AVANCAR / permanecer |
| `REGISTRAR_CHAMADO_JURIDICO` | Input ID chamado | AVANCAR |
| `DESFECHO_CHAMADO_JURIDICO` | Chamado finalizado? | AVANCAR / follow |
| `DESFECHO_SOLICITACAO_CADASTRO` | Confirmar envio ao funil Ops | cria opp OPERACOES; **não** Won |
| `DESFECHO_RECUPERACAO_LEAD` | 3 OutcomeCards | Reativou / Ainda tentando / Sem interesse |
| `DESFECHO_SONDAGEM_EXPANSAO` | Canal, anotações, volumes (se volume), UFs novas, decisão UF/VOLUME/Standby | muda ramo |
| `OBSERVAR_FLUXO_EREGISTRO` | Conclusão / painel e-Registro | concluir |
| `DESFECHO_ABORDAGEM_VOLUME` | Marcar reunião / manter contato / standby | follow ou standby |
| `DESFECHO_REUNIAO_VOLUME` | Realizada / remarcar / standby | avança ou agenda |
| `DESFECHO_STANDBY_EXPANSAO` | Recuperado / em contato / manter standby | reabre ou permanece |
| `CONFIRMAR_BOAS_VINDAS_OPERACOES` | Confirmar e-mail enviado | AVANCAR |
| `DESFECHO_ACOMPANHAMENTO_REGISTROS` | Vai operar? + previsão | cria confirmação |
| `DESFECHO_CONFIRMACAO_INICIO_REGISTROS` | Sim → Won; Ainda não / reagendar | CLOSED_WON ou follow |
| `NENHUMA` / `CONFIRMAR_RETORNO` / `REGISTRAR_CONTATO` / `REGISTRAR_NOTA` | Modal conclusão leve (contato/nota) | PATCH status |

---

# FORMULÁRIO — REUNIÃO DE SONDAGEM (`DESFECHO_DEMO`)

Grid de campos **antes** dos OutcomeCards finais:

| Campo | Controle | Persistência |
|-------|----------|--------------|
| Volume de registros por mês | texto + checkbox **Sem estimativa** (`volumeEstimadoNaoInformado`) | `dadosQualificacao.volumeEstimado` |
| Registradoras contratadas | **`RegistradorasPicker`** (busca + checkboxes + chips) + **Não informado** | `registradoraIds[]` + `registradoras` (nomes join) + `registradorasNaoInformado` |
| Utiliza integração? | segmentado Sim/Não + Sem estimativa | `integracao` / `integracaoNaoInformado` |
| Valor mensal estimativa (R$) | número + Sem estimativa | metadata/`valorEstimadoMensal` + `semEstimativaValor` |
| Estados em que opera | texto (UFs separadas por vírgula/; ) | `estados` → também vira `ufsNegociadas` no desfecho |
| Diferenciais | texto | `diferenciais` |

OutcomeCards: **Cliente quer proposta** (AVANCAR) | **Sem interesse após a sondagem** (LOST).

**RegistradorasPicker — anatomia:**
- Label “Registradoras contratadas” + checkbox “Não informado”
- Se informado: chips das selecionadas (clique remove) + input busca + lista scrollável com checkbox (nome + CNPJ)
- Multi-select; lista vem de `GET /registradoras?search=`

---

# FORMULÁRIO — DRAWER REGISTRADORA (ADMIN)

Seções no drawer (scroll + footer Cancelar/Salvar):

**Identificação (obrigatórios: CNPJ, Nome empresarial)**
- CNPJ*
- Nome empresarial*
- Nome de fantasia
- Tipo: Matriz \| Filial
- Data de abertura
- Porte (ex.: DEMAIS, ME, EPP)
- Situação cadastral (ex.: ATIVA)

**Atividade econômica / natureza**
- CNAE principal: código + descrição
- CNAEs secundários: textarea, uma por linha `código - descrição`
- Natureza jurídica: código + descrição

**Endereço e contato**
- CEP (ViaCEP preenche logradouro/bairro/município/UF)
- Logradouro, Número, Complemento, Bairro, Município, UF (select)
- E-mail, Telefone

**Situação cadastral (extra)**
- Data da situação cadastral
- Motivo da situação cadastral
- Ente federativo responsável (EFR)
- Situação especial + data

Lista admin: colunas Nome | CNPJ | Situação | Editar/Remover. Busca por nome ou CNPJ.

---

# CONTATOS E NOTAS (UX)

**Contato (drawer/modal):** nome, cargo, e-mail, telefone, principal, **anotações** (textarea). Se houver anotações na criação/edição ligada à oportunidade, gera Nota vinculada ao contato.

**Aba Notas:**
- Nota comum: texto
- Nota de cadastro do contato: badge “Cadastro do contato”, bloco Contato + Anotação
- **Editar:** textarea da anotação **e** select para trocar o contato (ou “Sem contato”)

---

# WORKFLOW POR ESTÁGIO — referência para UI

## Aquisição

| Estágio | Atividades | Desfecho / comportamento |
|---------|------------|--------------------------|
| **Prospecção** | Pesquisar empresa; Realizar primeiro contato | Contato: Interesse → avança / Ainda tentando → follow / Sem interesse → perda |
| **Qualificação** | Registrar qualificação; Enviar apresentação comercial | Form qualificação; enviar = checkbox → avançar quando obrigatórias ok |
| **Apresentação comercial** | Acompanhar retorno do e-mail; Reunião de sondagem | E-mail: Aceitou / Acompanhando (follow) / Recusou → perda. Sondagem: Quer proposta → avança / Sem interesse → perda |
| **Proposta** | Gerar proposta; Enviar proposta | Anexar URL; Aceitou / Acompanhando / Recusou |
| **Negociação** | Negociar condições → **Follow-up: Negociação** | Negociar: Aprovou/Continua + **data retorno** → cria follow (não avança); Sem fit → perda. **Follow:** Aprovou → **avança** Fechamento; Continua + data → novo follow; Sem fit → perda |
| **Fechamento** | Conferir UFs → Formalização → Jurídico → Solicitação cadastro | Solicitar cadastro cria card **Operações** + alerta; **não** é Won |
| **Aguardando registros** | Acompanhamento → Cliente iniciou registro? | Sim → Won; Não / reagendar conforme desfecho |

## Expansão

| Estágio / ramo | Atividades principais | Comportamento |
|----------------|----------------------|---------------|
| **Mapeamento** | Observar fluxo e-Registro; Sondagem expansão | UF → Proposta; VOLUME → Sem contato; Standby → Standby |
| **UF: Proposta → Negociação → Fechamento** | Proposta / negociar + follow / conferir UFs (+ formalização/cadastro como Aquisição) | Mesmo padrão de Follow-up Negociação da Aquisição; handoff Ops no Fechamento |
| **VOLUME: Sem contato → Em contato → Negociando → Fechado** | Abordagem; reunião; negociar + follow; registrar volume | Mesmo padrão de Follow-up Negociação; depois Aguardando registros (gate Ops se aplicável) |
| **Standby** | Entrar em contato (D+30) | Reabrir ou permanecer |

## Operações — Cadastro

| Estágio | Atividades | Comportamento |
|---------|------------|---------------|
| **Cadastro** | Atender solicitação; criar usuário; e-mail boas-vindas | Avança para Cadastro realizado |
| **Cadastro realizado** | — | Libera comercial origem → **Aguardando registros** |

---

# PRINCÍPIOS DE UX

1. **Velocidade:** achar conta <10s; registrar atividade <30s.
2. **Contexto único:** página da oportunidade concentra atividades, notas, histórico, dossiê, progresso do estágio.
3. **Decisão explícita:** desfechos em cards clicáveis (não formulários genéricos para escolher sim/não).
4. **Menos atrito:** drawers para cadastros rápidos; modais para desfechos; página dedicada para oportunidade.
5. **Feedback claro:** barra de progresso do estágio (X/Y obrigatórias), badges, banner em perdidas / alerta Ops.
6. **Sem atalhos que quebram regra:** sem drag, sem avançar estágio manual, sem fechar perdida fora de desfecho.
7. **Fases na jornada:** quando a conta tem cadeia Aquisição → Ops → Expansão, a UI usa **sub-abas de fase** (Atual editável; anteriores read-only).

---

# DESIGN SYSTEM

**Tema:** claro, base slate/zinc, primária azul, verde = ganho/sucesso, vermelho = perda/perigo, âmbar = alerta/pendência.

**Componentes reutilizáveis:**

| Componente | Uso |
|------------|-----|
| `Badge` | Status conta, oportunidade, atividade, obrigatória, segmento, tipo expansão |
| `Avatar` | Owner (iniciais) |
| `Modal` | Desfechos, fechamento ganha, motivo perda |
| `Drawer` | Nova financeira, nova oportunidade/expansão, atividade avulsa |
| **`OutcomeCard`** | Card clicável no desfecho |
| **`MotivoPerdaSelect`** | Select motivos + “Outro” |
| `UfSelect` / picker UFs | Multi-select estados BR |
| **`RegistradorasPicker`** | Busca + checkboxes + chips; multi-select de registradoras contratadas (sondagem) |
| `FunilFiltrosBar` | Filtros do funil (owner, produto, etc.) |
| `AdminTabs` | Abas Usuários \| Registradoras dentro de Administração |
| `FasesSubTabs` | Sub-abas Atual / Aquisição / Expansão… |
| `JornadaStepper` / `JornadaExpansaoStepper` | Trilha visual do funil |
| Lista de atividades | Checkbox + badges + título + data |
| `WorkflowPanel` | Progresso do estágio; **não** botão “Fechar ganha” genérico no Fechamento — Won vive em Aguardando registros |
| Timeline | Histórico cronológico |
| Painéis Ops | `AtendimentoOperacoesPanel`, `DemandasOperacoesPanel`, forms com campos NA |

**OutcomeCard — anatomia:**
```
[●] Título principal          (ex.: "Cliente quer proposta")
    Subtítulo explicativo     (ex.: "Avançar para Proposta")
```
Cores: emerald (success), amber (warn), red (danger). Hover com borda/fundo suave.

---

# NAVEGAÇÃO (sidebar)

```
Alias CRM — Máquina de Receita
├── Dashboard
├── Base Mestre
├── Grupos
├── Funil              ← Aquisição | Expansão (rotas /funil/aquisicao, /funil/expansao)
├── Operações          ← /operacoes (abas Cadastro | Atendimento | Demandas)
├── Atividades         ← agenda comercial
├── Relatórios
├── Configurações funis (ADMIN / SUPERINTENDENTE)
└── Administração      (ADMIN) — abas: Usuários | Registradoras
```

Topo: avatar, nome, role, logout.

---

# TELAS (ESPECIFICAÇÃO DETALHADA)

## 1. Login
E-mail + senha. Erro claro. Redirect para Dashboard após sucesso.

## 2. Dashboard
Cards KPI + gráficos por perfil (comercial vs superintendente). Consumir `GET /dashboard/comercial`.

## 3. Base Mestre
Tabela densa: Razão Social, CNPJ, Grupo, Owner, Segmento Carteira, Status, Último/Próximo contato, Relacionamento. Filtros + busca. Hover: Ver conta, Criar oportunidade. **+ Nova Financeira** (drawer).

## 4. Conta (Financeira)
Abas: Resumo, Contatos, Oportunidades, Produtos, Atividades (timeline).

## 5. Grupos
CRUD grupos financeiros.

## 6. Funil Aquisição (Kanban + Lista)
- Colunas = estágios abertos (+ Ganhas | Perdidas conforme produto)
- **Kanban: cards clicáveis, SEM drag-and-drop**
- Card: financeira, produto, valor mensal, owner, badge alerta operações
- **+ Nova oportunidade** (drawer)

## 6b. Funil Expansão
- **Três visões** (tabs): Mapeamento | Aumento de UF | Aumento de volume
- Colunas conforme visão (ver vocabulário); Standby **não** é coluna principal das visões UF/VOLUME
- **+ Nova expansão** — pesquisa cliente `CLIENTE` na Base Mestre

## 7. Operações (`/operacoes`)

Três abas in-page:

| Aba | Conteúdo |
|-----|----------|
| **Cadastro** | Kanban/lista pipeline `OPERACOES` (Cadastro → Cadastro realizado). Cards do handoff comercial. Link para oportunidade origem. |
| **Atendimento** | Lista/CRUD de atendimentos (não é kanban de opp). |
| **Demandas** | Lista/CRUD de demandas + matriz dificuldade×impacto. |

## 8. Página da Oportunidade (`/oportunidades/:id`) — **TELA CENTRAL**

**Layout 2 colunas (70/30):**

### Sub-abas de fase (quando há cadeia)
`FasesSubTabs`: **Atual** (editável) | fases anteriores (read-only). Filtra atividades, notas, histórico e detalhes por fase.

### Coluna principal — abas
1. **Atividades** (default)
   - Toggle “Mostrar estágios anteriores”
   - Lista ordenada: checkbox, badges (tipo, status, Obrigatória, Rastreio recuperação)
   - Checkbox → desfecho ou conclusão direta
   - **+ Nova atividade** (só se ABERTA e fase atual)
   - Se **CLOSED_LOST** com follow recuperação: só essa atividade interativa

2. **Notas** — feed cronológico; notas de cadastro de contato mostram Contato + Anotação (badge “Cadastro do contato”); ao editar, permitir trocar o contato vinculado

3. **Histórico** — timeline eventos (inclui resultado da negociação, data de retorno e decisão do follow)

4. **Detalhes** — dossiê por fase (mais recente → mais antigo); Q&A de Negociação/Follow com resultado + data de retorno

5. **e-Registro / Operações** (quando aplicável) — painéis de produção/registro

### Coluna lateral
- **Progresso do estágio** (se ABERTA): barra X/Y, pendências
- Mensagem gate Ops: “Aguardando Cadastro realizado…” quando bloqueado
- **Detalhes:** estágio (texto), motivo, valor, previsão, UFs/volume, `tipoExpansao`, owner
- **Contatos** da financeira
- Stepper de jornada (Aquisição / Expansão)

### Banner condicional
- **Alerta operações:** encaminhado ao funil Ops + link
- **Perdida:** motivo, estágio da perda, destino se reativar

### Modais
- `DesfechoAtividadeModal` — desfechos (incl. sondagem expansão, volume, standby, recuperação, confirmação registros)
- `CloseWonModal` — quando o fluxo exigir confirmação adicional
- `NovaAtividadeModal`, `ConcluirAtividadeModal`, `ContatoModal`

---

## 9. Modal de Desfecho (`DesfechoAtividadeModal`)

**Estrutura padrão:** título da atividade → subtítulo → OutcomeCards ou formulário → footer.

**Perda (2 passos):** OutcomeCard vermelho → `MotivoPerdaSelect` → Confirmar perda.

**Exemplos de OutcomeCards:**

| Atividade | Verde | Âmbar | Vermelho |
|-----------|-------|-------|----------|
| Primeiro contato | Interesse → avança | Ainda tentando → follow | Sem interesse → perda |
| Retorno e-mail | Aceitou | Acompanhar → follow | Recusou → perda |
| Sondagem (Aq) | Quer proposta → avança | — | Sem interesse → perda |
| Sondagem expansão | UF / VOLUME | Standby | — |
| Proposta enviada | Aceitou | Acompanhar | Recusou |
| **Negociar condições** | Aprovou + **data retorno** → cria Follow | Continua + **data retorno** → cria Follow | Sem fit → perda |
| **Follow-up: Negociação** | Aprovou → **avança Fechamento** | Continua + data → novo Follow | Sem fit → perda |
| Recuperação lead | Reativou → próximo estágio | Ainda tentando | Sem interesse |
| Cliente iniciou registros? | Sim → Won | Ainda não / reagendar | — |

**Negociação — regra de UX:**
- Em **Negociar condições**, após escolher Aprovou ou Continua, exibir `input type="date"` **Data de retorno** (obrigatória) antes de concluir.
- Subtítulos: *não* dizer “Avançar para Fechamento” nesta atividade; dizer que agenda o follow-up.
- Em **Follow-up: Negociação**, “Cliente aprovou” *sim* diz “Avançar para Fechamento”; “Continua” exige nova data.

**Sondagem (Aquisição) — Registradoras contratadas:**
- Usar **`RegistradorasPicker`** (nunca input texto livre).
- Ver seção **FORMULÁRIO — REUNIÃO DE SONDAGEM** para o grid completo de campos.

**Formulários ricos:** qualificação (e-mail + agenda), sondagem completa, anexar proposta (URL), chamado jurídico (ID), volumes/UFs expansão, campos NA em Ops.

---

## 10. Fechamento Ganha
Fluxo principal: desfecho em **Aguardando registros** (“Cliente iniciou registros?”). Modal de ganho: data + UFs/volume conforme pipeline. API: produto contratado + CLIENTE + nova Expansão Mapeamento.

## 11. Atividades (agenda)
Seções: Atrasadas, Hoje, Próximos 7 dias. Filtros. Link conta/oportunidade.

## 12. Relatórios / Dashboard executivo
Funil, conversão, win rate, ranking, motivos, 50/30/20 (parcial hoje).

## 13. Administração (`/admin`) — **ADMIN**

Abas in-page (`AdminTabs`):

| Aba | Rota | Conteúdo |
|-----|------|----------|
| **Usuários** | `/admin` | CRUD usuários (nome, email, role, ativo) |
| **Registradoras** | `/admin/registradoras` | Ver seção **FORMULÁRIO — DRAWER REGISTRADORA**. Lista + busca + soft delete. |

> Registradoras **não** têm item próprio na sidebar — só dentro de Administração.

**Configurações de funis** (`/configuracoes`): SLAs / dias de follow-up (ADMIN / SUPERINTENDENTE) — item separado no menu.

---

# ESTADOS VAZIOS

- Funil vazio → “Criar primeira oportunidade / expansão”
- Sem atividades → “Nenhuma atividade registrada”
- Workflow sem pendências → “Todas as obrigatórias concluídas” (avanço via último desfecho / liberação Ops)
- Cadastro realizado Ops → mensagem de cadastro concluído (sem checklist)

---

# BACKEND E CONTRATO DE API (O QUE O FRONT PRECISA SABER)

> O Lovable **não** reimplementa o backend. Precisa entender **como a API está organizada** e **quais contratos chamar**, para plugar sem inventar regra de negócio.

## Arquitetura do backend (visão para o front)

```
apps/api (Fastify :3001)
├── lib/auth          → JWT access + refresh cookie httpOnly
├── modules/*         → um domínio por pasta (routes + schema Zod + service)
│   auth, usuarios, contas, contatos, grupos, registradoras,
│   oportunidades, atividades, notas, eventos (timeline),
│   atendimentos, demandas, notificacoes, configuracoes,
│   dashboard, relatorios
└── Prisma            → PostgreSQL (packages/database)
```

**Padrão de módulo:** `*.routes.ts` (HTTP) → `*.schema.ts` (Zod) → `*.service.ts` (regra + Prisma).  
Erros de domínio viram HTTP 4xx com `{ error: string, details? }`.

**Proxy Vite:** browser chama `/api/...` → Vite reescreve para `http://localhost:3001/...` (sem `/api` no servidor).

## Modelo mental dos dados (entidades que a UI usa)

| Entidade | Papel |
|----------|--------|
| **User** | Owner comercial / admin (`role`, `ativo`) |
| **Conta** | Financeira (CNPJ, razão social, segmento, status, grupo, endereço) |
| **Contato** | Pessoa da conta (`anotacoes` opcional) |
| **GrupoFinanceiro** | Agrupamento de contas |
| **Registradora** | Catálogo CNPJ para sondagem |
| **Oportunidade** | Card do funil (`pipeline`, `estagio`, `status`, `dadosQualificacao` JSON, UFs/volume…) |
| **WorkflowInstance + Template** | Checklist do estágio atual |
| **Atividade** | Item do checklist / follow (`templateItem?`, `metadata?`, `obrigatoria`) |
| **Nota** | Anotação da oportunidade (`contatoId?`) |
| **Event** | Auditoria; alimenta timeline junto com atividades/notas |
| **Atendimento / Demanda** | Ops (fora do kanban comercial) |
| **ProdutoContratado** | Atualizado no Won |

**Regras que vivem no backend (front só dispara):**
- Avanço de estágio quando desfecho = `AVANCAR` e obrigatórias ok
- Criação de follow-ups / Follow Negociação / recuperação
- `CLOSED_LOST` + motivo; `CLOSED_WON` + produto + conta CLIENTE + Expansão Mapeamento
- Soft delete (`deletedAt`)
- Escopo COMERCIAL = só registros do `ownerId`

## Auth

| Método | Path | Body / notas | Response |
|--------|------|--------------|----------|
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, user: { id, nome, email, role } }` + set cookie refresh |
| POST | `/auth/refresh` | cookie | idem `{ accessToken, user }` |
| POST | `/auth/logout` | — | limpa cookie |

Todas as demais rotas: header `Authorization: Bearer <accessToken>` + `credentials: 'include'`.

## Endpoints por domínio (contrato)

### Contas / Contatos / Grupos
| Método | Path | Uso no front |
|--------|------|----------------|
| GET | `/contas?search=&...` | Base Mestre |
| GET/POST/PUT/DELETE | `/contas/:id` | Conta detalhe / CRUD |
| GET | `/contas/:contaId/contatos` | Lista contatos |
| POST | `/contas/:contaId/contatos` | Criar contato (+ anotação→nota se opp) |
| PUT/DELETE | `/contatos/:id` | Editar/remover |
| GET/POST/PUT/DELETE | `/grupos` | Admin grupos |

### Registradoras
| Método | Path | Quem |
|--------|------|------|
| GET | `/registradoras?search=&ids=` | Qualquer autenticado (picker + admin) |
| GET | `/registradoras/:id` | Detalhe |
| POST/PUT/DELETE | `/registradoras` / `/:id` | **ADMIN** only |

Body create/update: campos do cartão CNPJ (`cnpj`, `nomeEmpresarial`, opcionais…). Soft delete no DELETE.

### Oportunidades (núcleo do funil)
| Método | Path | Uso |
|--------|------|-----|
| GET | `/oportunidades?pipeline=&status=&ownerId=&search=` | Funil / listas |
| GET | `/oportunidades/:id` | Página detalhe (inclui conta, owner, dadosQualificacao…) |
| POST | `/oportunidades` | Nova opp / expansão |
| PUT | `/oportunidades/:id` | Editar campos |
| GET | `/oportunidades/:id/workflow` | Progresso X/Y do estágio |
| GET | `/oportunidades/:id/timeline` | Histórico |
| **POST** | **`/oportunidades/:id/desfecho`** | **Motor do funil** (ver abaixo) |
| PATCH | `/oportunidades/:id/estagio` | Existe, mas UI **não** usa para avanço manual |
| PATCH | `/oportunidades/:id/closed-won` | Modal ganho (quando fluxo pedir) |
| PATCH | `/oportunidades/:id/closed-lost` | Preferir perda via desfecho |
| PATCH | `/oportunidades/:id/previsao-fechamento` | Editar previsão |
| PATCH | `/oportunidades/:id/owner` | Transferência (não-COMERCIAL) |
| PATCH | `/oportunidades/:id/reabrir-standby` | Standby |
| DELETE | `/oportunidades/:id` | Soft delete |

### Desfecho — contrato detalhado

`POST /oportunidades/:id/desfecho`

```ts
{
  atividadeId: string
  resultado: 'AVANCAR' | 'PERMANECER' | 'LOST'
  concluirAtividade?: boolean          // default: true se não for PERMANECER
  criarFollowUp?: boolean              // follows D+N (contato, e-mail, proposta…)
  criarFollowNegociacao?: boolean      // cria Follow-up: Negociação
  dataRetorno?: string                 // ISO datetime — obrigatório se criarFollowNegociacao
  metadata?: Record<string, unknown>   // aprovou, negociacaoResultado, rodada, tentativa…
  dadosQualificacao?: Record<string, unknown>  // merge no JSON da opp
  motivoPerda?: string                 // obrigatório se LOST
  // opcionais frequentes:
  valorEstimadoMensal?, ufsNegociadas?, ufsPretendidas?, ufsRealizadas?,
  propostaPdfUrl?, chamadoJuridicoId?, tipoExpansao?,
  dataReuniaoVolume?, dataPrevisaoInicioRegistros?, dataPrimeiroRegistro?,
  volumeAtual?, volumePretendido?, volumeNegociado?,
  criarOportunidadeOperacoes?, operacoesOwnerId?, criarAtividades?[]
}
```

**Response:** oportunidade atualizada (mesmo shape do GET by id).  
Front deve **recarregar** oportunidade + atividades + workflow após sucesso.

**Negociação (obrigatório):**
- `DESFECHO_NEGOCIACAO` + aprovou/continua → `resultado: 'PERMANECER'`, `criarFollowNegociacao: true`, `dataRetorno`, `metadata.negociacaoResultado` — **nunca** `AVANCAR`
- `DESFECHO_FOLLOW_NEGOCIACAO` + aprovou → `resultado: 'AVANCAR'`
- Continua no follow → novo `criarFollowNegociacao` + nova `dataRetorno`
- Sem fit → `LOST` + `motivoPerda`

Backend rejeita `AVANCAR` em `DESFECHO_NEGOCIACAO` (400).

### Atividades / Notas / Timeline
| Método | Path | Uso |
|--------|------|-----|
| GET | `/atividades?oportunidadeId=&contaId=&...` | Lista opp / agenda |
| POST | `/atividades` | Atividade avulsa |
| PATCH | `/atividades/:id/status` | Conclusão simples (`NENHUMA`) |
| GET | `/oportunidades/:id/notas` | Aba notas |
| POST | `/oportunidades/:id/notas` | `{ texto, contatoId? }` |
| PUT | `/notas/:id` | `{ texto, contatoId? }` — trocar contato |
| GET | `/oportunidades/:id/timeline` | Histórico (ATIVIDADE \| EVENTO \| NOTA) |
| GET | `/contas/:id/timeline` | Timeline da conta |

Atividade tipicamente traz: `id, titulo, tipo, status, dataHora, obrigatoria, metadata, templateItem: { acao, titulo, ordem }, owner…`

### Ops / Config / Outros
| Método | Path | Uso |
|--------|------|-----|
| GET/POST | `/atendimentos` | Aba Atendimento |
| GET/POST | `/demandas` | Aba Demandas |
| GET | `/notificacoes`, PATCH `/:id/lida` | Sino |
| GET/PUT | `/configuracoes/cadencia` | Dias de follow-up por ação |
| GET | `/usuarios`, `/usuarios/select` | Admin / selects de owner |
| GET | `/dashboard/comercial` | Dashboard |
| GET | `/relatorios/*` | Relatórios (+ `/export`) |
| GET | `/health` | Healthcheck (sem auth) |

## Shapes que o front tipa em `types.ts` (não reinventar)

- `AuthUser`, `Conta`, `Contato`, `Oportunidade` / `OportunidadeListItem`
- `AtividadeListItem` (+ `templateItem`, `metadata`)
- `DadosQualificacao` (bag: `registradoraIds`, `registradoras`, flags `*NaoInformado`, expansão, recuperação…)
- `AcaoAtividade`, `WorkflowAtual`, `Registradora`, `Nota`, timeline items

Datas na API: **ISO string**. Dinheiro pode vir string/number — formatar no front (`format.ts`).

## Erros

```json
{ "error": "Mensagem legível", "details": { } }
```

Status comuns: 400 validação/regra, 401 auth, 403 RBAC, 404, 409 conflito (ex.: CNPJ duplicado). UI: toast/`ApiError.message`.

## O que o front NÃO deve reimplementar

- Cálculo de próximo estágio / instanciar workflow
- Cadência D+N de follow (lê de config no backend)
- Soft delete e escopo por owner
- Side-effects do Won/Lost (produto, conta, expansão, recuperação)

Front = **orquestra UI + chama o contrato certo + refetch**.

---

# O QUE **NÃO** FAZER (decisões de produto já tomadas)

- ❌ Drag-and-drop no kanban
- ❌ Botão “Avançar estágio” manual
- ❌ Botão “Fechar perdida” no header
- ❌ Select para mudar estágio manualmente
- ❌ Mensagens “Conclua antes: …” bloqueando checkbox
- ❌ Follow-up automático ao concluir “Gerar proposta” sem link
- ❌ Tratar Cadastro realizado Ops como Closed Won
- ❌ Inventar coluna “Relacionamento” — usar **Atendimento** + **Demandas**
- ❌ Avançar o funil em **Negociar condições** (só o **Follow-up: Negociação** avança)
- ❌ Texto livre para Registradoras contratadas na sondagem — usar catálogo + multi-select
- ❌ Item “Registradoras” solto na sidebar (fica sob Administração)
- ❌ Backend/Supabase no Lovable

---

# FORA DE ESCOPO

Marketing/MQL, WhatsApp/discador integrado, BI embed, D4Sign, automações externas profundas. OTRS = campo texto / ID de chamado quando necessário.

---

# ENTREGÁVEL

SPA navegável, design system consistente (`OutcomeCard`, `MotivoPerdaSelect`, `FasesSubTabs`, `RegistradorasPicker`, filtros), RBAC visual, services tipados, **fluxo activity-driven** fiel ao backend.

**Priorize polish de:** Funil (Aquisição + Expansão com 3 visões) e Página da Oportunidade (atividades + desfechos, sobretudo Negociação/Follow e Sondagem).

**Aceite mínimo de qualidade:**
- Kanban sem drag; estágio só como badge/texto
- Checkbox de atividade abre o desfecho certo via `resolveAcaoAtividade`
- Negociar condições **nunca** avança estágio; Follow com “Cliente aprovou” avança
- Sondagem usa RegistradorasPicker (multi)
- Admin tem abas Usuários | Registradoras (sem item Registradoras na sidebar)
- Perda sempre com MotivoPerdaSelect

**Referências de comportamento (se o código do monorepo estiver disponível):**
- Página opp / desfecho / funil / picker / admin registradoras / `domain.ts` / seed de workflows
- Spec de produto: `CRM - Arquitetura da Máquina de Receita.md`

Se o Lovable **não** tiver acesso ao monorepo, trate **este arquivo** como fonte da verdade — em especial **ARQUITETURA DO FRONT** + **BACKEND E CONTRATO DE API** — e mocke a API nesse formato até plugar em `apps/api`.
