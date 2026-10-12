# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, and others) working in this repository. `CLAUDE.md` imports this file, so keep this as the single source of truth.

## What this is

A DHIS2 custom app (built on the [DHIS2 Application Platform](https://github.com/dhis2/app-platform)) for viewing, testing and debugging DHIS2 program rules. A user picks a program, opens its registration/event forms, fills them in, and watches program rules evaluate live (hide/show fields and sections, assignments, mandatory, warnings/errors, feedback and indicator messages). Supports DHIS2 2.40 to 2.43 (see `d2.config.js`).

It consumes five sibling libraries as regular npm dependencies, all published from the separate [`dhis2-form-utils`](https://github.com/nnkogift/dhis2-form-utils) monorepo and versioned in lockstep with this app. **File issues/PRs against the rule engine, hooks, widgets or devtools there, not here.**

- `@nnkogift/dhis2-form-utils-hooks`: `useEventProgramMetadataQuery`, `useTrackerMetadataQuery`, `useEventForm`, `FormStateProvider`, `useFieldControl`, `useFieldRuleEffect`, `useFormFeedback`, `useRuleEffectTrace`
- `@nnkogift/dhis2-form-utils-metadata`: program/program-stage metadata shaping (`selectProgramStage`, `resolveFormSectionLayout`, option group resolution, `ProgramRuleActionType`, metadata types)
- `@nnkogift/dhis2-form-utils-rules`: rule engine runtime types and helpers (`RuleEventInput`, `RuleSupplementaryDataInput`, `feedbackItemKey`, `filterPayload`)
- `@nnkogift/dhis2-form-utils-dhis2-ui`: `D2FieldWidget`, the `@dhis2/ui`-backed field renderer
- `@nnkogift/dhis2-form-utils-devtools`: rule inspection (`RulesPanel`, `RuleDevtoolsScope` from `/scope`, `createLabelLookup`, `getEffectVariant`, `getEffectVisual`, `EFFECT_ICONS`)

This app's own code is thin: routing, DHIS2 API queries (programs list, org units, current-user supplementary data, option groups), UI chrome around the library-produced forms, and tracker/event submission payloads.

## Commands

```bash
pnpm install
pnpm dev                       # d2-app-scripts start, proxied against https://dhis.rufaa.co.tz
pnpm build                     # production build -> build/ (+ build/bundle/*.zip)
pnpm test                      # d2-app-scripts test (Jest)
pnpm typecheck                 # tsc --noEmit (strict mode)
pnpm lint                      # eslint + `prettier -c .`
pnpm format                    # prettier -w .
pnpm changeset                 # add a changeset for the next release
```

Run a single test file or pattern via the underlying Jest CLI, e.g.:

```bash
pnpm test -- src/modules/program-playground/hooks/usePublishFormValues.test.ts
pnpm test -- -t "some test name"
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test and build as separate jobs on pushes and PRs to `main`, `alpha` and `beta`. `deploy.yml` and `release.yml` handle deployment and Changesets releases.

## Source layout

```
src/
  AppWrapper.tsx               # routes (entry point)
  SyncUrlWithGlobalShell.tsx
  About.tsx
  modules/
    program-list/              # components, hooks, pages, schemas, utils
    program-playground/        # components (forms/, rules/), hooks, pages, schemas, utils
  shared/                      # cross-module components and types (e.g. shared/types/program.ts)
```

`@/*` maps to `src/*` (configured in both `tsconfig.json` and `jest.config.js`). DHIS2 API responses and form payloads are validated with Zod schemas in each module's `schemas/` folder (and `utils/trackerPayloads.ts`). Repeated string values live in `as const` objects (e.g. `PROGRAM_TYPE`, `PROGRAM_TYPE_FILTER`).

## Architecture

### Routing (`src/AppWrapper.tsx`)

`HashRouter` with three lazily loaded routes: `/` (program list), `/programs/:programId` (playground for one program), `/about`. `SyncUrlWithGlobalShell` keeps the DHIS2 global app shell's URL bar in sync with the hash router.

### Program list flow (`modules/program-list/`)

- `ProgramListPage` reads/writes list state (search, type filter, page, pageSize) via `useProgramListParams`, which serializes to URL search params (see `buildProgramListUrl.ts` for the param<->URL mapping and defaults).
- `usePrograms` runs `useDataQuery` against the `programs` resource and validates the response with `programsResponseSchema`; `buildProgramFilters` turns search/type into DHIS2 `filter` query params; `resolveProgramListItem` maps raw items to `Program`.
- Selecting a program in `ProgramListTable` navigates to `/programs/:id`, passing the current list params through router `state` so the "back to list" link (`buildProgramListUrl`) restores it.

### Program playground flow (`modules/program-playground/`)

`pages/ProgramPage` loads program metadata via `useEventProgramMetadataQuery`, accessible org units via `useAccessibleOrgUnits`, current-user supplementary data (`userGroups`/`userRoles`, required by the rule engine) via `useCurrentUserSupplementaryData`, and option-group codes referenced by rules via `useOptionGroupsSupplementaryData`. `ProgramContextBar` sets org unit, the primary date (enrollment or event date) and a reset (`useProgramPlaygroundState` bumps a `resetKey` that remounts the forms). It then branches on `program.programType`:

- **`WITHOUT_REGISTRATION`** (event program): renders a single `ProgramStageFormScreen` for the first program stage.
- **`WITH_REGISTRATION`** (tracker program): renders `components/forms/TrackerProgramShell`, the more complex piece:
    - Loads tracker-specific metadata (`useTrackerMetadataQuery`): TEAs, sections, tracked entity type.
    - State lives in a per-shell zustand + immer store (`utils/trackerFormsStore.ts`, provided via `components/trackerFormsStoreContext.tsx`): selected slot, draft events per repeatable stage, registration values and per-slot event values.
    - `components/EnrollmentRail` (left nav, with `RailRow` and `RepeatableStageGroup`) switches between the registration form and program-stage event forms. Repeatable stages can hold multiple draft events added via the store's `addEvent`; slots are identified by `TrackerSlot`/`slotKey` (`utils/trackerSlot.ts`).
    - **All rendered forms stay mounted simultaneously** (visibility toggled with `hidden` CSS, not conditional rendering) so switching rail rows never discards in-progress input in another form. `TrackerStageFormSlot` fixes each event's date at first render for the same reason.
    - Each form pushes its live values to the store via `usePublishFormValues` (debounced 150ms, uses RHF's `form.subscribe`, not `watch`) so sibling forms see them as `enrollment`/`events` rule-engine inputs. This is what lets a rule on an event form react to a value entered in the registration form, and vice versa.
    - `selectEventsExcludingSlot` in `trackerFormsStore.ts` shapes per-slot values into `RuleEventInput[]`, excluding the form's own slot. A `WeakMap` cache keeps unchanged entries referentially stable, and each `TrackerStageFormSlot` subscribes with `useShallow`, so a keystroke in one form does not re-render the others.

### Rule-aware rendering (`modules/program-playground/components/rules/`)

- `RuleAwareField` wraps every metadata-driven field: pulls `useFieldControl`/`useFieldRuleEffect` from `-hooks`, renders the field's own label (blanking the widget's built-in label to avoid duplication, then wiring `aria-labelledby` back onto whatever DOM node the widget rendered; see the comment in that file for why), a `FieldEffectBadge` when a rule is affecting the field, and either the real `D2FieldWidget` or a `HiddenFieldPlaceholder`/nothing depending on `RuleDisplayContext`'s `ghostsEnabled` flag.
- `RuleDisplayContext` / `GhostToggleButton` control whether rule-hidden fields/sections render as dashed "ghost" placeholders (`HiddenFieldPlaceholder`, `HiddenSectionPlaceholder`) or are omitted entirely.
- `RuleOutputColumn` is the sticky sidebar with separate Feedback and Indicators `RuleOutputCard`s, built from `useFormFeedback`. Each item resolves back to the rule that produced it via `useRuleEffectTrace(feedbackItemKey(item))` + `-devtools`' `createLabelLookup`.
- `LazyRulesPanel` lazy-loads the devtools `RulesPanel` (rule list, trace and dependency graph) with `RulesPanelFallback` as the Suspense fallback. Forms wrap their content in `RuleDevtoolsScope` so the panel can read the form store.

### Forms (`modules/program-playground/components/forms/`)

`ProgramRegistrationForm`/`ProgramEventForm` are the RHF-backed forms wired to the rule engine through `-hooks` (`useEventForm`, `FormStateProvider`). `EventFormFields`/`RegistrationFormFields` lay out `RuleAwareField`s inside `FormSectionCard`s per `-metadata`'s section/data-element resolution (`resolveFormSectionLayout`, `getProgramStageSectionDataElementIds`). On save, values pass through `-rules`' `filterPayload` (drops rule-hidden values), are validated with the Zod schemas in `utils/trackerPayloads.ts`, and are turned into DHIS2 tracker payloads (`buildEventPayload`, `buildTrackerRegistrationPayload`) posted to the `tracker` resource. Payload building is app-local, not part of the shared libraries. DHIS2 errors are parsed/formatted by `utils/parseDhis2Error.ts` and `utils/formatDhis2Error.ts`.

### Testing

Jest + Testing Library; tests sit next to the code as `*.test.ts(x)`. `usehooks-ts` ships ESM-only and is deliberately carved out of the default `transformIgnorePatterns` in `jest.config.js` (pnpm nests it under `.pnpm/`, hence the lookahead pattern). Don't "fix" that by reverting to the default ignore list.

### Releases

Changesets with conventional commits (`changeset-conventional-commits`); keep the `@nnkogift/dhis2-form-utils-*` versions in `package.json` aligned with each other. `pnpm-workspace.yaml` exempts those packages from pnpm's minimum release age so fresh alphas can be installed.
