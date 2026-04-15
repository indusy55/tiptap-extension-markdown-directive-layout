import type { JSONContent } from '@tiptap/core'
import { normalizeLayoutDirectiveAttributes } from './attributes'
import type {
  LayoutDirectiveAttributesMap,
  LayoutDirectiveName,
  LayoutNodeName,
  RawAttributes,
} from './schema'
import { LAYOUT_NODE_NAMES } from './schema'

export function nodeNameToDirective(nodeName: string): LayoutDirectiveName | null {
  const entry = Object.entries(LAYOUT_NODE_NAMES).find(
    ([, value]) => value === nodeName,
  )

  return entry ? (entry[0] as LayoutDirectiveName) : null
}

export function isLayoutNodeName(nodeName: string): nodeName is LayoutNodeName {
  return nodeNameToDirective(nodeName) !== null
}

export function createLayoutDirectiveNode<T extends LayoutDirectiveName>(
  directive: T,
  rawAttributes?: Partial<LayoutDirectiveAttributesMap[T]> | RawAttributes,
  content?: JSONContent[],
): JSONContent {
  const attrs = normalizeLayoutDirectiveAttributes(directive, rawAttributes)

  if (directive === 'break') {
    return {
      type: LAYOUT_NODE_NAMES[directive],
      attrs,
    }
  }

  return {
    type: LAYOUT_NODE_NAMES[directive],
    attrs,
    content: content ?? [],
  }
}
