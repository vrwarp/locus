# Locus

Locus is a data management and analytics platform designed for church administrators, integrating primarily with Planning Center Online (PCO).

The platform focuses on improving database accuracy through automated data hygiene tools, identifying patterns in engagement, and providing visual dashboards to help staff track health metrics like attendance and volunteer involvement.

## Features

Locus is divided into three core functional areas:

### 1. Data Integrity and Management
*   **Grade & Age Correlation:** Analyzes Birthdate, Grade, and School District Cutoff data to flag mismatched records, with a one-click correction tool.
*   **Family Logic Validator:** Cross-references family profiles to flag abnormal spouse age gaps, parent/child age logic, and potential duplicate households.
*   **Inactive Record Archiving:** Identifies records that have been inactive for over two years for bulk archiving.
*   **Data Standardization:** Automates formatting and validation for Addresses, Emails, Phone Numbers (E.164), and Name casing.

### 2. Analytics and Insights
*   **Pastoral Co-Pilot:** A conversational interface allowing users to query database metrics via natural language (e.g., "Find potential volunteers").
*   **Attrition Tracking:** Analyzes attendance drops and check-in gaps to flag individuals who may be disengaging.
*   **Volunteer Placement:** Evaluates and suggests volunteer placements based on life stage, tenure, and prior engagement history.

### 3. Visual Dashboards
*   **Bus Factor Graph:** Identifies critical volunteers who handle a disproportionate amount of responsibilities.
*   **Birthday Heatmap:** A visual calendar showing the density of birthdays across the congregation.
*   **Volunteer Web:** A force-directed graph revealing shared serving schedules among volunteers.
*   **Hygiene Contribution Graph:** An activity grid displaying daily data hygiene contributions by administrative staff.
*   **Newcomer Funnel:** Tracks guest retention rates from the first visit through to official membership.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Visualizations:** Recharts, Custom D3/SVG Force Directed Graphs
*   **Testing:** Vitest, Playwright (E2E)
*   **Development Server:** Node.js mock API

## Getting Started

To run Locus locally, start both the Vite development server and the mock API backend.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start the Mock API Server (Backend):**
    ```bash
    node mock-api/server.js
    ```

3.  **Start the Vite Development Server (Frontend):**
    Open a new terminal window and run:
    ```bash
    npm run dev
    ```

4.  **Login:**
    With the mock API running, use any credentials (e.g., `test` / `test`) to bypass the login overlay.

## Testing

Locus uses Vitest for unit/integration testing and Playwright for E2E verification.

*   **Run Unit Tests:**
    ```bash
    npm run test
    ```
    *(Note: Recharts `ResponsiveContainer` and `BarChart` are mocked in Vitest due to JS DOM measurement limitations).*

*   **E2E Verification Scripts:**
    Python/Playwright scripts to verify UI components are located in the `verification/` folder:
    ```bash
    python verification/verify_dashboard.py
    ```

## Documentation

For further context regarding product philosophy and future roadmap features, see the `plans/` directory.
