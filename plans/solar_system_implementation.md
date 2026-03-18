# Feature Implementation: The Solar System Visualization

## Overview
Implemented the "Solar System" feature (Idea #1 from The Idea Vault), a visual tool designed to map families dynamically based on member roles and age gaps.

## Components Built
1.  **`SolarSystem.tsx` & `SolarSystem.css`**
    *   **Core Logic:** The visualization filters through the `students` list, groups members by their `householdId`, and categorizes them into "parents" (`!isChild`) and "children" (`isChild`).
    *   **The Galaxy View:** Displays a grid of cards, each representing a "Solar System" (a valid household with at least one parent and child). Cards show summary stats (stars/planets).
    *   **The System View:** Clicking a card renders an SVG container where:
        *   **The Sun:** Represents the parents. The radius is sized proportionally to the average parent age.
        *   **The Planets:** Represent the children. Their orbits (distance from the sun) are calculated using the age gap between the child and the average parent age. Larger age gaps result in further orbits.
        *   **Visual Enhancements:** Circular orbital paths are drawn with dashed lines to complete the aesthetic.
2.  **State Management & Integration**
    *   Updated `App.tsx` state `currentView` to include `'solar-system'` rendering the newly built `<SolarSystem />`.
    *   Added a navigation button in `Sidebar.tsx` to enable users to toggle to the Solar System map.
3.  **Testing**
    *   Created `SolarSystem.test.tsx` ensuring edge cases are properly handled:
        *   Rendering an empty state message if no households have both parents and children.
        *   Proper grouping into the "Galaxy View" with mock students simulating typical family setups.
        *   Correct transition into the SVG render when clicking into a specific family's system.

## Technical Discoveries
*   **Data Structure Constraints:** The PCO API structures `isChild` and `householdId`, making mapping out parental relationships easier. However, we assume that any `!isChild` within the same `householdId` acts as a parent, which might incorrectly group adults living together (like siblings/roommates) as parents in a solar system context.
*   **Responsive SVG Constraints:** Implementing SVG rendering allowed precise control over radial layouts, utilizing sine and cosine calculations to distribute planets evenly across orbits.

## Future Ideas
*   **Planetary Moons:** If the database supports mapping multi-generational families in the same household, grandchildren could act as moons orbiting their respective parent-planet.
*   **Asteroid Belts:** Could be used to represent pets or non-family members linked to a household.
*   **Constellations:** Plotting connections between neighboring households.
