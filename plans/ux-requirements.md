# UX Requirements Document
*Status: Final | Version: 4.0 - Battle Tested*

## 1. Design Philosophy
*   **Cognitive Ease:** The interface should feel like a "Spa for the brain." Use generous whitespace and pastel colors.
*   **Physics of Data:** Interactions should feel tactile. Dots should "snap" and "slide."
*   **Gamification:** Turn chores into challenges, but respect the professional context.

## 2. Visual Style Guide
*   **Palette:**
    *   Background: Off-White / Paper.
    *   Safe Data: Pastel Blue / Green.
    *   Anomalies: Neon Orange / Red (High Contrast).
    *   Sandbox Mode: Calming Slate Blue.
    *   Robert Report: Professional Navy / Gold (Strategic).
*   **High Contrast Mode:**
    *   Background: Black.
    *   Safe Data: Cyan.
    *   Anomalies: Magenta.
    *   Text: White (Large).
*   **Typography:** Clean Sans-Serif (Inter or similar). Large numbers.

## 3. Key User Flows

### 3.1 The "Hover of Truth" (Micro-interaction)
*   **Trigger:** Mouse hover over a dot or Keyboard Focus.
*   **Response:**
    *   Scale dot 150%.
    *   Dim background 10%.
    *   Show Tooltip Card (Photo + Name + Error Delta).
    *   Draw faint guide lines to Axes.
*   **Timing:** < 10ms latency.

### 3.2 The "Magnetic Correction" (Correction Flow)
*   **Step 1:** Click Red Dot.
*   **Step 2:** Modal appears with a "Grade Slider" and "Birthdate Picker".
*   **Step 3:** User drags slider.
*   **Step 4:** A "Ghost Dot" moves on the chart in real-time.
*   **Step 5:** When slider hits "Correct Grade," Ghost Dot snaps to diagonal and turns Green.
*   **Step 6:** Release to save. Play subtle "Click" sound.
*   **Error State:** If API fails, Dot snaps back to Red position with a "Spring" animation and a "Shake" effect. Toast message: "Connection Failed".

### 3.3 The "Gamified Grind" (Review Mode)
*   **Layout:** Focused "Card Stack" view. One record at a time.
    *   *Correction:* Include a "List Context" sidebar to see upcoming/previous records.
*   **Feedback:**
    *   Success: "Ping" sound + Gold border glow.
    *   Combo: Counter increments (2x, 3x).
    *   Streak: Flame icon in header.
    *   Badge Unlock: Full screen confetti overlay (Canvas API).
    *   **Controls:** "Mute Sounds" toggle prominent in UI.

### 3.4 The "Robert Report" View
*   **Layout:** Dashboard style. Big Numbers.
*   **Visuals:** Trend lines (Green = Good).
*   **Tone:** Serious, trustworthy, strategic.

### 3.5 The "Genealogy" Graph (Moonshot)
*   **Visual:** Force-directed graph (D3.js or similar).
*   **Interaction:** Drag nodes to rearrange.
*   **Physics:** Nodes repel each other slightly. "Super Nodes" (Connectors) pulse slowly.

## 4. Accessibility
*   **Colorblind Mode:** Use shapes (Triangles/Squares) in addition to colors for Green/Red states. [DONE]
*   **Keyboard Nav:** Arrow keys must navigate the scatter plot points. Focus ring must be clearly visible.
*   **Screen Readers:** Scatter plot points must offer "Audio Charts" (Pitch varies by Y-axis value). *Note: Investigating Recharts accessibility features or custom canvas implementation.*
