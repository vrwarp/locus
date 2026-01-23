# User Journeys: Tales of the Data Guardians

## 1. The Cast of Characters (Personas)

### Sarah, The "Architect" (Primary Persona)
*   **Role:** Database Administrator / Executive Assistant.
*   **Archetype:** The Perfectionist.
*   **Motivation:** Order, efficiency, and being the "source of truth" for the staff.
*   **Pain Point:** "I spend 4 hours every Friday cross-referencing spreadsheets with the check-in system, and I *still* find mistakes on Sunday morning."
*   **Superpower:** Can spot a typo from 50 yards away.

### Pastor Mike, The "Shepherd" (Secondary Persona)
*   **Role:** Family Ministry Pastor.
*   **Archetype:** The Visionary.
*   **Motivation:** Making sure every kid is known and loved.
*   **Pain Point:** "I don't care about the database fields; I just want to know why Timmy is in the wrong small group."
*   **Superpower:** Knows every kid's name but forgets their birthdays.

### Karen, The "Gatekeeper" (Tertiary Persona)
*   **Role:** Check-in Volunteer Coordinator.
*   **Archetype:** The Protector.
*   **Motivation:** Security and speed on Sunday mornings.
*   **Pain Point:** "When a label prints wrong, the line stops, parents get mad, and I panic."
*   **Superpower:** Managing chaos with a smile.

---

## 2. Core Journeys (The "Happy Paths")

### Journey A: The "First Light" (The Initial Audit)
*The emotional journey from anxiety to clarity.*

1.  **The Trigger:** Sarah receives an angry email from a parent: "My son is 14 but he's stuck in the 5th-grade list for the retreat!" She realizes her data is a mess.
2.  **The Setup:** She logs into Locus. The interface is dark, sleek, and calming. She enters her API keys.
3.  **The Reveal:** The screen fades in. Thousands of dots animate into the "Grade Scatter" view.
    *   *Micro-interaction:* As the dots settle, a soft "thud" sound plays (optional), grounding the data.
4.  **The Shock:** She sees the "Diagonal of Truth"—a tight cluster of correct data. But she also sees the "Wilderness"—dots scattered everywhere.
    *   *Internal Monologue:* "Oh my gosh. It's worse than I thought. But... at least I can see it now."
5.  **The Exploration:** She toggles a filter: "Show only High School." The chart zooms in smoothly.
6.  **The Validation:** She clicks a "Share" button and generates a read-only link. She slacks it to Pastor Mike with the caption: "Found the problem with the retreat list. Give me 10 minutes."
7.  **Resolution:** She feels empowered. The monster in the closet is no longer invisible.

### Journey B: The "Morning Coffee Clean-up" (Routine Maintenance)
*The ritual of keeping the garden weeded.*

1.  **Context:** It's Tuesday morning. Sarah has her coffee. She has 15 minutes before a staff meeting.
2.  **The Dashboard:** She opens Locus. A "Health Score" widget spins up to **94/100**.
    *   *Notification:* "6 new anomalies detected since last week."
3.  **The Hunt:** She clicks "Review Anomalies." The view shifts to a focused list mode, side-by-side with the scatter plot.
4.  **The Action:**
    *   *Item 1:* "Jessica, Age 7, Grade: None." -> Sarah clicks "Auto-Assign Grade 2" based on birthdate. *Whoosh*—the item disappears.
    *   *Item 2:* "Mark, Age 45, Grade: 10." -> Sarah laughs. "Mark is a leader, not a student." She clicks "Mark as Adult/Graduated."
5.  **The Dopamine:** The counter ticks down: 5... 4... 3... 0.
6.  **The Payoff:** The Health Score bumps to **98/100**. Confetti rains briefly on the screen (subtle, classy confetti).
7.  **Exit:** She closes the tab, satisfied. Her work is done.

---

## 3. The "Edge Case" Journeys (Where Reality gets Messy)

### Journey C: The "Special Needs" Exception
*Handling data that is technically "wrong" but relationally "right".*

1.  **The Scenario:** Billy is 12 (should be 7th grade) but has special needs and stays in the 4th-grade classroom where he is comfortable.
2.  **The Conflict:** Locus flags Billy as a "Critical Error" (Age/Grade mismatch).
3.  **The Resolution:**
    *   Sarah sees the red flag on Billy.
    *   She hovers and clicks the "Ignore/Annotate" button (an icon of a crossed-out eye or a sticky note).
    *   She types a note: "Permitted Exception - Special Needs Ministry Plan."
    *   She sets an expiry: "Review in 1 Year."
4.  **The Outcome:** Billy's dot turns from "Error Red" to "Exception Blue." He stays on the chart but no longer affects the Health Score. The system respects the human nuance.

### Journey D: The "Import Disaster" Recovery
*Recovering from a bad CSV upload.*

1.  **The Scenario:** A volunteer uploaded a CSV of VBS kids and accidentally swapped the "Birth Month" and "Birth Day" columns for 50 kids.
2.  **The Detection:** Sarah logs in and sees a bizarre pattern—a vertical line of kids who all seemingly have birthdays on the 1st of the month.
3.  **The Analysis:** She uses the "Lasso Tool" to circle this odd group of dots.
4.  **The Insight:** The side panel shows a summary: "50 selected. Common trait: Birth Day is < 13."
5.  **The Fix:** She selects "Batch Edit." She chooses a transformation script (Future Feature): "Swap Day/Month."
6.  **The Relief:** The dots scramble and re-settle into a natural distribution. Crisis averted before anyone even noticed.

---

## 4. The Future State: "The Invisible Hand"

### Journey E: The AI Assistant ("Locus Prime")
*The future where the tool works without you.*

1.  **The Notification:** Sarah gets a push notification on her phone: "Locus detected 3 anomalies from Sunday's check-ins."
2.  **The Interaction:** She taps the notification. It opens a "Tinder-style" card interface.
    *   *Card 1:* "Timmy (Age 6) checked into 'Nursery' (Ages 0-2). Do you want to update his grade or flag this?"
    *   *Action:* She swipes Left ("Flag for Pastor Mike").
    *   *Card 2:* "New family 'The Smiths'. 3 members have no birthdates."
    *   *Action:* She swipes Right ("Send 'Missing Info' email template").
3.  **The Completion:** "All caught up!"
4.  **The Value:** The system is proactively monitoring the data stream, acting as a virtual assistant that never sleeps.

---

## 5. Emotional Maps

| Phase | User Emotion | System Response |
| :--- | :--- | :--- |
| **Login** | Anticipation / Anxiety (What will I find?) | Fast load, calming colors, "Welcome back, Sarah." |
| **Visualization** | Overwhelm (So many dots!) | Clear hierarchy, "Diagonal of Truth" anchors the eye. |
| **Discovery** | Curiosity (What is that outlier?) | Instant tooltips, fluid hover states. |
| **Correction** | Empowerment (I can fix this!) | snappy UI, immediate visual feedback (dot moves). |
| **Completion** | Relief / Pride (I did good work.) | Health Score goes up, celebration animation. |

---

## 6. Conclusion
These journeys highlight that Locus is not just about *viewing* data; it is about the **cycle of trust**. Discovery -> Verification -> Correction -> Confidence. We build features that grease the wheels of this cycle, making the hard thing (data integrity) the easy thing.
