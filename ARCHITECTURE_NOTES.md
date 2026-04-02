# FlowForge AI - Architecture Notes

**Date:** 2026-04-02
**Auditor:** Senior Developer
**Status:** **DOCUMENTED**

## 1. Current Framework Structure
FlowForge AI is built using:
- **React 18+** with **Vite** for the frontend.
- **TypeScript** for type safety and developer clarity.
- **Firebase** (Firestore, Auth) for the backend and real-time data.
- **Tailwind CSS** for utility-first styling.
- **Framer Motion** for UI animations.
- **Lucide React** for consistent iconography.

## 2. Route System
The application uses **React Router DOM v6** for navigation.
- **Guards:** `AuthGuard`, `StorytellingGuard`, `OnboardingGuard`, `AdminGuard`, and `ProjectGuard` ensure secure and contextual access.
- **Wrappers:** `FeatureDetailWrapper`, `FeatureChatWrapper`, `RoadmapWrapper`, and `UIArchitectureWrapper` provide project-specific context and data fetching.
- **Structure:** Routes are nested to reflect the application's hierarchy (Global -> Dashboard -> Project Scoped).

## 3. Layout System
The `Layout` component provides a consistent sidebar and mobile header/footer.
- **Navigation:** Navigation items are dynamically generated based on the user's role and project selection.
- **Sync Indicator:** A global `SyncIndicator` component shows the real-time status of the database sync.
- **Error Boundary:** A global `ErrorBoundary` catches and displays unhandled errors.

## 4. Component System
Components are organized into:
- **`src/components/`**: Reusable UI components (Dashboard, Workspace, etc.).
- **`src/components/admin/`**: Admin-specific sub-components (FullPRD, Tasklist).
- **`src/components/feature/`**: Feature-specific sub-components (Overview, Visuals, etc.).
- **`src/components/ui-architecture/`**: UI architecture planning sub-components (Modals, Grids).

## 5. Data Flow Notes
- **Contexts:** `AuthContext` and `ProjectContext` are the primary sources of truth for global state.
- **Hooks:** `useFirestore` is a custom hook for real-time Firestore data fetching and manipulation.
- **Services:** `SyncService` and `geminiService` handle complex business logic and AI interactions.
- **Persistence:** Data is persisted in Firestore, with some local storage used for UI preferences (search, filters).

## 6. Risks and Refactor Boundaries
- **ProjectContext Overload:** The `ProjectContext` is too large and should be split into smaller, domain-specific contexts.
- **Manual Sync Manifest:** The `SyncService` manifest should be automated or made more dynamic.
- **Firestore Size Limits:** A solution for large document storage is critical for production readiness.
- **Error Handling:** More granular error handling and user feedback are needed for specific AI and database operations.
- **State Management Performance:** As the application grows, the current context-based state management might lead to performance issues.
