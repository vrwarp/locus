# Technical Design Document
*Status: Final Draft | Version: 3.0*

## 1. System Architecture

### 1.1 High-Level Overview
Locus is a Single Page Application (SPA) built with React/Vite. It communicates with the Planning Center Online (PCO) API via a lightweight proxy to handle CORS and auth secrets.

### 1.2 Tech Stack
*   **Frontend:** React, TypeScript, TanStack Query, Recharts (customized).
*   **State Management:** React Context + TanStack Query Cache.
*   **Proxy:** Vite Proxy (Dev), Cloudflare Worker (Prod) for Basic Auth.
*   **Logic:** `date-fns` for age calculations.

---

## 2. Data Model (Transient)
Since we do not store PCO data, we map API responses to a lightweight internal model:

```typescript
interface Student {
  id: string; // PCO Person ID
  name: string;
  avatarUrl: string;
  birthdate: string; // ISO Date
  grade: number | null; // Converted from PCO grade string
  calculatedAge: number; // Derived
  delta: number; // calculatedAge - (grade + 5)
  status: 'active' | 'archived';
  metrics: {
     lastCheckIn: string | null;
     totalGivingLastYear: number;
     groupCount: number;
  }
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
    *   Use Web Worker for calculating deltas on > 10k records to avoid blocking Main Thread.

## 4. Security & Privacy
*   **RAM-Only Policy:** Data is fetched into browser memory. On tab close, data is lost.
*   **Auth:** Basic Auth (App ID : Secret). Credentials stored in `sessionStorage` (cleared on browser close) or strictly typed `.env` for dev.
*   **Erasure:** "Delete" actions in UI trigger PCO API `DELETE` endpoints immediately.

## 5. API Integration Strategy
*   **Rate Limiting:** PCO allows 100 requests/min.
    *   *Strategy:* Implement a `LeakyBucket` queue for "Bulk Fix" operations to prevent 429 errors.
*   **Optimistic Updates:**
    *   When user fixes a grade, update the UI dot immediately (Green).
    *   Send API request in background.
    *   If API fails, revert dot to Red and show Toast Error.
*   **Sandbox Implementation:**
    *   Wrap API calls in a `ServiceAdapter`.
    *   If `SandboxMode == true`, `ServiceAdapter` returns `Success` immediately and updates a local `MockStore` instead of hitting the network.

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

## 7. Scalability & Moonshots (10-Year Horizon)
*   **AI/LLM Integration:**
    *   Future implementation will require a Vector Database (Pinecone/Milvus) to store anonymized embeddings of church health data for RAG (Retrieval-Augmented Generation).
    *   *Note:* This violates RAM-Only policy, so will require specific Opt-In from churches.
*   **VR/AR:**
    *   Will require WebXR integration.
    *   Data stream will need to switch from Polling to WebSockets for real-time lobby heatmaps.
