import {Id} from '@/common/nodeGraphModel'
import {DocTree, NodeLink} from '@/common/node-tree'
import {systemFields} from '@/common/system-fields'

export const ROOT_NODE = '_root' as Id<'node'>

export const demoGraph: Exclude<DocTree, NodeLink> = {
  type: 'node',
  id: ROOT_NODE,
  title: '👋 Welcome to Catana!',
  expanded: true,
  content: [{
    title: 'Catana is a (still very much WIP) notetaking software that aims to let you keep control of your data like Obsidian or Logseq, but using a data model that\'s closer to Tana.',
    type: 'node',
    id: '1',
  }, {
    title: '💠 Nodes',
    type: 'node',
    expanded: true,
    content: [{
      title: 'Everything in Catana is a Node. Think of them like bullet points, but with superpowers.',
      type: 'node',
      id: '2',
      expanded: true,
      content: [],
    }, {
      title: '↔️ Node Indentation',
      type: 'node',
      id: '2-1',
      expanded: true,
      content: [{
        title: '👈 Every Node that has others indented under it has a little arrow instead of a bullet. Click it to open this node!',
        type: 'node',
        content: [{
          title: 'Easy, right?',
          type: 'node',
          id: '2-1-1',
        }, {
          title: 'You can nest Nodes as deeply as you want. Try nesting this one under the one above by pressing Tab!',
          type: 'node',
          id: '2-1-2',
        }, {
          title: 'Nodes remember if they are expanded or collapsed. That\'s how some of the nodes on this page started expanded while others didn\'t.',
          type: 'node',
        }, {
          title: 'Nodes can also be expanded or collapsed using the Keyboard. Focus on this Node, then press Ctrl + Arrow Down to expand it!',
          type: 'node',
          id: '2-1-3',
          content: [{
            title: 'Nice! In the same way, you can collapse an expanded node by pressing Ctrl + Arrow Up. You can find even more keyboard shortcuts at the bottom of this page!',
            type: 'node',
          }],
        }],
      }],
    }, {
      title: '🔗 Node Linking',
      type: 'node',
      id: '2-2',
      content: [{
        title: 'Nodes can be linked in multiple places. Here\'s a link to the previous node explaining indentation:',
        type: 'node',
      }, {
        type: 'nodeLink',
        nodeId: '2-1',
      }, {
        title: 'Node Links can be identified by the dashed circle around their bullet point or arrow. If you edit a linked node, it will automatically update everywhere it is linked. Try editing the linked node above and see it change live in the other location as well!',
        type: 'node',
        id: '2-2-2',
      }],
    }, {
      title: 'Checkboxes',
      type: 'node',
      checkbox: {
        type: 'intrinsic',
        state: 'unchecked',
      },
      content: [
        {
          title: 'Press Ctrl + Enter to add a checkbox to a node. Pressing it again will check it, and a third time will remove it again.',
          type: 'node',
        },
        {
          title: 'You can also use the markdown syntax `[] ` at the start of a node to add a checkbox!',
          type: 'node',
        },
      ],
    }, {
      title: '🔣 Node Properties',
      type: 'node',
      expanded: false,
      content: [
        {
          type: 'property',
          fieldId: 'sys.checkbox',
          content: [
            // TODO move this into the field definitions and link to it instead
            {
              type: 'node',
              title: 'Unchecked',
            },
          ],
        },
        {
          type: 'property',
          fieldId: 'sys.color',
          content: [
            {
              type: 'node',
              title: '#abcdef',
            },
          ],
        },
        {
          type: 'property',
          fieldId: 'sys.icon',
          content: [
            {
              type: 'node',
              title: '🔣',
            },
          ],
        },
        {
          title: 'Nodes can store additional data about them in Properties.',
          type: 'node',
        },
      ],
    }],
  }, {
    type: 'node',
    title: '⌨️ Keyboard Shortcuts',
    expanded: true,
    content: [{
      type: 'node',
      title: 'Catana has been built to be used efficiently with the keyboard. Below are some of the supported keyboard shortcuts to try!',
    }, {
      type: 'node',
      title: 'Indent / Outdent Node: Tab / Shift + Tab',
    }, {
      type: 'node',
      title: 'Collapse/Expand Node: Ctrl + Arrow Up/Down',
    }, {
      type: 'node',
      title: 'Cycle Checkbox State: Ctrl + Enter',
    }, {
      type: 'node',
      title: 'Move the focused Node up/down within its parent Node: Alt + Shift + Arrow Up/Down',
    }],
  }, systemFields],
}
