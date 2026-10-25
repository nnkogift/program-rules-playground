# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, and others) working in this repository. `CLAUDE.md` imports this file, so keep this as the single source of truth.

## What this is

A DHIS2 custom app (built on the [DHIS2 Application Platform](https://github.com/dhis2/app-platform)) for viewing, testing and debugging DHIS2 program rules. A user picks a program, opens its enrollment and event forms, fills them in, and watches program rules evaluate live (hide/show fields and sections, assignments, mandatory, warnings/errors, feedback and indicator messages). Supports DHIS2 2.40 to 2.43 (see `d2.config.js`).

**The app never saves data.** Its only data write call is the tracker importer dry run (`importMode=VALIDATE`) in `hooks/useServerVerification.ts`, which runs the server's rule engine and validation and persists nothing. One exception lives in the libraries: FILE_RESOURCE and IMAGE field widgets (`-dhis2-ui`, via `useFileResourceUpload` in `-hooks`) upload a picked file immediately with `POST fileResources`, leaving an unassigned file resource on the server. The user docs say so. Keep it that way: do not add calls that post to `tracker` (or any other resource) without `importMode=VALIDATE`.

It consumes five sibling libraries as regular npm dependencies, all published from the separate [`dhis2-form-utils`](https://github.com/nnkogift/dhis2-form-utils) monorepo and versioned in lockstep with this app. **File issues/PRs against the rule engine, hooks, widgets or devtools there, not here.**

- `@nnkogift/dhis2-form-utils-hooks`: `useEventProgramMetadataQuery`, `useTrackerMetadataQuery`, `useEventForm`, `useTrackerForm`, `FormStateProvider`, `useFieldControl`, `useFieldRuleEffect`, `useFieldState`, `useSectionRuleEffect`, `useSectionState`, `useFormFeedback`, `useRuleEffectTrace`
- `@nnkogift/dhis2-form-utils-metadata`: program/program-stage metadata shaping (`selectProgramStage`, `resolveFormSectionLayout`, option group resolution, `ProgramRuleActionType`, metadata types)
- `@nnkogift/dhis2-form-utils-rules`: rule engine runtime types and helpers (`RuleEventInput`, `RuleSupplementaryDataInput`, `feedbackItemKey`, `filterPayload`)
- `@nnkogift/dhis2-form-utils-dhis2-ui`: `D2FieldWidget`, the `@dhis2/ui`-backed field renderer
- `@nnkogift/dhis2-form-utils-devtools`: rule inspection (`RulesPanel`, `ServerEffectsSummary`, `RuleDevtoolsScope` from `/scope`, `createLabelLookup`, `getEffectVariant`/`getEffectVisual`/`EFFECT_ICONS` from `/effect-styles`, the server report types `ServerVerification`/`ServerReportEntry`, and since `0.1.0-alpha.14` the `EFFECT_LEGEND` and `PROVENANCE_TAGS` constants). The `EffectLegend` and `ProvenanceTag` components are bundled but not exported from the package entry in `alpha.14`; export them in `dhis2-form-utils` before using them here.

This app's own code is thin: routing, DHIS2 API queries (programs list, accessible and program org units, current-user supplementary data, option groups), UI chrome around the library-produced forms, and the tracker/event payloads sent by the server dry run.

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

CI (`.github/workflows/ci.yml`) runs lint, test, build and a Fallow audit (fed with test coverage) as separate jobs on pushes and PRs to `main`, `alpha` and `beta`. It does not run `pnpm typecheck`, so run that locally before pushing. `deploy.yml` and `release.yml` handle deployment and Changesets releases.

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

`HashRouter` with three lazily loaded routes: `/` (program list), `/programs/:programId` (playground for one program), `/about` (`About.tsx`: app version from `useConfig`, supported DHIS2 range and resource links). The program list page ends with a footer (`program-list/components/ProgramListHelpLinks`) linking to the docs and About. External URLs and the displayed DHIS2 range live in `src/shared/constants/links.ts`; `SUPPORTED_DHIS2_RANGE` there is a hard-coded string, so change it together with `minDHIS2Version`/`maxDHIS2Version` in `d2.config.js`. `SyncUrlWithGlobalShell` keeps the DHIS2 global app shell's URL bar in sync with the hash router.

### Program list flow (`modules/program-list/`)

- `ProgramListPage` reads/writes list state (search, type filter, page, pageSize) via `useProgramListParams`, which serializes to URL search params (see `buildProgramListUrl.ts` for the param<->URL mapping and defaults).
- `usePrograms` runs `useDataQuery` against the `programs` resource and validates the response with `programsResponseSchema`; `buildProgramFilters` turns search/type into DHIS2 `filter` query params; `resolveProgramListItem` maps raw items to `Program`.
- Selecting a program in `ProgramListTable` navigates to `/programs/:id`, passing the current list params through router `state` so the "back to list" link (`buildProgramListUrl`) restores it.

### Program playground flow (`modules/program-playground/`)

`pages/ProgramPage` gets everything it needs from `hooks/useProgramPageData`: program metadata via `useEventProgramMetadataQuery`, the user's accessible org units via `useAccessibleOrgUnits`, the program's assigned org units via `useProgramOrgUnits`, current-user supplementary data (`userGroups`/`userRoles`, required by the rule engine) via `useCurrentUserSupplementaryData`, and option-group codes referenced by rules via `useOptionGroupsSupplementaryData`. `ProgramContextBar` sets the org unit (`components/orgUnit/OrgUnitSelectorField`, a searchable modal tree limited to the program's org units; `ProgramOrgUnitsContext` lets forms require it before validating or verifying), the primary date (enrollment or event date) and a reset (`useProgramPlaygroundState` bumps a `resetKey` that remounts the forms). It then branches on `program.programType`:

- **`WITHOUT_REGISTRATION`** (event program): renders a single `ProgramStageFormScreen` for the first program stage.
- **`WITH_REGISTRATION`** (tracker program): renders `components/forms/TrackerProgramShell`, the more complex piece:
    - Loads tracker-specific metadata (`useTrackerMetadataQuery`): TEAs, sections, tracked entity type.
    - State lives in a per-shell zustand + immer store (`utils/trackerFormsStore.ts`, provided via `components/trackerFormsStoreContext.tsx`): selected slot, draft events per repeatable stage, registration (enrollment form) values and per-slot event values.
    - `components/EnrollmentRail` (left nav, with `RailRow` and `RepeatableStageGroup`) switches between the enrollment form (rail row "Enrollment form", `TrackerSlot` kind `registration`) and program-stage event forms. Repeatable stages can hold multiple draft events added via the store's `addEvent`; slots are identified by `TrackerSlot`/`slotKey` (`utils/trackerSlot.ts`).
    - **All rendered forms stay mounted simultaneously** (visibility toggled with `hidden` CSS, not conditional rendering) so switching rail rows never discards in-progress input in another form. `TrackerStageFormSlot` fixes each event's date at first render for the same reason.
    - Each form pushes its live values to the store via `usePublishFormValues` (debounced 150ms, uses RHF's `form.subscribe`, not `watch`) so sibling forms see them as `enrollment`/`events` rule-engine inputs. This is what lets a rule on an event form react to a value entered in the enrollment form, and vice versa.
    - `selectEventsExcludingSlot` in `trackerFormsStore.ts` shapes per-slot values into `RuleEventInput[]`, excluding the form's own slot. A `WeakMap` cache keeps unchanged entries referentially stable, and each `TrackerStageFormSlot` subscribes with `useShallow`, so a keystroke in one form does not re-render the others.

### Rule-aware rendering (`modules/program-playground/components/rules/`)

- `RuleAwareField` wraps every metadata-driven field: pulls `useFieldControl`/`useFieldRuleEffect` from `-hooks`, renders the field's own label (blanking the widget's built-in label to avoid duplication, then wiring `aria-labelledby` back onto whatever DOM node the widget rendered; see the comment in that file for why), a `FieldEffectBadge` when a rule is affecting the field, and either the real `D2FieldWidget` or a `HiddenFieldPlaceholder`/nothing depending on `RuleDisplayContext`'s `showHiddenFields` flag.
- `RuleDisplayContext` / `GhostToggleButton` (the "Show hidden fields" toggle, an `aria-pressed` button) control whether rule-hidden fields and sections render as dashed hidden-field placeholders (`HiddenFieldPlaceholder`, `HiddenSectionPlaceholder`) or are omitted entirely. Call them hidden-field placeholders in UI text and docs, not ghosts.
- `RuleOutputColumn` is the sticky sidebar with separate Feedback and Indicators `RuleOutputCard`s, built from `useFormFeedback`. Each item resolves back to the rule that produced it via `useRuleEffectTrace(feedbackItemKey(item))` + `-devtools`' `createLabelLookup`.
- `LazyRulesPanel` lazy-loads the devtools `RulesPanel` (rule list, trace and dependency graph) with `RulesPanelFallback` as the Suspense fallback. Forms wrap their content in `RuleDevtoolsScope` so the panel can read the form store.

### Forms (`modules/program-playground/components/forms/`)

`ProgramRegistrationForm` (the enrollment form, `useTrackerForm`) and `ProgramEventForm` (`useEventForm`) are the RHF-backed forms wired to the rule engine through `-hooks` (`FormStateProvider`). `EventFormFields`/`RegistrationFormFields` lay out `RuleAwareField`s inside `FormSectionCard`s per `-metadata`'s section/data-element resolution (`resolveFormSectionLayout`, `getProgramStageSectionDataElementIds`). `ProgramFormActions` renders the buttons below each form. None of them saves anything:

- **Validate form** runs the form's own validation (`utils/validateForm.ts`, `hooks/useFormValidation.ts`) and `ValidationNotice` lists the fields with issues. No request is sent.
- **Verify with server** (`hooks/useFormServerCheck.ts` over `hooks/useServerVerification.ts`) posts the payload to `tracker` with `importMode=VALIDATE&async=false`. A run that finds problems answers 409 with the report, which `utils/parseRuleValidationReport.ts` parses. `utils/applyServerReport.ts` puts rule errors on the fields they target, and `ServerCheckStatus` shows the rest (including `OtherImportErrors`).
- **Preview server effects** (enrollment form submit, and the first of the two event form buttons) opens `SaveReviewDialog`, a read-only wrapper around the devtools `ServerEffectsSummary`. It shows the server-side effects (messages, scheduled events) the importer would run and compares them with the last Verify result. It has no post action.
- **Preview on-complete effects** (event forms only) first runs the completion pass (`hooks/useCompletionPass.ts`): it sets `status` to `COMPLETED`, waits for the rule engine, and collects on-complete warnings/errors and missing mandatory fields (`utils/completionIssues.ts`). If there are issues, `CompletionBanner` offers Back to editing or Complete anyway (when nothing blocks). It then opens the same summary for `COMPLETED`. `hooks/useEventReviewFlow.ts` tracks which status the summary was last opened for, and Verify dry-runs that status.

The dry-run payload is built the way a real save would build it: values pass through `utils/parseFormValues.ts` (`-rules`' `filterPayload` drops rule-hidden values), are validated with the Zod schemas in `utils/trackerPayloads.ts`, and are turned into tracker payloads by `buildEventPayload` / `buildTrackerRegistrationPayload` there. Payload building is app-local, not part of the shared libraries. DHIS2 errors are parsed/formatted by `utils/parseDhis2Error.ts` and `utils/formatDhis2Error.ts`.

### Testing

Jest + Testing Library; tests sit next to the code as `*.test.ts(x)`. `usehooks-ts` and `lodash-es` ship ESM-only and are deliberately carved out of the default `transformIgnorePatterns` in `jest.config.js` (pnpm nests them under `.pnpm/`, hence the lookahead pattern). Don't "fix" that by reverting to the default ignore list.

### Releases

Changesets with conventional commits (`changeset-conventional-commits`); keep the `@nnkogift/dhis2-form-utils-*` versions in `package.json` aligned with each other. `pnpm-workspace.yaml` exempts those packages from pnpm's minimum release age so fresh alphas can be installed.

Releases run from `.github/workflows/release.yml` on pushes to `alpha`: `changesets/action` opens the version PR, and once it is merged `scripts/release.mjs` builds the bundle and tags the release.

**Docs impact.** When a changeset changes something users see, add a line starting with `docs:` after the summary, in its own paragraph, saying what the docs must change:

```md
---
'program-rules-playground': minor
---

Renames the Show hidden fields toggle to Show placeholders.

docs: Rename the toggle in "Read field badges and hidden-field placeholders" and retake its screenshot.
```

After a release, the `docs-impact` job runs `scripts/docs-impact.mjs`. It reads the `docs:` lines from the new version's `CHANGELOG.md` section (the changelog generator copies changeset bodies there), compares `minDHIS2Version`/`maxDHIS2Version` in `d2.config.js` with the previous tag, and, in [`nnkogift/program-rules-playground-docs`](https://github.com/nnkogift/program-rules-playground-docs), opens a `Docs impact: program-rules-playground vX` issue when either found something and sends the `app-released` (always) and `app-compat-changed` (range changed) repository dispatches. It needs the `DOCS_REPO_TOKEN` secret and skips with a warning without it. Run `node scripts/docs-impact.mjs --dry-run` to see what it would do. The PR template (`.github/pull_request_template.md`) asks for the docs impact of every PR.
