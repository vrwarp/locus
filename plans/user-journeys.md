# User Journeys

## Persona: Sarah, the Church Database Admin
- **Role:** Administrator at a mid-sized church (500-1000 members).
- **Goals:** Wants to ensure all children are checked into the correct classes for security and age-appropriate learning.
- **Frustrations:** Finds manual spreadsheet audits tedious; often discovers kids in the wrong grade only when a parent complains or a check-in label prints incorrectly.
- **Tech Savvy:** Comfortable with web apps, but not a developer.

---

## Journey 1: The Initial Audit (The "Lightbulb Moment")
**Goal:** Assess the overall health of the church's age/grade data for the first time.

1.  **Discovery:** Sarah hears about Locus as a tool to visualize PCO data.
2.  **Authentication:** She opens Locus and enters her Planning Center Application ID and Secret (she knows where to find these from her PCO Developer settings).
3.  **Loading:** She waits a moment while the app fetches her "People" database.
4.  **Visualization:** The "Grade Scatter" plot appears.
    - *Reaction:* She immediately sees a strong diagonal line (the "Diagonal of Truth") where most students sit.
    - *Realization:* However, she also sees scattered dots far away from the line—a 16-year-old in 1st Grade, and a 4-year-old in 5th Grade.
5.  **Outcome:** Sarah instantly understands that her database has significant errors that need addressing. She feels validated that her "hunch" about bad data was correct.

---

## Journey 2: Investigating Outliers (The "Detective Work")
**Goal:** Identify specific students with incorrect data to prepare for cleanup.

1.  **Selection:** Sarah focuses on the most extreme outliers on the chart (the dots furthest from the diagonal).
2.  **Inspection:** She hovers over a dot representing a "15-year-old in 2nd Grade."
3.  **Identification:** The tooltip reveals the name: "John Doe."
4.  **Verification:** She opens a new tab, goes to Planning Center People, and searches for "John Doe."
    - She sees his birthdate was entered incorrectly (typo in the year).
5.  **Action:** She corrects the birthdate in PCO.
6.  **Refresh:** (In a future version) She refreshes Locus, and John's dot snaps to the correct position on the diagonal.
7.  **Outcome:** Sarah has successfully cleaned up a record. She repeats this for the top 10 worst offenders.

---

## Journey 3: The Maintenance Check (The "Peace of Mind")
**Goal:** Ensure no new bad data has crept in during the busy fall kickoff season.

1.  **Routine:** It's the first Monday of the month. Sarah logs into Locus.
2.  **Scan:** She glances at the scatter plot.
3.  **Observation:** The dots are tightly clustered around the expected diagonal. There are no major outliers.
4.  **Confidence:** She sees one minor outlier (a child held back a year), but recognizes the name and knows it's intentional.
5.  **Outcome:** She closes the tab in under 2 minutes, confident that her data is clean and ready for Sunday service.
