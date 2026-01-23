import { differenceInYears } from 'date-fns';

export interface PcoAttributes {
  birthdate?: string | null;
  grade?: number | null;
  name?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export interface PcoPerson {
  id: string;
  type: string;
  attributes: PcoAttributes;
}

export interface PcoApiResponse {
  data: PcoPerson[];
  meta: {
    total_count: number;
    count: number;
    [key: string]: unknown;
  };
}

export interface Student {
  id: string;
  age: number;
  pcoGrade: number;
  name: string;
}

export const transformPerson = (person: PcoPerson): Student | null => {
  const { id, attributes } = person;
  const { birthdate, grade, name, first_name, last_name } = attributes;

  if (!birthdate || grade === undefined || grade === null) {
    return null;
  }

  const dob = new Date(birthdate);
  // Check if date is valid
  if (isNaN(dob.getTime())) {
    return null;
  }

  const age = differenceInYears(new Date(), dob);

  // Use 'name' if available, otherwise construct from first/last, otherwise 'Unknown'
  const displayName = name || `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown';

  return {
    id,
    age,
    pcoGrade: grade,
    name: displayName,
  };
};
