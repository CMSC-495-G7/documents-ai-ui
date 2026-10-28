# documents-ai-ui

Frontend for Documents AI, built with React 19, React Router, Vite and Vitest.

## Setup

Use Node.js 22.22.2 or newer in the 22.x series, 24.15.0 or newer in the 24.x
series, or 26.0.0 and newer. These versions match the current test dependencies.
Check your version with `node --version`.

```bash
npm install
npm run dev
```

## Scripts

| Command              | What it does                        |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start the Vite dev server           |
| `npm run build`      | Type-check and build for production |
| `npm run preview`    | Serve the production build locally  |
| `npm test`           | Run the Vitest suite once           |
| `npm run test:watch` | Run Vitest in watch mode            |
| `npm run lint`       | Lint with oxlint                    |
| `npm run typecheck`  | Type-check without building         |
| `npm run format`     | Format everything with Prettier     |

## Code quality

A husky pre-commit hook runs lint-staged on the files you're committing:

- `.js/.jsx/.ts/.tsx`: `oxlint --fix`, then `prettier --write`
- `.json/.css/.md/.html`: `prettier --write`

If oxlint finds an error, the commit is stopped so you can fix it. Warnings are
shown but don't block the commit.

The oxlint rules in `.oxlintrc.json` aim to catch real bugs rather than enforce
style: hooks misuse, missing `key` props, `==` instead of `===`, `var`,
leftover `debugger` statements (errors), plus unused variables and
`console.log` calls (warnings). Prettier handles all formatting.

## Layout

See [ARCHITECTURE.md](ARCHITECTURE.md) for where code lives and which folders
may import which.

- `src/app/router.tsx`: the main router; mounts each feature's sub-router
- `src/app/layouts/`: the app shell (header and nav)
- `src/features/<feature>/<feature>-routes.tsx`: each feature's sub-router
- `src/features/`: `auth` (`/login`), `chat` (`/chat`), `ingestion` (`/ingestion`)
- `src/common/config/paths.ts`: the base path of every feature
- `src/testing/`: Vitest setup and the `renderWithRouter` helper
- `designs/`: HTML design mockups (excluded from linting and formatting)

Tests render routes with `renderWithRouter`. See `src/app/router.test.tsx`.
