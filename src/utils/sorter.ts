import type { Student } from './pco';

export interface HouseholdInfo {
  id: string;
  adults: Student[];
  size: number;
  averageAge: number;
}

export interface SmallGroup {
  id: number;
  members: Student[];
  size: number;
  averageAge: number;
}

/**
 * Maps students into households containing only adults.
 */
export const buildHouseholds = (students: Student[]): HouseholdInfo[] => {
  const adultStudents = students.filter(s => !s.isChild);

  const householdMap = new Map<string, Student[]>();

  for (const s of adultStudents) {
    const key = s.householdId || `individual-${s.id}`;
    if (!householdMap.has(key)) {
      householdMap.set(key, []);
    }
    householdMap.get(key)!.push(s);
  }

  const households: HouseholdInfo[] = [];
  householdMap.forEach((members, id) => {
    const size = members.length;
    const averageAge = members.reduce((sum, m) => sum + m.age, 0) / size;
    households.push({
      id,
      adults: members,
      size,
      averageAge
    });
  });

  return households;
};

/**
 * Evaluates the fitness of a given chromosome.
 * Higher is better (less variance in size and age).
 */
const evaluateFitness = (
  chromosome: number[],
  households: HouseholdInfo[],
  k: number,
  targetSize: number,
  targetAge: number
): number => {
  const groupSizes = new Array(k).fill(0);
  const groupAgeSums = new Array(k).fill(0);

  for (let i = 0; i < chromosome.length; i++) {
    const groupId = chromosome[i];
    groupSizes[groupId] += households[i].size;
    groupAgeSums[groupId] += (households[i].averageAge * households[i].size);
  }

  let sizeVariance = 0;
  let ageVariance = 0;

  for (let j = 0; j < k; j++) {
    const size = groupSizes[j];
    const avgAge = size > 0 ? groupAgeSums[j] / size : targetAge;

    // Penalize empty groups heavily
    if (size === 0) {
      sizeVariance += Math.pow(targetSize, 2) * 10;
    } else {
      sizeVariance += Math.pow(size - targetSize, 2);
    }

    ageVariance += Math.pow(avgAge - targetAge, 2);
  }

  // Weight size variance more heavily so groups are balanced in size first
  return -(sizeVariance * 1.5 + ageVariance);
};

const createRandomChromosome = (length: number, k: number): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * k));
};

const tournamentSelection = (population: number[][], fitnesses: number[]): number[] => {
  const t1 = Math.floor(Math.random() * population.length);
  const t2 = Math.floor(Math.random() * population.length);
  return fitnesses[t1] > fitnesses[t2] ? population[t1] : population[t2];
};

const crossover = (p1: number[], p2: number[]): number[] => {
  return p1.map((gene, i) => (Math.random() > 0.5 ? gene : p2[i]));
};

const mutate = (chromosome: number[], k: number, mutationRate: number): number[] => {
  return chromosome.map(gene => (Math.random() < mutationRate ? Math.floor(Math.random() * k) : gene));
};

/**
 * Runs a genetic algorithm to assign households to `groupCount` small groups,
 * aiming to balance total members and average age across all groups.
 */
export const sortIntoGroups = (
  students: Student[],
  groupCount: number,
  generations: number = 500
): SmallGroup[] => {
  if (groupCount <= 0) return [];
  if (students.filter(s => !s.isChild).length === 0) {
    return Array.from({ length: groupCount }, (_, i) => ({ id: i, members: [], size: 0, averageAge: 0 }));
  }

  const households = buildHouseholds(students);
  if (households.length === 0) return [];

  // Edge case: more groups than households
  if (groupCount > households.length) {
    groupCount = households.length;
  }

  const totalAdults = households.reduce((sum, h) => sum + h.size, 0);
  const totalAge = households.reduce((sum, h) => sum + (h.averageAge * h.size), 0);

  const targetSize = totalAdults / groupCount;
  const targetAge = totalAge / totalAdults;

  const popSize = 100;
  const mutationRate = 0.1;

  let population = Array.from({ length: popSize }, () => createRandomChromosome(households.length, groupCount));
  let bestChromosome = population[0];
  let bestFitness = -Infinity;

  for (let g = 0; g < generations; g++) {
    const fitnesses = population.map(chrom => evaluateFitness(chrom, households, groupCount, targetSize, targetAge));

    for (let i = 0; i < popSize; i++) {
      if (fitnesses[i] > bestFitness) {
        bestFitness = fitnesses[i];
        bestChromosome = [...population[i]];
      }
    }

    const nextGeneration: number[][] = [];
    nextGeneration.push([...bestChromosome]); // Elitism

    while (nextGeneration.length < popSize) {
      const p1 = tournamentSelection(population, fitnesses);
      const p2 = tournamentSelection(population, fitnesses);
      let child = crossover(p1, p2);
      child = mutate(child, groupCount, mutationRate);
      nextGeneration.push(child);
    }

    population = nextGeneration;
  }

  // Construct final groups from best chromosome
  const groups: SmallGroup[] = Array.from({ length: groupCount }, (_, id) => ({
    id,
    members: [],
    size: 0,
    averageAge: 0
  }));

  for (let i = 0; i < bestChromosome.length; i++) {
    const groupId = bestChromosome[i];
    groups[groupId].members.push(...households[i].adults);
    groups[groupId].size += households[i].size;
  }

  // Calculate final average ages
  groups.forEach(g => {
    if (g.size > 0) {
      const sumAge = g.members.reduce((sum, m) => sum + m.age, 0);
      g.averageAge = sumAge / g.size;
    }
  });

  return groups;
};
