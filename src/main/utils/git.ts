import {spawn} from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs/promises'
import {workspaceFileName} from '../persistence/storage-api'

let gitStatus: null | 'initialized' | 'could-not-initialize' = null

/**
 * Executes a git command in the specified directory
 */
async function executeGitCommand(directory: string, args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const gitProcess = spawn('git', args, {
      cwd: directory,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let output = ''
    let error = ''

    gitProcess.stdout.on('data', (data) => {
      output += data.toString()
    })

    gitProcess.stderr.on('data', (data) => {
      error += data.toString()
    })

    gitProcess.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output.trim(),
        error: error.trim()
      })
    })
  })
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
  const result = await executeGitCommand(workspaceDir, ['rev-parse', '--git-dir'])
  return result.success
}

/**
 * Initializes a git repository in the specified directory
 */
async function initializeGit(workspaceDir: string): Promise<void> {
  const result = await executeGitCommand(workspaceDir, ['init'])
  if (!result.success) {
    throw new Error(`Failed to initialize git repository: ${result.error}`)
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

  const addGitIgnoreResult = await executeGitCommand(workspaceDir, ['add', '.gitignore'])
  if (!addGitIgnoreResult.success) {
    throw Error(`Failed to add .gitignore: ${addGitIgnoreResult.error}`)
  }

  const addWorkspaceFileResult = await executeGitCommand(workspaceDir, ['add', workspaceFileName])
  if (!addWorkspaceFileResult.success) {
    throw Error(`Failed to add .gitignore: ${addWorkspaceFileResult.error}`)
  }

  const commitResult = await executeGitCommand(workspaceDir, ['commit', '-m', 'Initial commit'])
  if (!commitResult.success) {
    throw Error(`Failed to create initial commit: ${commitResult.error}`)
  }
}

/**
 * Commits changes to the workspace file
 */
export async function gitCommitWorkspace(workspaceDir: string): Promise<void> {
  if (gitStatus !== 'initialized') {
    console.warn('Git is not initialized, skipping commit')
    return
  }

  // Add the workspace file
  const addResult = await executeGitCommand(workspaceDir, ['add', workspaceFileName])
  if (!addResult.success) {
    throw new Error(`Failed to add ${workspaceFileName} to git: ${addResult.error}`)
  }

  // Check if there are any changes to commit
  const statusResult = await executeGitCommand(workspaceDir, ['status', '--porcelain'])
  if (!statusResult.success) {
    throw new Error(`Failed to check git status: ${statusResult.error}`)
  }

  // If there are no changes, don't commit
  if (!statusResult.output.includes(workspaceFileName)) {
    console.log('No changes to commit for workspace file')
    return
  }

  // Commit the changes
  const commitResult = await executeGitCommand(workspaceDir, [
    'commit',
    '-m',
    `Workspace saved - ${new Date().toISOString()}`
  ])

  if (!commitResult.success) {
    throw new Error(`Failed to commit workspace changes: ${commitResult.error}`)
  }

  console.log('Successfully committed workspace changes')
}
