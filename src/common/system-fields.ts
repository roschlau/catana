import {DocTree} from '@/common/doc-tree'

export const systemFields: DocTree = {
  id: 'sys.fields',
  type: 'node',
  title: 'System Fields',
  content: [
    {
      id: 'sys.checkbox',
      type: 'field',
      title: 'Checkbox',
    },
    {
      id: 'sys.color',
      type: 'field',
      title: 'Color',
    },
    {
      id: 'sys.icon',
      type: 'field',
      title: 'Icon',
    },
    {
      id: 'sys.checkbox.unchecked',
      type: 'node',
      title: 'Unchecked',
    },
    {
      id: 'sys.checkbox.checked',
      type: 'node',
      title: 'Checked',
    },
  ],
}
