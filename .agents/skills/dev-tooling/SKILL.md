---
name: dev-tooling
description: "Gift's non-negotiable development tools and their correct configuration. ALWAYS load this skill when initializing a project, adding dependencies, configuring linting, formatting, testing, CI/CD, Docker, databases, auth, notifications, or email, or when any of these tools are mentioned: Bun, Biome, ESLint, Prettier, Fallow, Playwright, Vitest, Docker, Prisma, PostgreSQL, GitHub Actions, TanStack Query, React Hook Form, Zod, lodash-es, better_auth, Novu, react-email, pg-boss, RabbitMQ. Also load when someone asks what tools to use for a given problem."
---

# Dev Tooling

These tools are non-negotiable. Do not suggest alternatives. Do not introduce tools from outside this list without
explicit approval. When starting any project, set these up first before writing feature code.

---

## Runtime & Package Management

| Context                                     | Tool                                   |
| ------------------------------------------- | -------------------------------------- |
| All JavaScript/TypeScript projects          | **Bun**                                |
| DHIS2 projects (app platform & app runtime) | **pnpm** (required by DHIS2 toolchain) |

- `bun.lock` is the lock file — commit it, never delete it
- Bun workspaces are configured via the `workspaces` field in the root `package.json` — no separate workspace file
  needed
- Never mix package managers in the same repo — lock file wins
- Bun is also the test runner (`bun test`) and build tool (`bun run build`, `bun build`) for all non-DHIS2 projects —
  don't reach for a separate runner/bundler where Bun already covers it
- Always track the latest stable version of every tool in this document — don't pin to an old major version out of
  habit; run upgrades regularly instead of freezing on first install

---

## Linting & Formatting

**Tool: Biome** for all projects — replaces ESLint + Prettier

```bash
bun add -d @biomejs/biome
```

```json
// biome.json — root of every project
{
    "$schema": "https://biomejs.dev/schemas/latest/schema.json",
    "linter": {
        "enabled": true,
        "rules": {
            "recommended": true,
            "suspicious": {
                "noExplicitAny": "error"
            },
            "correctness": {
                "noUnusedVariables": "error"
            }
        }
    },
    "formatter": {
        "enabled": true,
        "indentStyle": "space",
        "indentWidth": 2,
        "lineWidth": 100
    },
    "javascript": {
        "formatter": {
            "quoteStyle": "single",
            "trailingCommas": "es5",
            "semicolons": "always"
        }
    }
}
```

- CI pipeline fails on any Biome lint or format error
- VSCode extension: `biomejs.biome` — set Biome as the default formatter in workspace settings
- `bun biome check --write .` as the pre-commit format step

### DHIS2 exception

DHIS2 apps keep **ESLint v9 (flat config) + Prettier** — the DHIS2 App Platform toolchain assumes them, don't swap in
Biome for these projects.

```js
// eslint.config.js — DHIS2 apps only
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'

export default [
    js.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: { '@typescript-eslint': tsPlugin },
        languageOptions: {
            parser: tsParser,
            parserOptions: { project: true },
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
        },
    },
    prettierConfig,
]
```

```json
// .prettierrc — DHIS2 apps only
{
    "singleQuote": true,
    "trailingComma": "es5",
    "semi": true,
    "printWidth": 100,
    "tabWidth": 2
}
```

- VSCode extensions: `dbaeumer.vscode-eslint` + `esbenp.prettier-vscode`
- `pnpm eslint --fix . && pnpm prettier --write .` as the pre-commit format step

---

## Codebase Intelligence

**Tool: Fallow** — static analysis for TypeScript/JavaScript apps (free, open source, Rust-native, zero config)

```bash
bun add -d fallow
```

What it finds:

- **Dead code** — unused files, exports, types, and dependencies
- **Duplication** — repeated logic across the codebase
- **Health** — complexity hotspots and refactor targets
- **Architecture** — boundary drift between modules

Key commands:

```bash
fallow               # dead code + duplication + health summary
fallow dead-code     # cleanup candidates
fallow dupes         # repeated logic
fallow health        # complexity + refactor targets
fallow fix --dry-run # preview automatic cleanup
```

- Run `fallow --summary` before submitting a PR — catches dead code introduced by AI-generated changes
- CI runs `fallow dead-code` as a soft check; add `--fail-on-count 1` to make it blocking
- Fallow exposes an MCP server via `node_modules/.bin/fallow --mcp` for Claude Code integration

---

## Testing

| Layer                   | Tool                                   |
| ----------------------- | -------------------------------------- |
| Unit & integration      | **Vitest**                             |
| End-to-end              | **Playwright**                         |
| React component testing | **@testing-library/react** with Vitest |

- Never Cypress, never Jest (Vitest is a drop-in with better DX)
- Test files co-located beside the file they test: `invoice.utils.test.ts` next to `invoice.utils.ts`
- E2e tests live in `e2e/` at the project root
- CI runs unit tests and e2e tests in separate jobs — e2e never blocks unit test feedback

```ts
// vitest.config.ts baseline
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
    },
})
```

---

## Database

| Concern           | Tool                    |
| ----------------- | ----------------------- |
| Database          | **PostgreSQL** (always) |
| ORM               | **Prisma**              |
| Schema migrations | **Prisma Migrate**      |
| Local dev DB      | **Docker Compose**      |

- Never raw SQL unless Prisma genuinely cannot express the query
- Schema changes always go through `prisma migrate dev` — never manual ALTER TABLE
- `prisma/schema.prisma` is the single source of truth for the data model
- Seed scripts live in `prisma/seed.ts`

```yaml
# docker-compose.yml — local dev services
services:
    db:
        image: postgres:alpine
        environment:
            POSTGRES_DB: appdb
            POSTGRES_USER: appuser
            POSTGRES_PASSWORD: apppassword
        ports:
            - '5432:5432'
        volumes:
            - pgdata:/var/lib/postgresql/data
volumes:
    pgdata:
```

---

## Containerization

**Tool: Docker** with multi-stage builds

```dockerfile
# Pattern for Bun-based apps (Next.js, API servers, etc.)
FROM oven/bun:alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

> DHIS2 projects use a pnpm-based Dockerfile — see the DHIS2 app development skill.

- `.env` files are never copied into images — environment injected at runtime via Docker or orchestrator
- Always track the latest stable image tag (e.g. `oven/bun:alpine`, `postgres:alpine`) — don't pin to an old
  major/minor version out of habit
- `.dockerignore` excludes `node_modules`, `.next`, `.env*`, `*.log`

---

## CI/CD

**Tool: GitHub Actions** (only)

Standard pipeline structure:

```text
lint → type-check → unit-test → build → e2e → deploy
```

```yaml
# .github/workflows/ci.yml baseline
name: CI
on: [push, pull_request]
jobs:
    lint:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: oven-sh/setup-bun@v2
            - run: bun install --frozen-lockfile
            - run: bun biome ci .

    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: oven-sh/setup-bun@v2
            - run: bun install --frozen-lockfile
            - run: bun test --run
```

- DHIS2 CI workflows keep the `pnpm eslint .` / `pnpm prettier --check .` steps instead of Biome
- Secrets live in GitHub Environments — never hardcoded, never in `.env` committed to the repo
- Deployment jobs have `environment: production` set to require manual approval on sensitive deploys
- Cache `node_modules` via `actions/cache` keyed on `bun.lock` hash

---

## Frontend (React / Next.js)

| Concern                      | Tool                                         |
| ---------------------------- | -------------------------------------------- |
| Server state & data fetching | **TanStack Query** (`@tanstack/react-query`) |
| Forms                        | **React Hook Form** (`react-hook-form`)      |
| Schema validation            | **Zod**                                      |
| Form + Zod bridge            | `@hookform/resolvers/zod`                    |
| Utility functions            | **lodash-es**                                |

### TanStack Query Setup

```ts
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})
```

### React Hook Form + Zod Pattern

```ts
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email(),
})

type FormValues = z.infer<typeof schema>

export const useContactForm = () => {
    return useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', email: '' },
    })
}
```

### lodash-es Usage

- Import individual functions to preserve tree-shaking: `import { groupBy, debounce } from 'lodash-es'`
- Never `import _ from 'lodash-es'` and use `_.method()` — always named imports
- Use for: collection transforms (`groupBy`, `keyBy`, `chunk`, `uniqBy`), `debounce`/`throttle`, `cloneDeep`, `merge`,
  `omit`, `pick`

---

## Authentication

**Tool: better_auth** for new projects requiring authentication

- Configure in `lib/auth.ts` (server) and `lib/auth-client.ts` (client)
- Session strategy: database sessions (not JWT) for revocability
- Always use the `better_auth` adapter for Prisma — do not write auth tables manually
- Social providers configured via environment variables only
- Verification, password reset, and other auth emails are built with **react-email** components — see
  Transactional Email below

---

## Notifications

**Tool: Novu** for multi-channel notification infrastructure (in-app, email, push, SMS)

- Use Novu workflows to orchestrate notification steps rather than hand-rolling per-channel dispatch logic
- Notification templates and channel routing live in the Novu dashboard/workflow definitions, not scattered across
  application code
- Trigger workflows from the backend via the Novu SDK using an idempotent event/subscriber identifier
- Reach for Novu whenever a project needs more than a single one-off email — anything with in-app, push, or
  multi-channel delivery

---

## Transactional Email

**Tool: react-email** for composing email templates

- Templates live under `emails/` and are written as React components — no raw HTML strings
- Render with `@react-email/render` before handing off to the sending provider (directly, or as the email step in
  a Novu workflow)
- Use `react-email` for every transactional email in a project — auth flows via better_auth, notification emails
  via Novu, and any other system email

---

## Message Queues (Backend Pipelines)

**Tool: RabbitMQ** (for pipeline orchestration, e.g. CAPS)

- One queue per pipeline step — not a single shared queue
- Dead letter exchange configured on all queues
- Messages are idempotent — processing the same message twice must be safe
- Connection managed via a singleton with reconnect logic

---

## Queue / Background Jobs (Lightweight)

**Tool: pg-boss** (when RabbitMQ is overkill — simple job queues in a single service, backed by Postgres)

```bash
bun add pg-boss
```

- Uses the project's existing PostgreSQL database as the backing store — no separate Redis instance to provision
- Always define job types with Zod schemas
- Separate worker processes from the main API server
