# Area D — engagement-analytics — Round 1 (church-admin) — Discovery Critique

Reviewed as the ops director who would actually open these screens on a Tuesday.
Data-source verdict up front, since it's the load-bearing question for this whole
area:

| # | Feature | Data source |
|---|---------|-------------|
| 29 | Attendance Pulse | **Real** — PCO Check-Ins v2 API |
| 30 | Check-in Velocity | **Real** — same API, historical, not live |
| 31 | Solar System | **Real** PCO People fields, decorative use |
| 32 | Heatmap of Life | **Real** (birthdays), **unverifiable/likely-empty** (anniversaries, deaths in prod) |
| 33 | Demographics | **Real** — birthdate only |
| 34 | Map View | **Real** — address.city only, aggregated, no pins |
| 35 | Global Pulse | **Fabricated** — hardcoded numbers, comments literally say `// Mocked` |
| 36 | Sentiment Pulse | **Fabricated field** — `prayer_topic` does not exist on the real PCO People API; mock-only |

---

## #29 Attendance Pulse (`src/components/AttendancePulse.tsx`, `src/utils/attendance.ts`)

**Verdict: SIMPLIFY**

Real data: `fetchRecentCheckIns` hits `/api/check-ins/v2/check_ins` and
`aggregateCheckInsByWeek` buckets by `startOfWeek` on `created_at`
(`attendance.ts:10-33`). No fabrication here — this is an honest chart.

**Would we actually open this?** Maybe once a month, by whoever preps the
attendance line for the elder board. But I already have this.

**PCO overlap:** Check-Ins' own "Attendance" report shows weekly check-in
volume trends natively, no export needed, and it breaks down by event/location,
which this chart does not (this is a single flat line, no event filter, no
service-time split for multi-service Sundays). Locus's version is *strictly
less capable* than the thing it's duplicating.

**Governance/privacy risk:** None — aggregate counts only.

**What would make it worth the licence fee:** Combine it with something PCO's
native report doesn't do — overlay giving, volunteer scheduling, or first-time
guest counts on the same week axis. As a standalone line chart of check-in
counts, it's a worse copy of a report I already have.

---

## #30 Check-in Velocity (`src/components/CheckInVelocity.tsx`, `src/utils/velocity.ts`)

**Verdict: SIMPLIFY**

Real data, and genuinely PCO doesn't offer this view — per-minute check-in
rate for the latest Sunday vs. the all-time-Sunday average, bucketed in 5-min
intervals from 7am-1pm (`velocity.ts:38-42`). This is the one analytics screen
in this area with a real operational use: spotting a check-in station
bottleneck.

But the copy over-claims: "**Real-time** gauge of check-ins per minute on
Sunday morning" (`CheckInVelocity.tsx:60`). It is not real-time. It loads once
on mount from historical data (`useEffect` fires on `auth` change only, no
polling, no websocket). If a volunteer coordinator opens this expecting a live
dashboard to watch during the 9am rush, they'll get last week's numbers,
static. That's a trust problem the moment someone notices.

**Would we actually open this?** During Sunday setup planning (Thursday
staff meeting), by whoever runs Check-Ins stations, to decide if they need
another kiosk. Genuinely plausible, low-frequency use.

**PCO overlap:** None that I know of — this is the strongest feature in the
area.

**Governance/privacy risk:** None.

**What would make it worth the licence fee:** Make "real-time" actually real
— poll during the live window, or drop the word from the copy. As shipped,
the mismatch between the label and the behavior is exactly the kind of thing
that makes staff stop trusting Locus's language generally, not just here.

---

## #31 Solar System (`src/components/SolarSystem.tsx`)

**Verdict: CUT**

Real underlying data (household grouping, `isChild`, `age` from birthdate,
all from PCO People), but the "insight" is nothing — it's a decorative family
tree rendered as literal orbiting circles, distance-from-sun computed from
age gap (`SolarSystem.tsx:94-96`), planet size from child's age. There is no
action this produces. You click a family card, look at a solar system diagram
of who's older than whom, and then what? Nothing. No edit, no flag, no export.

**Would we actually open this?** No. Not once, outside a demo. There's no
task this maps to.

**PCO overlap:** The household/family page in PCO People already shows this
information as a plain list, which is faster to read and actually usable for
follow-up (add note, call, assign pastor).

**Governance/privacy risk:** Low — it's real children's ages rendered as
visual objects for entertainment value, which is a mildly uncomfortable
choice (kids-as-planets) but not a data leak.

**What would make it worth the licence fee:** Nothing salvages this as an
analytics feature. If kept at all, it's gamification eye-candy for a demo,
not something that belongs in a working church office's nav bar.

---

## #32 Heatmap of Life (`src/components/LifeEventsHeatmap.tsx`, `src/utils/heatmap.ts`)

**Verdict: SIMPLIFY (cut the Deaths tab specifically)**

Three tabs: Birthdays, Anniversaries, Deaths, all keyed off `student.birthdate`
/ `.anniversary` / `.deathDate` (`heatmap.ts:57-67`).

- **Birthdays**: real, populated field. Mildly useful for spotting clustering
  (e.g., "we have 12 people with October birthdays, batch the cards").
- **Anniversaries**: `anniversary` is a real PCO People attribute, but in the
  mock generator it's only set for two-adult households and is shared between
  spouses (`mock-api/data.js:62`) — fine in the mock, unverified in prod
  because it depends entirely on whether the church actually fills that field
  in, which most don't for anyone but married-in-office couples.
- **Deaths**: `death_date` is **not a documented PCO People API attribute**.
  It only exists in this codebase because `mock-api/data.js:110-115`
  fabricates it for ~2% of adults. Nothing in `pco.ts` maps it from a real
  PCO field (no custom-field lookup, no `field_data` relationship traversal —
  it's read straight off `attributes.death_date`, which real PCO responses
  will never contain). Point this at a live PCO account and the Deaths tab is
  permanently empty. That's a dead feature, and the name doesn't help: "Heatmap
  of Life: Deaths" is a genuinely bad screen title for an admin tool used by
  people who plan actual funerals.

**Would we actually open this?** Birthdays tab, maybe, for card-batching —
rare. Deaths tab: never, and I'd ask you to take it out of the nav before a
staff member finds it by accident.

**PCO overlap:** PCO Lists can filter/sort by birthdate and anniversary
already; less pretty, more useful (you can actually message the list).

**Governance/privacy risk:** The Deaths view is a pastoral-sensitivity problem
even hypothetically — turning member deaths into a color-intensity grid
("high density" tooltip copy, `LifeEventsHeatmap.tsx:80`) is the wrong register
for grief data, full stop, independent of whether the field is populated.

**What would make it worth the licence fee:** Birthdays/anniversaries as a
"who to send cards to this month" export would beat PCO Lists on usability.
Drop Deaths entirely — there is no operational reason to visualize member
mortality as a heatmap, and if it ever did populate from real data it would be
actively harmful to show anyone.

---

## #33 Demographics / Generation Stack (`src/components/GenerationStack.tsx`, `src/utils/demographics.ts`)

**Verdict: KEEP (fold into Dashboard, don't give it a standalone nav slot)**

Honest and cheap: buckets by birth year into named generations
(`demographics.ts:9-17`), real `birthdate` field, no fabrication, no scoring
of individuals. This is the kind of feature I'd actually trust.

**Would we actually open this?** Once or twice a year, when planning
ministry programming (e.g., "do we have enough Boomers to justify a
Wednesday senior lunch") — genuinely a real planning question.

**PCO overlap:** PCO Lists can filter by age range, but doesn't give you the
named-generation bucket chart out of the box. This is a small, real win.

**Governance/privacy risk:** None — aggregate counts, no individual labels.

**What would make it worth the licence fee:** It already clears the bar as a
small, honest utility. Don't over-invest in it; it doesn't need its own route,
a dashboard widget is plenty for how rarely it changes anything.

---

## #34 Map View (`src/components/MapView.tsx`, `src/utils/geospatial.ts`)

**Verdict: SIMPLIFY**

**On the specific question I was asked to check hard for:** No, this does
**not** put member home addresses on a map. There is no actual map (no
Leaflet/Mapbox/Google Maps — confirmed by grep, nothing renders a geographic
surface). It's a `recharts` bar chart of member counts grouped by
`address.city` (`geospatial.ts:8-30`). Street address, ZIP, and coordinates
are never touched. That's the right call and I want it on record so nobody
"fixes" this later by adding pin-drops of home addresses — don't. Even
city-level aggregation carries mild re-identification risk in a small town
("Lakeside has 3 members" is basically naming names), but it's a defensible
level of aggregation.

Two problems that remain:

1. **Misleading name.** Calling a city-count bar chart "Map View" will make
   every new staff member expect an actual map and be confused when they get
   a bar chart with a slider.
2. **"Predictive Planting Suggestions" is not predictive.** It's a single
   threshold filter — cities other than the largest with count ≥ slider value
   (`geospatial.ts:32-41`). No growth trend, no travel-time modeling, no cost
   basis, nothing forecasted. Calling this "predictive" and presenting it next
   to a button-styled suggestion list invites an executive pastor to treat it
   as a real site-selection recommendation. Multi-site campus decisions are
   multi-year, multi-million-dollar calls; a raw current-member ZIP count with
   no de-duplication for households (are these person-counts or
   household-counts? — it's per-person, so a family of 5 at one address
   inflates the "city" count 5x, `geospatial.ts` iterates `students` not
   households) is not a defensible input for that conversation.

**Would we actually open this?** Rarely, and only in an actual
campus-planning conversation — which is exactly when the "predictive" framing
becomes dangerous rather than harmless.

**PCO overlap:** None directly (PCO doesn't have city clustering natively),
so this is a real gap Locus fills, if positioned honestly.

**Governance/privacy risk:** Low as built (city-level, no pins). Flag for
anyone touching this next: do not add address-level markers.

**What would make it worth the licence fee:** Rename it (it's a "City
Distribution Report," not a map). Rename "Predictive Planting Suggestions" to
something honest like "Cities Above Threshold." Switch to household-level
counts, not person-level, so a family of five doesn't skew city rankings.

---

## #35 Global Pulse (`src/components/GlobalPulse.tsx`)

**Verdict: CUT**

This is fabricated data presented as inter-church benchmarking, and the
source code says so out loud: `// Mock logic: derive local metrics from
'students' (in reality, requires complex cross-church aggregates)`
(`GlobalPulse.tsx:11`), followed by `Retention Rate: 65, // Mocked`,
`Engagement: 50, // Mocked`, `Growth Velocity: 40, // Mocked`
(`GlobalPulse.tsx:35-50`). The "Global Average" series (85/78/60/55/45) is
hardcoded with **no data source at all** — there is no cross-tenant
aggregation service, no anonymized benchmark pipeline, nothing. It is five
numbers typed into the component.

The UI presents this as: *"Compare your church's health metrics against
anonymized global averages"* (`GlobalPulse.tsx:57`). That sentence is false.
There is no anonymized global dataset. If an executive pastor sees "Your
Retention Rate: 65 vs Global Average: 60" and decides the church is doing
fine relative to peers, that decision is based on a number a developer typed
in, not on any other church's actual data. This is precisely the "mock data
presented as insight" hazard the brief calls out, aimed at the most senior
audience in the building (this lives in the read-only Executive Dashboard
per the inventory).

**Would we actually open this?** If it looked credible, yes — the exec
pastor loves a benchmark chart. Which is exactly the danger: it's the most
"open-able" bad feature in the whole area.

**PCO overlap:** None — and no ChMS I know of publishes real cross-tenant
benchmarks either, because none of them have consented, pooled data to do it
with. That absence should have been the signal to not build a fake version.

**Governance/privacy risk:** Reputational/decision-integrity risk, not a
data leak — the risk is bad strategic decisions made on fabricated
comparative data, at the level of the person who signs the budget.

**What would make it worth the licence fee:** Either build a real opted-in,
anonymized cross-church benchmark (a genuinely hard, multi-year data-network
project, not a Locus v1 feature) or delete the "Global Average" series
entirely and only show the church's own metrics over time. As shipped, don't
let this anywhere near the executive dashboard.

---

## #36 Sentiment Pulse (`src/components/SentimentPulse.tsx`, `src/utils/sentiment.ts`)

**Verdict: CUT**

**What "Sentiment" is actually computed from:** it is not sentiment analysis
in any sense of the term — no polarity, no NLP, no text processing at all.
`calculateSentimentPulse` just tallies how many students share the same
`prayerTopic` string and title-cases it (`sentiment.ts:8-32`). It's a
frequency count over a five-value enum (`Financial, Health, Grief, Anxiety,
Addiction` — `mock-api/data.js:96`), rendered as a word cloud. The UI copy
calls it "**Spiritual Climate**," "a word cloud derived from **anonymized
prayer requests and comment themes**" (`SentimentPulse.tsx:53`) — none of
that is true of what the code does. There are no free-text prayer requests
or comments anywhere in this data model, and nothing is anonymized — it's a
category tag sitting directly on a named `Student` record.

**Where the field comes from:** the project's own graveyard doc admits it —
*"utilizing the mocked `prayerTopic` attribute on the `Student` model"*
(`plans/graveyard/sentiment_pulse_implementation.md:4`). `prayer_topic` is
read straight off `attributes.prayer_topic` in `transformPerson`
(`pco.ts:231,276`) with no custom-field/`field_data` lookup. **This is not a
documented Planning Center People API attribute.** Point Locus at a real PCO
account and every person's `prayerTopic` will be `undefined` — the feature
will render "No themes detected. Ensure students have 'prayerTopic' set,"
forever, because there is no supported way for church staff to set it. This
is a demo-only feature dressed as a working one.

**Even hypothetically, if the data existed:** attaching category labels like
"Addiction" or "Grief" to an individual member record, and then aggregating
and displaying them — even in a word cloud — for staff to browse is a real
pastoral-risk item under the "scoring humans" principle. Prayer requests are
shared in confidence, usually with a specific pastor, not so that "Addiction"
can go into a dashboard tile visible to anyone with Locus Intelligence
access. There's no consent model here, no scoping to who can see it, and no
audit of who's allowed to know a given member's prayer topic.

**Would we actually open this?** No — and if it ever did populate from real
data, I would not want front-desk volunteers or the ops team seeing a ranked
list of which sensitive categories are trending among named members.

**PCO overlap:** None, but that's because no ChMS does this — for good
reason.

**Governance/privacy risk:** High, hypothetically (sensitive pastoral
categories, no consent trail, no access scoping) — moot only because the
underlying field doesn't exist in production PCO data today.

**What would make it worth the licence fee:** This isn't a simplify job.
Rename the concept away from "Sentiment," source the data from something
that's actually text (survey comments, connection-card notes) via a real NLP
pass with a defined confidence/consent model, and put an access-control layer
on anything that touches "Grief"/"Addiction"-adjacent categories before this
comes back as a real feature — not before.

---

## Summary Verdict Table

| # | Feature | Verdict |
|---|---------|---------|
| 29 | Attendance Pulse | SIMPLIFY |
| 30 | Check-in Velocity | SIMPLIFY |
| 31 | Solar System | CUT |
| 32 | Heatmap of Life | SIMPLIFY (cut Deaths tab) |
| 33 | Demographics | KEEP |
| 34 | Map View | SIMPLIFY |
| 35 | Global Pulse | CUT |
| 36 | Sentiment Pulse | CUT |
