import { describe, it, expect, beforeEach } from 'vitest';
import { getApiBase, setApiBase, resolveApiUrl, API_PREFIX } from './apiBase';

describe('apiBase', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getApiBase / setApiBase', () => {
    it('is empty by default, so paths stay origin-relative for the dev proxy', () => {
      expect(getApiBase()).toBe('');
    });

    it('round-trips a stored origin', () => {
      setApiBase('https://mirror.example.org');
      expect(getApiBase()).toBe('https://mirror.example.org');
    });

    it('strips a trailing slash so joining a path never doubles it', () => {
      setApiBase('https://mirror.example.org/');
      expect(getApiBase()).toBe('https://mirror.example.org');
      expect(resolveApiUrl('/api/people/v2/people')).toBe('https://mirror.example.org/people/v2/people');
    });

    it('tolerates surrounding whitespace, which a paste tends to carry', () => {
      setApiBase('  https://mirror.example.org  ');
      expect(getApiBase()).toBe('https://mirror.example.org');
    });

    it('clears the override when handed an empty value', () => {
      setApiBase('https://mirror.example.org');
      setApiBase('');
      expect(getApiBase()).toBe('');
    });

    it('keeps a base that includes a path prefix of its own', () => {
      setApiBase('https://example.org/pco');
      expect(resolveApiUrl('/api/people/v2/people')).toBe('https://example.org/pco/people/v2/people');
    });
  });

  describe('resolveApiUrl', () => {
    it('leaves everything alone when no base is configured', () => {
      expect(resolveApiUrl('/api/people/v2/people?per_page=100'))
        .toBe('/api/people/v2/people?per_page=100');
    });

    it('swaps the dev-proxy prefix for the configured origin', () => {
      expect(resolveApiUrl('/api/check-ins/v2/check_ins', 'https://mirror.example.org'))
        .toBe('https://mirror.example.org/check-ins/v2/check_ins');
    });

    it('preserves the query string', () => {
      expect(resolveApiUrl('/api/people/v2/people?offset=100&include=emails', 'https://mirror.example.org'))
        .toBe('https://mirror.example.org/people/v2/people?offset=100&include=emails');
    });

    it('leaves an absolute URL untouched — the mock is addressed directly', () => {
      expect(resolveApiUrl('http://localhost:3000/people/v2/people', 'https://mirror.example.org'))
        .toBe('http://localhost:3000/people/v2/people');
    });

    it('leaves a path that never carried the prefix untouched', () => {
      expect(resolveApiUrl('/people/v2/people', 'https://mirror.example.org'))
        .toBe('/people/v2/people');
    });

    // `/apiary/...` starts with the prefix as a string but is not under it.
    it('does not match a path that merely starts with the same letters', () => {
      expect(resolveApiUrl('/apiary/v2/things', 'https://mirror.example.org'))
        .toBe('/apiary/v2/things');
    });

    it('maps the bare prefix onto the base', () => {
      expect(resolveApiUrl(API_PREFIX, 'https://mirror.example.org'))
        .toBe('https://mirror.example.org');
    });
  });
});
