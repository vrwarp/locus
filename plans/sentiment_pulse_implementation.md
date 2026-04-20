# Sentiment Pulse Implementation

## Objective
Implement Concept #4.4 ("Sentiment Pulse") from the `plans/vision.md` document. The goal is to provide a visual representation of the "Spiritual Climate" of the congregation by analyzing anonymized inputs (in this case, utilizing the mocked `prayerTopic` attribute on the `Student` model) and rendering a word cloud.

## Implementation Details

### Data Aggregation (`src/utils/sentiment.ts`)
- Created `calculateSentimentPulse`, which takes an array of `Student` objects.
- It iterates through the students, extracting their `prayerTopic`.
- It standardizes the casing of the topics (e.g., 'anxiety', 'HEALTH' become 'Anxiety', 'Health').
- It tallies the frequency of each distinct topic using a Map.
- It converts the Map into an array of `{ text, value }` objects, sorted by frequency descending.

### User Interface (`src/components/SentimentPulse.tsx`)
- Created a new React component to display the data.
- Handles loading and empty states cleanly.
- Renders a purely CSS-based "Word Cloud" utilizing CSS Flexbox.
- Font sizes dynamically scale between a base size (1rem) and a max size (4rem) based on the relative frequency of the word compared to the most and least frequent words in the dataset.
- Added localized styling in `src/components/SentimentPulse.css`.

### App Integration
- Registered `SentimentPulse` in the main routing switch (`src/App.tsx`) under the `sentiment-pulse` view.
- Added a new navigation item with a thought-bubble icon (💭) in the `Sidebar` under the "Intelligence" category.

### Conversational AI Integration (`src/utils/copilot.ts`)
- Added a new intent handler to the Pastoral Co-Pilot.
- The Co-Pilot now recognizes queries like "What is the spiritual climate?", "sentiment", or "word cloud".
- When triggered, it analyzes the sentiment pulse data and returns a structured list detailing the top themes and their frequencies, seamlessly directing the user to the visual view.

## Testing
- **Utility Logic:** `src/utils/sentiment.test.ts` achieves 100% coverage, handling empty states, valid aggregations, casing normalizations, and sorting.
- **Component UI:** `src/components/SentimentPulse.test.tsx` uses React Testing Library to verify the loading state, empty state, word cloud rendering, correct font-size calculation assertions, and fallback handling when frequencies are flat.
- **Co-Pilot Intent:** `src/utils/copilot.test.ts` was expanded to verify the AI accurately intercepts sentiment queries and gracefully handles the absence of data.
- All new tests pass, maintaining high overall test coverage.

## Future Enhancements
- Connect this to real NLP analysis of raw survey comment cards or transcriptions, using a lightweight library like `natural` or delegating to an LLM endpoint.
- Enhance the visual word cloud with D3.js or a dedicated React wrapper (e.g., `react-wordcloud`) for more sophisticated layouts (spirals, tighter packing) if the data set grows significantly.
- Allow filtering the sentiment pulse by demographic (e.g., "What is the spiritual climate of the High School group vs. the Elderly?").