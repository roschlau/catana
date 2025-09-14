import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/renderer/components/ui/command'
import {useState} from 'react'
import {AppCommand, CommandContext} from '@/renderer/commands/app-command'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {focusRestoreRequested, selectCommandFocus, setCommandFocus} from '@/renderer/features/ui/uiSlice'
import {selectNodes} from '@/renderer/features/node-graph/nodes-slice'
import {TextNode} from '@/common/nodes'
import {ChevronRight, DotIcon} from 'lucide-react'
import {commands} from '@/renderer/commands/commands'
import {viewOpened} from '@/renderer/features/navigation/navigation-slice'
import {mdToPlain} from '@/common/markdown-utils'

export function CommandPrompt({ open, onOpenChange }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const dispatch = useAppDispatch()
  const filteredNodes = useAppSelector(state => open && searchQuery !== '' ? selectNodes(state, searchQuery) : emptyArray)
  const currentView = useAppSelector(state => state.undoable.present.navigation.currentView)
  const lastFocus = useAppSelector(selectCommandFocus)
  const context: CommandContext = {
    openedNode: currentView?.type === 'node' ? currentView.nodeId : undefined,
    focus: lastFocus,
  }

  const _onOpenChange = (open: boolean) => {
    if (!open) {
      if (lastFocus) {
        dispatch(focusRestoreRequested({ nodeView: lastFocus.nodeView, selection: lastFocus.selection }))
      }
      dispatch(setCommandFocus(undefined))
    }
    onOpenChange(open)
  }

  const commandSelected = (command: AppCommand) => {
    _onOpenChange(false)
    dispatch(command.thunkCreator(context))
  }

  const nodeSelected = (nodeId: TextNode['id']) => {
    _onOpenChange(false)
    dispatch(viewOpened({ type: 'node', nodeId }))
  }

  const commandElements = commands
    .filter(command => command.canActivate(context))
    .map(command => (
      <CommandItem
        key={command.name}
        onSelect={() => commandSelected(command)}
      >
        {command.icon}
        {command.name}
        {command.shortcut && <CommandShortcut>
          {command.shortcut.map((it, i) => <span key={i}>{it}</span>)}
        </CommandShortcut>}
      </CommandItem>
    ))

  const nodeElements = filteredNodes
    .toSorted((a, b) => b.content.length - a.content.length)
    .slice(0, 10)
    .map(node => (
      <CommandItem
        key={node.id}
        value={mdToPlain(node.title)}
        onSelect={() => nodeSelected(node.id)}
      >
        {node.content.length === 0 ? <DotIcon/> : <ChevronRight/>}
        {mdToPlain(node.title) || <span className={'text-muted-foreground'}>Empty</span>}
      </CommandItem>
    ))

  return <CommandDialog
    open={open}
    onOpenChange={_onOpenChange}
  >
    <CommandInput
      value={searchQuery}
      onInput={(e) => setSearchQuery(e.currentTarget.value)}
      placeholder={'Search for a command or node...'}
    />
    <CommandEmpty>Nothing found.</CommandEmpty>
    <CommandList>
      <CommandGroup heading={'Commands'}>
        {commandElements}
      </CommandGroup>
      <CommandSeparator/>
      {nodeElements.length > 0 && <CommandGroup heading={'Nodes'}>
        {nodeElements}
      </CommandGroup>}
    </CommandList>
  </CommandDialog>
}

const emptyArray = Object.freeze([])
