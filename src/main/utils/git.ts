import path from 'node:path'
import fscb from 'node:fs'
import fs from 'node:fs/promises'
import * as git from 'isomorphic-git'
import {workspaceFileName} from '../persistence/storage-api'

let gitStatus: null | 'initialized' | 'could-not-initialize' = null

// Default identity used for commits if user hasn't configured anything
const defaultIdentity = {
  name: 'Catana',
  email: 'catana@local'
}

/**
 * Initializes a git repository in the workspace directory if it is not already initialized.
 * This function assumes that the workspace file has already been created and will attempt to commit it,
 * so when calling it for a fresh workspace, make sure the default workspace file has been created already.
 */
export async function gitInitializeWorkspace(workspaceDir: string): Promise<void> {
  try {
    const gitInitialized = await isGitInitialized(workspaceDir)
    if (!gitInitialized) {
      console.log('Initializing git repository in workspace directory')
      await initializeGit(workspaceDir)
    }
    gitStatus = 'initialized'
  } catch (error) {
    console.warn('Failed to initialize git repository:', error)
    console.warn('Will continue without git', error)
    gitStatus = 'could-not-initialize'
    // Continue without git if initialization fails
  }
}

/**
 * Checks if git is already initialized in workspace directory
 */
async function isGitInitialized(workspaceDir: string): Promise<boolean> {
  // Treat repo as initialized if .git exists
  const gitDirPath = path.join(workspaceDir, '.git')
  const stat = await fs.stat(gitDirPath).catch(() => null)
  return !!stat && stat.isDirectory()
}

/**
 * Initializes a git repository in the specified directory
 */
async function initializeGit(workspaceDir: string): Promise<void> {
  try {
    await git.init({fs: fscb, dir: workspaceDir})
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Failed to initialize git repository: ${msg}`)
  }

  // Add .gitignore to ignore common files that shouldn't be tracked
  const gitignoreContent = `
# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`

  const gitignorePath = path.join(workspaceDir, '.gitignore')
  await fs.writeFile(gitignorePath, gitignoreContent.trim(), 'utf8')

  await git.add({fs: fscb, dir: workspaceDir, filepath: '.gitignore'})
  await git.add({fs: fscb, dir: workspaceDir, filepath: workspaceFileName})
  await git.commit({
    fs: fscb,
    dir: workspaceDir,
    message: 'Initial commit',
    author: defaultIdentity,
    committer: defaultIdentity,
  })
}

/**
 * Commits changes to the workspace file
 */
export async function gitCommitWorkspace(workspaceDir: string): Promise<void> {
  if (gitStatus !== 'initialized') {
    console.warn('Git is not initialized, skipping commit')
    return
  }

  // Stage workspace file
  await git.add({fs: fscb, dir: workspaceDir, filepath: workspaceFileName})

  // Check if there are any changes to commit
  const status = await git.status({fs: fscb, dir: workspaceDir, filepath: workspaceFileName})
  if (status === 'unmodified') {
    console.log('No changes to commit for workspace file')
    return
  }

  await git.commit({
    fs: fscb,
    dir: workspaceDir,
    message: `Workspace saved - ${new Date().toISOString()}`,
    author: defaultIdentity,
    committer: defaultIdentity,
  })

  console.log('Successfully committed workspace changes')
}
