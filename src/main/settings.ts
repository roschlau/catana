import path from 'node:path'
import fs from 'node:fs'
import {app} from 'electron'
import {environment} from '@/main/main'

function getSettingsPath(): string {
  const userData = app.getPath('userData')
  const dirName = environment === 'dev' ? 'settings-dev' : 'settings'
  return path.join(userData, dirName)
}

export type SettingsKey =
  | 'last-workspace-location'
  | 'last-window-position'

export const settings = {
  get(key: SettingsKey): string | null {
    const file = path.join(getSettingsPath(), key)
    if (!fs.existsSync(file)) {
      return null
    }
    return fs.readFileSync(file, 'utf8')
  },
  set(key: SettingsKey, value: string) {
    const file = path.join(getSettingsPath(), key)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, value, 'utf8')
  },
}
