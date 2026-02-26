# Volunteer Web Feature Implementation

## Overview
Implemented "The Volunteer Web" (Vision Item #3), a force-directed graph visualization that shows relationships between volunteers based on shared serving shifts. This helps identify cliques, silos, and well-connected "hub" volunteers.

## Components
- `src/utils/volunteerWeb.ts`:
    - `buildVolunteerGraph`: Core logic to transform `PcoCheckIn[]` into nodes (Volunteers) and links (Shared Shifts).
    - `computeForceLayout`: Custom implementation of a force-directed layout algorithm (Repulsion, Attraction, Center Gravity) to compute X/Y coordinates for nodes.
- `src/components/VolunteerWeb.tsx`:
    - React component rendering the graph using raw SVG elements (`circle`, `line`).
    - Handles data fetching (`fetchRecentCheckIns`, `fetchEvents`).
    - Implements interactions (Hover tooltips, highlighting).
- `src/components/RobertReport.tsx`: Integrated the new component as a "Network" tab.

## Technical Details
- **Graph Construction:**
    - Filters check-ins for `kind: 'Volunteer'` or events classified as `Serving`.
    - Groups check-ins by `EventID + Date` (Start of Day) to identify "Shifts".
    - Creates a weighted link between every pair of volunteers in the same shift.
- **Layout Algorithm:**
    - Iterative simulation (300 ticks) running in `useMemo`.
    - `Repulsion`: Nodes push each other away ($1/d^2$).
    - `Attraction`: Connected nodes pull together (Spring force).
    - `Gravity`: Weak pull to center to keep graph contained.
- **Performance:**
    - Uses `fetchRecentCheckIns` with pagination (last 20 pages) to build a sufficient history.
    - Layout calculation is optimized for typical volunteer team sizes (< 100 nodes).

## Verification
- **Unit Tests:** `src/utils/volunteerWeb.test.ts` verifies that links are correctly created for people in the same shift and ignored for others.
- **Component Tests:** `src/components/VolunteerWeb.test.tsx` mocks API responses and verifies rendering states (Loading, Graph, Empty).
- **Integration Tests:** `src/components/RobertReport.test.tsx` verifies the tab integration.
