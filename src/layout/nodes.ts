import { normalizeLayoutDirectiveAttributes } from './attributes'
import type {
  LayoutDirectiveAttributesMap,
  LayoutDirectiveName,
  RawAttributes,
} from './schema'
import { isLayoutDirectiveName } from './schema'
import { serializeDirectiveAttributes } from './attributes'

export type MarkdownNode = {
  attributes?: Record<string, string | null | undefined> | null
  children?: MarkdownNode[]
  data?: Record<string, unknown>
  name?: string | null
  type: string
  value?: string
  [key: string]: unknown
}

export type MarkdownRoot = MarkdownNode & {
  children: MarkdownNode[]
  type: 'root'
}

export type DirectiveNodeType =
  | 'containerDirective'
  | 'leafDirective'
  | 'textDirective'

export type DirectiveNode = MarkdownNode & {
  attributes?: Record<string, string | null | undefined> | null
  name: string
  type: DirectiveNodeType
}

export type LayoutDirectiveKind = 'container' | 'leaf'

export type LayoutDirectiveData<T extends LayoutDirectiveName = LayoutDirectiveName> = {
  attributes: LayoutDirectiveAttributesMap[T]
  kind: LayoutDirectiveKind
  name: T
}

export type LayoutDirectiveNode<T extends LayoutDirectiveName = LayoutDirectiveName> =
  DirectiveNode & {
    data?: Record<string, unknown> & {
      layoutDirective?: LayoutDirectiveData<T>
    }
    name: T
    type: 'containerDirective' | 'leafDirective'
  }

export function isDirectiveNode(
  node: MarkdownNode | null | undefined,
): node is DirectiveNode {
  return Boolean(
    node
    && typeof node.name === 'string'
    && (
      node.type === 'containerDirective'
      || node.type === 'leafDirective'
      || node.type === 'textDirective'
    ),
  )
}

export function isLayoutDirectiveNode(
  node: MarkdownNode | null | undefined,
): node is LayoutDirectiveNode {
  return isDirectiveNode(node) && isLayoutDirectiveName(node.name)
}

export function getLayoutDirectiveData(
  node: MarkdownNode | null | undefined,
): LayoutDirectiveData | null {
  if (!isLayoutDirectiveNode(node)) {
    return null
  }

  const layoutDirective = node.data?.layoutDirective

  if (!layoutDirective || typeof layoutDirective !== 'object') {
    return null
  }

  return layoutDirective as LayoutDirectiveData
}

export function createLayoutDirectiveNode<T extends LayoutDirectiveName>(
  directive: T,
  rawAttributes?: Partial<LayoutDirectiveAttributesMap[T]> | RawAttributes,
  children?: MarkdownNode[],
): LayoutDirectiveNode<T> {
  const attributes = normalizeLayoutDirectiveAttributes(directive, rawAttributes)
  const serializedAttributes = serializeDirectiveAttributes(
    directive,
    attributes as Record<string, unknown>,
  )
  const kind: LayoutDirectiveKind =
    directive === 'break' ? 'leaf' : 'container'
  const data: LayoutDirectiveNode<T>['data'] = {
    layoutDirective: {
      attributes,
      kind,
      name: directive,
    },
  }

  if (directive === 'break') {
    return {
      ...(serializedAttributes ? { attributes: serializedAttributes } : {}),
      data,
      name: directive,
      type: 'leafDirective',
    }
  }

  return {
    ...(serializedAttributes ? { attributes: serializedAttributes } : {}),
    children: children ?? [],
    data,
    name: directive,
    type: 'containerDirective',
  }
}
