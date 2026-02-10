import { differenceInYears } from 'date-fns';
import { AxiosError } from 'axios';
import api from './api';
import { calculateExpectedGrade } from './grader';
import { detectNameAnomaly } from './hygiene';
import type { GraderOptions } from './grader';

export interface PcoAttributes {
  birthdate?: string | null;
  grade?: number | null;
  name?: string;
  first_name?: string;
  last_name?: string;
  child?: boolean;
  household_id?: string;
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
  firstName: string;
  lastName: string;
  birthdate: string;
  calculatedGrade: number;
  delta: number;
  lastCheckInAt: string | null;
  checkInCount: number | null;
  groupCount: number | null;
  avatarUrl?: string;
  isChild: boolean;
  householdId: string | null;
  hasNameAnomaly: boolean;
}

export const transformPerson = (person: PcoPerson, options?: GraderOptions): Student | null => {
  const { id, attributes } = person;
  const { birthdate, grade, name, first_name, last_name, last_checked_in_at, avatar, child, household_id } = attributes;

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
  const hasNameAnomaly = detectNameAnomaly(displayName);

  return {
    id,
    age,
    pcoGrade: grade,
    name: displayName,
    firstName: (first_name || '').trim(),
    lastName: (last_name || '').trim(),
    birthdate,
    calculatedGrade,
    delta,
    lastCheckInAt: (last_checked_in_at as string) || null,
    checkInCount: null, // Fetched lazily
    groupCount: null, // Fetched lazily
    avatarUrl: (avatar as string) || undefined,
    isChild: !!child,
    householdId: household_id || null,
    hasNameAnomaly,
  };
};

export const updatePerson = async (id: string, attributes: PcoAttributes, auth: string, sandboxMode?: boolean): Promise<PcoPerson> => {
    const headers: Record<string, string> = {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
    };

    if (sandboxMode) {
        headers['X-Locus-Sandbox'] = 'true';
    }

    const response = await api.patch<PcoSingleResponse>(
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

export const archivePerson = async (id: string, auth: string, sandboxMode?: boolean): Promise<PcoPerson> => {
    return updatePerson(id, { status: 'inactive' }, auth, sandboxMode);
};

export const fetchCheckInCount = async (id: string, auth: string): Promise<number | null> => {
    try {
        const response = await api.get<{ data: { attributes: { check_in_count: number } } }>(
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

export const fetchGroupCount = async (id: string, auth: string): Promise<number | null> => {
    try {
        // PCO Groups API structure for memberships
        // We use the simulator endpoint or real proxy
        const response = await api.get<{ meta: { total_count: number } }>(
            `/groups/v2/people/${id}/memberships`,
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );
        return response.data.meta.total_count;
    } catch (error) {
        console.error('Failed to fetch group count for person', id, error);
        return null;
    }
};

export const fetchAllPeople = async (auth: string, url: string = '/api/people/v2/people?per_page=100', maxPages: number = Infinity): Promise<{ people: PcoPerson[], nextUrl: string | undefined }> => {
  let allPeople: PcoPerson[] = [];
  let nextUrl: string | undefined = url;
  let pageCount = 0;

  while (nextUrl && pageCount < maxPages) {
    // Ensure we use the proxy for absolute URLs returned by PCO
    const proxyUrl = nextUrl.replace('https://api.planningcenteronline.com', '/api');

    const response = await api.get<PcoApiResponse>(proxyUrl, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    allPeople = [...allPeople, ...response.data.data];
    nextUrl = response.data.links?.next;
    pageCount++;
  }

  return { people: allPeople, nextUrl };
};

export const checkApiVersion = async (auth: string): Promise<boolean> => {
  try {
    await api.get('/api/people/v2/people', {
      params: { per_page: 1 },
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return true;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid credentials.');
      }
      if (error.response?.status === 404) {
        throw new Error('API Error: Version mismatch or endpoint not found.');
      }
    }
    throw error;
  }
};
