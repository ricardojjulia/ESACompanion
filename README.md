# Getting Started with your Dynatrace App

This project was bootstrapped with Dynatrace App Toolkit.

It uses React in combination with TypeScript, to provide great developer experience.

## Available Scripts

In the project directory, you can run:

### `npm run start`

Runs the app in the development mode. A new browser window with your running app will be automatically opened.

Edit a component file in `ui` and save it. The page will reload when you make changes. You may also see any errors in the console.

### `npm run build`

Builds the app for production to the `dist` folder. It correctly bundles your app in production mode and optimizes the build for the best performance.

### `npm run deploy`

Builds the app and deploys it to the specified environment in `app.config.json`.

### `npm run uninstall

Uninstalls the app from the specified environment in `app.config.json`.

### `npm run generate:function`

Generates a new serverless function for your app in the `api` folder.

### `npm run update`

Updates @dynatrace-scoped packages to the latest version and applies automatic migrations.

### `npm run info`

Outputs the CLI and environment information.

### `npm run help`

Outputs help for the Dynatrace App Toolkit.

## Learn more

You can find more information on how to use all the features of the new Dynatrace Platform in [Dynatrace Developer](https://dt-url.net/developers).

To learn React, check out the [React documentation](https://reactjs.org/).

## ESA Companion Enhancements

- Architect Workspace dashboard: objectives, task progress, attention items, and linked client updates.
- ESA Admin mode: full project, objective, task, client, and client-update management, including JSON import/export.
- Client mode: assigned-project visibility, task-status updates, and submission of project-linked client updates.
- Project assignment uses `assignedClientAppIds`; legacy projects without assignments are available only in ESA Admin mode.
- Client updates use `engagementId` and `submittedByAppId` to associate updates with an assigned project and client.

### Authorization Model

The current Admin/Client controls are implemented in the browser using `sessionStorage` and `localStorage`. They prevent accidental cross-mode changes in the application UI, but are not server-enforced authorization and must not be considered a security boundary. Production use requires an AppEngine backend and a secured Dynatrace persistence service.

### Local Data Keys

- `esa-engagements` — Projects, objectives, tasks, and client assignments.
- `esa-client-interactions` — Project-linked client updates and administrator updates.
- `esa-clients` — Client registry records.

### Deploy tip

If deploy fails due to version conflict, bump `version` in `app.config.json` and re-run:

```
cd esa-companion
npx dt-app build
npx dt-app deploy
```
