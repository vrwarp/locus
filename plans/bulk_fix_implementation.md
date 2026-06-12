# Bulk Fix Implementation

## Overview
Implemented the "Bulk Fixing" concept as an enhancement to the Locus Core Data Custodian Workspace. This feature allows users to instantly resolve all safe formatting anomalies (Name, Phone, Address) at once via a "Smart Fix All" button during Review Mode.

## Implementation Details

### UI Integration (`src/components/ReviewMode.tsx` & `.css`)
- Added a "Smart Fix All" button in the review-actions toolbar. It is conditionally hidden during the competitive "Speed Run Mode" to maintain the integrity of the minigame score calculations.
- Added `handleFixAll` function which maps over the `students` array and applies deterministic formatting corrections (via `fixName`, `fixPhone`, and `fixAddress` utilities).
- Resolves anomalies optimally into a structured updates array and passes it through a new `onSaveBulk` property.

### Application Logic (`src/App.tsx`)
- Added `handleSaveStudentBulk` to process the updates array.
- This method computes correct Locus Gamification Action Types (`name`, `phone`, `address`) for each update, increments gamification stats optimistically, and awards Badges appropriately in a batch fashion.
- Employs the `BatchUpdateCommand` to handle communication with the Planning Center Online mock API cleanly, simultaneously capturing the operation into `CommandManager` so it can be Undone/Redone smoothly with one click.

### Testing (`src/components/ReviewMode.test.tsx`)
- Appended robust unit testing inside the vitest test suite. Confirmed the generated `updates` payload accurately contains the fully processed attributes.

## Discoveries & Future Ideas
- **Email Validation Enhancement:** Currently `email` string formats are not completely safely 'fixable' automatically without a third-party intelligence provider or basic typo auto-correct rules. An AI/ML approach could be integrated in the future.
- **Granular Category Selection:** Future iterations could allow the user to only batch process a specific subset of anomalies (e.g., clicking "Smart Fix All Phones" instead of all safe fields).
