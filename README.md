# Program Rules Playground

[![fallow](.github/badges/fallow.svg)](https://github.com/fallow-rs/fallow)

A DHIS2 app for testing, validating and debugging program rules against your real form configurations. You pick a program, fill in its enrollment and event forms, and watch the rules evaluate live: hidden fields and sections, assigned values, mandatory fields, warnings and errors, and feedback and indicator messages. A live rule trace and a dependency graph show why each rule fired, or why it did not.

<!-- TODO: screenshot from the docs pipeline (docs/images/playground.png) -->

## Who it's for

- **Program configurators and implementers** who write program rules and want to see them work before users do.
- **DHIS2 admins** who need to find out why a rule behaves differently on their instance.
- **Trainers** who explain program rules and want a safe place to show them in action.

## Nothing is saved

The playground never saves tracker data, events, enrollments or metadata, and never sends notifications. You can use it on a production server. The one exception: choosing a file in a file or image field uploads that file to the server as an unused file resource, so use a test file on production.

- **Validate form** checks the form in your browser and sends nothing.
- **Verify with server** sends your form to the tracker importer as a dry run (`importMode=VALIDATE`). The server runs its rule engine and validation and reports the result, but stores nothing.
- **Preview server effects** and **Preview on-complete effects** open a read-only summary of the effects the server would run (messages, scheduled events). They do not post anything.

## Supported DHIS2 versions

DHIS2 2.40 to 2.43 (`minDHIS2Version` and `maxDHIS2Version` in [`d2.config.js`](d2.config.js)). The app's About page shows the same range and the installed version.

## Documentation and install

- User documentation: [prp-docs.nnkogift.dev](https://prp-docs.nnkogift.dev)
- DHIS2 App Hub (coming soon)
- Release bundles: the `.zip` attached to each [GitHub release](https://github.com/nnkogift/program-rules-playground/releases)

## Built on dhis2-form-utils

The rule engine, form hooks, field widgets and rule devtools come from the [`dhis2-form-utils`](https://github.com/nnkogift/dhis2-form-utils) libraries (`@nnkogift/dhis2-form-utils-*` on npm). File issues and pull requests for those parts there. This repository holds the app around them.

## Development

You need Node.js 24 and pnpm.

```bash
pnpm install
pnpm dev         # start the dev server, proxied against a DHIS2 instance
pnpm test        # run the Jest test suite
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint + prettier check
pnpm build       # production build; the deployable .zip lands in build/bundle
pnpm changeset   # describe your change for the next release
```

The app is built with the [DHIS2 Application Platform](https://platform.dhis2.nu/). Contributor and agent guidance lives in [`AGENTS.md`](AGENTS.md).
