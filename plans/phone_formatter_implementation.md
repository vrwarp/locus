# Phone Formatter Implementation

## Overview
Implemented the "Phone Formatter" concept from the Idea Vault (Vision Item #16) as part of our automated data hygiene suite. The goal is to enhance data completeness by automatically prepending area codes to 7-digit phone numbers when a valid US ZIP Code is available.

## Implementation Details

### Core Logic (`src/utils/areaCodes.ts`)
Instead of a rudimentary mock dictionary, we generated a comprehensive map linking 3-digit US ZIP Code prefixes (SCFs - Sectional Center Facilities) to their most common Area Code.
- To avoid bloating the codebase, the map is stored in a compressed format grouped by area code (e.g., `'310': '902|903|904'`).
- The utility function `getUncompressedMapping` parses this compressed record into a flat lookup dictionary at runtime.
- The `getAreaCodeFromZip` function then extracts the first three digits of a given ZIP code and looks up the corresponding Area Code.

### Utility Integration (`src/utils/hygiene.ts`)
The `fixPhone` utility leverages this new capability.
- When `fixPhone` encounters a 7-digit phone string, it attempts to resolve the area code using `getAreaCodeFromZip(zipCode)`.
- If an area code is found, it prepends `+1{areaCode}` ensuring the final string meets E.164 standards.

### Testing & Maintenance
- Added `src/utils/areaCodes.test.ts` to assert that correct mapping and edge cases (e.g., invalid lengths, unknown prefixes) are handled gracefully.
- Updated `src/utils/hygiene.test.ts` to verify the integration.
- Fixed unrelated test warnings and errors across the suite (e.g., `AudioContext` errors in `audio.test.ts` and `act()` warnings in React Testing Library component tests) to ensure the newly robust test suite passes flawlessly.

## Discoveries & Future Ideas
- **Overlay Complexity:** The mapping algorithm pairs a single dominant Area Code to each SCF. Realistically, some regions have overlapping Area Codes. This "best guess" approach is usually sufficient for simple hygiene but could be improved by checking if the user resides in a specific city string or by checking external telecom APIs.
- **City/State Auto-fill:** A future extension of this SCF mapping could be used to implement the reverse: auto-suggesting City and State fields when an Admin inputs a ZIP Code during profile creation or data review.
