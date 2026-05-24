/**
 * Lightweight semver comparison helpers.
 *
 * Handles strings like "1.4.16", "1.5.0", "1.5.0rc2", "2.0.0-beta.1".
 * Pre-release labels (rc, alpha, beta, …) sort *before* the corresponding
 * release — e.g. "1.5.0rc2" < "1.5.0".
 */

interface ParsedVersion {
  parts: number[]
  pre: string
}

function parseVersion(v: string): ParsedVersion {
  // Split at first non-numeric-or-dot character to separate numeric from pre-release
  const match = v.match(/^([\d.]+)(.*)$/)
  const numeric = match?.[1] ?? v
  const pre = (match?.[2] ?? '').replace(/^[-.]/, '') // strip leading dash/dot

  const parts = numeric.split('.').map((n) => parseInt(n, 10) || 0)
  return { parts, pre }
}

/**
 * Compare two version strings.
 * Returns -1 if a < b, 0 if a === b, +1 if a > b.
 */
export function compareVersions(a: string, b: string): number {
  const av = parseVersion(a)
  const bv = parseVersion(b)

  const len = Math.max(av.parts.length, bv.parts.length)
  for (let i = 0; i < len; i++) {
    const an = av.parts[i] ?? 0
    const bn = bv.parts[i] ?? 0
    if (an !== bn) return an < bn ? -1 : 1
  }

  // Same numeric segment — pre-release sorts before the final release
  if (av.pre && !bv.pre) return -1
  if (!av.pre && bv.pre) return 1
  if (av.pre && bv.pre) {
    return av.pre < bv.pre ? -1 : av.pre > bv.pre ? 1 : 0
  }
  return 0
}

/**
 * Returns true when `version` is ≥ `minVersion`.
 *
 * @example
 * isVersionAtLeast('1.5.0rc2', '1.5.0') // false  (rc < release)
 * isVersionAtLeast('1.5.0',    '1.5.0') // true
 * isVersionAtLeast('1.5.1',    '1.5.0') // true
 * isVersionAtLeast('1.4.16',   '1.5.0') // false
 */
export function isVersionAtLeast(version: string, minVersion: string): boolean {
  return compareVersions(version, minVersion) >= 0
}
