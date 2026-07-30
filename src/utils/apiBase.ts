/**
 * Where `/api/...` actually goes.
 *
 * In development every request is origin-relative and the Vite dev server
 * proxies `/api` onto `VITE_API_TARGET`, stripping the prefix. A static build has
 * no proxy: served from GitHub Pages, `/api/people/v2/people` resolves against
 * `github.io` and 404s. So the deployed app needs to be told the API's origin,
 * and it has to be told at runtime — the person opening the page is the one who
 * knows which pcomirror they point at, and baking it into the bundle would make
 * the build specific to one installation.
 *
 * Resolution order, first non-empty wins:
 *
 *   1. Whatever the user typed on the login screen (persisted here).
 *   2. `VITE_API_BASE_URL` at build time, for a deploy that does have one fixed
 *      backend and would rather not ask.
 *   3. Nothing — keep paths origin-relative, which is what the dev proxy wants.
 *
 * The target must send CORS headers that allow this origin; see the README.
 */

const STORAGE_KEY = 'locus.apiBase';

/** The prefix every call site writes, and that the dev proxy rewrites away. */
export const API_PREFIX = '/api';

const buildTimeBase = (): string => {
  try {
    return (import.meta.env?.VITE_API_BASE_URL as string | undefined) || '';
  } catch {
    return '';
  }
};

/** Strip trailing slashes so joining a path never doubles them. */
const normalise = (base: string): string => base.trim().replace(/\/+$/, '');

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * The API origin, or `''` when requests should stay origin-relative.
 */
export const getApiBase = (): string => {
  if (isBrowser()) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) return normalise(stored);
    } catch {
      // Private-mode localStorage throws on read. Fall through to the build value.
    }
  }
  return normalise(buildTimeBase());
};

/**
 * Remember an API origin for the next visit. An empty value clears the override
 * and hands resolution back to the build-time default.
 */
export const setApiBase = (base: string): void => {
  if (!isBrowser()) return;
  try {
    const next = normalise(base);
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — the value simply will not survive a reload.
  }
};

/**
 * Point an `/api/...` path at the configured base. Anything else — an absolute
 * URL the mock tests address directly, a path that never carried the prefix — is
 * returned untouched.
 */
export const resolveApiUrl = (url: string, base: string = getApiBase()): string => {
  if (!base) return url;
  if (url === API_PREFIX) return base;
  if (!url.startsWith(`${API_PREFIX}/`)) return url;
  return `${base}${url.slice(API_PREFIX.length)}`;
};
