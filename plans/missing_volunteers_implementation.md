# Missing Volunteers Implementation

## Overview
Improved the coherency and integration of the application by integrating the "Missing Volunteers" concept (a core feature listed in `plans/vision.md` and already present in the "Pastoral Co-Pilot") into its own dedicated view accessible via the Sidebar, as well as fixing the reference to the "Burnout Predictor" being complete in the Vision document.

## What Was Done
- **Component Creation:** Created `MissingVolunteersReport.tsx` and `MissingVolunteersReport.css` to visualize the list of missing key volunteers (who served >= 2 times in the last 6 weeks but have 0 check-ins in the last 2 weeks).
- **Sidebar Integration:** Added a "Missing Volunteers" navigation button in `Sidebar.tsx` under the "Intelligence" section to easily access the report.
- **App Routing:** Updated `App.tsx` to handle the `missing` route and render the `MissingVolunteersReport` component, passing down the necessary `students` and `auth` props.
- **Vision Document Update:** Marked "Burnout Predictor" as `[DONE]` in `plans/vision.md` since it was previously implemented but not properly flagged.
- **Testing:** Added robust unit tests in `MissingVolunteersReport.test.tsx` verifying empty states, error handling, and the successful rendering of missing volunteers. Updated `Sidebar.test.tsx` to ensure proper parsing.

## What Was Discovered
- The `calculateMissingVolunteers` logic was already robust and well-tested, making it easy to build a frontend around.
- Previous tests were not set up to check for missing imports correctly due to Vite misconfiguration when installing Vitest directly via shell instead of `npm run test` script context. Once resolving dependencies using standard `npm run test`, test execution proceeded smoothly.

## Future Ideas
- **Notifications:** Connect the Missing Volunteer alert system directly to the Dashboard as a high-priority "Push" notification for immediate attention rather than just listing it.
- **Quick Actions:** Include direct links or buttons within the `MissingVolunteersReport` to quickly send SMS or Email check-ins to missing volunteers (e.g., integrating with Twilio or the proposed "Locus Automate" workflow engine).
