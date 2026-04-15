import type { JSONContent } from '@tiptap/core'
import {
  getLayoutDocumentView,
  type PreviewPage,
} from './layout-types'

export type PaginatedLayoutDocument = {
  pages: PreviewPage[]
  rootGap: number
  usesRootStack: boolean
}

export function paginateDocument(
  documentJson: JSONContent,
): PaginatedLayoutDocument {
  const { gap, nodes, usesRootStack } = getLayoutDocumentView(documentJson)
  const pages: PreviewPage[] = [{ index: 1, nodes: [] }]

  for (const node of nodes) {
    if (node.type === 'layoutBreak') {
      if (pages[pages.length - 1].nodes.length > 0) {
        pages.push({ index: pages.length + 1, nodes: [] })
      }
      continue
    }

    pages[pages.length - 1].nodes.push(node)
  }

  return {
    pages,
    rootGap: gap,
    usesRootStack,
  }
}
