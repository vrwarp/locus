# Zip Code Enrichment Implementation

## Overview
Implemented the "Zip Code Enrichment" feature as a data hygiene improvement in the interactive Data Custodian Workspace.

## Implementation Details

### Core Logic (`src/utils/zipCodes.ts`)
Created the `enrichZipCode` utility function, which relies on a pre-defined mapping of 3-digit Zip Code prefixes to major US City/State combinations.
- Uses `ZIP_PREFIX_MAP` to look up the first 3 digits of a provided Zip Code string.
- Returns a structured `{ city, state }` object if a match is found, otherwise returns null.

### UI Integration (`src/components/ReviewMode.tsx`)
Integrated the `enrichZipCode` utility into the interactive Review Mode during Address anomaly fixing.
- Modified the Zip Code input field's `onChange` handler to dynamically detect when a user enters at least 3 digits.
- Upon entering a recognizable prefix, the system automatically calls `enrichZipCode`.
- If a match is found, it non-destructively populates the `city` and `state` fields in the `targetAddress` state, provided they are currently empty. This allows for rapid data entry while preserving existing corrections.

### Testing
- Added unit tests in `src/utils/zipCodes.test.ts` to verify prefix matching, error handling (empty strings, short strings), and unknown prefix fallbacks.

## Discoveries & Future Ideas
- **Comprehensive Mapping:** The current `ZIP_PREFIX_MAP` contains a subset of major cities. In the future, this mapping should be expanded to a complete USPS 3-digit SCF (Sectional Center Facility) dataset to provide value for all locations.
- **API Fallback (Implemented):** If the static mapping fails or provides an outdated/incorrect city name for a specific 5-digit zip code, a lightweight asynchronous fallback to the Zippopotam.us API is now used via `enrichZipCodeAsync` to provide precise enrichment.
