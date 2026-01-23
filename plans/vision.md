# Locus Product Vision

## Executive Summary
Locus is the data integrity companion for churches using Planning Center Online, transforming invisible data errors into visible, actionable insights to ensure every person is known, placed, and cared for correctly.

## Vision Statement
To create a world where church data is pristine, effortless to maintain, and serves as a reliable foundation for effective ministry, freeing administrators from the "spreadsheet fatigue" of manual audits.

## Mission Statement
We empower Church Administrators by providing intuitive visualization tools that instantly reveal data anomalies (starting with Age/Grade alignment), enabling rapid correction and ongoing confidence in their people database.

## Target Audience
- **Primary:** Church Data Administrators / Database Managers.
- **Secondary:** Ministry Leaders (Kids/Youth Pastors) who rely on accurate rosters.
- **Context:** They are often overwhelmed by manual data entry, duplicate records, and out-of-date information. They value accuracy but lack the tools to ensure it efficiently.

## Core Value Propositions
1.  **Instant Visibility:** Turn rows of abstract data into clear, visual patterns (e.g., Scatter Plots) that make outliers impossible to miss.
2.  **Effortless Integration:** Seamlessly connect with Planning Center Online—no CSV exports or manual syncing required.
3.  **Actionable Intelligence:** Don't just show data; highlight the *problems* (e.g., "This 15-year-old is listed in 2nd Grade") and facilitate the fix.

## Strategic Pillars
1.  **Data Integrity:** Accuracy is our north star. We help users trust their system of record.
2.  **Visual Intuition:** We believe a chart is worth a thousand database queries. Complex relationships should be understood at a glance.
3.  **Ministry Focus:** We understand that behind every data point is a person. Correct grades mean kids are in the right classrooms and hearing the right curriculum.

## Roadmap Overview

### Phase 1: The "Diagonal of Truth" (Current)
- **Goal:** Visualize the correlation between Age and Grade.
- **Features:**
    - Basic Auth connection to PCO.
    - Fetch People API data.
    - Calculate Age vs. Recorded Grade.
    - Scatter Plot visualization to identify outliers.

### Phase 2: Actionable Insights (Near Term)
- **Goal:** Make it easier to identify and list specific errors.
- **Features:**
    - "Smart Lists" of probable errors (e.g., "Age 15, Grade 2").
    - Filtering and search within the visualization.
    - Click-to-view person details.

### Phase 3: The Correction Loop (Future)
- **Goal:** Fix data without leaving Locus.
- **Features:**
    - "Fix in Locus" button to update Grade/Birthdate directly via API.
    - Bulk update capabilities.
    - Historical tracking of data health improvements.
