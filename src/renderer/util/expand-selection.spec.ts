import {describe, expect, test} from 'vitest'

import {expandSelection} from '@/renderer/util/expand-selection'

// Basic functionality tests
test('expands simple word from middle', () => {
  expect(expandSelection('three word sentence', { start: 8, end: 8 }))
    .toEqual({ start: 6, end: 10 })
})
test('expands simple word from start', () => {
  expect(expandSelection('three word sentence', { start: 6, end: 6 }))
    .toEqual({ start: 6, end: 10 })
})
test('expands simple word from start', () => {
  expect(expandSelection('three word sentence', { start: 10, end: 10 }))
    .toEqual({ start: 6, end: 10 })
})
test('expands to partially selected word', () => {
  expect(expandSelection('three word sentence', { start: 7, end: 9 }))
    .toEqual({ start: 6, end: 10 })
})
test('expands to partially selected word from start', () => {
  expect(expandSelection('three word sentence', { start: 6, end: 9 }))
    .toEqual({ start: 6, end: 10 })
})
test('expands to partially selected word from end', () => {
  expect(expandSelection('three word sentence', { start: 7, end: 10 }))
    .toEqual({ start: 6, end: 10 })
})

describe('with punctuation', () => {
  test('expands word with comma', () => {
    expect(expandSelection('hello, world', { start: 3, end: 3 }))
      .toEqual({ start: 0, end: 5 })
  })

  test('expands word with period', () => {
    expect(expandSelection('hello. world', { start: 3, end: 3 }))
      .toEqual({ start: 0, end: 5 })
  })

  test('expands word with exclamation mark', () => {
    expect(expandSelection('hello! world', { start: 3, end: 3 }))
      .toEqual({ start: 0, end: 5 })
  })

  test('expands word with question mark', () => {
    expect(expandSelection('hello? world', { start: 3, end: 3 }))
      .toEqual({ start: 0, end: 5 })
  })

  test('expands word with semicolon', () => {
    expect(expandSelection('hello; world', { start: 3, end: 3 }))
      .toEqual({ start: 0, end: 5 })
  })

  test('expands word with colon', () => {
    expect(expandSelection('hello: world', { start: 3, end: 3 }))
      .toEqual({ start: 0, end: 5 })
  })
})

describe('with special characters', () => {
  test('expands word with hyphen', () => {
    expect(expandSelection('well-known fact', { start: 6, end: 6 }))
      .toEqual({ start: 5, end: 10 })
  })

  test('expands word with underscore', () => {
    expect(expandSelection('variable_name here', { start: 6, end: 6 }))
      .toEqual({ start: 0, end: 8 })
  })

  test('expands word with apostrophe', () => {
    expect(expandSelection('don\'t worry', { start: 3, end: 3 }))
      .toEqual({ start: 0, end: 3 })
  })

  test('expands word with parentheses', () => {
    expect(expandSelection('word(s) here', { start: 3, end: 3 }))
      .toEqual({ start: 0, end: 4 })
  })
})

describe('with position edge cases', () => {
  test('expands word at the beginning of content', () => {
    expect(expandSelection('first word', { start: 2, end: 2 }))
      .toEqual({ start: 0, end: 5 })
  })

  test('expands word at the end of content', () => {
    expect(expandSelection('the last', { start: 6, end: 6 }))
      .toEqual({ start: 4, end: 8 })
  })

  test('expands the only word in content', () => {
    expect(expandSelection('singleword', { start: 5, end: 5 }))
      .toEqual({ start: 0, end: 10 })
  })
})

describe('with different whitespace characters', () => {
  test('expands word with tab separator', () => {
    expect(expandSelection('word\tanother', { start: 2, end: 2 }))
      .toEqual({ start: 0, end: 4 })
  })

  test('expands word with newline separator', () => {
    expect(expandSelection('word\nanother', { start: 2, end: 2 }))
      .toEqual({ start: 0, end: 4 })
  })

  test('expands word with multiple spaces', () => {
    expect(expandSelection('word    another', { start: 2, end: 2 }))
      .toEqual({ start: 0, end: 4 })
  })
})

describe('with alphanumeric characters', () => {
  test('expands word with numbers', () => {
    expect(expandSelection('hello123 world', { start: 6, end: 6 }))
      .toEqual({ start: 0, end: 8 })
  })

  test('expands number sequence', () => {
    expect(expandSelection('year 2023 now', { start: 7, end: 7 }))
      .toEqual({ start: 5, end: 9 })
  })
})

describe('expands from word to any non-whitespace sequence', () => {
  test('from start', () => {
    expect(expandSelection('abc hello.world def', { start: 4, end: 9 }))
      .toEqual({ start: 4, end: 15 })
  })
  test('from end', () => {
    expect(expandSelection('abc hello.world def', { start: 10, end: 15 }))
      .toEqual({ start: 4, end: 15 })
  })
})
describe('expands from non-whitespace sequence to full sentence', () => {
  test('Simple example', () => {
    expect(expandSelection('One sentence! And ano.ther one. And more!', { start: 18, end: 26 }))
      .toEqual({ start: 14, end: 31 })
  })
  test('includes ellipses', () => {
    expect(expandSelection('One sentence! And ano.ther one... And more!', { start: 18, end: 26 }))
      .toEqual({ start: 14, end: 33 })
  })
  test('includes confusion', () => {
    expect(expandSelection('One sentence! And ano.ther one?!?! And more!', { start: 18, end: 26 }))
      .toEqual({ start: 14, end: 34 })
  })
  test('includes confusion 2', () => {
    expect(expandSelection('One sentence! And ano.ther one?!?! And more!', { start: 14, end: 33 }))
      .toEqual({ start: 14, end: 34 })
  })
})
describe('expands to entire content if sentence is covered', () => {
  test('Expands to entire content', () => {
    expect(expandSelection('One sentence! And ano.ther one?!?! And more!', { start: 14, end: 34 }))
      .toEqual({ start: 0, end: 44 })
  })
})
