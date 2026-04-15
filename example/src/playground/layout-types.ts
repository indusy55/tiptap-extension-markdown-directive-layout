import type { JSONContent } from '@tiptap/core'

export type RichTextNode = {
  marks?: Array<{
    attrs?: Record<string, unknown>
    type?: string
  }>
  text?: string
  type?: string
  content?: RichTextNode[]
}

export type LayoutNode = {
  attrs?: Record<string, unknown>
  content?: LayoutNode[]
  type?: string
  text?: string
}

export type PreviewPage = {
  index: number
  nodes: LayoutNode[]
}

export type LayoutDocumentView = {
  gap: number
  nodes: LayoutNode[]
  usesRootStack: boolean
}

export function getLayoutDocumentView(
  documentJson: JSONContent,
): LayoutDocumentView {
  const root = documentJson.content?.[0] as LayoutNode | undefined

  if (root?.type === 'layoutStack') {
    return {
      gap: Number(root.attrs?.gap ?? 0) * 8,
      nodes: root.content ?? [],
      usesRootStack: true,
    }
  }

  return {
    gap: 16,
    nodes: (documentJson.content ?? []) as LayoutNode[],
    usesRootStack: false,
  }
}
