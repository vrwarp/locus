# Giving Trends Implementation

## Overview
Implemented the "Stripe" Giving Trends visualization (Concept #47) from the Vision document, mapping weekly attendance to a simulated giving volume using a dual-axis chart.

## Enhancements Built

### 1. Data Utility (`src/utils/givingTrends.ts`)
- **Goal:** Transform raw check-ins into weekly aggregated attendance data, and map that attendance to a deterministic, simulated giving volume (since we don't have a real Stripe API endpoint).
- **Implementation:**
    - Extracts check-ins for the primary 'Worship' event.
    - Uses `date-fns` to group unique attendees by the Sunday of each week.
    - Derives a `givingVolume` value by assuming a baseline average gift ($25/attendee) and applying a sine wave variance to simulate organic week-over-week fluctuations deterministically.
- **Testing:** Unit tested empty states, event filtering, unique attendee logic, and predictable mock values in `givingTrends.test.ts`.

### 2. Visualization Component (`src/components/GivingTrends.tsx`)
- **Goal:** Display the aggregated trend data clearly so pastors can correlate attendance spikes/drops with financial health.
- **Implementation:**
    - Used Recharts' `ComposedChart` to render a dual Y-Axis graph.
    - The left axis uses a `Bar` chart to represent Attendance volume (blue).
    - The right axis uses a `Line` chart to represent Giving Volume in dollars (green).
    - Includes a summary header calculating the exact "Average Giving per Attendee" over the currently viewed period.
- **Testing:** Render testing implemented in `GivingTrends.test.tsx`, with specific `vi.mock` setups for Recharts elements (e.g. `ComposedChart`, `YAxis`) to avoid JSDOM SVG parsing errors and successfully assert presence of both axes and data structures.

## Technical Discoveries
- **Recharts Dual Axis:** When rendering dual axes, using `orientation="right"` on the secondary `YAxis` and explicitly mapping the `yAxisId` onto the `<Line>` component ensures smooth overlaying without scaling distortion.
- **Recharts Testing in JSDOM:** Complex chart structures like `ComposedChart` require explicit granular mocking in Vitest. Mocking the inner sub-components (like `XAxis`, `YAxis`, `Line`, `Bar`) as simple `div` tags with `data-testid` attributes allows the testing library to verify correct structural rendering logic based on prop state without crashing the test runner.

## Future Ideas
- Connect the Giving Volume directly to the Planning Center Giving API (or a real Stripe webhook) to replace the deterministic mock calculations with real ledger data.
- Allow filtering trends by specific Campuses or specific funds (e.g., General vs Missions).
