import path from 'node:path'
import fs from 'node:fs'
import {app} from 'electron'

function getSettingsPath(): string {
  const userData = app.getPath('userData')
  return path.join(userData, 'settings')
}

export const settings = {
  get(key: string): string | null {
    const file = path.join(getSettingsPath(), key)
    if (!fs.existsSync(file)) {
      return null
    }
    return fs.readFileSync(file, 'utf8')
  },
  set(key: string, value: string) {
    const file = path.join(getSettingsPath(), key)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, value, 'utf8')
  },
}
