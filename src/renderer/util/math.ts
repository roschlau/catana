
/**
 * Clamps the passed number x to the range defined by the min and max values, so that `min <= returnValue <= max`.
 * If `min > max`, `max` takes precedence, so that the function will always return `max`.
 */
export const clamp = (x: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, x))
