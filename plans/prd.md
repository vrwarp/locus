# Product Requirement Document (PRD)
*Status: Final | Version: 4.0 - Battle Tested*

## 1. Introduction
Locus is a **Data Health OS** for church administrators using Planning Center Online (PCO).

*Note: Originally conceived as a simple visualization tool for Age/Grade anomalies, Locus has evolved into a comprehensive Ministry Intelligence Platform.*

While visualization (seeing the problem) remains a core capability, the product focus has shifted to **Automation (fixing the problem)** and **Intelligence (predicting the future)**. We are not just flagging errors; we are automating the stewardship of people data.

### 1.1 Goals
*   **Primary:** Reduce the "Entropy Rate" of church databases by providing actionable, automated insights.
*   **Secondary:** Shift administrative focus from "Data Entry" to "Ministry Strategy" by automating 80% of routine hygiene tasks.
*   **Tertiary:** Increase "Peace of Mind" for Executive Pastors by transforming raw data into predictive risk indicators (Burnout, Attrition).

### 1.2 Target Audience
*   **Sarah (Admin):** Power user, needs efficiency and safety.
*   **Dr. Robert (Exec Pastor):** Needs high-level ROI and health metrics.
*   **Emily (Volunteer):** Needs a simplified, safe interface.

---

## 2. Prioritized Features (MoSCoW)

### 2.1 Must Have (MVP)
*   **Correlation Engine:** Scatter plot of Age vs. Grade with "Diagonal of Truth" logic. [DONE]
*   **Smart Fix Modal:** One-click corrections for Grade/Birthdate. [DONE]
    *   *Correction:* Must support full date selection, defaulting to Jan 1st of the estimated year if unknown. [DONE]
*   **PCO Integration:** Basic Auth, Read/Write capabilities.
    *   *Constraint:* Must handle pagination (recursive fetch) for datasets < 5,000. [DONE]
*   **Undo System:** 10-second toast to revert actions. [DONE]
*   **Persistence (Config):** Save "Cutoff Date" and user preferences locally (Encrypted). [DONE - Basic Auth/Storage]

### 2.2 Should Have (V1.1)
*   **Ghost Protocol:** Identification of inactive records with "Archive" bulk action. [DONE]
*   **Sandbox Mode:** Simulation environment for bulk edits. [DONE]
*   **The Robert Report:** Web-based read-only dashboard. [DONE]
*   **Cache Management:** Intelligent caching of API responses (e.g., 5-minute validity). [DONE]
*   **Pagination Handling (Large DB):** "Load More" or "Virtual Scroll" for databases > 5,000 records to prevent browser crash.

### 2.3 Could Have (V2.0)
*   **Gamification:** Progress bars, streaks, "Combo" sounds (with Mute toggle). [DONE]
*   **Family Logic:** Validator for Spouse/Child age gaps. [DONE]
*   **Genealogy Project:** Network graph of relationships.

### 2.4 Won't Have (Next 12 Months)
*   **VR War Room:** This is a conceptual "Moonshot" only. No engineering resources allocated.
*   **Native Mobile App:** Web responsive only.
*   **Integration with Rock RMS:** PCO only for launch.

---

## 3. Specific Feature Specs

### 3.1 The "Ghost" Protocol (Detailed)
*   **Logic:** `LastCheckIn > 24m` AND `Groups == 0`.
*   **Action:** Apply PCO `Membership Status: Archived`.

### 3.2 The "Robert Report" (Detailed)
*   **Header:** Church Name + "Data Health Audit".
*   **Section 1: The Score.** 0-100 calculated from % of valid records.
*   **Section 2: The Trend.** Line chart of "Health Score" over last 6 months.

---

## 4. Non-Functional Requirements
*   **Performance:** Chart must render 5,000 points in < 1 second.
*   **Security:** PII storage on Locus servers is prohibited.
*   **Accessibility:** WCAG 2.1 AA compliant colors. High Contrast Mode toggle required. Colorblind Mode supported.
*   **Reliability:** Must handle API Rate Limits (429) gracefully with exponential backoff.
*   **Resilience:** Startup check for PCO API version compatibility.
