# Family Swap Feature Implementation

## Overview
Implemented the ability to swap roles between a Child and a Parent when a "Child older than Parent" anomaly is detected.

## Components
- `src/commands/BatchUpdateCommand.ts`: Handles atomic updates for multiple `Student` records. Specifically used to swap `isChild` status.
- `src/utils/family.ts`: Detects "Child older than Parent" and tags it with `fixType: 'Swap'`.
- `src/components/FamilyModal.tsx`: Renders a "Swap Roles" button for issues with `fixType: 'Swap'`.
- `src/App.tsx`: Implements `handleFamilySwap` which uses `BatchUpdateCommand`.

## Verification
- Unit tests: `src/commands/BatchUpdateCommand.test.ts` covers the swap logic and undo capability.
- E2E Verification: Confirmed via script that the button appears and can be clicked.
