import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
// @ts-ignore - Importing JS file
import { app, resetDb } from '../../mock-api/server.js';
import { fetchAllPeople } from '../utils/pco';
import axios from 'axios';
import http from 'http';
import { AddressInfo } from 'net';

let server: http.Server;
let baseUrl: string;

describe('Local API Simulator', () => {
  beforeAll(async () => {
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        console.log(`Test simulator running at ${baseUrl}`);
        resolve(null);
      });
    });
  });

  afterAll(() => {
    if (server) server.close();
  });

  beforeEach(() => {
    resetDb();
  });

  it('GET /people/v2/people returns paginated results', async () => {
    const response = await axios.get(`${baseUrl}/people/v2/people?per_page=2`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveLength(2);
    expect(response.data.meta.total_count).toBeGreaterThanOrEqual(30); // ~35 households * ~3 people

    const nextLink = response.data.links.next;
    expect(nextLink).toBeDefined();
    expect(nextLink).toContain(baseUrl);
    expect(nextLink).toContain('offset=2');
  });

  it('PATCH /people/v2/people/:id updates grade', async () => {
    // Need to find a valid ID since they are generated
    const listRes = await axios.get(`${baseUrl}/people/v2/people?per_page=1`);
    const personId = listRes.data.data[0].id;
    const newGrade = 8;

    // Update
    const patchRes = await axios.patch(
      `${baseUrl}/people/v2/people/${personId}`,
      {
        data: {
          type: 'Person',
          id: personId,
          attributes: { grade: newGrade }
        }
      },
      { headers: { 'Content-Type': 'application/vnd.api+json' } }
    );

    expect(patchRes.data.data.attributes.grade).toBe(newGrade);

    // Verify persistence by fetching again
    const getRes = await axios.get(`${baseUrl}/people/v2/people/${personId}`);
    expect(getRes.data.data.attributes.grade).toBe(newGrade);
  });

  it('fetchAllPeople follows pagination from simulator', async () => {
    // Just fetch first 50 to verify it works without fetching thousands
    const { people } = await fetchAllPeople('fake-auth', `${baseUrl}/people/v2/people?per_page=50`);

    // We expect at least 35 households, so probably > 100 people
    expect(people.length).toBeGreaterThanOrEqual(100);

    // Verify structure of a person
    const person = people[0];
    expect(person.type).toBe('Person');
    expect(person.attributes.name).toBeDefined();
  });

  it('GET /check-ins/v2/check_ins returns substantial data', async () => {
    const response = await axios.get(`${baseUrl}/check-ins/v2/check_ins?per_page=1`);
    expect(response.status).toBe(200);
    // 51 weeks * 2 events * ~60 kids * 0.6 attendance => ~3600 checkins
    expect(response.data.meta.total_count).toBeGreaterThan(1000);
  });

  it('GET /check-ins/v2/events returns 2 events', async () => {
    const response = await axios.get(`${baseUrl}/check-ins/v2/events`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveLength(2);
    expect(response.data.data[0].attributes.name).toMatch(/Friday|Sunday/);
  });

  it('Verifies adults have contact info', async () => {
    const response = await axios.get(`${baseUrl}/people/v2/people?per_page=100`);
    const people = response.data.data;
    const adults = people.filter((p: any) => !p.attributes.child);

    expect(adults.length).toBeGreaterThan(0);
    const adult = adults[0];

    expect(adult.attributes.phone_numbers).toBeDefined();
    expect(adult.attributes.phone_numbers[0].number).toMatch(/555-\d{3}-\d{4}/);
    expect(adult.attributes.email_addresses).toBeDefined();
    expect(adult.attributes.email_addresses[0].address).toContain('@example.com');
  });
});
