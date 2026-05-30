# Newsletter Architect Demographic Filtering Implementation

## Overview
Implemented the demographic filtering enhancement for the Newsletter Architect (Concept #31). This allows users to generate customized newsletters targeting specific generations (e.g., Gen Z, Millennials) by filtering the "Upcoming Birthdays" section accordingly.

## Implementation Details

### Core Logic (`src/utils/newsletter.ts`)
- Extended the `NewsletterOptions` interface to accept an optional `targetAudience` property.
- Updated the `generateNewsletter` utility to leverage the `GENERATIONS` constant from `src/utils/demographics.ts`.
- When filtering the `students` list to identify upcoming birthdays, the utility now cross-references the student's `birthYear` with the bounds of the selected generation, ensuring only matching individuals are included if a specific `targetAudience` (other than "All") is requested.

### UI Integration (`src/components/NewsletterArchitect.tsx`)
- Added a new component state `targetAudience` defaulting to `'All'`.
- Inserted a `<select>` dropdown labeled "Target Audience" within the newsletter controls.
- The dropdown populates its `<option>` elements dynamically using the `GENERATIONS` constant, offering a scalable solution if generation brackets are updated in the future.
- The `targetAudience` state is now passed into the `useMemo` block that calls `generateNewsletter`, ensuring the Markdown preview reacts and updates instantaneously when the user changes the demographic selection.

## Testing and Verification
- **Unit Tests:** Added a robust test case in `src/utils/newsletter.test.ts` to verify that passing 'Gen Z' or 'Millennials' properly filters out individuals from other generations while preserving those within the target bounds.
- **Integration Tests:** Added a new test in `src/components/NewsletterArchitect.test.tsx` to simulate user interaction. This test verifies that changing the dropdown value triggers an immediate update to the Markdown preview, filtering out names that no longer match. (Note: Relied on explicit data mocking and React DOM assertions instead of `vi.useFakeTimers()` to avoid JSDOM measurement and state update race conditions when testing the `useMemo` hooks).

## Future Ideas
- Connect the `targetAudience` filter to the event fetching logic. If PCO exposes event tags or demographics, we could filter out "Youth Night" when targeting "Boomers", ensuring the entire newsletter (not just birthdays) is strictly tailored.
- Provide a feature to save these generated drafts as templates or schedule them for direct export to Mailchimp depending on the chosen demographic.
