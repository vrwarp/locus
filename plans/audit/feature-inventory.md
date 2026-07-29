# Locus Feature Inventory

Every navigable surface and significant interactive subsystem in the app as of
the audit, grouped into the six areas the critique loop runs over. Routing lives
in `src/App.tsx` (`currentView` switch, ~L755-1005) plus the modal block
(~L1010-1075). Navigation lives in `src/components/SidebarCore.tsx` and
`src/components/SidebarIntelligence.tsx`.

Two segregated surfaces, chosen at login (`src/components/LandingPage.tsx`):

* **Locus Core** — Data Custodian Workspace (`src/layouts/CoreLayout.tsx`)
* **Locus Intelligence** — read-only Executive Dashboard (`src/layouts/IntelligenceLayout.tsx`)

---

## Area A — `core-hygiene` (the actual job)

| # | Feature | Route / trigger | Implementation |
|---|---------|-----------------|----------------|
| 1 | Dashboard | `dashboard` | `src/components/Dashboard.tsx` |
| 2 | Data Health (Diagonal of Truth scatter, Load More) | `data-health` | `src/components/GradeScatter.tsx`, `src/utils/grader.ts` |
| 3 | Smart Fix Modal | point click | `src/components/SmartFixModal.tsx` |
| 4 | Review Mode + Speed Run + Zen Mode | `data-health` buttons | `src/components/ReviewMode.tsx`, `src/utils/audio.ts` |
| 5 | Duplicate Detective | `duplicates` | `src/components/DuplicatesReport.tsx`, `src/utils/duplicates.ts` |
| 6 | Ghost Protocol | `ghosts` (modal) | `src/components/GhostModal.tsx`, `src/utils/ghost.ts` |
| 7 | Family Audit | `families` (modal) | `src/components/FamilyModal.tsx`, `src/utils/family.ts` |
| 8 | Golden Record | modal | `src/components/GoldenRecordModal.tsx` |
| 9 | Undo / Redo + Undo toast | header | `src/components/UndoRedoControls.tsx`, `src/components/UndoToast.tsx` |
| 10 | Settings / Config | `settings` (modal) | `src/components/ConfigModal.tsx` |
| 11 | Address / phone / email hygiene utilities | used by 3,4,45 | `src/utils/hygiene.ts`, `src/utils/zipCodes.ts`, `src/utils/areaCodes.ts` |

## Area B — `gamification`

| # | Feature | Route | Implementation |
|---|---------|-------|----------------|
| 12 | Bounty Board | `bounties` | `src/components/BountyBoard.tsx` |
| 13 | Campus Cup | `campus-cup` | `src/components/CampusCup.tsx` |
| 14 | Achievement Case | `achievements` | `src/components/AchievementCase.tsx` |
| 15 | Gamification Widget (streak, daily fixes) | header | `src/components/GamificationWidget.tsx`, `src/utils/gamification.ts` |
| 16 | Avatar / level | sidebar footer | `src/components/Avatar.tsx`, `src/utils/avatar.ts` |
| 17 | Confetti, Badge toast, combo sounds | ambient | `src/components/Confetti.tsx`, `src/components/BadgeToast.tsx`, `src/utils/audio.ts` |
| 18 | Contribution Graph | dashboard | `src/components/ContributionGraph.tsx` |

## Area C — `pastoral-ops` (care + volunteer operations)

| # | Feature | Route | Implementation |
|---|---------|-------|----------------|
| 19 | Pastoral Co-Pilot | `copilot` | `src/components/CoPilot.tsx`, `src/utils/copilot.ts` |
| 20 | Burnout Risk | `burnout` | `src/components/BurnoutReport.tsx`, `src/utils/burnout.ts` |
| 21 | Predictive Attrition (Drift) | `attrition` | `src/components/DriftReport.tsx`, `src/utils/drift.ts` |
| 22 | Missing Volunteers | `missing` | `src/components/MissingVolunteersReport.tsx`, `src/utils/missing.ts` |
| 23 | Recruitment Intelligence | `recruitment` | `src/components/RecruitmentReport.tsx`, `src/utils/recruitment.ts` |
| 24 | Retention Funnel (Newcomer) | `retention` | `src/components/NewcomerFunnel.tsx`, `src/utils/retention.ts` |
| 25 | Bus Factor | `bus-factor` | `src/components/BusFactorGraph.tsx`, `src/utils/busFactor.ts` |
| 26 | Volunteer Web | `network` | `src/components/VolunteerWeb.tsx`, `src/utils/volunteerWeb.ts` |
| 27 | Emergency Alerts | `emergency` | `src/components/EmergencyAlerts.tsx` |
| 28 | Automations (new baby / elderly rides / first-time giver) | `automations` | `src/components/AutomationsReport.tsx`, `src/utils/automations.ts` |

## Area D — `engagement-analytics`

| # | Feature | Route | Implementation |
|---|---------|-------|----------------|
| 29 | Attendance Pulse | `attendance` | `src/components/AttendancePulse.tsx`, `src/utils/attendance.ts` |
| 30 | Check-in Velocity | `velocity` | `src/components/CheckInVelocity.tsx`, `src/utils/velocity.ts` |
| 31 | Solar System | `solar-system` | `src/components/SolarSystem.tsx` |
| 32 | Heatmap of Life | `heatmap` | `src/components/LifeEventsHeatmap.tsx`, `src/utils/heatmap.ts` |
| 33 | Demographics / Generation Stack | `demographics` | `src/components/GenerationStack.tsx`, `src/utils/demographics.ts` |
| 34 | Map View | `map-view` | `src/components/MapView.tsx`, `src/utils/geospatial.ts` |
| 35 | Global Pulse | `global-pulse` | `src/components/GlobalPulse.tsx` |
| 36 | Sentiment Pulse | `sentiment-pulse` | `src/components/SentimentPulse.tsx`, `src/utils/sentiment.ts` |

## Area E — `content-giving-comms`

| # | Feature | Route | Implementation |
|---|---------|-------|----------------|
| 37 | Sermon Sentiment | `sermons` | `src/components/SermonSentiment.tsx` |
| 38 | Sermon Correlator | `sermon-correlator` | `src/components/SermonCorrelator.tsx` |
| 39 | Giving River | `giving-river` | `src/components/GivingRiver.tsx`, `src/utils/giving.ts` |
| 40 | Stripe / Giving Trends | `giving-trends` | `src/components/GivingTrends.tsx`, `src/utils/givingTrends.ts` |
| 41 | Newsletter Architect | `newsletter` | `src/components/NewsletterArchitect.tsx` |
| 42 | Robert Report (+ Genealogy tab) | export | `src/components/RobertReport.tsx`, `src/components/GenealogyGraph.tsx` |
| 43 | Integrations Hub | `integrations` | `src/components/IntegrationsHub.tsx` |

## Area F — `relational-tools`

| # | Feature | Route | Implementation |
|---|---------|-------|----------------|
| 44 | Prayer Partner Match | `prayer` | `src/components/PrayerMatch.tsx`, `src/utils/prayer.ts` |
| 45 | Small Group Sorter | `small-groups` | `src/components/SmallGroupSorter.tsx`, `src/utils/sorter.ts` |
| 46 | Locus Public (member self-service portal) | `locus-public` | `src/components/LocusPublic.tsx` |
| 47 | Landing / auth / role split | login | `src/components/LandingPage.tsx`, `src/utils/api.ts`, `src/utils/crypto.ts` |
| 48 | Data layer: PCO fetch, cache, rate limiting, storage | app-wide | `src/utils/api.ts`, `src/utils/pco.ts`, `src/utils/storage.ts`, `src/utils/analytics.ts` |

---

## Standing context for every critic

* Locus reads **Planning Center People and Check-Ins only**. It does **not** use
  PCO Groups (dropped deliberately — see README). It has no Giving API access.
* `mock-api/server.js` + `mock-api/data.js` is a fixture backend. Several
  features are wired only to mock or locally-synthesised data. Identifying which
  ones present simulated numbers as real insight is an explicit goal of this audit.
* Writes go back to real PCO records via HTTP Basic auth from the browser.
* Vision, PRDs and personas: `plans/01_vision_and_strategy.md` through
  `plans/05_architecture_and_routing.md`. Build history: `plans/progress.md`.
