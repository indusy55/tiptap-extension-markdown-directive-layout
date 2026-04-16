import type { DirectiveNode, MarkdownNode } from '../../../src'

export type DirectiveLabel = MarkdownNode[] | null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isMarkdownNode(value: unknown): value is MarkdownNode {
  return isRecord(value) && typeof value.type === 'string'
}

export function normalizeDirectiveLabel(value: unknown): DirectiveLabel {
  if (!Array.isArray(value)) {
    return null
  }

  const label = value.filter(isMarkdownNode)

  return label.length > 0 ? label : null
}

export function extractDirectiveLabel(node: DirectiveNode): DirectiveLabel {
  if (node.type === 'containerDirective') {
    const [firstChild] = node.children ?? []

    if (
      firstChild?.type === 'paragraph'
      && firstChild.data?.directiveLabel === true
      && Array.isArray(firstChild.children)
    ) {
      return normalizeDirectiveLabel(firstChild.children)
    }

    return null
  }

  return normalizeDirectiveLabel(node.children)
}

export function stripContainerDirectiveLabel(
  node: DirectiveNode,
): MarkdownNode[] {
  if (node.type !== 'containerDirective') {
    return node.children ?? []
  }

  const [firstChild, ...restChildren] = node.children ?? []

  if (
    firstChild?.type === 'paragraph'
    && firstChild.data?.directiveLabel === true
  ) {
    return restChildren
  }

  return node.children ?? []
}

export function createContainerDirectiveChildren(options: {
  content: MarkdownNode[]
  label: DirectiveLabel
}): MarkdownNode[] {
  const { content, label } = options

  if (!label || label.length === 0) {
    return content
  }

  return [
    {
      type: 'paragraph',
      data: { directiveLabel: true },
      children: label,
    },
    ...content,
  ]
}

export function serializeDirectiveLabel(label: DirectiveLabel): string | null {
  if (!label || label.length === 0) {
    return null
  }

  return JSON.stringify(label)
}

export function deserializeDirectiveLabel(value: string | null): DirectiveLabel {
  if (!value) {
    return null
  }

  try {
    return normalizeDirectiveLabel(JSON.parse(value))
  } catch {
    return null
  }
}

export function getDirectiveLabelText(label: DirectiveLabel): string {
  if (!label || label.length === 0) {
    return ''
  }

  const collectText = (node: MarkdownNode): string => {
    if (typeof node.value === 'string') {
      return node.value
    }

    if (!Array.isArray(node.children)) {
      return ''
    }

    return node.children.map(collectText).join('')
  }

  return label.map(collectText).join('')
}
