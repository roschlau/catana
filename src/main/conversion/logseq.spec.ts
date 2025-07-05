import {expect, test} from 'vitest'
import {tryParseLogseq} from '@/main/conversion/logseq'
import {TreeTextNode} from '@/common/node-tree'

test('Simple Node', () => {
  const input = '- Node Title'
  const expected: TreeTextNode[] = [{ type: 'node', title: 'Node Title', expanded: true }]
  expect(tryParseLogseq(input)).toEqual(expected)
})

test('Node With ID', () => {
  const input = `
    - Node Title
      id:: 123987
  `
  const expected: TreeTextNode[] = [{ type: 'node', title: 'Node Title', id: '123987', expanded: true }]
  expect(tryParseLogseq(input)).toEqual(expected)
})

test('Collapsed Node with children', () => {
  const input = `
    - Parent
      collapsed:: true
      - Child 1
      - Child 2
  `
  const expected: TreeTextNode[] = [{
    type: 'node',
    title: 'Parent',
    content: [
      { type: 'node', title: 'Child 1', expanded: true },
      { type: 'node', title: 'Child 2', expanded: true },
    ],
    expanded: false,
  }]
  expect(tryParseLogseq(input)).toEqual(expected)
})

test('Task List', () => {
  const input = `
    - TODO To Do
    - DOING In Progress
    - DONE Done
  `
  const expected: TreeTextNode[] = [
    { type: 'node', title: 'To Do', expanded: true, checkbox: false },
    { type: 'node', title: 'In Progress', expanded: true, checkbox: 'indeterminate' },
    { type: 'node', title: 'Done', expanded: true, checkbox: true },
  ]
  expect(tryParseLogseq(input)).toEqual(expected)
})

test('Done Task with logbook entry', () => {
  const input = `
- DONE Task
  :LOGBOOK:
  CLOCK: [2025-05-26 Mon 21:31:52]--[2025-05-29 Thu 15:26:42] =>  00:21:59
  :END:
`
  const expected: TreeTextNode[] = [{
    type: 'node',
    title: 'Task',
    expanded: true,
    checkbox: true,
    history: {
      checkbox: [
        [1748525202000, true],
        [1748287912000, 'indeterminate'],
      ],
    },
  }]
  expect(tryParseLogseq(input)).toEqual(expected)
})

test('Open Task with logbook entry', () => {
  const input = `
- TODO Task
  :LOGBOOK:
  CLOCK: [2025-05-26 Mon 21:31:52]--[2025-05-29 Thu 15:04:41] =>  65:32:49
  :END:
`
  const expected: TreeTextNode[] = [{
    type: 'node',
    title: 'Task',
    expanded: true,
    checkbox: false,
    history: {
      checkbox: [
        [1748523881000, false],
        [1748287912000, 'indeterminate'],
      ],
    },
  }]
  expect(tryParseLogseq(input)).toEqual(expected)
})

test('Tolerate lowercase logbook markers', () => {
  const input = `
- TODO Task
  :logbook:
  CLOCK: [2025-05-26 Mon 21:31:52]--[2025-05-29 Thu 15:04:41] =>  65:32:49
  :end:
- Second node`
  const expected: TreeTextNode[] = [{
    type: 'node',
    title: 'Task',
    expanded: true,
    checkbox: false,
    history: {
      checkbox: [
        [1748523881000, false],
        [1748287912000, 'indeterminate'],
      ],
    },
  }, {
    type: 'node',
    title: 'Second node',
    expanded: true,
  }]
  expect(tryParseLogseq(input)).toEqual(expected)
})

test('Task with multiple logbook entries', () => {
  const input = `
- DONE Task
  :LOGBOOK:
  CLOCK: [2025-05-26 Mon 21:31:52]--[2025-05-29 Thu 15:04:41] =>  65:32:49
  CLOCK: [2025-05-29 Thu 15:04:43]--[2025-05-29 Thu 15:26:42] =>  00:21:59
  :END:
`
  const expected: TreeTextNode[] = [{
    type: 'node',
    title: 'Task',
    expanded: true,
    checkbox: true,
    history: {
      checkbox: [
        [1748525202000, true],
        [1748523883000, 'indeterminate'],
        [1748523881000, false],
        [1748287912000, 'indeterminate'],
      ],
    },
  }]
  expect(tryParseLogseq(input)).toEqual(expected)
})

test('Keeps links, inline-formatting, etc.', () => {
  const input = `
- ### Vision
  collapsed:: true
\t- [[🥷 Catana]] is:
\t\t- _The_ manager for your digital life
\t\t- An [Outliner](https://en.wikipedia.org/wiki/Outliner) / Notes App / "Second Brain"
\t\t- A Journal
\t\t- A personal Tasks / Project Management App
\t\t- A File Manager
\t\t- [[Local-First]]
\t- Example Stories / Use Cases
\t\t- Managing instructions / bills / documents etc.
\t\t\t- Scan, insert scan into Today note
\t\t\t- Tag with #document (or other)
\t\t\t- Automatically gets moved to correct spot in file system, reference gets left in Today
`
  const expected: TreeTextNode[] = [{
    type: 'node',
    title: '### Vision',
    expanded: false,
    content: [
      {
        type: 'node',
        title: '[[🥷 Catana]] is:',
        expanded: true,
        content: [
          { type: 'node', title: '_The_ manager for your digital life', expanded: true },
          {
            type: 'node',
            title: 'An [Outliner](https://en.wikipedia.org/wiki/Outliner) / Notes App / "Second Brain"',
            expanded: true,
          },
          { type: 'node', title: 'A Journal', expanded: true },
          { type: 'node', title: 'A personal Tasks / Project Management App', expanded: true },
          { type: 'node', title: 'A File Manager', expanded: true },
          { type: 'node', title: '[[Local-First]]', expanded: true },
        ],
      },
      {
        type: 'node',
        title: 'Example Stories / Use Cases',
        expanded: true,
        content: [
          {
            type: 'node',
            title: 'Managing instructions / bills / documents etc.',
            expanded: true,
            content: [
              { type: 'node', title: 'Scan, insert scan into Today note', expanded: true },
              { type: 'node', title: 'Tag with #document (or other)', expanded: true },
              {
                type: 'node',
                title: 'Automatically gets moved to correct spot in file system, reference gets left in Today',
                expanded: true,
              },
            ],
          },
        ],
      },
    ],
  }]
  expect(tryParseLogseq(input)).toEqual(expected)
})
