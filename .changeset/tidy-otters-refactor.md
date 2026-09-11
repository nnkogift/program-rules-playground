---
'program-rules-playground': patch
---

Refactors the app to follow the team's coding standards: dedupes magic strings into `as const` objects, enables TypeScript strict mode (fixing the nullability gaps and one real bug it surfaced), validates DHIS2 API responses and form payloads with Zod, reorganizes `src` into `modules/program-list`, `modules/program-playground`, and `shared`, and decomposes `EnrollmentRail`/`ProgramPage` into smaller components. No user-facing behavior changes.
