import {TextNode} from '@/common/nodes'
import {test} from 'vitest'

test('Dummy test because this file fails the tests otherwise', () => {})

/**
 * Node with dummy data for testing, so that tests only need to specify relevant properties for better readability
 */
export const testNode: TextNode = {
  id: 'irrelevant' as TextNode['id'],
  ownerId: 'irrelevant2' as TextNode['id'],
  type: 'node',
  title: 'Irrelevant',
  content: [],
  history: {
    createdTime: 0,
    lastModifiedTime: 0,
  },
}
