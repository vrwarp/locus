# Smart Parking Implementation

## Overview
Implemented "Smart Parking" (Concept #39), a feature that monitors and visualizes parking capacity, occupancy levels, and the ratio of cars to people.

## Components
- `src/components/SmartParking.tsx`: Displays a summary of the metrics (Total Capacity, Current Occupancy, Avg People / Car) and provides a toggle to switch between views (Lot Occupancy vs. Cars to People Ratio). Uses Recharts to visualize the mock data over a timeline.
- `src/components/SmartParking.css`: Implements clean styling for the metrics cards and the chart container.
- `src/App.tsx`: Added state handling to route the `currentView` equal to `smart-parking` to the `SmartParking` component.
- `src/components/Sidebar.tsx`: Added "Smart Parking" navigation item under the "Intelligence" section to match the overarching feature categorizations.

## Testing and Verification
- Created `src/components/SmartParking.test.tsx` containing comprehensive unit tests using React Testing Library and Vitest.
- Mocked Recharts internals (`ResponsiveContainer`, `ComposedChart`) to verify conditional data rendering without layout layout issues in the jsdom environment.
- Verified state transitions when users toggle between the "Lot Occupancy" and "Cars vs People Ratio" views.
- Verified integration tests in `Sidebar` and `App` continue to pass without regressions.

## Future Ideas
- **Hardware Integration:** Replace mock data with actual polling from computer vision/IoT hardware endpoints or an API like Meraki.
- **Predictive Metrics:** Use historic attendance and capacity data to alert staff preemptively about parking overflow scenarios before Sunday service begins.
- **Interactive Drill-downs:** Allow users to click on specific service times to view localized snapshots of specific parking zones/lots.
