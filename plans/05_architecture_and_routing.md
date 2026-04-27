# Architecture & Routing Boundaries

## The Problem
The current UI is a chaotic monolith. The `App.tsx` file renders a massive conditional list of 30+ disparate views, mixing data entry tasks with executive dashboards and unrelated widgets.

## The Solution: Role-Based Routing
We must implement strict role-based routing to decouple the UI into distinct layout shells.

### 1. The Landing Page (Identity Selection)
- The application entry point must establish the user's persona immediately: "Who are you?" (Admin/Volunteer vs. Executive Pastor).
- Based on this selection (or eventual actual Auth roles), the user is routed to entirely different top-level layout components.

### 2. Layout Shells
- **`CoreLayout` (Locus Core):**
  - Houses the interactive Data Custodian Workspace.
  - Sidebar navigation is restricted to Hygiene tasks (Duplicates, Smart Fix, Ghost Protocol) and Settings.
  - Contains the Gamification state and UI overlays.
- **`IntelligenceLayout` (Executive Dashboard):**
  - Houses the read-only strategic dashboard.
  - Sidebar navigation is restricted to Analytics (Drift Report, Burnout Risk, Bus Factor).
  - Explicitly blocks loading or rendering of any Gamification components.

### 3. State Management Boundaries
- **Interactive vs. Read-Only:** The global state must reflect the decoupled nature of the app. Locus Core requires complex interactive state (Undo/Redo, batch processing queues). Locus Intelligence primarily requires robust, cached data fetching for charts and aggregations.
- **Strict Separation:** Components built for Locus Core must not be imported or rendered within Locus Intelligence, and vice versa.

### 4. Cleaning the Monolith
- The single `App.tsx` file must be refactored to act only as a router.
- All "distraction" widgets (Spotify, Smart Parking, Digital Tithe) must be removed from the active routing and navigation immediately.

## Implementation Status
- **Completed:** Role-based routing is fully implemented. The monolithic `App.tsx` has been refactored into a router that directs users to either `CoreLayout` (Data Custodian Workspace) or `IntelligenceLayout` (Executive Dashboard) after a persona selection step on `LandingPage`.
- **Completed:** The distraction widgets (`SpotifyWidget`, `SmartParking`, `DigitalTithe`) have been completely removed from the codebase and active navigation.
