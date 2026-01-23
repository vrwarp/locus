# User Journeys: The Locus Chronicles
*Volume 2 - The Narrative Edition*

---

## 1. The Dramatis Personae (The Cast)

### 1.1 Sarah, The "Architect" (Primary Persona)
*   **Role:** Database Administrator / Executive Assistant.
*   **Archetype:** The Perfectionist / The Shield.
*   **Quote:** "If it's not in PCO, it didn't happen."
*   **Psychographics:** High conscientiousness, high anxiety. Feeds on order. Loves crossing things off lists.
*   **Tech Literacy:** High (for apps), Low (for code). Can write a complex Excel formula but fears the "Delete" key.

### 1.2 Pastor Mike, The "Shepherd" (Secondary Persona)
*   **Role:** Family Ministry Pastor.
*   **Archetype:** The Visionary / The Relationalist.
*   **Quote:** "People are not numbers."
*   **Psychographics:** Extroverted, big-picture thinker. Gets bored by spreadsheets instantly. Trusts his gut more than the data.
*   **Tech Literacy:** Moderate. Uses an iPad for everything.

### 1.3 Dr. Robert, The "Skeptic" (New Persona)
*   **Role:** Executive Pastor (Former CFO).
*   **Archetype:** The Auditor.
*   **Quote:** "Show me the ROI. Why are we paying for another tool?"
*   **Psychographics:** Risk-averse, bottom-line focused. Sees "software subscriptions" as leaks in the budget.
*   **Tech Literacy:** Low. Still prints out emails.

### 1.4 Emily, The "Over-Eager Volunteer" (New Persona)
*   **Role:** Sunday School Coordinator (Volunteer).
*   **Archetype:** The Enthusiast.
*   **Quote:** "I just want to help!"
*   **Psychographics:** High energy, low attention to detail. Will accidentally delete a record if not restricted.
*   **Tech Literacy:** Digital Native (Gen Z), but careless.

### 1.5 The "Ghost" (New Persona - The Data Subject)
*   **Role:** A generic 14-year-old student in the database.
*   **Archetype:** The Victim of Entropy.
*   **Status:** "Lost." He is listed as 9 years old, so he gets invitations to "Jump House" parties instead of "Laser Tag." He thinks the church is lame and irrelevant.

---

## 2. Narrative Arc 1: The Skeptic's Conversion
*A story of how Dr. Robert went from budget-cutter to Locus champion.*

**Scene:** The Monday Morning Staff Meeting. Tension is high.
**Conflict:** Dr. Robert is reviewing the software budget. "We spend $5,000 a month on SaaS. We need to cut."

**The Action:**
1.  **The Challenge:** Robert points to the line item for "Locus - $99/mo." He asks, "What is this? Doesn't Planning Center do this?"
2.  **The Defense:** Sarah doesn't argue. She connects her laptop to the projector.
3.  **The Demo:** She opens Locus.
    *   She clicks "Projector Mode" (High contrast, large text).
    *   She navigates to the "Giving vs. Attendance" Scatter Plot (Enterprise Feature).
4.  **The Reveal:** "Robert, look at this cluster here." She circles a group of red dots in the top right quadrant.
    *   *Data Point:* High Giving, Zero Attendance (Last 6 months).
5.  **The Insight:** "These are 15 families who are effectively 'donating ghosts'. They are still giving, but they haven't checked in since Easter. We are about to lose them, and their tithe."
6.  **The Realization:** Robert adjusts his glasses. "That's... $40,000 of annual giving at risk."
7.  **The Resolution:** Robert looks at Sarah. "Can we export that list? I want to call them personally."
8.  **The Aftermath:** Robert approves the budget. He now has Locus bookmarked on his iPad.

---

## 3. Narrative Arc 2: The Volunteer's Nightmare
*A story of Safety, Error, and Redemption.*

**Scene:** Thursday afternoon. Emily is preparing labels for the "Fall Kickoff."

**The Problem:** Emily needs to print name tags for the "Little Lambs" (Ages 2-3) class. She exports the list from PCO and prints 50 labels.
**The Disaster:** On Sunday morning, a 12-year-old boy named "Michael" walks up. His name tag is waiting in the "Little Lambs" pile. His friends see it. They laugh. Michael is humiliated. He refuses to go to class. His mom is furious.

**The Diagnosis (Post-Mortem with Locus):**
1.  **The Investigation:** Sarah logs into Locus on Monday.
2.  **The Visualization:** She filters for "Name: Michael."
3.  **The Anomaly:** She sees Michael's dot.
    *   *Y-Axis (Grade):* 7th Grade.
    *   *X-Axis (Age):* 2.5 years old.
4.  **The Cause:** Someone (probably Emily) typed "2021" instead of "2011" for his birth year. PCO didn't catch it because "2021" is a valid date.
5.  **The Solution:** Locus *did* catch it. It was a bright red dot screaming "Age/Grade Mismatch." If Sarah had checked Locus on Friday, Michael wouldn't have been embarrassed.

**The New Protocol:**
1.  **The Pre-Flight Check:** Every Friday at 2 PM, Sarah opens Locus.
2.  **The Sweep:** She checks the "New Records" bucket (people added in the last 7 days).
3.  **The Catch:** She spots a new typo ("Grade 35" instead of "Grade 5").
4.  **The Fix:** Click -> Edit -> Save.
5.  **The Result:** A boring Sunday. No drama. Just ministry.

---

## 4. Micro-Journeys: The UI Physics
*Detailed breakdown of specific interactions.*

### 4.1 The "Hover of Truth"
**Goal:** To inspect a data point without losing context.
*   **Trigger:** User moves mouse over a dot.
*   **Response (< 10ms):**
    *   The dot scales up 150%.
    *   A "Tooltip Card" snaps into existence.
    *   *Card Content:* Profile Photo (Circle), Full Name (Bold), Age (calculated), Grade (recorded), and the "Delta" (e.g., "-2 years").
    *   *Background:* The rest of the chart dims slightly (10% opacity reduction) to focus attention.
    *   *Connecting Lines:* Faint lines draw from the dot to the X and Y axes to show exact position.

### 4.2 The "Magnetic Correction"
**Goal:** To fix a grade error with satisfying physics.
*   **Trigger:** User clicks a dot that is off the diagonal.
*   **Action:** A modal appears: "Fix Grade".
*   **Interaction:** The user drags a slider for "Grade".
*   **Feedback:** As the slider moves, a "Ghost Dot" moves on the chart in real-time.
*   **The Snap:** When the slider hits the correct grade (matching the age), the Ghost Dot snaps to the "Diagonal of Truth" line and glows Green.
*   **Commit:** User releases the slider. The real dot animates to the new position with a "Spring" physics curve.
*   **Sound:** A subtle "Click" sound plays.

### 4.3 The "Lasso" Select
**Goal:** Bulk action.
*   **Action:** User holds "Shift" and clicks-and-drags on the chart background.
*   **Visual:** A semi-transparent blue selection polygon follows the cursor.
*   **Selection:** All dots inside the polygon turn Blue.
*   **Context Menu:** A floating toolbar appears next to the selection:
    *   [Edit Grade]
    *   [Add to List]
    *   [Archive]
    *   [Email]

---

## 5. The "Crisis" Scenario: The Big Migration
*A high-stress journey.*

**Context:** The church has just acquired a smaller church ("The Merger"). They are importing 500 new people into the database today.

**Hour 0: The Dump**
*   The CSV is imported. It is a mess. Formats are wrong. "M" and "F" are "Male" and "Female". Birthdates are "DD/MM/YYYY" mixed with "MM/DD/YYYY".

**Hour 1: The Panic**
*   Sarah opens PCO. It looks fine on the surface.
*   She opens Locus. **It looks like a Jackson Pollock painting.** Dots are everywhere. There is no diagonal. Chaos.

**Hour 2: The Triage**
*   Sarah uses Locus's "Source Filter" to show only the new 500 records.
*   She sees a cluster of people listed as "123 years old." (Birth year 1900 - the default for missing data).
*   **Action:** Lasso Select -> "Set Birthdate to Null". Cleared.

**Hour 3: The Pattern**
*   She sees a diagonal line, but it's *perpendicular* to the correct one.
*   **Insight:** "Oh, the import swapped Age and Grade columns for the Kids Ministry."
*   **Action:** She selects the group. She opens the "Transformation Tool."
*   **Script:** "Swap Field: Grade <-> Field: Age (derived)."
*   **Result:** The perpendicular line rotates 90 degrees and snaps onto the Diagonal of Truth.

**Hour 4: Peace**
*   The chart looks clean. The merger is successful. Sarah goes home on time.

---

## 6. The "Onboarding" Experience (First 5 Minutes)

1.  **The Welcome:** "Hello, Guardian. Let's clean your house."
2.  **The Connection:** "Enter App ID / Secret." -> "Validating..." -> "Success."
3.  **The Loading Screen:** "Fetching 2,403 People... Calculating Ages... Identifying Ghosts... Polishing Pixels..."
4.  **The First Chart:** The chart loads with a dramatic animation (Staggered fade-in from left to right).
5.  **The "Wow" Moment:** A single spotlight shines on the "Worst Offender" (The biggest outlier).
    *   *Text:* "Meet John. He's listed as 84 years old in the Nursery. Let's fix him together."
6.  **The Tutorial:** User clicks "Fix". John moves.
7.  **The Reward:** "1 down. 43 anomalies to go. You've got this."

---
*End of Document*
