# Locus: Ministry Intelligence Platform

Locus is a **Data Health OS** designed for church administrators (currently focusing on integrations with Planning Center Online - PCO). It has evolved from a simple data visualization tool into a comprehensive **Ministry Intelligence Platform**.

Locus exists to solve the silent crisis of data entropy in church databases, transforming raw data into actionable intelligence, automated hygiene, and predictive insights.

**Data Integrity is Pastoral Care.** To correctly know someone's name, age, and life stage is the most basic form of dignity. When data is accurate, effective ministry follows. Locus provides peace of mind by turning "Unknown Unknowns" into "Known Knowns".

## Features

Locus is divided into three core pillars:

### 1. The Core Engine (Data Integrity)
*   **The "Diagonal of Truth":** A correlation engine that calculates a health score based on Birthdate, Grade, and School District Cutoff, featuring one-click corrections (Smart Fix).
*   **Family Logic Validator:** Cross-references family data to flag abnormal spouse age gaps, parent/child age logic, and potential duplicates.
*   **The "Ghost" Protocol:** Identifies inactive records (active in the DB but zero real-world footprint for >2 years) for safe batch archiving.
*   **Advanced Data Hygiene:** Automated formatting and validation for Addresses, Emails, Phone Numbers (E.164), and Name casing.

### 2. The Intelligence Layer (AI & LLMs)
*   **The Pastoral Co-Pilot:** A conversational natural-language interface allowing users to ask complex questions like "Who is at risk of burnout?" or "Find potential volunteers."
*   **Predictive Attrition (Drift Report):** Analyzes attendance drops and check-in gaps to predict and flag members at high risk of leaving, suggesting timely pastoral interventions.
*   **Ministry Matchmaker:** Optimizes volunteer placement using algorithms that factor in life stage, tenure, and engagement.

### 3. Data Visualization & Insights
*   **The Bus Factor Graph:** Identifies critical, "high-risk" volunteers who act as single points of failure.
*   **The Heatmap of Life:** A visual calendar showing density for events like Birthdays.
*   **The Volunteer Web:** A force-directed graph revealing who serves with whom.
*   **The Contribution Graph:** A GitHub-style activity grid visualizing daily data hygiene contributions.
*   **The Newcomer Funnel:** Tracks guest retention from 1st visit through to membership.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Visualizations:** Recharts, Custom D3/SVG Force Directed Graphs
*   **Testing:** Vitest, Playwright (E2E)
*   **Development Server:** Node.js mock API

## Getting Started

To run Locus locally, you need to start both the Vite development server and the Mock API backend.

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
    By default, with the mock API running, use any credentials (e.g., `test` / `test`) to bypass the login overlay.

## Testing

Locus uses Vitest for unit/integration tests and Playwright for E2E verification.

*   **Run Unit Tests:**
    ```bash
    npm run test
    ```
    *(Note: Recharts `ResponsiveContainer` and `BarChart` are mocked in Vitest due to JS DOM measurement limitations).*

*   **E2E Verification Scripts:**
    There are Python/Playwright scripts located in the `verification/` folder to generate screenshots of various views:
    ```bash
    python verification/verify_dashboard.py
    ```

## Roadmap & Vision

For a deeper dive into the product philosophy, future roadmap, and over 100+ feature concepts in the "Idea Vault", refer to the included plans:
*   `plans/vision.md` (Version 6.2 - The "Pastoral Co-Pilot" Edition)
*   `plans/prd.md`
*   `plans/user-journeys.md`
