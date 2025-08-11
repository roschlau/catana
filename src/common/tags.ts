import {Brand} from '@ark/util/'

export interface Tag {
  id: Brand<string, 'tag'>,
  name: string,
  hue: number,
}

export interface TagColors {
  tagBackground: string,
  tagForeground: string,
}

export function tagColors(hue: number, theme: string | undefined): TagColors {
  return {
    tagBackground: theme === 'dark' ? `oklch(0.30 0.10 ${hue})` : `oklch(0.96 0.06 ${hue})`,
    tagForeground: theme === 'dark' ? `oklch(0.8 0.16 ${hue})` : `oklch(0.30 0.20 ${hue})`,
  }
}
