import {insertDemoContentCommand} from '@/common/demoGraph'
import {openWorkspaceCommand} from '@/renderer/persistence/open-workspace'
import {saveWorkspaceCommand} from '@/renderer/persistence/save-workspace'
import {importFromTanaCommand} from '@/renderer/persistence/tana-import'
import {AppCommand} from '@/renderer/commands/app-command'
import {cycleCheckboxStateCommand} from '@/common/checkboxes'
import {backCommand, forwardCommand, zoomInCommand} from '@/renderer/features/navigation/zoom-in-command'

export const commands: AppCommand[] = [
  zoomInCommand,
  insertDemoContentCommand,
  openWorkspaceCommand,
  saveWorkspaceCommand,
  importFromTanaCommand,
  cycleCheckboxStateCommand,
  backCommand,
  forwardCommand,
]
