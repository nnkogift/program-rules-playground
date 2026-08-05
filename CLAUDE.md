# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A DHIS2 custom app (built on the [DHIS2 Application Platform](https://github.com/dhis2/app-platform)) for testing and debugging DHIS2 program rules. It lets a user pick a program, open its registration/event forms, fill them in, and watch program rules evaluate live (hide/show fields, assignments, mandatory, warnings/errors, feedback messages).

It consumes four sibling libraries as regular npm dependencies, all published from the separate [`dhis2-form-utils`](https://github.com/nnkogift/dhis2-form-utils) monorepo — **file issues/PRs against the underlying rule engine, hooks, or widgets there, not here**:

- `@nnkogift/dhis2-form-utils-hooks` — `useEventProgramMetadataQuery`, `useTrackerMetadataQuery`, `useEventForm`/`useTrackerForm`-style hooks, `useFieldControl`, `useFieldRuleEffect`, `useFormFeedback`, `useRuleEffectTrace`
- `@nnkogift/dhis2-form-utils-metadata` — program/program-stage metadata shaping (`selectProgramStage`, `resolveFormSectionLayout`, option group resolution, `ProgramRuleActionType`, etc.)
- `@nnkogift/dhis2-form-utils-rules` — the rule engine's runtime types (`RuleEventInput`, `RuleSupplementaryDataInput`, `feedbackItemKey`)
- `@nnkogift/dhis2-form-utils-dhis2-ui` — `D2FieldWidget`, the actual `@dhis2/ui`-backed field renderer
- `@nnkogift/dhis2-form-utils-devtools` — rule trace/dependency-graph inspection (`createLabelLookup`, `getEffectVariant`, `getEffectVisual`, `EFFECT_ICONS`)

This app's own code is thin: routing, DHIS2 API queries (programs list, org units, current-user supplementary data), and the UI chrome around forms produced by those libraries.

## Commands

```bash
pnpm install
pnpm dev                       # d2-app-scripts start, proxied against https://dhis.rufaa.co.tz (see d2.config.js)
pnpm build                     # production build -> build/ (+ build/bundle/*.zip)
pnpm test                      # d2-app-scripts test (Jest)
pnpm lint                      # eslint + `prettier -c .`
pnpm format                    # prettier -w .
```

Run a single test file or pattern via the underlying Jest CLI, e.g.:

```bash
pnpm test -- src/hooks/usePublishFormValues.test.ts
pnpm test -- -t "some test name"
```

There is no separate typecheck script; `tsc --noEmit` (per `tsconfig.json`) is the way to check types manually — the build/lint scripts do not run it explicitly.

## Architecture

### Routing (`src/AppWrapper.tsx`)

`HashRouter` with three routes: `/` (program list), `/programs/:programId` (playground for one program), `/about`. `SyncUrlWithGlobalShell` keeps the DHIS2 global app shell's URL bar in sync with the hash router.

### Program list flow

- `ProgramListPage` reads/writes list state (search, type filter, page, pageSize) via `useProgramListParams`, which serializes to URL search params (see `buildProgramListUrl.ts` for the param<->URL mapping and defaults).
- `usePrograms` runs the `useDataQuery` against the `programs` resource; `buildProgramFilters` turns search/type into DHIS2 `filter` query params.
- Selecting a program in `ProgramListTable` navigates to `/programs/:id`, passing the current list params through router `state` so the "back to list" link (`buildProgramListUrl`) restores it.

### Program playground flow (`ProgramPage` → `TrackerProgramShell` / `ProgramStageFormScreen`)

`ProgramPage` loads program metadata via `useEventProgramMetadataQuery`, accessible org units via `useAccessibleOrgUnits`, current-user supplementary data (`userGroups`/`userRoles`, required by the rule engine) via `useCurrentUserSupplementaryData`, and referenced option-group codes via `useOptionGroupsSupplementaryData`. It branches on `program.programType`:

- **`WITHOUT_REGISTRATION`** (event program): renders a single `ProgramStageFormScreen` for the first program stage.
- **`WITH_REGISTRATION`** (tracker program): renders `TrackerProgramShell`, which is the more complex piece:
  - Loads tracker-specific metadata (`useTrackerMetadataQuery`) — TEAs, sections, tracked entity type.
  - Maintains an `EnrollmentRail` (left nav) that can switch between the registration form and any program-stage event forms. Repeatable stages can have multiple draft events, added via `handleAddEvent`; identified by `TrackerSlot`/`slotKey` (`src/components/programs/trackerSlot.ts`).
  - **All rendered forms stay mounted simultaneously** (visibility toggled with `hidden` CSS, not conditional rendering) so switching rail rows never discards in-progress input in another form.
  - Each form pushes its live values up via `usePublishFormValues` (debounced 150ms, uses RHF's `form.subscribe`, not `watch`) so sibling forms can see them as `enrollment`/`events` rule-engine inputs — this is what lets a rule on the event form react to a value entered in the registration form, and vice versa.
  - `toRuleEventInput` / `eventsExcludingSlot` in `TrackerProgramShell` shape per-form values into `RuleEventInput[]` for the rule engine, excluding each form's own in-progress event from the list passed to itself.

### Rule-aware rendering (`src/components/rules/`)

- `RuleAwareField` wraps every metadata-driven field: pulls `useFieldControl`/`useFieldRuleEffect` from `-hooks`, renders the field's own label (blanking the widget's built-in label to avoid duplication, then wiring `aria-labelledby` back onto whatever DOM node the widget rendered — see the comment in that file for why), a `FieldEffectBadge` when a rule is currently affecting the field, and either the real `D2FieldWidget` or a `HiddenFieldPlaceholder`/nothing depending on `RuleDisplayContext`'s `ghostsEnabled` flag.
- `RuleDisplayContext` / `GhostToggleButton` control whether rule-hidden fields/sections render as dashed "ghost" placeholders (useful for seeing what a rule hid) or are omitted entirely.
- `RuleFeedbackList` renders program-rule-generated feedback/indicator messages (`useFormFeedback`), each resolvable back to the rule that produced it via `useRuleEffectTrace` + `-devtools`' `createLabelLookup`.

### Forms (`src/components/programs/forms/`)

`ProgramRegistrationForm`/`ProgramEventForm` are the RHF-backed forms wired to the rule engine hooks from `-hooks`; `EventFormFields`/`RegistrationFormFields` lay out `RuleAwareField`s per `-metadata`'s section/data-element resolution (`resolveFormSectionLayout`, `getProgramStageSectionDataElementIds`). `trackerPayloads.ts` builds the actual DHIS2 tracker/event submission payloads from form values — this is app-local, not part of the shared libraries.

### Path alias

`@/*` maps to `src/*` (configured in both `tsconfig.json` and `jest.config.js`).

### Testing

Jest + Testing Library. `usehooks-ts` ships ESM-only and is deliberately carved out of the default `transformIgnorePatterns` in `jest.config.js` (pnpm nests it under `.pnpm/`, hence the lookahead pattern) — don't "fix" that by reverting to the default ignore list.
