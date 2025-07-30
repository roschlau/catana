import {TreeTextNode} from '@/common/node-tree'
import {CheckboxState} from '@/common/checkboxes'

// Constants for task states
const TASK_TODO = 'TODO '
const TASK_DOING = 'DOING '
const TASK_DONE = 'DONE '

// Constants for property identifiers
const PROPERTY_ID = 'id::'
const PROPERTY_COLLAPSED = 'collapsed::'
const PROPERTY_LOGBOOK_START = ':LOGBOOK:'
const PROPERTY_LOGBOOK_END = ':END:'

// Constants for regex patterns
const BULLET_POINT_PATTERN = /^(\s*)-\s+(.*)/
const CLOCK_ENTRY_PATTERN = /CLOCK: \[(.*?)]--\[(.*?)]/
const LOGSEQ_DATE_PATTERN = /(\d{4}-\d{2}-\d{2}) \w+ (\d{2}:\d{2}:\d{2})/

// Type definitions
type NodeStackItem = { node: TreeTextNode, level: number }
type LogbookEntry = { start: number, end: number }

/**
 * Attempts to parse a string in Logseq format into a tree of nodes.
 *
 * @param str The string to parse
 * @returns An array of TreeTextNode objects or undefined if parsing fails
 */
export function tryParseLogseq(str: string): TreeTextNode[] | undefined {
  if (!str.trim()) {
    return undefined
  }

  try {
    const lines = str.split('\n')
    const rootNodes: TreeTextNode[] = []
    const nodeStack: NodeStackItem[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Skip empty lines
      if (!line.trim()) {
        continue
      }

      // Parse the node from the current line
      const nodeInfo = parseNodeFromLine(line)
      if (!nodeInfo) {
        continue // Skip lines that don't start with a bullet point
      }

      const { indentation, node: newNode } = nodeInfo

      // Process properties and advance the line index
      const nextLineIndex = processNodeProperties(lines, i + 1, indentation, newNode)

      // Skip the lines we've already processed
      i = nextLineIndex - 1

      // Add the node to the tree structure
      addNodeToTree(rootNodes, nodeStack, newNode, indentation)
    }

    return rootNodes
  } catch (error) {
    console.error('Error parsing Logseq format:', error)
    return undefined
  }
}

/**
 * Parses a single line into a node with its indentation level.
 *
 * @param line The line to parse
 * @returns An object containing the node and its indentation level, or undefined if the line is not a valid node
 */
function parseNodeFromLine(line: string): { indentation: number, node: TreeTextNode } | undefined {
  const match = line.match(BULLET_POINT_PATTERN)
  if (!match) {
    return undefined
  }

  const indentation = match[1].length
  const content = match[2].trim()

  // Create a new node with default values
  const newNode: TreeTextNode = {
    type: 'node',
    title: content,
    expanded: true
  }

  // Process task state if present
  processTaskState(newNode)

  // Process heading nodes (starting with #)
  const headingMatch = newNode.title.match(/^(#{1,6})\s+(.+)$/)
  if (headingMatch) {
    // Extract the text after the hashtags and make it bold
    newNode.title = `**${headingMatch[2]}**`
  }

  return { indentation, node: newNode }
}

/**
 * Processes task state markers (TODO, DOING, DONE) in the node title.
 * Modifies the node in place.
 *
 * @param node The node to process
 */
function processTaskState(node: TreeTextNode): void {
  const title = node.title

  if (title.startsWith(TASK_TODO)) {
    node.checkbox = false
    node.title = title.substring(TASK_TODO.length).trim()
  } else if (title.startsWith(TASK_DOING)) {
    node.checkbox = 'indeterminate'
    node.title = title.substring(TASK_DOING.length).trim()
  } else if (title.startsWith(TASK_DONE)) {
    node.checkbox = true
    node.title = title.substring(TASK_DONE.length).trim()
  }
}

/**
 * Processes node properties (id, collapsed, logbook) from subsequent lines.
 *
 * @param lines All lines in the document
 * @param startIndex The index to start processing from
 * @param parentIndentation The indentation level of the parent node
 * @param node The node to add properties to
 * @returns The index of the next line to process
 */
function processNodeProperties(
  lines: string[],
  startIndex: number,
  parentIndentation: number,
  node: TreeTextNode
): number {
  let currentIndex = startIndex

  while (currentIndex < lines.length) {
    const currentLine = lines[currentIndex].trim()

    // Check if the next line is a new bullet point at the same or lower indentation level
    const bulletMatch = lines[currentIndex].match(BULLET_POINT_PATTERN)
    if (bulletMatch && bulletMatch[1].length <= parentIndentation) {
      break
    }

    // Process different property types
    if (currentLine.startsWith(PROPERTY_ID)) {
      node.id = currentLine.substring(PROPERTY_ID.length).trim()
      currentIndex++
    } else if (currentLine.startsWith(PROPERTY_COLLAPSED)) {
      const collapsedValue = currentLine.substring(PROPERTY_COLLAPSED.length).trim()
      node.expanded = collapsedValue !== 'true'
      currentIndex++
    } else if (currentLine.toLowerCase() === PROPERTY_LOGBOOK_START.toLowerCase()) {
      currentIndex = processLogbook(lines, currentIndex + 1, node)
    } else {
      // Not a recognized property, check if it's a new bullet point
      if (currentLine.startsWith('-')) {
        break
      }
      // Otherwise, it's probably part of the current node's content, skip it
      currentIndex++
    }
  }

  return currentIndex
}

/**
 * Processes logbook entries and adds them to the node's history.
 *
 * @param lines All lines in the document
 * @param startIndex The index to start processing from
 * @param node The node to add history to
 * @returns The index of the next line to process
 */
function processLogbook(lines: string[], startIndex: number, node: TreeTextNode): number {
  let currentIndex = startIndex
  const logbookEntries: LogbookEntry[] = []

  // Collect all logbook entries
  while (currentIndex < lines.length && !lines[currentIndex].trim().toLowerCase().startsWith(PROPERTY_LOGBOOK_END.toLowerCase())) {
    const logLine = lines[currentIndex].trim()
    const clockEntry = parseClockEntry(logLine)

    if (clockEntry) {
      logbookEntries.push(clockEntry)
    }

    currentIndex++
  }

  // Skip the :END: line
  if (currentIndex < lines.length && lines[currentIndex].trim().toLowerCase() === PROPERTY_LOGBOOK_END.toLowerCase()) {
    currentIndex++
  }

  // Process the collected logbook entries
  if (logbookEntries.length > 0) {
    addLogbookEntriesToNodeHistory(node, logbookEntries)
  }

  return currentIndex
}

/**
 * Parses a clock entry line into start and end timestamps.
 *
 * @param line The line containing a clock entry
 * @returns An object with start and end timestamps, or undefined if parsing fails
 */
function parseClockEntry(line: string): LogbookEntry | undefined {
  const clockMatch = line.match(CLOCK_ENTRY_PATTERN)
  if (!clockMatch) {
    return undefined
  }

  const [, startTimeStr, endTimeStr] = clockMatch

  try {
    const startTime = parseLogseqDate(startTimeStr)
    const endTime = parseLogseqDate(endTimeStr)

    if (!isNaN(startTime) && !isNaN(endTime)) {
      return { start: startTime, end: endTime }
    }
  } catch (e) {
    console.error('Error parsing logbook timestamps:', e)
  }

  return undefined
}

/**
 * Parses a Logseq date string into a timestamp.
 *
 * @param dateStr The date string in Logseq format (e.g., "2025-05-26 Mon 21:31:52")
 * @returns A timestamp (milliseconds since epoch) or NaN if parsing fails
 */
function parseLogseqDate(dateStr: string): number {
  const match = dateStr.match(LOGSEQ_DATE_PATTERN)
  if (match) {
    const [, datePart, timePart] = match
    return new Date(`${datePart}T${timePart}`).getTime()
  }
  return NaN
}

/**
 * Adds logbook entries to a node's history.
 *
 * @param node The node to add history to
 * @param logbookEntries The logbook entries to process
 */
function addLogbookEntriesToNodeHistory(node: TreeTextNode, logbookEntries: LogbookEntry[]): void {
  if (!node.history) {
    node.history = {}
  }
  if (!node.history.checkbox) {
    node.history.checkbox = []
  }

  // Sort logbook entries chronologically (oldest first)
  logbookEntries.sort((a, b) => a.start - b.start)

  // Process each entry and build the history
  const history: [number, CheckboxState | null][] = []

  for (let i = 0; i < logbookEntries.length; i++) {
    const entry = logbookEntries[i]

    // If this isn't the first entry, switch the previous entry to 'TODO'
    if (i > 0) {
      const prevEntry = logbookEntries[i - 1]
      history.push([prevEntry.end, false]) // End of previous entry -> TODO
    }

    // Add the DOING state at the start of this entry
    history.push([entry.start, 'indeterminate']) // Start of entry -> DOING

    // If this is the last entry, add the current checkbox state at the end
    if (i === logbookEntries.length - 1) {
      history.push([entry.end, node.checkbox ?? null]) // End of last entry -> current state
    }
  }

  // Reverse the history to get reverse chronological order (newest first)
  node.history.checkbox = history.reverse()
}

/**
 * Adds a node to the tree structure based on indentation level.
 *
 * @param rootNodes The array of root nodes
 * @param nodeStack The stack of parent nodes
 * @param newNode The node to add
 * @param indentation The indentation level of the new node
 */
function addNodeToTree(
  rootNodes: TreeTextNode[],
  nodeStack: NodeStackItem[],
  newNode: TreeTextNode,
  indentation: number
): void {
  // Find the parent node based on indentation level
  while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= indentation) {
    nodeStack.pop()
  }

  if (nodeStack.length === 0) {
    // This is a root node
    rootNodes.push(newNode)
  } else {
    // Add as a child to the parent node
    const parentNode = nodeStack[nodeStack.length - 1].node
    if (!parentNode.content) {
      parentNode.content = []
    }
    parentNode.content.push(newNode)
  }

  // Add this node to the stack
  nodeStack.push({ node: newNode, level: indentation })
}
