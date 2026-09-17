# ESA Companion

ESA Companion is a Dynatrace App Toolkit application for lightweight project and delivery coordination between an architect/admin role and client-facing users.

It provides browser-based project planning, task tracking, progress dashboards, comments/sign-off workflows, and JSON import/export for sharing project datasets.

## What the app does

Current routed experience:

- **Authentication splash** with role selection (Architect or Client).
- **Home workspace** with role-specific summary views:
  - Architect: client signals, stalled work, sign-off backlog, objective progress.
  - Client: assigned/open tasks, pending acknowledgements, recent updates.
- **Projects (manager/architect tools)**:
  - Create/edit/delete projects.
  - Manage objectives and milestones.
  - Create/update/delete tasks.
  - Task ownership, visibility, comments, and status updates.
  - JSON import/export of project collections.
- **Dashboard**:
  - Cross-project health and progress metrics.
  - Task filtering and status updates.
  - Client sign-off/acknowledgement flow and threaded comments.

## Architecture

- **Platform**: Dynatrace AppEngine app scaffolded with `dt-app`.
- **Frontend**: React + TypeScript.
- **UI system**: Strato components (`@dynatrace/strato-components`, `@dynatrace/strato-components-preview`).
- **Routing**: `react-router-dom` (`BrowserRouter` with `basename="ui"`).
- **Persistence**: Browser storage (`localStorage`, `sessionStorage`) only.
- **Backend functions**: none currently used by the routed application.

## Data model and local storage behavior

Primary entities:

- `Project` with `tasks`, optional `objectives`, optional `milestones`.
- `Task` with owner, visibility, subtasks, comments, acknowledgement metadata.
- `ClientInteraction` and `ClientInfo` supporting client/project-linked updates.

Browser keys currently used:

- `esa-engagements`: project/task/objective/milestone collections.
- `esa-client-interactions`: client updates/interactions.
- `esa-clients`: client registry.
- `esa-users`: additional user/profile records used by auxiliary pages.
- `esaAuthenticated`, `esaMode`, `esaManager`, `esaAppId`: session role/auth flags.
- `esa-last-visit-architect`, `esa-last-visit-client`: last-visit timestamps.

Back-compat is preserved in code for some legacy fields (`engagementId`, `notes`, `assignedClientAppIds`) when loading imported or older data.

## Security limitations (important)

Authorization and role checks are enforced in the browser UI only.

- Architect mode is gated by a client-side password check in frontend code.
- Role/auth state is stored in `sessionStorage`.
- Application data is stored in `localStorage`.

This **is not a server-side security boundary** and should not be treated as hardened authorization. For production-grade authorization and secure persistence, add server-side controls and trusted storage/service enforcement.

## Prerequisites

- Node.js `>=16.13.0` (per `package.json` engines)
- npm
- Dynatrace environment access configured in `app.config.json`

## Installation

```bash
npm install
```

## Development and operations commands

From repository root:

```bash
npm run start       # dt-app dev
npm run lint        # eslint
npm run build       # dt-app build
npm run deploy      # dt-app deploy
npm run uninstall   # dt-app uninstall
npm run update      # dt-app update
npm run info        # dt-app info
npm run help        # dt-app help
npm run create:function  # dt-app function create
npm run create:action    # dt-app action create
```

## Configuration

`/app.config.json` controls deployment settings and app metadata:

- `environmentUrl`: target Dynatrace tenant.
- `app.id`, `app.name`, `app.version`, `app.description`.
- `app.scopes`: required Dynatrace API scopes.

## Troubleshooting

- **Deploy version conflict**: bump `app.version` in `app.config.json`, then run:
  ```bash
  npm run build
  npm run deploy
  ```
- **App not retaining expected data**: inspect browser `localStorage` keys listed above.
- **Role/session confusion**: sign out (clears session keys) and authenticate again.

## Testing and validation

There is currently no dedicated automated unit/integration test suite in this repository.

Minimum validation for contributions:

```bash
npm run lint
npm run build
```

## Contributing

1. Keep changes focused and minimal.
2. Do not commit secrets or private/customer data.
3. Update documentation when behavior or commands change.
4. Validate with lint/build before opening or updating a PR.

## Release and update notes

- Keep package/app metadata aligned when releasing (notably `package.json` and `app.config.json` version and description).
- Use `npm run update` to apply Dynatrace package/toolkit migrations.
- Rebuild and redeploy after metadata or dependency updates.

## License

This project is licensed under the **MIT License**. See [`LICENSE`](./LICENSE).
