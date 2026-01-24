# Technical Design Document
*Status: Final | Version: 4.0 - Battle Tested*

## 1. System Architecture

### 1.1 High-Level Overview
Locus is a Single Page Application (SPA) built with React/Vite. It communicates with the Planning Center Online (PCO) API via a lightweight proxy to handle CORS and auth secrets.

### 1.2 Tech Stack
*   **Frontend:** React, TypeScript, TanStack Query, Recharts (customized).
*   **State Management:** React Context + TanStack Query Cache.
*   **Proxy:** Vite Proxy (Dev), Cloudflare Worker (Prod) for Basic Auth.
*   **Logic:** `date-fns` for age calculations.
*   **Persistence:** `localStorage` (AES Encrypted) for config/settings. `IndexedDB` for cache.

---

## 2. Data Model (Transient)
Since we do not store PCO data, we map API responses to a lightweight internal model:

```typescript
interface Student {
  id: string; // PCO Person ID
  name: string;
  birthdate: string; // ISO Date
  pcoGrade: number; // Converted from PCO grade string
  calculatedGrade: number; // Derived
  delta: number; // calculatedGrade - (pcoGrade + 5)
  lastCheckInAt: string | null;
  checkInCount: number | null; // Fetched lazily from Check-Ins API
}
```

## 3. The Correlation Engine
*   **Logic:**
    *   Fetch `/people/v2/people?include=field_data,households`.
    *   Iterate through results.
    *   Calculate `Age = Today - Birthdate`.
    *   Calculate `ExpectedGrade = Age - 5`.
    *   `Delta = ExpectedGrade - RecordedGrade`.
*   **Performance:**
    *   **Visualization:** Use Canvas-based rendering (e.g., `react-chartjs-2` or customized `recharts` with optimization) if DOM nodes > 2000 to prevent layout thrashing.
    *   **Worker:** Use Web Worker only for heavy CSV parsing or large-scale "Genealogy" graph calculations, not simple age math.
*   **Caching Strategy:**
    *   Store fetched `Student[]` in `indexedDB` (Encrypted) or persistent Query Cache with 5-minute TTL.
    *   **Loading State:** On reload, check IndexedDB. If data < 5m old, hydrate immediately. Show "Data is cached" banner. If > 5m, trigger background refresh.

## 4. Security & Privacy
*   **RAM-Preferred Policy:** Data is fetched into browser memory.
*   **Encrypted Local Storage:** Configuration (Cutoff dates, High Contrast Mode) and Health History are stored in `localStorage` encrypted with AES-GCM (256-bit).
    *   **Key Derivation:** The encryption key is derived from the user-provided `App ID` using PBKDF2 with SHA-256 and a random salt (for future enhancement) or context-specific binding.
*   **Auth:** Basic Auth (App ID : Secret).
    *   *Critique Mitigation:* Credentials in `sessionStorage` are vulnerable to XSS.
    *   *Solution:* We will accept the risk for MVP (Client-side app) but advise users to use Incognito. Future: Proxy-managed HttpOnly cookies.
*   **Erasure:** "Delete" actions in UI trigger PCO API `DELETE` endpoints immediately.

## 5. API Integration Strategy
*   **Rate Limiting:** PCO allows 100 requests/min.
    *   *Strategy:* `LeakyBucket` queue implemented in `api-client.ts`. Rate limit bucket state is per-session (RAM).
*   **Optimistic Updates:**
    *   When user fixes a grade, update the UI dot immediately (Green).
    *   Send API request in background.
    *   If API fails, revert dot to Red and show Toast Error.
*   **Sandbox Implementation:**
    *   Wrap API calls in a `ServiceAdapter`.
    *   If `SandboxMode == true`, `ServiceAdapter` returns `Success` immediately and updates a local `MockStore` instead of hitting the network.
*   **Pagination:**
    *   For DB < 5,000: Recursive fetch of `links.next` on startup.
    *   For DB > 5,000: Limit initial fetch to "Most Recent 5,000" or "Grade Level != Null". Show "Load More" button to fetch older records.

## 6. Undo Architecture (Command Pattern)
*   Every user action (Fix Grade, Archive) creates a `Command` object:
    ```typescript
    interface Command {
       execute(): Promise<void>;
       undo(): Promise<void>;
    }
    ```
*   Commands are pushed to a `HistoryStack`.
*   "Undo" pops the stack and calls `.undo()`.
    *   *Note:* `.undo()` performs the inverse API write (e.g., setting Grade back to original). This counts against Rate Limits.

## 7. Scalability & Moonshots (10-Year Horizon)
*   **AI/LLM Integration:**
    *   Future implementation will require a Vector Database (Pinecone/Milvus) to store anonymized embeddings of church health data for RAG (Retrieval-Augmented Generation).
    *   *Note:* This violates RAM-Only policy, so will require specific Opt-In from churches.
*   **VR/AR:**
    *   Will require WebXR integration.
    *   Data stream will need to switch from Polling to WebSockets for real-time lobby heatmaps.
