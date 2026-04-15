import type { LayoutNode, RichTextNode } from './layout-types'

type LayoutDataAttributes = Record<string, string>

function renderMarkedText(node: RichTextNode, key: string) {
  const text = node.text ?? ''

  return (node.marks ?? []).reduce<React.ReactNode>((content, mark, index) => {
    if (mark.type === 'highlight') {
      return <mark key={`${key}-highlight-${index}`}>{content}</mark>
    }

    return content
  }, text)
}

function renderInlineNode(node: RichTextNode, key: string): React.ReactNode {
  if (node.type === 'text') {
    return renderMarkedText(node, key)
  }

  if (node.type === 'hardBreak') {
    return <br key={key} />
  }

  return renderInline(node.content ?? [], key)
}

function renderInline(
  nodes: RichTextNode[] = [],
  keyPrefix = 'inline',
): React.ReactNode {
  return nodes.map((node, index) => (
    <span key={`${keyPrefix}-${index}`}>{renderInlineNode(node, `${keyPrefix}-${index}`)}</span>
  ))
}

function getLayoutDataAttributes(node: LayoutNode): LayoutDataAttributes {
  const attributes: LayoutDataAttributes = {}

  if (node.type === 'layoutStack' || node.type === 'layoutGrid') {
    const gap = Number(node.attrs?.gap ?? 0)
    if (gap !== 0) {
      attributes['data-layout-gap'] = String(gap)
    }
  }

  if (node.type === 'layoutGrid') {
    const cols = Number(node.attrs?.cols ?? 12)
    if (cols !== 12) {
      attributes['data-layout-cols'] = String(cols)
    }
  }

  if (node.type === 'layoutCell') {
    const span = Number(node.attrs?.span ?? 1)
    if (span !== 1) {
      attributes['data-layout-span'] = String(span)
    }
  }

  return attributes
}

function LayoutNodeView({ node }: { node: LayoutNode }) {
  if (!node.type) {
    return null
  }

  if (node.type === 'paragraph') {
    return <p>{renderInline(node.content as RichTextNode[])}</p>
  }

  if (node.type === 'heading') {
    const level = Number(node.attrs?.level ?? 2)
    const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'
    return <Tag>{renderInline(node.content as RichTextNode[])}</Tag>
  }

  if (node.type === 'bulletList') {
    return (
      <ul>
        {(node.content ?? []).map((child, index) => (
          <LayoutNodeView key={`${child.type}-${index}`} node={child} />
        ))}
      </ul>
    )
  }

  if (node.type === 'listItem') {
    return (
      <li>
        {(node.content ?? []).map((child, index) => (
          <LayoutNodeView key={`${child.type}-${index}`} node={child} />
        ))}
      </li>
    )
  }

  const directive = node.type.replace('layout', '').toLowerCase()

  return (
    <div
      className={`layout-directive layout-${directive}`}
      data-layout-directive={directive}
      {...getLayoutDataAttributes(node)}
    >
      {(node.content ?? []).map((child, index) => (
        <LayoutNodeView key={`${child.type}-${index}`} node={child} />
      ))}
    </div>
  )
}

export function LayoutPageContent({
  nodes,
  rootGap,
  usesRootStack,
}: {
  nodes: LayoutNode[]
  rootGap: number
  usesRootStack: boolean
}) {
  const content = nodes.map((node, index) => (
    <LayoutNodeView key={`${node.type}-${index}`} node={node} />
  ))

  if (!usesRootStack) {
    return content
  }

  const rootGapValue = rootGap === 0 ? undefined : String(rootGap / 8)

  return (
    <div
      className="layout-directive layout-stack"
      data-layout-directive="stack"
      data-layout-gap={rootGapValue}
    >
      {content}
    </div>
  )
}
