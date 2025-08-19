import {useAppSelector} from '@/renderer/redux/hooks'

import {PageTitle} from '@/renderer/components/ui/page-title'
import {Tag} from '@/common/tags'
import {ObjectDebugInfo} from '@/renderer/components/object-debug-info'
import {TagBadge} from '@/renderer/components/ui/tag-badge'
import {selectDebugMode} from '@/renderer/features/ui/uiSlice'
import {TextNode} from '@/common/nodes'

export function TagPage({ tagId }: {
  tagId: Tag['id'],
}) {
  const tag = useAppSelector(state => state.undoable.present.tags[tagId])
  const taggedNodes = useAppSelector(state => Object.values(state.undoable.present.nodes)
    .filter((node): node is TextNode => node?.type === 'node' && !!node.tags?.includes(tagId)))
  const debugMode = useAppSelector(selectDebugMode)

  if (!tag) {
    return (
      <div className={'text-muted-foreground grow flex flex-col items-center p-5'}>
        <i>Tag "{tagId}" could not be found. It might have been deleted.</i>
      </div>
    )
  }

  return (
    <div className={'overflow-auto scrollbar-stable flex flex-col items-center grow p-4 gap-8 bg-background rounded-lg'}>
      <div className={'flex flex-col gap-4 w-full max-w-[800px]'}>
        <PageTitle>
          <TagBadge hue={tag.hue}>{tag.name}</TagBadge>
        </PageTitle>
        {debugMode && <ObjectDebugInfo object={tag}/>}
        <div>
          {taggedNodes.map(node => (
            <div>
              {node.title}
            </div>
          ))}
        </div>
        {/*<EditorBlockList*/}
        {/*  nodes={taggedNodes.filter(isPresent).map(it => ({ nodeId: it.id, expanded: false, }))}*/}
        {/*  parentView={nodeView}*/}
        {/*  moveFocusBefore={focusEnd}*/}
        {/*/>*/}
      </div>
    </div>)
}
