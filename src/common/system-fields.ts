import {id} from '@/common/nodeGraphModel'
import {DocTree} from '@/common/node-tree'

export const systemFields: DocTree = {
  id: id('sys.fields'),
  type: 'node',
  title: 'System Fields',
  content: [
    {
      id: id('sys.checkbox'),
      type: 'field',
      title: 'Checkbox',
    },
    {
      id: id('sys.color'),
      type: 'field',
      title: 'Color',
    },
    {
      id: id('sys.icon'),
      type: 'field',
      title: 'Icon',
    },
    {
      id: id('sys.checkbox.unchecked'),
      type: 'node',
      title: 'Unchecked',
    },
    {
      id: id('sys.checkbox.checked'),
      type: 'node',
      title: 'Checked',
    },
  ],
}
