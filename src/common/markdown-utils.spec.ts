import {describe, expect, test} from 'vitest'
import {encloseRange, suppressUnsupportedMd} from '@/common/markdown-utils'

describe('toggleMarkup', () => {
  test('adds to entire string', () => {
    const { result, mappedRange } = encloseRange('abc', { start: 0, end: 3 }, 'toggle', '[', ']')
    expect(result).toEqual('[abc]')
    expect(mappedRange).toEqual({ start: 1, end: 4 })
  })

  test('respects different prefix/suffix lengths when adding', () => {
    const { result, mappedRange } = encloseRange('Test surrounding this', { start: 5, end: 16 }, 'toggle', '**')
    expect(result).toEqual('Test **surrounding** this')
    expect(mappedRange).toEqual({ start: 7, end: 18 })
  })

  test('removes from entire string', () => {
    const { result, mappedRange } = encloseRange('[abc]', { start: 1, end: 4 }, 'toggle', '[', ']')
    expect(result).toEqual('abc')
    expect(mappedRange).toEqual({ start: 0, end: 3 })
  })

  test('doesn\'t remove in enclose mode', () => {
    const { result, mappedRange } = encloseRange('[abc]', { start: 1, end: 4 }, 'enclose', '[', ']')
    expect(result).toEqual('[[abc]]')
    expect(mappedRange).toEqual({ start: 2, end: 5 })
  })

  test('respects different prefix/suffix lengths when removing', () => {
    const { result, mappedRange } = encloseRange('Test **surrounding** this', { start: 7, end: 18 }, 'toggle', '**', '**')
    expect(result).toEqual('Test surrounding this')
    expect(mappedRange).toEqual({ start: 5, end: 16 })
  })

  test('adds again if already present but part of range', () => {
    const { result, mappedRange } = encloseRange('Test [surrounding] this', { start: 5, end: 18 }, 'toggle', '[', ']')
    expect(result).toEqual('Test [[surrounding]] this')
    expect(mappedRange).toEqual({ start: 6, end: 19 })
  })

  test('adds to empty range correctly', () => {
    const { result, mappedRange } = encloseRange('beforeafter', { start: 6, end: 6 }, 'toggle', '[', ']')
    expect(result).toEqual('before[]after')
    expect(mappedRange).toEqual({ start: 7, end: 7 })
  })

  test('removes from empty range correctly', () => {
    const { result, mappedRange } = encloseRange('before[]after', { start: 7, end: 7 }, 'toggle', '[', ']')
    expect(result).toEqual('beforeafter')
    expect(mappedRange).toEqual({ start: 6, end: 6 })
  })

  test('doesn\'t remove from empty range in enclose mode', () => {
    const { result, mappedRange } = encloseRange('before[]after', { start: 7, end: 7 }, 'enclose', '[', ']')
    expect(result).toEqual('before[[]]after')
    expect(mappedRange).toEqual({ start: 8, end: 8 })
  })

  test('Excludes space from end of range', () => {
    const { result, mappedRange } = encloseRange('Word in middle', { start: 5, end: 8 }, 'toggle', '[', ']')
    expect(result).toEqual('Word [in] middle')
    expect(mappedRange).toEqual({ start: 6, end: 8 })
  })

  test('Excludes space from start of range', () => {
    const { result, mappedRange } = encloseRange('Word in middle', { start: 4, end: 7 }, 'toggle', '[', ']')
    expect(result).toEqual('Word [in] middle')
    expect(mappedRange).toEqual({ start: 6, end: 8 })
  })
})

describe('escapeUnsupportedMd', () => {
  test('Suppresses level 1 headings', () => {
    expect(suppressUnsupportedMd('# Heading'))
      .toEqual('\\# Heading')
  })
  test('Suppresses level 4 headings', () => {
    expect(suppressUnsupportedMd('#### Heading'))
      .toEqual('\\#### Heading')
  })
  test('Suppresses blockquotes', () => {
    expect(suppressUnsupportedMd('> Blockquote'))
      .toEqual('\\> Blockquote')
  })
  test(`Suppresses html tags`, () => {
    expect(suppressUnsupportedMd('Some <span>span</span> here'))
      .toEqual('Some \\<span\\>span\\</span\\> here')
  })
})
