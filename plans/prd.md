# Product Requirement Document (PRD)
*Status: Final | Version: 4.0 - Battle Tested*

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
*   **Correlation Engine:** Scatter plot of Age vs. Grade with "Diagonal of Truth" logic. [DONE]
*   **Smart Fix Modal:** One-click corrections for Grade/Birthdate. [DONE - UI/Logic]
    *   *Correction:* Must support full date selection, defaulting to Jan 1st of the estimated year if unknown.
*   **PCO Integration:** Basic Auth, Read/Write capabilities.
    *   *Constraint:* Must handle pagination (recursive fetch) for datasets < 5,000. [DONE]
*   **Undo System:** 10-second toast to revert actions. [DONE]
*   **Persistence (Config):** Save "Cutoff Date" and user preferences locally (Encrypted). [DONE - Basic Auth/Storage]

### 2.2 Should Have (V1.1)
*   **Ghost Protocol:** Identification of inactive records with "Archive" bulk action.
    *   *Constraint:* Configurable thresholds for "Ghost Donor" (e.g., Default > $100/yr).
*   **Sandbox Mode:** Simulation environment for bulk edits. [DONE]
*   **The Robert Report:** Web-based read-only dashboard. [DONE]
*   **Cache Management:** Intelligent caching of API responses (e.g., 5-minute validity).
*   **Pagination Handling (Large DB):** "Load More" or "Virtual Scroll" for databases > 5,000 records to prevent browser crash.

### 2.3 Could Have (V2.0)
*   **Gamification:** Progress bars, streaks, "Combo" sounds (with Mute toggle).
*   **Family Logic:** Validator for Spouse/Child age gaps.
*   **Genealogy Project:** Network graph of relationships.

### 2.4 Won't Have (Next 12 Months)
*   **VR War Room:** This is a conceptual "Moonshot" only. No engineering resources allocated.
*   **Native Mobile App:** Web responsive only.
*   **Integration with Rock RMS:** PCO only for launch.

---

## 3. Specific Feature Specs

### 3.1 The "Ghost" Protocol (Detailed)
*   **Logic:** `LastCheckIn > 24m` AND `Giving < $Threshold` AND `Groups == 0`.
*   **Action:** Apply PCO `Membership Status: Archived`.
*   **Exception:** If `Giving > $Threshold` in last 12m, apply Tag `Review: High Value Donor` and do NOT archive.

### 3.2 The "Robert Report" (Detailed)
*   **Header:** Church Name + "Data Health Audit".
*   **Section 1: The Score.** 0-100 calculated from % of valid records.
*   **Section 2: The Risk.** Sum of `Last Year Giving` for all "Ghost Donors".
*   **Section 3: The Trend.** Line chart of "Health Score" over last 6 months.

---

## 4. Non-Functional Requirements
*   **Performance:** Chart must render 5,000 points in < 1 second.
*   **Security:** PII storage on Locus servers is prohibited.
*   **Accessibility:** WCAG 2.1 AA compliant colors. High Contrast Mode toggle required.
*   **Reliability:** Must handle API Rate Limits (429) gracefully with exponential backoff.
*   **Resilience:** Startup check for PCO API version compatibility.
