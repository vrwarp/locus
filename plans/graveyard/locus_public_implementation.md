# Locus Public Implementation Document

## Overview
The "Locus Public" feature (Concept #35) introduces a simulated member-facing portal. It allows users to log in (simulated by selecting their profile from a dropdown) and update their own contact information independently, rather than relying on an administrator to resolve data anomalies.

## Implementation Details

### Component Structure
1. **`LocusPublic.tsx`**:
    - Acts as the primary interface for the member portal.
    - Requires an array of `Student` objects and an `onSave` callback to handle profile updates.
    - Uses local state to manage the currently selected member (`selectedStudentId`) and form input data (`formData`).
    - Handles the structured `Address` object by presenting individual inputs for `street`, `city`, `state`, and `zip`.
    - The "Update Profile" function applies the existing hygiene utility methods (`fixPhone`, `fixAddress` for the street component) to ensure the updated inputs adhere to database formatting standards before assembling the updated `Student` and triggering the `onSave` callback.

2. **`LocusPublic.css`**:
    - Provides dedicated styling to differentiate the member portal from the admin dashboard.
    - Implements a simple layout with clear grouping of form inputs.
    - Includes basic visual feedback for successful updates using CSS animations.

### Integration
- **`Sidebar.tsx`**: Added a new navigation item for "Locus Public" (using the 👤 icon) under the "Tools" section to access the view.
- **`App.tsx`**: Registered `'locus-public'` as a valid view and configured it to render the `LocusPublic` component, passing down the current state of `students` and `handleSaveStudent`.

## Test Coverage
- Unit and integration tests were created in `src/components/LocusPublic.test.tsx` using `vitest` and `@testing-library/react`.
- Tests verify:
  1. Component renders correctly.
  2. Selecting a user from the dropdown correctly loads their initial data into the form (including flattening the `Address` object).
  3. Modifying input fields and clicking the "Update Profile" button properly triggers the `onSave` callback with hygienic data formats (verifying that `fixPhone` and `fixAddress` behavior persists, and the `Address` object is correctly reconstructed).
