# Executive Export Implementation

## Overview
Implemented the "Boardroom Ready" export capability as dictated by the `04_prd_locus_intelligence.md` requirement: "The data should be easily exportable or presentable for executive meetings." This enhancement allows Executive Pastors to export complex strategic reports into a universal, portable format (CSV) for further analysis in spreadsheet software or for distribution in staff meetings.

## Enhancements Built

### 1. Universal CSV Exporter (`src/utils/export.ts`)
- **Goal:** Provide a generic, robust utility for converting arrays of data objects into a downloadable CSV file on the client-side.
- **Implementation:**
    - Created the `downloadCSV` function that accepts an array of objects and a target filename.
    - Uses `Blob` and dynamically generated HTML `<a>` elements to trigger native browser downloads.
    - Implemented robust cell serialization: properly handles `null`/`undefined` edge cases, stringifies nested objects safely, and strictly escapes double-quotes to prevent CSV injection or malformation.
- **Testing:** Implemented `export.test.ts` to verify DOM element creation/interaction and correct execution pathways using Vitest's `vi.spyOn` for browser globals.

### 2. Burnout Risk Export (`src/components/BurnoutReport.tsx`)
- **Goal:** Allow executives to export the list of at-risk volunteers.
- **Implementation:** Added an "Export to CSV" button to the report header. When clicked, it maps the underlying `candidates` state into a boardroom-friendly format with headers like 'Risk Level', 'Serving Count', and 'Worship Count', and triggers the download.
- **Testing:** Updated `BurnoutReport.test.tsx` to assert the button exists when data is present and correctly invokes the `downloadCSV` mock.

### 3. Predictive Attrition Export (`src/components/DriftReport.tsx`)
- **Goal:** Allow executives to export the list of individuals exhibiting attendance drift.
- **Implementation:** Added an "Export to CSV" button to the report header. It maps the data into columns such as 'Baseline Rate', 'Recent Rate', and 'Drop Percentage', providing a clear numerical narrative for the downloaded report.
- **Testing:** Updated `DriftReport.test.tsx` to assert the integration between the UI and the new export utility.

### 4. Missing Volunteers Export (`src/components/MissingVolunteersReport.tsx`)
- **Goal:** Allow executives to export the list of key volunteers who have been completely absent recently.
- **Implementation:** Added an "Export to CSV" button to the report header alongside the alert details. When clicked, it exports the 'Name', 'Weeks Missing', and 'Last Seen' data to a CSV file named `missing_volunteers_report.csv`.
- **Testing:** Updated `MissingVolunteersReport.test.tsx` to assert the export functionality calls the `downloadCSV` mock utility properly when data is present.

## Technical Discoveries
- **JSDOM Constraints:** Simulating file downloads in JSDOM (Vitest) is impossible natively since it lacks a real filesystem and navigation context. I resolved this by mocking `URL.createObjectURL` and intercepting DOM calls (`document.createElement('a')`, `.click()`) to verify the *intent* of the function without causing test runtime errors.
- **Reusability:** By using generics (`<T extends Record<string, any>>`), the `downloadCSV` utility is highly adaptable and can be easily applied to any future report (e.g., Duplicates, Missing Volunteers) without modification.

## Future Ideas
- **PDF Generation:** While CSV is great for data manipulation, a "Boardroom Ready" feature should eventually include generating styled PDF summaries of the dashboards (perhaps using a library like `jspdf` or `html2canvas`) for instant visual handouts.
- **Global Intelligence Export:** Create a "Master Export" button on the Intelligence Dashboard that zips multiple CSVs (Burnout, Drift, Missing Volunteers) together into a single downloadable archive.
- **Scheduled Exports:** Integrate with a backend (if one is ever built) to email these CSV reports automatically to the executive team every Monday morning.
