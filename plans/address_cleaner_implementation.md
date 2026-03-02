# Address Cleaner Implementation

## Overview
Implemented the "Address Cleaner" concept from the Idea Vault (Vision Item #15) as an automated data hygiene utility. This utility focuses on standardizing street address abbreviations into their full forms, improving data consistency across the church database.

## Implementation Details

### Core Logic (`src/utils/hygiene.ts`)
Created the `fixAddress` utility function, which processes raw street address strings.
- Employs a map of common address abbreviations (e.g., 'St.', 'Rd.', 'Ave.') mapped to their full representations ('Street', 'Road', 'Avenue').
- Uses Regular Expressions (`\b{abbr}(?=\s|$)`) to find and replace abbreviations accurately at the end of strings or when followed by a space, avoiding accidental replacement in the middle of words (e.g., not replacing 'St' inside 'Austin').
- Implements a secondary regex pass to ensure correct capitalization (Title Case) of standard street suffixes, transforming variations like '123 Main street' or '123 main ave' into '123 Main Street' and '123 main Avenue'.

### UI Integration (`src/components/ReviewMode.tsx`)
Integrated the `fixAddress` utility into the interactive Review Mode.
- When an admin selects a student with an "Address Anomaly", the Review Modal now pre-populates the "Street" input field with the result of `fixAddress(currentAddress.street)`.
- This auto-suggestion saves time and manual effort, allowing the admin to simply accept the corrected format with a single click ("Fix Address").

### Testing
- Added comprehensive unit tests in `src/utils/hygiene.test.ts` to cover various abbreviation types, capitalization handling, and edge cases (empty strings, non-matching text).
- Updated integration tests in `src/components/ReviewMode.test.tsx` to verify that the UI correctly suggests the cleaned address string to the user.

## Discoveries & Future Ideas

- **Complex Replacements:** The current regex handles common cases well, but edge cases like `St. Louis` or `St. John Street` might accidentally turn into `Street Louis` or `Street John Street` depending on the string position constraints. We limited the match to word boundaries (`\b`) and followed by space or end-of-string to minimize false positives, but a more sophisticated NLP or mapping approach might be needed for perfect accuracy on saint names versus street types.
- **Address Validation API Integration:** The current system relies on basic regex for validation and formatting. A future enhancement could integrate with a dedicated address validation API (like SmartyStreets or Google Maps API) to verify the address actually exists and retrieve the fully standardized USPS format.
- **Zip Code Enrichment:** The Idea Vault mentions "Phone Formatter: Auto-add area codes based on Zip Code." A similar enhancement could auto-fill City and State based on an entered Zip Code, further streamlining data entry.
- **Bulk Fixing:** Currently, the fix is applied sequentially in Review Mode. Future iterations could allow for a "Smart Fix All" button that automatically applies safe fixes (like address expansions) across the entire dataset without requiring manual review per record.
