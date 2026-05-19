# tabular-router

SolidJS tabbed router: multiple tabs, per-tab back/forward history, keep-alive outlets, and entry-local state.

## Install

```bash
pnpm add tabular-router solid-js
```

In a monorepo, depend on the package path or workspace name.

## Usage

```tsx
import { Router, Route, Link, useDocumentTitle } from "tabular-router";

function Home() {
  useDocumentTitle("Home");
  return <Link href="/about">About</Link>;
}

function App() {
  return (
    <Router root={Layout} rootPath="/home" initialPath="/home">
      <Route path="/home" component={Home} />
      <Route path="/about" component={About} />
    </Router>
  );
}
```

Set each page title with `useDocumentTitle` (or `setDocumentTitle`). Tabular does not infer titles from paths.

## Exports

- Components: `Router`, `Route`, `Link`, `TabButton`, `TabKeyboardShortcuts`
- Hooks: `useTabular`, `useNavigate`, `useParams`, `useDocumentTitle`, `useRouteState`, …
- Store API: `navigate`, `openTab`, `routerState`, …
- Persistence helpers: `persistToActiveEntry`, `getEntryNamespace`, …

## Peer dependency

- `solid-js` ^1.8

## Publishing (trusted publishing)

Releases are published to npm from GitHub Actions using [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC). No `NPM_TOKEN` secret is required.

### One-time npm setup

1. Create the package on npm (first release only) or open [tabular-router on npm](https://www.npmjs.com/package/tabular-router) after the first publish.
2. On npm: **Package → Settings → Trusted Publisher → GitHub Actions**
3. Set:
   - **Organization or user:** `ItsNoxius`
   - **Repository:** `tabular-router`
   - **Workflow filename:** `publish.yml` (filename only, not the path)
   - **Environment:** leave empty unless you add a GitHub `npm` environment and configure it here too

Remove any legacy `NPM_TOKEN` / `NODE_AUTH_TOKEN` repository secrets if you no longer need them.

### Release a version

1. Bump `version` in `package.json` and commit to `main`.
2. Tag and push:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

   The tag (`v0.1.0`) must match the version in `package.json` (`0.1.0`).

3. The [Publish to npm](.github/workflows/publish.yml) workflow builds and runs `pnpm publish --provenance`.

You can also trigger a publish manually from **Actions → Publish to npm → Run workflow** (uses the version already in `package.json` on the selected branch).
