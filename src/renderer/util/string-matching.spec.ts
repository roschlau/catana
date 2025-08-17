import {describe, expect, test} from 'vitest'
import {textSearchMatch} from '@/renderer/util/string-matching'

describe('textSearchMatch', () => {
  test('returns true on exact match', () => {
    expect(textSearchMatch('abc', 'abc')).toBe(true)
  })
  test('returns true on partial match', () => {
    expect(textSearchMatch('abcdef', 'bcd')).toBe(true)
  })
  test('returns true on prefix match', () => {
    expect(textSearchMatch('abcdef', 'abc')).toBe(true)
  })
  test('returns true on suffix match', () => {
    expect(textSearchMatch('abcdef', 'def')).toBe(true)
  })
  test('returns true on sparse match', () => {
    expect(textSearchMatch('abcdef', 'bdf')).toBe(true)
  })
  test('returns true on empty query', () => {
    expect(textSearchMatch('abcdef', '')).toBe(true)
  })
  test('returns false on empty text', () => {
    expect(textSearchMatch('', 'abc')).toBe(false)
  })
  test('returns true on empty text and query', () => {
    expect(textSearchMatch('', '')).toBe(true)
  })
  test('is case insensitive', () => {
    expect(textSearchMatch('abc', 'AB')).toBe(true)
  })
  test('returns false on no match', () => {
    expect(textSearchMatch('abc', 'def')).toBe(false)
  })
  test('returns false on wrong order', () => {
    expect(textSearchMatch('abc', 'cba')).toBe(false)
  })
})
