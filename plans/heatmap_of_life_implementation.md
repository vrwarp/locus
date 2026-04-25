# Heatmap of Life Implementation

## Overview
Expanded "The Heatmap of Life" feature (Concept #2) to visualize not just Birthdays, but also Anniversaries and Deaths.

## Implementation Details
1. **Extended Data Model (`src/utils/pco.ts`)**:
   - Added `anniversary` and `deathDate`/`death_date` properties to `PcoAttributes` and `Student` interfaces.
   - Handled mapping of these new properties in the `transformPerson` function.

2. **Generated Mock Data (`mock-api/data.js`)**:
   - Added mock logic to generate `anniversary` dates for households with two adults (`adultCount === 2`).
   - Added a 2% chance to generate a `death_date` for adult records to represent deceased individuals within the database.

3. **Refactored Heatmap Logic (`src/utils/heatmap.ts`)**:
   - Abstracted the existing `calculateBirthdayHeatmap` function into a generic `calculateEventHeatmap` that accepts a customizable `dateExtractor` function.
   - Exported specific helper functions: `calculateBirthdayHeatmap`, `calculateAnniversaryHeatmap`, and `calculateDeathHeatmap` using the new generic function.
   - Updated `src/utils/heatmap.test.ts` to include dedicated tests for the new anniversary and death mapping logic.

4. **Updated UI Component (`src/components/LifeEventsHeatmap.tsx`)**:
   - Renamed `BirthdayHeatmap.tsx` to `LifeEventsHeatmap.tsx`.
   - Introduced a `<select>` dropdown to allow the user to toggle between "Birthdays", "Anniversaries", and "Deaths" visualizations.
   - Wired the dropdown to conditionally call the appropriate calculation function and dynamically update the title and tooltips.
   - Updated component tests in `src/components/LifeEventsHeatmap.test.tsx` to cover the new state changes and data visualization assertions.

5. **Integrated Navigation**:
   - Replaced `<BirthdayHeatmap>` with `<LifeEventsHeatmap>` in `src/App.tsx` and `src/components/RobertReport.tsx`.
   - Updated `src/components/Sidebar.tsx` to label the nav item as "Heatmap of Life" instead of just "Birthdays".

## Testing
- **Unit Tests:** Maintained 100% passing test suite across all 90 files.
- **Coverage:** Replaced existing coverage, ensuring that event changes accurately update the DOM and that date handling logic accounts for the new event types robustly.

## Future Ideas
- **Click-to-View Feature:** Enable clicking on a specific cell within the heatmap to display a modal list of the specific individuals associated with that date's life event, facilitating targeted pastoral follow-up (e.g., sending an anniversary card or acknowledging the anniversary of a death).
- **Date Range Adjustments:** Make the year dynamic to track previous/upcoming years, instead of a static leap year layout representing aggregated annual patterns.
- **API Integration:** Connect the mock anniversary and death attributes to actual custom fields defined in Planning Center via the API.
