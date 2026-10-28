# Frontend architecture rulebook

> **Adapt before use.** Everything in `<angle brackets>` is a placeholder, and the feature list in
> §2 is a starting point — replace it with your own. The rules themselves are meant to be kept.

This document governs where code **lives** and which module may import which. It is not a style
guide; it is the structural contract.

Much of the code here is written by people who don't work in React every day, and by AI agents.
So the rules are mechanical, not tasteful: there is a decision table for "where does this file
go", and the linter rejects the wrong answer. When this document and your instinct disagree, this
document wins. When it is silent, add a rule to it in the same change.

**Stack:** React + TypeScript · React Router · TanStack Query (server state) · Redux Toolkit +
redux-persist (client state) · ESLint (flat config).

## 1. Non-negotiables

1. **Three roots.** Every file under `src/` belongs to `app/`, `features/`, or `common/`.
2. **One-way dependencies.** `common/` → `features/` → `app/`. Never the other way.
3. **A feature never imports another feature.** Features are composed in `app/`.
4. **`common/` must be earned.** See the admission test in §5.
5. **No HTTP outside an `api/` folder.** No `fetch`, no `axios` in a component.
6. **TanStack Query owns server state. Redux owns client state.** Neither does the other's job.
7. **Every file is kebab-case** (§4.1).
8. **A component ships with its test** in the same folder (§4.3).
9. **No barrel files, no default exports.** Import the file you mean.
10. `npm run lint && npm run typecheck && npm test` passes before you call the work done.

## 2. Project structure

```
src/
│
├── app/                        composition root — knows every feature exists
│   ├── layouts/                app shell, chrome, navigation
│   ├── pages/                  screens that belong to no feature (not found)
│   ├── router.tsx              main router — mounts each feature's sub-router
│   ├── provider.tsx            every global provider, nested in one place
│   └── store.ts                Redux store + redux-persist configuration
│
├── features/                   one folder per business capability
│   ├── auth/                   sign in          → /login
│   ├── chat/                   ask the assistant → /chat
│   └── ingestion/              add documents     → /ingestion
│
├── common/                     feature-agnostic building blocks
│   ├── api/                    HTTP client, error types, request helpers
│   ├── components/             primitives with no domain knowledge
│   │   └── ui/                 button, card, dialog, table…
│   ├── config/                 route paths, env, constants
│   ├── hooks/                  generic hooks (use-debounce, use-media-query)
│   ├── lib/                    preconfigured third-party wiring
│   ├── store/                  typed Redux hooks, shared slices
│   ├── types/                  the API contract
│   └── utils/                  pure functions, no domain vocabulary
│
├── testing/                    test setup, render helpers, fixtures
│
├── main.tsx                    ← the only two files allowed at the src root
└── index.css
```

Dependencies point one way:

```
 common/  ──────►  features/  ──────►  app/

 app/ may import features and common.
 features/ may import common. Never another feature.
 common/ imports neither.
```

Why: the blast radius of a change is visible from the path alone. Touching `features/chat/`
cannot break `ingestion/`. Touching `common/` can break everything, which is why it has the
highest bar for entry.

`provider.tsx` and `store.ts` are created with the first global provider or Redux slice. Until
then they don't exist; don't add empty ones.

### 2.1 `app/` — the composition root

The only layer that knows the full set of features. It owns the **main router**, the layouts, and
the few screens that belong to no feature (the not-found page).

The main router (`app/router.tsx`) decides two things and nothing else: **where** each feature is
mounted (its base path, from `common/config/paths.ts`) and **which layout** wraps it. It never
names a feature's screens — those come from the feature's sub-router (§2.2).

```tsx
// src/app/router.tsx
export const routes: RouteObject[] = [
  { path: paths.login, children: authRoutes },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={paths.login} replace /> },
      { path: paths.chat, children: chatRoutes },
      { path: paths.ingestion, children: ingestionRoutes },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
```

If the main router grows a screen, a form, or a query, that code belongs in a feature.

`app/store.ts` configures the Redux store and redux-persist. It is the one place that imports
every feature's slice — features never import the store's type graph back (see §7.2).

### 2.2 `features/` — one folder per capability

A feature owns its screens, requests, state, types, tests **and its sub-router**. Named after the
capability, lowercase and kebab: `order-history/`, not `OrderHistory/` or `orders2/`.

```
features/auth/
├── api/                        sign-in.ts — the only place this feature talks HTTP
├── pages/                      screens the sub-router mounts, each with its .css and .test.tsx
│   ├── login-page.tsx
│   ├── login-page.css
│   └── login-page.test.tsx
├── components/                 pieces used by this feature's pages
└── auth-routes.tsx             the sub-router
```

Create a folder when its first file arrives; don't scaffold empty ones.

**The sub-router** is `<feature>-routes.tsx`, exporting `<feature>Routes: RouteObject[]`. Its paths
are **relative** to wherever the main router mounts it — the index route is the feature's base
path. So `chat-routes.tsx` says `{ index: true }` for `/chat`, and a future
`{ path: ':conversationId' }` for `/chat/:conversationId`, without ever writing `/chat` itself.

```tsx
// src/features/chat/chat-routes.tsx
export const chatRoutes: RouteObject[] = [
  { index: true, element: <ChatPage /> },
]
```

Rules for sub-routers:

1. A feature has exactly one sub-router, and only `app/router.tsx` imports it.
2. A sub-router mounts only its own feature's pages. No layouts — the main router picks those.
3. Paths in a sub-router never start with `/`.
4. To link to **another** feature, use `paths` from `common/config/paths.ts`, never a string
   literal and never an import from that feature.

Test a page through its own sub-router, mounted at its real path with `renderWithRouter` from
`testing/`. Never import `app/router.tsx` from a feature test.

If two features want the same code, read §5 before moving anything.

### 2.3 `common/` — the shared library

`common/` is a library your app happens to ship with. It must be readable without knowing what the
product does. If a file in `common/` mentions your domain nouns, it is in the wrong folder.
