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
    expect(response.data.meta.total_count).toBeGreaterThan(2);

    const nextLink = response.data.links.next;
    expect(nextLink).toBeDefined();
    // Verify it points to the same host
    expect(nextLink).toContain(baseUrl);
    expect(nextLink).toContain('offset=2');
  });

  it('PATCH /people/v2/people/:id updates grade', async () => {
    const id = '1';
    const newGrade = 8;

    // Update
    const patchRes = await axios.patch(
      `${baseUrl}/people/v2/people/${id}`,
      {
        data: {
          type: 'Person',
          id,
          attributes: { grade: newGrade }
        }
      },
      { headers: { 'Content-Type': 'application/vnd.api+json' } }
    );

    expect(patchRes.data.data.attributes.grade).toBe(newGrade);

    // Verify persistence by fetching again
    const getRes = await axios.get(`${baseUrl}/people/v2/people/${id}`);
    expect(getRes.data.data.attributes.grade).toBe(newGrade);
  });

  it('fetchAllPeople follows pagination from simulator', async () => {
    // fetchAllPeople is a utility that recursively follows links.next.
    // By passing our simulator URL, we verify it can handle real HTTP responses
    // and correctly accumulate results.

    // Use a small per_page to force multiple requests
    const people = await fetchAllPeople('fake-auth', `${baseUrl}/people/v2/people?per_page=10`);

    // Total in data.js is 30 (4 manual + 26 generated).
    expect(people.length).toBe(30);

    const ids = people.map(p => p.id);
    expect(ids).toContain('1');
    expect(ids).toContain('30');

    // Verify data integrity
    const p1 = people.find(p => p.id === '1');
    expect(p1?.attributes.name).toBe('Valid Kindergartner');
  });

  it('GET /check-ins/v2/check_ins returns data', async () => {
    const response = await axios.get(`${baseUrl}/check-ins/v2/check_ins`);
    expect(response.status).toBe(200);
    expect(response.data.data.length).toBeGreaterThan(0);
    expect(response.data.data[0].type).toBe('CheckIn');
  });

  it('GET /check-ins/v2/events returns data', async () => {
    const response = await axios.get(`${baseUrl}/check-ins/v2/events`);
    expect(response.status).toBe(200);
    expect(response.data.data.length).toBeGreaterThan(0);
    expect(response.data.data[0].type).toBe('Event');
  });

  it('GET /api/v2 returns organization info', async () => {
    const response = await axios.get(`${baseUrl}/api/v2`);
    expect(response.status).toBe(200);
    expect(response.data.data.type).toBe('Organization');
  });
});
