import {insertDemoContentCommand} from '@/common/demoGraph'
import {openWorkspaceCommand} from '@/renderer/features/workspace/open-workspace'
import {saveWorkspaceCommand} from '@/renderer/features/workspace/save-workspace'
import {importFromTanaCommand} from '@/renderer/features/import/tana-import'
import {AppCommand} from '@/renderer/commands/app-command'
import {cycleCheckboxStateCommand} from '@/common/checkboxes'
import {backCommand, forwardCommand, zoomInCommand} from '@/renderer/features/navigation/zoom-in-command'
import {deleteNodeCommand} from '@/renderer/features/node-graph/delete-node-tree'
import {indentCommand, outdentCommand} from '@/renderer/features/node-graph/indent-outdent'
import {redoCommand, undoCommand} from '@/renderer/commands/undo-redo'

export const commands: AppCommand[] = [
  zoomInCommand,
  cycleCheckboxStateCommand,
  deleteNodeCommand,
  indentCommand,
  outdentCommand,
  insertDemoContentCommand,
  openWorkspaceCommand,
  saveWorkspaceCommand,
  importFromTanaCommand,
  undoCommand,
  redoCommand,
  backCommand,
  forwardCommand,
]
