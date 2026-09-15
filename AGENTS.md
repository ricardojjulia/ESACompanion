# AI Coding Agent Instructions

## DQL - Dynatrace Query Language

Before writing any DQL query, the agent must always use the knowledge base (`dql_search` tool) to search for relevant DQL documentation, syntax, and examples, whenever the tool is available.

## UI Components - Strato

Before using any Strato UI component, the agent must always use the knowledge base tools to search for relevant component documentation and usage examples, whenever the tools are available:
- Use the `strato_search` tool to search for available Strato components by name or keyword.
- Use the `strato_get_component` tool to retrieve detailed documentation, props, and code examples for a specific component.
- Use the `strato_get_usecase_details` tool to get code for specific component use cases and patterns.

## Project Overview
This repository contains a **Dynatrace App** built with the Dynatrace App Toolkit "dt-app", running on **Dynatrace AppEngine**. Use the **App Toolkit** during development and CI (`dt-app dev`, `dt-app build`, `dt-app deploy`, `dt-app publish`).

## Core Concepts
### Dynatrace Apps
- UI is **TypeScript/React** using **Strato Design System** components for consistent Dynatrace UX.
- Backend logic runs inside the **Dynatrace JavaScript runtime**. Let the app execute backend code, primarily to call external URLs (e.g., third-party APIs) that shouldn't be invoked directly from the browser.
- Apps can use **Intents** for cross-app communication.
- Apps can provide **Actions** and **Widgets** to extend Dynatrace.

### Grail
- **Grail** stores observability data (logs, metrics, events, traces, business events).
- **DQL** is used to query Grail.

### DQL (Dynatrace Query Language)
DQL is a **pipeline-style query language** for Grail: you start with a data source (e.g., `fetch logs` or `timeseries` for metrics), then add pipe-separated commands like `filter`, `summarize`, `sort`, and `makeTimeseries` to transform and aggregate results. Typical patterns include counting events, building time series, and grouping by dimensions (e.g., host or status).

### Platform Services
A set of services are available to Dynatrace Apps to read and write data. Every service provides a TypeScript **client SDK** to interact with it. Common services include:
- **Grail Query Service**: Query Dynatrace Grail data using DQL. Prefer using the `useDql` React hook from `@dynatrace-sdk/react-hooks` in UI code, but the low-level client `@dynatrace-sdk/client-query` is also available.
- **Document Service**: Store and retrieve JSON files. Used, for example, for dashboards and can be shared with other users. Use `@dynatrace-sdk/client-document` to interact with it.
- **(User) App State Service**: Store and retrieve user-specific or app-specific key/value data. Used for caching or user preferences. Use `@dynatrace-sdk/client-state` to interact with it.

## Strato Design System
The **Strato Design System** is Dynatrace's official design system and component library. It provides React components, design tokens, and icons to build consistent UIs that align with Dynatrace's look and feel.

Available packages:
- `@dynatrace/strato-components` - Stable React components. Components here include: Button, ProgressBar, ProgressCircle, Skeleton, SkeletonText, AppRoot, Container, Divider, Flex, Grid, Surface, Heading, Link, List, Paragraph, Strikethrough, Strong, Text, TextEllipsis.
- `@dynatrace/strato-components-preview` - Most components are here, including Charts (TimeseriesChart, HistogramChart, HoneycombChart, SingleValue, PieChart), Content (Accordion, Chip, HealthIndicator, MessageContainer), Editors (CodeEditor, DQLEditor), Filters (FilterBar, FilterField, SegmentSelector, TimeframeSelector), Forms (Checkbox, Radio, Select, Switch, TextInput), Layouts (AppHeader, HelpMenu, InputGroup, Page, TitleBar), Navigation (AppLink, Breadcrumbs, Menu, Tabs), Overlays (Modal, Overlay, Sheet, Tooltip), and Tables (DataTable, SimpleTable).
- `@dynatrace/strato-design-tokens` - Design tokens for colors, borders, shadows, spacing, and typography.
- `@dynatrace/strato-geo` - Map visualization primitives.
- `@dynatrace/strato-icons` - Strato icon library.

### Working with Table Components
When using table components from Strato, prefer `DataTable` from `@dynatrace/strato-components-preview/tables` for advanced features like sorting, filtering, pagination, and selection. Use `SimpleTable` for basic tabular data without interactivity, mostly used for Markdown rendering.

Table API:
- Tables require the `data` and `columns` props.
- Column definitions must include `id`, `header`, and `accessor` (string path or function).

### Importing Strato Components
When importing Strato components, follow these guidelines to ensure optimal bundle size and performance:
1. **Never** import from the `@dynatrace/strato-components` or `@dynatrace/strato-components-preview` package root.
2. **Always** import from the specific category subdirectory (for example, `/layouts`, `/typography`, or `/tables`).
3. **Wrong**: `import { Flex, Heading } from "@dynatrace/strato-components";`
4. **Correct**:
   ```typescript
   import { Flex } from "@dynatrace/strato-components/layouts";
   import { Heading } from "@dynatrace/strato-components/typography";
   ```

**TypeScript Definitions**: All Strato packages have TypeScript definitions located directly in the package root under each component folder. For example:
- `node_modules/@dynatrace/strato-components-preview/forms/select/Select.d.ts` - Main Select component.
- `node_modules/@dynatrace/strato-components-preview/forms/select/SelectOption.d.ts` - Select.Option component.
- Pattern: `node_modules/@dynatrace/strato-components[-preview]/<category>/<component>/<Component>.d.ts`.

Always check the `.d.ts` files directly in `node_modules/@dynatrace/strato-components[-preview]/` to understand component APIs. Do not look for a separate `types/` subdirectory.

## Client SDKs
Dynatrace provides TypeScript client SDKs to interact with platform services. Each service has its own package, for example: `@dynatrace-sdk/client-query`, `@dynatrace-sdk/client-document`, and `@dynatrace-sdk/client-state`. Those packages are autogenerated from service OpenAPI specs and have the following characteristics:
- Exported clients to call service endpoints, for example `queryClient` or `documentClient`.
- Example:
  ```typescript
  const result = await queryClient.queryExecute({ body: { query: "fetch logs | count" } });
  ```

Prefer using the higher-level React hooks from `@dynatrace-sdk/react-hooks` in UI code, as they encapsulate state management, polling, and error handling.

## Other SDKs
- React hooks - `@dynatrace-sdk/react-hooks`: React hooks for DQL (`useDql`), documents, app state, settings, and other platform services. Prefer these in UI code. Request and response types match the low-level client SDKs. Example:
  ```typescript
  const { data, error, isLoading } = useDocument({ id: documentId });
  ```
- Common React hooks:
  - `useDql(query: string)` - Execute DQL queries.
  - `useDocument({ id: string })` - Fetch a single document.
  - `useListDocuments(params)` - List all documents; requires `document:documents:read` scope.
  - `useAppState({ key: string })` and `useUserAppState({ key: string })` - Read app or user state.
  - `useSetAppState()` and `useSetUserAppState()` - Write app or user state; return an execute function.
  - `useAppFunction({ name: string, data: any })` - Call backend functions.
- Units and formatting - `@dynatrace-sdk/units`: Convert values to human-readable strings, such as bytes to KiB/MB, and ensure consistent unit formatting across UI and functions.
- App Environment - `@dynatrace-sdk/app-environment`: Read app/environment context, IDs, URLs, and current user directly in the app.
- User Preferences - `@dynatrace-sdk/user-preferences`: Retrieve the logged-in user's theme, language, regional format, and timezone to adapt UI and formatting. Do not use it to store custom user settings; use the App State service instead.

## Development Workflow

### Commands (via `dt-app` CLI)
- **Dev Server**: `npm run start` - Runs with hot reload and opens the browser.
- **Build**: `npm run build` - Outputs to the `dist/` folder.
- **Deploy**: `npm run deploy` - Deploys to the environment in `app.config.json`.

### Configuration
- **App Metadata**: `app.config.json` defines app name, ID, version, and required scopes.
- **Environment URL**: Set `environmentUrl` in `app.config.json` to target a Dynatrace environment.
- **Scopes**: Add required permissions to the `app.config.json` `scopes` array, for example `storage:logs:read`, `document:documents:read`, `document:documents:write`, `state:app-states:read`, and `state:app-states:write`.

## Key Dependencies
- `@dynatrace/strato-components` and `@dynatrace/strato-components-preview`: UI component library.
- `@dynatrace/strato-design-tokens`: Design tokens for colors, borders, and shadows.
- `@dynatrace-sdk/react-hooks`: Hooks for Dynatrace APIs such as `useDql`.
- `@dynatrace-sdk/client-*`: Query API clients; every service has its own client package.

## Common Tasks
- **Add Route**: Update `Routes` in `ui/app/App.tsx` and add a navigation item to `ui/app/components/Header.tsx`.
- **Query Data**: Use the `useDql` hook with a DQL query string.
- **Style Components**: Import from `@dynatrace/strato-design-tokens/{colors,borders,box-shadows}` for design tokens.