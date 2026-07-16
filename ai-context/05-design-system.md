# 05 — Design System

Fonte: classes Tailwind em `apps/web` (especialmente `Layout`, `Modal`, `Drawer`, `Badge`, `FunilPage`, `DesfechoAtividadeModal`). Não há design tokens em CSS variables dedicados — `styles.css` só importa Tailwind.

## Direção visual atual

- Fundo app: `bg-slate-100`, texto `text-slate-900`
- Superfícies: `bg-white`, bordas `border-slate-200`
- Marca/accent: azul (`text-blue-600`, ativo nav `bg-blue-50 text-blue-700`)
- Sidebar: `w-60`, branco, borda direita
- Tipografia: stack default Tailwind (sem fonte display custom no código atual)

## Layout shell

```
flex min-h-screen
  aside w-60 | main flex-1
  header border-b | main px-8 py-8
```

Brand no aside: eyebrow `Alias CRM` (uppercase tracking) + subtítulo `Máquina de Receita`.

## Modal

- Overlay: `fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm`
- Panel: `rounded-2xl bg-white shadow-2xl`
- Larguras: sm `max-w-sm`, md `max-w-md`, lg `max-w-2xl`
- Header `border-b border-slate-100`; footer opcional `border-t`

## Drawer

- `fixed inset-0 z-40 flex justify-end`
- Overlay igual ao modal
- Aside: `h-full w-full max-w-md bg-white shadow-2xl`

## Inputs padrão (padrão MotivoPerdaSelect / forms)

```
rounded-lg border border-slate-300 px-3 py-2 text-sm
focus:border-blue-500 focus:ring-2 focus:ring-blue-100
label: text-sm font-medium text-slate-700
hint: text-xs text-slate-400
```

## Badge

Base: `inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset`

Tones: green, blue, gray, amber, red, violet, teal.

Exports especializados: StatusContaBadge, SegmentoCarteiraBadge, StatusRelacionamentoBadge, ClienteReceptivoBadge, OperacoesOrigemBadges.

## OutcomeCard (desfecho)

Botão full-width: `rounded-xl border bg-white px-4 py-3`, variantes success | primary | warn | danger com hover/selected ring por variante + bolinha de cor.

## Funil / kanban

- Coluna: `w-72`, `rounded-xl border border-slate-200 bg-slate-50`
- Card: `rounded-lg border bg-white p-3 shadow-sm hover:border-blue-300`
- Toggle visão: `inline-flex rounded-lg border bg-white p-1`
- Empty/erro: painéis `rounded-xl border bg-white` texto centralizado

## Botões (padrão observado)

- Primário: azul (bg-blue-*) em CTAs
- Secundário: `border border-slate-200 text-slate-600 hover:bg-slate-100`
- Perigo: tons red em LOST / delete

## Avatar

Iniciais do nome (componente `Avatar`).

## Ícones / motion

Sem biblioteca de ícones centralizada documentada no código explorado; motion mínima (transitions Tailwind).

## Anti-padrões neste design system

Não introduzir tema purple-on-white, cream+serif, ou dark mode sem alinhamento — o app atual é **slate + blue claro**.
