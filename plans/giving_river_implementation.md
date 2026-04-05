# Giving River Implementation

## Overview
Implemented "The Giving River" concept from the Idea Vault (Vision Item #4) as an interactive visualization. This utility uses a Sankey diagram to visualize the flow of generosity across funds and ministries (e.g., General Fund -> Missions -> Building).

## Implementation Details

### Core Visualization (`src/components/GivingRiver.tsx` and `.css`)
Created the `GivingRiver` component which utilizes the `Sankey` component from `recharts`.
- Constructed a mock multi-level flow structure (`data` payload) mapping donations from "Total Giving" through the "General Fund", "Missions Fund", and "Building Fund" into specific downstream causes like "Local Outreach" and "Global Missions".
- Implemented a custom node renderer (`renderNode`) that accurately calculates label placement to avoid text overlap (using right-align or left-align logic based on the node's position index in the rendering hierarchy).
- Designed an interactive Tooltip that displays financial values clearly using an `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` hook for easy legibility.
- High Contrast Mode styles were included specifically targeting tooltip and container backgrounds to maintain accessibility standards.

### UI Integration (`src/App.tsx` and `src/components/Sidebar.tsx`)
- Appended `GivingRiver` to the core router (`currentView === 'giving-river'`).
- Integrated navigation entry under the 'Intelligence' module in the `Sidebar` utilizing a suitable `💸` (flying money) icon to denote financial health tracking.

### Testing
- Added comprehensive unit tests in `src/components/GivingRiver.test.tsx`.
- Mocked out `recharts` internals (like `Sankey` and `ResponsiveContainer`) to assert data linkage pass-through (validating node counts and link structures) while sidestepping DOM measurement errors within `jsdom`. Improved line coverage on the component to > 89%.

## Discoveries & Future Ideas
- **Actual Financial Integrations:** Currently, the diagram is powered by static mock data. A future enhancement could hook this component up to Stripe API integrations (Concept #47) or Planning Center Giving APIs to securely stream real-time giving distributions.
- **Dynamic Node Calculations:** Sankey diagrams require rigid link indexing. For dynamic data sets, a helper utility will need to be written to aggregate raw individual transactions and dynamically trace them back into categorical nodes to prevent unmapped link errors.
- **Drill-Down Capabilities:** Allowing users to click on specific flow bands to see the largest underlying donors or associated demographic groups (e.g., "Gen Z is driving the spike in Global Missions funding") would greatly enhance the "Intelligence" value of this module.
