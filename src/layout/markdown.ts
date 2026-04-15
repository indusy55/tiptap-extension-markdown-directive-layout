import type { AnyExtension, JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { MarkdownManager } from '@tiptap/markdown'
import { getLayoutExtensions } from './extensions'

export type LayoutMarkdownManagerOptions = Omit<
  NonNullable<ConstructorParameters<typeof MarkdownManager>[0]>,
  'extensions'
> & {
  extensions?: AnyExtension[]
}

let layoutMarkdownManager: MarkdownManager | null = null

export function getLayoutMarkdownBaseExtensions(): AnyExtension[] {
  return [StarterKit, ...getLayoutExtensions()]
}

export function createLayoutMarkdownManager(
  options: LayoutMarkdownManagerOptions = {},
): MarkdownManager {
  return new MarkdownManager({
    ...options,
    extensions: options.extensions ?? getLayoutMarkdownBaseExtensions(),
  })
}

export function getLayoutMarkdownManager(): MarkdownManager {
  if (layoutMarkdownManager) {
    return layoutMarkdownManager
  }

  layoutMarkdownManager = createLayoutMarkdownManager()

  return layoutMarkdownManager
}

export function parseLayoutDocument(markdown: string): JSONContent {
  return getLayoutMarkdownManager().parse(markdown)
}

export function serializeLayoutDocument(content: JSONContent): string {
  return getLayoutMarkdownManager().serialize(content).trimEnd()
}
