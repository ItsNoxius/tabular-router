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
