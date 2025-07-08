import {useAppDispatch} from '@/renderer/redux/hooks'
import React, {useCallback} from 'react'
import {openWorkspace} from '@/renderer/features/workspace/open-workspace'
import {Button} from '@/renderer/components/ui/button'
import {FolderOpenIcon} from 'lucide-react'

import {PageTitle} from '@/renderer/components/ui/page-title'

export function OpenWorkspaceScreen() {
  const dispatch = useAppDispatch()
  const openWorkspaceClicked = useCallback(async () => {
    dispatch(openWorkspace('pick'))
  }, [dispatch])
  return (
    <div className={'grow grid place-content-center'}>
      <div className={'grow max-w-sm flex flex-col gap-2 items-start justify-center cursor-default'}>
        <PageTitle className={'self-center mb-5'}>Welcome to Catana</PageTitle>
        <p>Open a Workspace to get started!</p>
        <p className={'text-sm leading-4 text-muted-foreground text-justify'}>
          A Workspace is a folder on your device that you want Catana to save data into. You can use any folder, even if
          it already contains other files! Catana will include them in your node tree and let you work with them right
          next to your notes.
        </p>
        <Button
          className={'self-center mt-5'}
          onClick={openWorkspaceClicked}
        >
          <FolderOpenIcon/>
          Open Workspace
        </Button>
      </div>
    </div>
  )
}
