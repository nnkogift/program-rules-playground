# program-rules-playground

## 0.1.0-alpha.9

### Patch Changes

- 965adc5: Refactors the app to follow the team's coding standards: dedupes magic strings into `as const` objects, enables TypeScript strict mode (fixing the nullability gaps and one real bug it surfaced), validates DHIS2 API responses and form payloads with Zod, reorganizes `src` into `modules/program-list`, `modules/program-playground`, and `shared`, and decomposes `EnrollmentRail`/`ProgramPage` into smaller components. No user-facing behavior changes.

## 0.1.0-alpha.8

### Patch Changes

- 8e4b674: Adds description to program rule condition in the details modal. Adds links to maintenance apps in the program rules details modal. Improvements on Coordinate and GeoJSON fields

## 0.1.0-alpha.7

### Patch Changes

- b9b72c2: feat: move rule feedback and indicators into a persistent sidebar with separate Feedback/Indicators cards, replacing the inline tinted banner

## 0.1.0-alpha.6

### Patch Changes

- 1def1c0: fixes and improvements on the rules list filtering and performance improvements

## 0.1.0-alpha.5

### Patch Changes

- 8c3d2df: perf: code-split routes and program forms with React.lazy

## 0.1.0-alpha.4

### Patch Changes

- 9ae64b1: fix: the rules are now sorted to allow those firing to move on top

## 0.1.0-alpha.3

### Patch Changes

- ae36375: fix issues with multi value texts throwing errors
- 696222b: updates on devtools panel

## 0.1.0-alpha.2

### Patch Changes

- 7ac9eed: performance fixes
- c2b2835: move the add-event button inline next to repeatable stage labels

## 0.1.0-alpha.1

### Patch Changes

- 85a3d98: - fix: fixes issues with missing renderType causing whole form to crash
    - fix: fixes issues with event form displays fields outside of sections

## 0.1.0-alpha.0

### Minor Changes

- 49b7b5e: initial release
