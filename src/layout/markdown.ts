import type { JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { MarkdownManager } from '@tiptap/markdown'
import { getLayoutExtensions } from './extensions'

let layoutMarkdownManager: MarkdownManager | null = null

function getLayoutMarkdownManager(): MarkdownManager {
  if (layoutMarkdownManager) {
    return layoutMarkdownManager
  }

  layoutMarkdownManager = new MarkdownManager({
    extensions: [StarterKit, ...getLayoutExtensions()],
  })

  return layoutMarkdownManager
}

export function parseLayoutDocument(markdown: string): JSONContent {
  return getLayoutMarkdownManager().parse(markdown)
}

export function serializeLayoutDocument(content: JSONContent): string {
  return getLayoutMarkdownManager().serialize(content).trimEnd()
}
