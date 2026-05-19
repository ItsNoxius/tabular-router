# tabular-router

**SolidJS router with browser-style tabs** — multiple tabs, per-tab back/forward history, keep-alive outlets, and state that survives navigation within a tab.

Built for desktop-style apps (IDEs, admin panels, creative tools) where users expect Chrome-like tabs instead of a single linear history stack.

## Features

- **Multi-tab routing** — open, close, switch, duplicate, and reopen tabs
- **Per-tab history** — back/forward is scoped to the active tab, not global
- **Keep-alive outlets** — visited history entries stay mounted (hidden when inactive) so scroll position and component state persist
- **Entry-local state** — draft forms, filters, and UI state tied to a history entry; restored on back/forward
- **Familiar Solid API** — `Link`, `useNavigate`, `useParams`, `useSearchParams`, `useLocation`
- **Optional chrome** — `TabButton`, `TabKeyboardShortcuts` (Ctrl/Cmd+T/W/D, 1–9, etc.)
- **Imperative store** — navigate and manage tabs outside components via `tabular-router/store`
- **Tree-shakeable** — `sideEffects: false`, subpath exports for store/persist/types

## Install

```bash
pnpm add tabular-router solid-js
# or
npm install tabular-router solid-js
```

**Peer dependency:** `solid-js` ^1.8

In a monorepo, depend on the workspace package name or path instead of the registry name.

## Quick start

```tsx
import { Router, Route, Link, useDocumentTitle } from "tabular-router";

function Home() {
  useDocumentTitle("Home");
  return (
    <div>
      <h1>Home</h1>
      <Link href="/about">About</Link>
    </div>
  );
}

function About() {
  useDocumentTitle("About");
  return <Link href="/home">Back home</Link>;
}

function Layout(props: { children?: JSX.Element }) {
  return (
    <div class="flex h-screen flex-col">
      <header class="border-b px-4 py-2">My App</header>
      <main class="min-h-0 flex-1">{props.children}</main>
    </div>
  );
}

export function App() {
  return (
    <Router root={Layout} rootPath="/home" initialPath="/home" maxTabs={20}>
      <Route path="/home" component={Home} />
      <Route path="/about" component={About} />
    </Router>
  );
}
```

`<Route>` only registers a path → component mapping; it does not render DOM. The matched page renders in the router outlet (inside `root` if provided).

## Concepts

Understanding these three layers makes the rest of the API click:

| Layer             | What it is                                             | Example                                |
| ----------------- | ------------------------------------------------------ | -------------------------------------- |
| **Tab**           | A top-level workspace with its own history stack       | “Settings”, “Project A”                |
| **History entry** | One URL (pathname + search) inside a tab               | `/users/42?tab=posts`                  |
| **Mounted entry** | An entry whose component is still mounted (keep-alive) | All entries you’ve visited in that tab |

```
App
├── Tab "Home"          ← active tab
│   ├── entry 1  /home        (mounted, hidden)
│   ├── entry 2  /about       (mounted, visible)  ← historyIndex
│   └── entry 3  /settings    (not visited yet)
└── Tab "Docs"
    └── entry 1  /docs
```

- **Navigate** in a tab pushes a new history entry (or replaces the current one).
- **Back/forward** (`navigate(-1)` / `navigate(1)`) moves `historyIndex` within the active tab only.
- **Switch tabs** changes which tab is active; each tab remembers its own index and mounted entries.
- **Close tab** snapshots it for **reopen** (Ctrl/Cmd+Shift+T when using `TabKeyboardShortcuts`).

## Routes

Routes use static segments and `:param` dynamic segments. Longer patterns win when multiple routes could match.

```tsx
<Router rootPath="/projects" initialPath="/projects">
  <Route path="/projects" component={ProjectList} />
  <Route path="/projects/:id" component={ProjectDetail} />
  <Route path="/projects/:id/settings" component={ProjectSettings} />
</Router>
```

```tsx
import { useParams } from "tabular-router";

function ProjectDetail() {
  const params = useParams<{ id: string }>();
  return <h1>Project {params.id}</h1>;
}
```

**Root fallback:** Unknown paths and `/` resolve to `rootPath` (from `<Router rootPath>` or the first route). Set `rootPath` explicitly when your home route is not `/`.

## Navigation

### Declarative — `Link`

```tsx
<Link href="/about">About</Link>
```

| Modifier                    | Behavior                           |
| --------------------------- | ---------------------------------- |
| Normal click                | `navigate(href)` in the active tab |
| Ctrl/Cmd + click            | `openTab(href)` — new tab          |
| Middle-click on `TabButton` | Close tab (see below)              |

### Hooks — `useNavigate`

```tsx
import { useNavigate } from "tabular-router";

function Toolbar() {
  const { navigate, navigateBackwards, navigateForward, canGoBack, canGoForward } =
    useNavigate();

  return (
    <div>
      <button disabled={!canGoBack()} onClick={navigateBackwards}>
        Back
      </button>
      <button disabled={!canGoForward()} onClick={navigateForward}>
        Forward
      </button>
      <button onClick={() => navigate("/settings")}>Settings</button>
      <button onClick={() => navigate("/edit", { replace: true })}>Replace URL</button>
      <button onClick={() => navigate(-1)}>History -1</button>
    </div>
  );
}
```

`navigate` accepts a **string** (href) or a **number** (delta in the active tab’s history).

### Location, params, search

```tsx
import { useLocation, useParams, useSearchParams } from "tabular-router";

function SearchPage() {
  const location = useLocation(); // reactive: pathname, search, href, query
  const [search, setSearch] = useSearchParams<{ q?: string; page?: string }>();

  return (
    <input
      value={search.q ?? ""}
      onInput={(e) => setSearch({ q: e.currentTarget.value })}
    />
  );
}
```

Inside a **cached** (inactive) history entry, `useParams`, `useLocation`, and `useSearchParams` read that entry’s context — useful for keep-alive pages that still need their own URL slice.

## Tab UI

### Tab bar with `useTabs` + `TabButton`

```tsx
import { For, Show } from "solid-js";
import { TabButton, TabKeyboardShortcuts, useTabs } from "tabular-router";

function TabBar() {
  const { tabs, activeTabId, closeTab } = useTabs();

  return (
    <div class="flex gap-1 border-b px-2">
      <For each={tabs()}>
        {(tab) => (
          <TabButton
            tabId={tab.id}
            class="rounded px-3 py-1"
            classList={{ "bg-gray-200": tab.id === activeTabId() }}
          >
            <span>{tab.title || "Untitled"}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              ×
            </button>
          </TabButton>
        )}
      </For>
    </div>
  );
}

function AppShell() {
  return (
    <>
      <TabBar />
      <TabKeyboardShortcuts newTabPath="/home" />
      {/* outlet from Router */}
    </>
  );
}
```

`TabButton` activates on primary click and closes on middle-click by default (`activateOnClick`, `closeOnMiddleClick`).

### Keyboard shortcuts

`TabKeyboardShortcuts` registers global listeners (skipped when focus is in an input):

| Shortcut         | Action                                |
| ---------------- | ------------------------------------- |
| Ctrl/Cmd+T       | New tab (`newTabPath`, default: root) |
| Ctrl/Cmd+W       | Close active tab                      |
| Ctrl/Cmd+Shift+T | Reopen last closed tab                |
| Ctrl/Cmd+D       | Duplicate active tab                  |
| Ctrl/Cmd+1–9     | Switch to tab by index                |

```tsx
<TabKeyboardShortcuts
  newTabPath="/home"
  enabled={true}
  closeOnCtrlW={true}
  newTabOnCtrlT={true}
/>
```

### Programmatic tab control

```tsx
import { useTabs } from "tabular-router";

function NewTabAction() {
  const { openTab, duplicateTab, reopenClosedTab, canOpenTab, getMaxTabs } = useTabs();

  return (
    <button disabled={!canOpenTab()} onClick={() => openTab("/home")}>
      New tab ({getMaxTabs()} max)
    </button>
  );
}
```

Closing the last tab automatically opens a fresh tab at the root path.

## Document titles (tab labels)

Tabular does **not** infer titles from paths. Set them explicitly — like `document.title`, but per history entry.

```tsx
import { useDocumentTitle } from "tabular-router";
import { createSignal } from "solid-js";

function UserPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = createSignal({ name: "…" });

  useDocumentTitle(() => user()?.name ?? `User ${params.id}`);

  return <div>{user()?.name}</div>;
}
```

Titles are stored on the history entry and restored when the user goes back/forward. Imperative alternative: `setDocumentTitle("…")` or `setDocumentTitleForEntry(entryId, "…")`.

## Entry-local state

State that should survive **in-tab** back/forward (but not necessarily across tabs) belongs on the history entry.

### `useRouteState` — simple key/value per entry

```tsx
import { useRouteState } from "tabular-router";

function Editor() {
  const [draft, setDraft] = useRouteState("draft", { body: "" });

  return (
    <textarea
      value={draft().body}
      onInput={(e) => setDraft({ body: e.currentTarget.value })}
    />
  );
}
```

Navigate away and back — the draft for that entry returns. A new navigation push creates a new entry with fresh initial state.

### `useEntryNamespace` / `getEntryNamespace` — arbitrary bags

```tsx
import { useEntryNamespace } from "tabular-router";

function Panel() {
  const ui = useEntryNamespace("panel");
  const width = () => (ui().width as number | undefined) ?? 320;
  // ...
}
```

### Persistence helpers (`tabular-router/persist`)

For syncing external stores (e.g. TanStack Query, Zustand) into entry state:

```ts
import { persistToActiveEntry, isSyncingFromEntry, setSyncingFromEntry } from "tabular-router/persist";
import { getEntryNamespace } from "tabular-router";

// When hydrating from entry → your store, set the flag to avoid write-back loops
setSyncingFromEntry(true);
const data = getEntryNamespace(activeEntry, "myFeature");
// ... apply to store
setSyncingFromEntry(false);

// When your store changes, persist to the active entry
persistToActiveEntry("myFeature", { filters, scrollY });
```

## Imperative API (`tabular-router/store`)

Use outside Solid components or in non-reactive code:

```ts
import {
  initRouter,
  navigate,
  openTab,
  closeTab,
  routerState,
  setRouterState,
} from "tabular-router/store";

// Usually you don't call initRouter — <Router> does. Useful for tests/tools:
initRouter(
  [
    { path: "/home", component: Home },
    { path: "/about", component: About },
  ],
  "/home",
  { maxTabs: 10, rootPath: "/home" },
);

navigate("/about");
openTab("/home");
console.log(routerState.tabs, routerState.activeTabId);
```

`routerState` is a Solid store (`solid-js/store`); prefer hooks in UI code.

## Matching utilities

Low-level helpers for tests, SSR glue, or custom navigation:

```ts
import { matchRoute, matchRouteExact, parseHref, resolveHref, normalizePathname } from "tabular-router";

const routes = [{ path: "/users/:id", component: User }];
matchRoute(routes, "/users/42"); // { route, params: { id: "42" } }
matchRouteExact(routes, "/");   // null (no root fallback)
parseHref("/users/42?page=2");  // { pathname, search }
```

## Subpath exports

| Import                   | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `tabular-router`         | Components, hooks, matching helpers                   |
| `tabular-router/store`   | `routerState`, `navigate`, `openTab`, `initRouter`, … |
| `tabular-router/persist` | `persistToActiveEntry`, sync guards                   |
| `tabular-router/types`   | `Tab`, `HistoryEntry`, `TabularRoute`, …              |

## API reference

### Components

| Export                 | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `Router`               | Provider + outlet; collects `<Route>` children |
| `Route`                | Registers `path` → `component`                 |
| `Link`                 | Client navigation; Ctrl/Cmd opens new tab      |
| `TabButton`            | Tab activate / middle-close                    |
| `TabKeyboardShortcuts` | Browser-like tab shortcuts                     |
| `TabularProvider`      | Low-level provider (used by `Router`)          |

### Hooks

| Export              | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `useTabular`        | Full router context                                     |
| `useNavigate`       | `navigate`, back, forward, `canGoBack` / `canGoForward` |
| `useLocation`       | Active (or entry) pathname, search, href                |
| `useParams`         | Route params for current entry                          |
| `useSearchParams`   | Query string read/write                                 |
| `useDocumentTitle`  | Set tab label for current entry                         |
| `useTabs`           | Tab list and tab CRUD                                   |
| `useRouteState`     | Keyed state on current history entry                    |
| `useEntryNamespace` | Namespaced state bag on current entry                   |
| `useEntryContext`   | `{ entry, tabId, isActive }` for cached entries         |
| `useMatchRoute`     | Current route match                                     |

### Store (selection)

| Export                               | Description                       |
| ------------------------------------ | --------------------------------- |
| `navigate(target, options?)`         | Href string or history delta      |
| `openTab(href?)`                     | New tab; returns `false` at limit |
| `closeTab(tabId)`                    | Close; snapshots for reopen       |
| `reopenClosedTab()`                  | Restore last closed tab           |
| `duplicateTab(tabId?)`               | Clone tab history and state       |
| `activateTab` / `activateTabAtIndex` | Switch tab                        |
| `setSearchParams`                    | Update query on active entry      |
| `setDocumentTitle`                   | Title for active entry            |
| `canOpenTab` / `getMaxTabs`          | Tab limit (default 20)            |

## How this differs from a single-history router

|                    | Typical SPA router       | tabular-router               |
| ------------------ | ------------------------ | ---------------------------- |
| History            | One global stack         | One stack **per tab**        |
| Back button        | App-wide                 | Scoped to active tab         |
| Component lifetime | Often unmount on leave   | Visited entries stay mounted |
| State              | Often global or URL-only | Per **history entry**        |
| UX model           | One page at a time       | Many parallel workspaces     |

If you only need one page and no tabs, a standard Solid router may be simpler. Tabular shines when users juggle several contexts at once.

## Development

```bash
git clone https://github.com/ItsNoxius/tabular-router.git
cd tabular-router
pnpm install
pnpm test
pnpm build
```

## License

[MIT](LICENSE) © [ItsNoxius](https://github.com/ItsNoxius)
