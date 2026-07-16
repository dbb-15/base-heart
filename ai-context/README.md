# AI Context — CRM Alias

Documentação **gerada a partir do código** deste repositório. Destinada a IAs (Cursor, Lovable, etc.) e humanos que precisam de contexto vivo do sistema.

## Arquivos

| Arquivo | Conteúdo |
|---------|----------|
| [01-architecture.md](./01-architecture.md) | Monorepo, stack, padrão de módulos, bootstrap |
| [02-business-rules.md](./02-business-rules.md) | Pipelines, estágios, desfecho, RBAC, soft delete |
| [03-api-reference.md](./03-api-reference.md) | Endpoints, auth, payloads, erros |
| [04-frontend-context.md](./04-frontend-context.md) | Telas, serviços, filtros, validações de UI |
| [05-design-system.md](./05-design-system.md) | Tokens e padrões visuais do `apps/web` |
| [06-navigation.md](./06-navigation.md) | Rotas hash e sidebar por role |
| [07-domain-glossary.md](./07-domain-glossary.md) | Entidades, enums, relacionamentos |

## Regras

1. **Não inventar.** Só o que existe em `apps/`, `packages/`.
2. **Regenerar** quando o backend/frontend mudar (não manter à mão).
3. Documentos de produto legados na raiz (`Arquitetura.md`, `UX-UI-Lovable.md`, etc.) são fontes humanas; este folder é a fonte **derivada do código**.

## Como regenerar

No Cursor, a partir da raiz do repo (local ou Azure DevOps MCP):

```text
Backend/frontend mudou. Regenere todos os arquivos em /ai-context
lendo apenas o código. Não invente endpoints, enums ou regras.
```
