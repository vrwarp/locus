# Product Requirement Document (PRD)
*Status: Final Draft | Version: 3.0*

## 1. Introduction
Locus is a "Data Health OS" for church administrators using Planning Center Online (PCO). It visualizes data anomalies (specifically Age/Grade mismatches) to ensure data integrity, which directly correlates to effective pastoral care.

### 1.1 Goals
*   **Primary:** Reduce the "Entropy Rate" of church databases by providing actionable insights.
*   **Secondary:** Reduce administrative time spent on auditing by 80%.
*   **Tertiary:** Increase "Peace of Mind" for Executive Pastors regarding data accuracy.

### 1.2 Target Audience
*   **Sarah (Admin):** Power user, needs efficiency and safety.
*   **Dr. Robert (Exec Pastor):** Needs high-level ROI and health metrics.
*   **Emily (Volunteer):** Needs a simplified, safe interface.

---

## 2. Prioritized Features (MoSCoW)

### 2.1 Must Have (MVP)
*   **Correlation Engine:** Scatter plot of Age vs. Grade with "Diagonal of Truth" logic.
*   **Smart Fix Modal:** One-click corrections for Grade/Birthdate.
*   **PCO Integration:** Basic Auth, Read/Write capabilities.
*   **Undo System:** 10-second toast to revert actions.

### 2.2 Should Have (V1.1)
*   **Ghost Protocol:** Identification of inactive records with "Archive" bulk action.
    *   *Constraint:* Must distinguish "Ghost Donors" (High giving, low attendance) and flag them separately.
*   **Sandbox Mode:** Simulation environment for bulk edits.
*   **The Robert Report:** PDF exportable dashboard with financial/health metrics.

### 2.3 Could Have (V2.0)
*   **Gamification:** Progress bars, streaks, "Combo" sounds.
*   **Family Logic:** Validator for Spouse/Child age gaps.
*   **Genealogy Project:** Network graph of relationships.
*   **VR War Room:** AR/VR interface for lobby management.

### 2.4 Won't Have (For Now)
*   **Native Mobile App:** Web responsive only.
*   **Integration with Rock RMS:** PCO only for launch.

---

## 3. Specific Feature Specs

### 3.1 The "Ghost" Protocol (Detailed)
*   **Logic:** `LastCheckIn > 24m` AND `Giving < $10` AND `Groups == 0`.
*   **Action:** Apply PCO `Membership Status: Archived`.
*   **Exception:** If `Giving > $100` in last 12m, apply Tag `Review: High Value Donor` and do NOT archive.

### 3.2 The "Robert Report" (Detailed)
*   **Header:** Church Name + "Data Health Audit".
*   **Section 1: The Score.** 0-100 calculated from % of valid records.
*   **Section 2: The Risk.** Sum of `Last Year Giving` for all "Ghost Donors".
*   **Section 3: The Trend.** Line chart of "Health Score" over last 6 months.

---

## 4. Non-Functional Requirements
*   **Performance:** Chart must render 5,000 points in < 1 second.
*   **Security:** No PII storage on Locus servers (RAM only).
*   **Accessibility:** WCAG 2.1 AA compliant colors.
*   **Reliability:** Must handle API Rate Limits (429) gracefully with exponential backoff.
