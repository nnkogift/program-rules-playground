# program-rules-playground

## 0.1.0-alpha.12

### Patch Changes

- 9f76666: Updates the `@nnkogift/dhis2-form-utils-*` packages to `0.1.0-alpha.14`, which adds stable `data-test` hooks, exported effect legend and provenance tag constants, and enrollment wording in the devtools.
- 0d88316: Uses "Enrollment" consistently in user-facing copy: the first rail row is now **Enrollment form** and the load error reads **Could not load enrollment form**.
- 35b94c6: Names the ghost feature once as "hidden-field placeholders": the toggle is now a **Show hidden fields** button that reports its state with `aria-pressed` instead of swapping its label, and its tooltip reads **Shows a placeholder where a rule hid a field or section.**
- 0d88316: Renames **Trigger server rules** to **Preview server effects** and **Trigger on-complete rules** to **Preview on-complete effects**. The buttons only open the read-only server effects summary and never post anything.

## 0.1.0-alpha.11

### Patch Changes

- 29d0d0a: fix: place event form fields inside their program stage sections by bumping `@nnkogift/dhis2-form-utils-*` to `0.1.0-alpha.13`, and call `useMemo` before the early return in `EventFormFields`

## 0.1.0-alpha.10

### Minor Changes

- 43adccd: Fields made mandatory by a program rule are now marked with an asterisk in their label.
- 43adccd: Select the organisation unit from a modal tree limited to the program's assigned org units (searchable, with unassigned ancestors shown but not selectable). The same selector is used for org unit fields inside forms. Validate form, Verify with server and Save now require an org unit and flag the selector when it is missing.
- 9e06c23: Splits the event form submit into **Save** (posts `ACTIVE`) and **Complete** (posts `COMPLETED` with `completedAt`). The registration form keeps a single action, and `status` is never sent as a data value.
- 5e305d7: The registration form now opens the server effects summary (with **Verify with server**) before posting, like the event form. The actions are renamed to **Trigger server rules** (registration and event Save) and **Trigger on-complete rules** (event Complete).
- ef81793: Registration and event forms have a Validate form button that runs form validation and highlights field issues without posting anything.
- ab30794: Adds **Verify with server** to the save review dialog. It posts the exact event payload with `importMode=VALIDATE&async=false` (nothing is saved), attributes the server's rule errors and warnings to their rules, flags rules only the server fired as "Server only", and lists other import errors separately.

### Patch Changes

- 43adccd: Updates the `@nnkogift/dhis2-form-utils-*` packages to `0.1.0-alpha.12`.
- dd70716: Fixes saving events and registrations that could not be submitted: numeric and boolean values are now accepted, and `orgUnit` and the date fields (which the form resolver strips) are restored before validation and kept after the post-save reset.
- 8a21612: Redesigns the footer of the server review dialog. Status, import errors and the dry-run note are one compact block beside the actions, the duplicate Cancel is gone (Close does the same), and a failed verification raises an alert instead of a notice box in the footer.
- 6745953: The review dialog actions no longer wrap onto two lines, and a failed retry keeps the last good server check on screen instead of clearing it.
- ad11892: Polishes the server review dialog: verification results are announced to screen readers, a status line says when the server check finished (including a clean run), the button becomes **Verify again**, Cancel moves before Verify, and other import errors show their code as a tag without the importer's backticks. Result messages now say server rules were triggered instead of saved.
- 311d020: Adds a `typecheck` script and CI job, fixes a strict-mode type error for programs without a `code`, and refreshes the agent guidance (`AGENTS.md` is now the single source, imported by `CLAUDE.md`).
- 6b76324: Validate form now reports invalid results too: a focused alert lists the fields with issues (each links to its field) and a failed validation is shown instead of being swallowed. Shared by the registration and event forms.
- ed8e985: Verify with server now sits beside Validate form instead of in the server summary modal. Rule errors from the dry run appear on the fields they target, and anything else shows in a notice. The summary modal is read-only, and its Trigger server rules button, which posted the payload, is removed.

## 0.1.0-alpha.9

### Patch Changes

- fce7fbb: fixes issues with rule list not showing any rules in scope for event programs
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
