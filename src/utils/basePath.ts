/**
 * Base path prefix used when the app is deployed under a subdirectory.
 *
 * The value comes from the `NEXT_PUBLIC_BASE_PATH` environment variable. When
 * running locally this defaults to an empty string.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Prefix a path with `BASE_PATH` so asset URLs resolve correctly both locally
 * and when deployed under a GitHub Pages style subpath.
 */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
