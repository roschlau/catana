import fs from 'node:fs/promises'

/**
 * Attempts to read the file at `filePath`. If the file doesn't exist, it will be created with the content returned by
 * calling `defaultContent`, and that content is returned.
 */
export async function readOrCreateFile(
  filePath: string,
  defaultContent: () => string,
  encoding: BufferEncoding = 'utf8'
): Promise<string> {
  try {
    return await fs.readFile(filePath, { encoding });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const content = defaultContent();
      await fs.writeFile(filePath, content, { encoding });
      return content;
    }
    throw err
  }
}
