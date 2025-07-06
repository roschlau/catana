import {expect, test} from 'vitest'
import {toMarkdown} from '@/main/conversion/markdown'
import {TextNode} from '@/common/nodes'
import {testNode} from '@/common/nodes.spec'

test('Done Task with checkbox history entries', () => {
  const input: TextNode = {
    ...testNode,
    title: 'Task',
    checkbox: true,
    history: {
      createdTime: 1748286912000,
      lastModifiedTime: 1748525302000,
      checkbox: [
        [1748525202000, true],
        [1748523883000, 'indeterminate'],
        [1748523881000, false],
        [1748287912000, 'indeterminate'],
      ],
    },
  }
  const expected = `- DONE Task
:LOGBOOK:
  CLOCK: [2025-05-26 Mon 21:31:52]--[2025-05-29 Thu 15:04:41] =>  65:32:49
  CLOCK: [2025-05-29 Thu 15:04:43]--[2025-05-29 Thu 15:26:42] =>  00:21:59
:END:`
  expect(toMarkdown(input, 'logseq')).toEqual(expected)
})

test('Done Task with checkbox history entries', () => {
  const input: TextNode = {
    ...testNode,
    title: 'Task',
    checkbox: 'indeterminate',
    history: {
      createdTime: 1748286912000,
      lastModifiedTime: 1748525302000,
      checkbox: [
        [1751666312000, 'indeterminate'],
      ],
    },
  }
  const expected = `- DOING Task
:LOGBOOK:
  CLOCK: [2025-07-04 Fri 23:58:32]
:END:`
  expect(toMarkdown(input, 'logseq')).toEqual(expected)
})
