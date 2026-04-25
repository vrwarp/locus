# PRD: Locus Core (Data Custodian Workspace)

## Overview
Locus Core is the engine of the platform. It is a highly interactive workspace dedicated to reducing database entropy. This space is designed for Admins (Sarah) and Volunteers (Emily).

## Scope
This PRD governs all tactical, repetitive data hygiene work.

### Core Features
- **Diagonal of Truth (Age/Grade Anomalies):** Visualizes and helps resolve mismatches between a person's age and their assigned school grade.
- **Smart Fix Modal:** A rapid-fire UI for correcting missing or malformed data (phones, emails, addresses).
- **Ghost Protocol:** Identifying and clearing inactive profiles.
- **Duplicates Report:** Merging duplicate profiles safely.
- **Address & Phone Formatting:** Utilities to standardize contact information.

### The Gamification Engine
Because the work in Locus Core is repetitive and tedious, this workspace utilizes a Gamification Engine to motivate volunteers.
- **Rule:** Gamification is strictly confined to Locus Core.
- **Features Include:**
  - Streaks (Daily/Weekly)
  - Bounty Board (Task assignments)
  - Zen Mode / Speed Run Mode
  - Campus Cup (Team-based competition)
  - Data Ninja Avatars

## State Management
This workspace requires robust state management (e.g., an Undo/Redo Command Manager) to handle the high volume of interactive data modifications safely.
