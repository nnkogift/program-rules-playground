## What and why

<!-- What does this change, and why? Link the Linear issue (e.g. NNK-123). -->

## Docs impact

<!-- Pick one. User-facing changes need a `docs:` note in their changeset (see AGENTS.md, Releases). -->

- [ ] None
- [ ] Docs page(s) affected: <!-- list the pages on prp-docs.nnkogift.dev -->
- [ ] Screenshots change

If this changes `minDHIS2Version` or `maxDHIS2Version` in `d2.config.js`, say so here and update `SUPPORTED_DHIS2_RANGE` in `src/shared/constants/links.ts` to match. The release workflow flags the change for the DHIS2 version compatibility page.

## Checks

- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass
- [ ] Changeset added (`pnpm changeset`) if users will notice the change
