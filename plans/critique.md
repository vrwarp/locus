# Critique Log
*Status: Closed*

## 1. Critique of Product Requirement Document (PRD)
*   **Gap:** "Smart Fix Modal" mentions "Fix Birth Year". Does it allow specific date selection or just year? PCO requires full dates. -> **Addressed in v3.3**
*   **Over-Engineering:** "The Robert Report" as a PDF export in MVP/Should Have seems like a heavy lift for V1. Can it be a simple read-only dashboard URL first? -> **Addressed in v3.3**
*   **Inconsistency:** PRD says "Won't Have: Native Mobile App" but User Journeys mention "iPad AR view". -> **Addressed in v3.3**
*   **Hardening (Iter 2):** "Moonshots" like VR War Room are fun but distracting. PRD should be explicit that these are purely *concept* phases with no engineering resources allocated in the next 12 months. -> **Addressed in v3.3**
*   **Hardening (Iter 2):** "RAM-only" is great for privacy but terrible for UX. If I refresh the page, do I have to fetch 5,000 records again? PCO API will throttle us. We need a middle ground. -> **Addressed in v3.3**
*   **Stress Test (Iter 3):** What if the church has 50,000 members? Pagination is critical. -> **Addressed in v3.3**
*   **Stress Test (Iter 3):** API Versioning. PCO updates their API. Locus breaks. We need a "System Health" check on startup. -> **Addressed in v3.3**

## 2. Critique of UX Requirements
*   **Gap:** Error states are missing. What happens if the API fails during a "Magnetic Correction"? Does the ghost dot snap back? -> **Addressed in v3.3**
*   **Accessibilty:** "Audio Charts" are listed as a requirement but Design Doc calls it a Moonshot. Alignment needed. -> **Addressed in v3.3**
*   **Friction:** "Gamified Grind" card stack view prevents seeing context. Admins might want to see the *list* context while fixing. -> **Addressed in v3.3**
*   **Hardening (Iter 2):** Gamification "Combo Sounds" might be annoying in an open office. Needs a "Mute" toggle requirement. -> **Addressed in v3.3**
*   **Stress Test (Iter 3):** High Contrast Mode. The "Pastel" palette fails accessibility for visually impaired admins. Need a dedicated "High Contrast" toggle. -> **Addressed in v3.3**

## 3. Critique of Technical Design Doc
*   **Security:** `sessionStorage` for Basic Auth credentials is risky (XSS). Should consider `HttpOnly` cookies via the proxy if possible, or at least acknowledge the risk. -> **Addressed in v3.3**
*   **Performance:** "Web Worker for > 10k records". Why 10k? JS Main thread can handle 10k simple math ops easily. Rendering is the bottleneck. Focus on *Virtualization* of the chart logic. -> **Addressed in v3.3**
*   **Missing:** No caching strategy mentioned for "Undo". If I undo 5 times, do I hit the API 5 times? -> **Addressed in v3.3**
*   **Missing:** Handling of "Rate Limiting" is mentioned but not architected. `LeakyBucket` needs more detail (persistence? per session?). -> **Addressed in v3.3**
*   **Hardening (Iter 2):** `localStorage` with encryption (AES) for *non-sensitive* config (like "Cutoff Date" or "Ghost Thresholds") should be allowed. We can't require users to re-configure the app every visit. -> **Addressed in v3.3**
*   **Stress Test (Iter 3):** Pagination Logic. PCO API is paginated (per_page=100). We need a "Fetch All" recursive loop or a "Load More" button. "Fetch All" for 50k records will time out. -> **Addressed in v3.3**
*   **Stress Test (Iter 3):** IndexedDB is async. The app needs a loading state while re-hydrating from cache. -> **Addressed in v3.3**

## 4. Final Polish (Iter 4)
*   **Tone Check:** PRD v3.3 is concise. UX Docs use consistent terminology ("Magnetic Correction").
*   **Consistency:** All documents now reflect the same feature set, constraints, and architecture.
*   **Status:** All critical critiques have been resolved or deferred to V2.0.
