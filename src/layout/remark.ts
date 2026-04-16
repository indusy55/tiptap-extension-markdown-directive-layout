import { visit } from 'unist-util-visit'
import {
  normalizeLayoutDirectiveAttributes,
  serializeDirectiveAttributes,
} from './attributes'
import type {
  DirectiveNode,
  LayoutDirectiveData,
  LayoutDirectiveNode,
  MarkdownRoot,
  MarkdownNode,
} from './nodes'
import { isDirectiveNode, isLayoutDirectiveNode } from './nodes'
import {
  isContainerLayoutDirectiveName,
  isLayoutDirectiveName,
  type LayoutDirectiveName,
} from './schema'

function getLayoutDirectiveKind(
  directive: LayoutDirectiveName,
): LayoutDirectiveData['kind'] {
  return directive === 'break' ? 'leaf' : 'container'
}

function assertSupportedDirective(
  node: DirectiveNode,
): asserts node is DirectiveNode & { name: LayoutDirectiveName } {
  if (isLayoutDirectiveName(node.name)) {
    return
  }

  throw new Error(`Unsupported directive "${node.name}".`)
}

function assertDirectiveShape(node: DirectiveNode): asserts node is LayoutDirectiveNode {
  assertSupportedDirective(node)

  const expectedKind = getLayoutDirectiveKind(node.name)

  if (node.type === 'textDirective') {
    throw new Error(
      `Layout directive "${node.name}" must be used as a block directive.`,
    )
  }

  if (expectedKind === 'leaf' && node.type !== 'leafDirective') {
    throw new Error(
      `Layout directive "${node.name}" must use leaf syntax.`,
    )
  }

  if (expectedKind === 'container' && node.type !== 'containerDirective') {
    throw new Error(
      `Layout directive "${node.name}" must use container syntax.`,
    )
  }
}

export function normalizeLayoutDirectiveNode(
  node: DirectiveNode,
): LayoutDirectiveNode | null {
  assertDirectiveShape(node)

  const attributes = normalizeLayoutDirectiveAttributes(
    node.name,
    node.attributes as Record<string, unknown> | null | undefined,
  )
  const serializedAttributes = serializeDirectiveAttributes(
    node.name,
    attributes as Record<string, unknown>,
  )

  if (serializedAttributes) {
    node.attributes = serializedAttributes
  } else {
    delete node.attributes
  }

  node.data = {
    ...node.data,
    layoutDirective: {
      attributes,
      kind: getLayoutDirectiveKind(node.name),
      name: node.name,
    },
  }

  return node as LayoutDirectiveNode
}

export function remarkLayoutDirectives() {
  return (tree: unknown) => {
    visit(tree as MarkdownRoot, node => {
      if (!isDirectiveNode(node)) {
        return
      }

      normalizeLayoutDirectiveNode(node)
    })
  }
}

const EMPTY_LINE_HTML_VALUES = new Set([
  '<br />',
  '<br>',
  '<br/>',
  '<br >',
])

function isEmptyLineHtmlNode(node: MarkdownNode): boolean {
  return (
    node.type === 'html'
    && typeof node.value === 'string'
    && EMPTY_LINE_HTML_VALUES.has(node.value.trim())
  )
}

export function remarkLayoutDirectiveEmptyLines() {
  return (tree: unknown) => {
    visit(tree as MarkdownRoot, node => {
      if (
        !isLayoutDirectiveNode(node)
        || !isContainerLayoutDirectiveName(node.name)
        || !node.children
      ) {
        return
      }

      node.children = node.children.map(child => {
        if (!isEmptyLineHtmlNode(child)) {
          return child
        }

        return {
          children: [],
          type: 'paragraph',
        }
      })
    })
  }
}
