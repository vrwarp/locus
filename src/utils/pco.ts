import { differenceInYears } from 'date-fns';
import axios from 'axios';
import { calculateExpectedGrade } from './grader';

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

export interface PcoSingleResponse {
    data: PcoPerson;
}

export interface Student {
  id: string;
  age: number;
  pcoGrade: number;
  name: string;
  birthdate: string;
  calculatedGrade: number;
  delta: number;
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
  const calculatedGrade = calculateExpectedGrade(dob);
  const delta = calculatedGrade - grade;

  // Use 'name' if available, otherwise construct from first/last, otherwise 'Unknown'
  const displayName = name || `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown';

  return {
    id,
    age,
    pcoGrade: grade,
    name: displayName,
    birthdate,
    calculatedGrade,
    delta,
  };
};

export const updatePerson = async (id: string, attributes: PcoAttributes, auth: string): Promise<PcoPerson> => {
    const response = await axios.patch<PcoSingleResponse>(
      `/api/people/v2/people/${id}`,
      {
        data: {
          type: 'Person',
          id,
          attributes
        }
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data;
  };
