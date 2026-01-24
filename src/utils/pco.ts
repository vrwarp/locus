import { differenceInYears } from 'date-fns';
import axios from 'axios';
import { calculateExpectedGrade } from './grader';
import type { GraderOptions } from './grader';

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
  links?: {
    next?: string;
    self?: string;
  };
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
  lastCheckInAt: string | null;
  checkInCount: number | null;
}

export const transformPerson = (person: PcoPerson, options?: GraderOptions): Student | null => {
  const { id, attributes } = person;
  const { birthdate, grade, name, first_name, last_name, last_checked_in_at } = attributes;

  if (!birthdate || grade === undefined || grade === null) {
    return null;
  }

  const dob = new Date(birthdate);
  // Check if date is valid
  if (isNaN(dob.getTime())) {
    return null;
  }

  const age = differenceInYears(new Date(), dob);
  const calculatedGrade = calculateExpectedGrade(dob, undefined, options);
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
    lastCheckInAt: (last_checked_in_at as string) || null,
    checkInCount: null, // Fetched lazily
  };
};

export const updatePerson = async (id: string, attributes: PcoAttributes, auth: string, sandboxMode = false): Promise<PcoPerson> => {
    const headers: Record<string, string> = {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
    };

    if (sandboxMode) {
        headers['X-Locus-Sandbox'] = 'true';
    }

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
        headers
      }
    );
    return response.data.data;
  };

export const archivePerson = async (id: string, auth: string, sandboxMode = false): Promise<PcoPerson> => {
    return updatePerson(id, { status: 'inactive' }, auth, sandboxMode);
};

export const fetchCheckInCount = async (id: string, auth: string): Promise<number | null> => {
    try {
        const response = await axios.get<{ data: { attributes: { check_in_count: number } } }>(
            `/api/check-ins/v2/people/${id}`,
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );
        return response.data.data.attributes.check_in_count;
    } catch (error) {
        console.error('Failed to fetch check-in count for person', id, error);
        return null;
    }
};

export const fetchAllPeople = async (auth: string, url: string = '/api/people/v2/people?per_page=100'): Promise<PcoPerson[]> => {
  let allPeople: PcoPerson[] = [];
  let nextUrl: string | undefined = url;

  while (nextUrl) {
    // Ensure we use the proxy for absolute URLs returned by PCO
    const proxyUrl = nextUrl.replace('https://api.planningcenteronline.com', '/api');

    const response = await axios.get<PcoApiResponse>(proxyUrl, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    allPeople = [...allPeople, ...response.data.data];
    nextUrl = response.data.links?.next;
  }

  return allPeople;
};
