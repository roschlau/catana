/**
 * Returns true if the given text contains all characters from the given query in the order they appear in the query.
 * Case-insensitive.
 */
export const textSearchMatch = (text: string, query: string) => {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let queryIndex = 0
  let textIndex = 0
  while (true) {
    if (queryIndex >= q.length) return true
    if (textIndex >= t.length) return false
    // Consume query character if found at current name index
    if (t[textIndex] === q[queryIndex]) queryIndex += 1
    // Consume text character
    textIndex += 1
  }
}
