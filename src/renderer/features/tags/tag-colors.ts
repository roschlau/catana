
export interface TagColorValues {
  hue: number,
  tagBackground: string,
  tagForeground: string,
}

export function grayTagColorValues(theme: string | undefined) {
  return {
    hue: 0,
    tagBackground: theme === 'dark' ? 'oklch(0.4 0 0)' : 'oklch(0.9 0 0)',
    tagForeground: theme === 'dark' ? 'oklch(0.9 0 0)' : 'oklch(0.20 0 0)',
  }
}

export function tagColorValues(hue: number, theme: string | undefined): TagColorValues {
  return {
    hue,
    tagBackground: theme === 'dark' ? `oklch(0.30 0.10 ${hue})` : `oklch(0.96 0.06 ${hue})`,
    tagForeground: theme === 'dark' ? `oklch(0.8 0.16 ${hue})` : `oklch(0.30 0.20 ${hue})`,
  }
}

export const tagHues = [20, 48, 70, 86, 131, 152, 183, 237, 260, 283, 305, 322, 354]

/**
 * Chooses a random element from the passed array based on the given seed *non-securely*.
 */
export async function chooseRandomElement<T>(list: T[], seed: string): Promise<T> {
  const randomIndex = await randomNumber(seed) % list.length
  return list[randomIndex]
}

/**
 * Generates a (non-secure) pseudo-random number based on the given seed. Great for choosing things like tag colors at
 * random, but reproducibly.
 */
async function randomNumber(seed: string): Promise<number> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(seed))
  const hashString = Array.from(new Uint8Array(hash))
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')
  return parseInt(hashString.substring(0, 10), 16)
}
