# VRM.Web Architecture Deep Dive

This document outlines the architecture and implementation patterns used in the `VRM.Web` project. The goal is to provide a blueprint for replicating this structure in the `CPMS` project.

## 1. Technology Stack

- **Core**: React 18 (TypeScript)
- **Build Tool**: Webpack (Note: `CPMS` is currently using Vite, which is recommended to keep for performance, but structures will follow `VRM.Web`).
- **State Management**: Redux with `redux-thunk`, `reselect`, and `redux-persist`.
- **UI Framework**: Material UI (MUI) v5 with `styled-components` engine.
- **Data Fetching**: `react-query` (v3) for server state.
- **Form Management**: `react-hook-form` and `yup` for validation.
- **Routing**: `react-router` (v7).
- **Internationalization**: `i18next` with `react-i18next`.
- **Date Handling**: `moment-timezone`.

## 2. Folder Structure (`src/`)

The project follows a modular structure centered around the `app` directory.

```text
src/
├── app/
│   ├── modules/       # Feature-based folders (e.g., VendorAssignment, Auth)
│   ├── shared/        # Shared UI components, hooks, and helpers
│   ├── utils/         # Global utility functions and custom hooks
│   ├── Routes/        # Application routing logic
│   ├── Layout/        # Primary layout components (Header, Sidebar, etc.)
│   ├── appReducer.ts  # Root reducer (combining all module reducers)
│   ├── store.ts       # Redux store configuration
│   ├── App.tsx        # Main App component with providers
│   └── globalConfig.ts # Global application settings/constants
├── i18n/              # Localization files
├── images/            # Static assets (icons, illustrations)
├── queries/           # Centralized react-query hooks/api calls
├── styles/            # Global styled-components themes and resets
└── index.tsx          # Application entry point
```

## 3. Implementation Patterns

### 3.1 Modules
Each feature should reside in `src/app/modules/[ModuleName]`. A typical module contains:
- `components/`: Feature-specific components.
- `helpers/`: Constants, types, and utility functions for the module.
- `[moduleName]Reducer.ts`: Redux slice for the module.
- `[moduleName]Actions.ts`: Redux actions (if not using toolkit-like patterns).

### 3.2 State Management
The application uses a centralized Redux store. Each module's reducer is added to the `appReducer.ts`.
- **Selectors**: Always use `reselect` for memoized state selection.
- **Persistence**: Critical state is persisted using `redux-persist`.

### 3.3 Routing
Routes are defined in `src/app/Routes`. It typically involves:
- `AppRoutes.tsx`: Main route definitions.
- `PrivateRoute.tsx`: Guarded routes requiring authentication.

### 3.4 Styling
- **MUI + Styled Components**: The project uses MUI but utilizes the `styled-components` engine for custom styling.
- **Theme**: A global theme is defined and provided at the top level.

### 3.5 API Layer
- **React Query**: Used for fetching and caching data.
- **Axios**: Configured with interceptors for auth tokens and error handling.

## 4. Path Aliases
The following aliases are used in `tsconfig.json` and should be replicated in `CPMS`:
- `@modules/*` -> `app/modules/*`
- `@shared/*` -> `app/shared/*`
- `@utils/*` -> `app/utils/*`
- `@app/*` -> `app/*`
- `@queries/*` -> `queries/*`
- `@styles/*` -> `styles/*`
