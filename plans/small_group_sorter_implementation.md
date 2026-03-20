# Small Group Sorter Implementation

## Overview
Implemented the "Small Group Sorter" concept (#32) from the Idea Vault, which utilizes a genetic algorithm to automatically generate balanced small groups of adults within the congregation.

## What Was Done
- **`src/utils/sorter.ts`**: Developed a fully functional genetic algorithm.
  - Groups adults (`!isChild`) into distinct households using their `householdId` to ensure families (e.g., spouses) remain in the same small group.
  - Generates chromosomes representing potential assignments of households into `k` groups.
  - The fitness function evaluates assignments based on minimizing the variance of each group's total size and average age compared to the target ideals. Heavy penalties were implemented for any group that ends up completely empty.
  - Evolves over up to 2000 generations using tournament selection, uniform crossover, and mutation to iteratively discover optimal balances.
- **`src/components/SmallGroupSorter.tsx`**: Created a user interface allowing administrators to define the target number of groups and the algorithmic depth (number of generations). Results render elegantly into distinct cards displaying group stats alongside member profiles.
- **Tests**: Comprehensive Vitest coverage added for utility boundaries and UI interaction, properly handling the asynchronous nature of the "Evolving Generations..." UI feedback loop.
- **Integration**: Inserted as a primary navigation view ('small-groups') inside the Sidebar under 'Ministry Intelligence'.

## What Was Discovered
- Maintaining the synchronous logic of the genetic algorithm in `React Testing Library` required handling testing DOM specific timeout boundaries.
- Small datasets (e.g., test mock API) evolve almost instantly, making the 500-generation default easily scalable in browser memory. Even for thousands of congregants, the time complexity on the client machine is negligible.

## Future Ideas
- Include more varied constraints into the fitness function, such as automatically detecting introverts/extroverts if custom data fields are present, balancing male/female ratios, or grouping by complementary spiritual gifts.
- Expand the visual output with network graphs to show how strongly related the individuals within a sorted group are.
- Provide a feature to "lock" specific people into specific groups before running the algorithm, letting the AI fill in the remaining slots seamlessly.
