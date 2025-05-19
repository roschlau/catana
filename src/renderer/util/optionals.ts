/**
 * Returns true if the passed value is neither null nor undefined. Used for easier typing of `filter` calls on lists of
 * optional values.
 * @example [1, null, 2, undefined].filter(isPresent) // => [1, 2]
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
