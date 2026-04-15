import { editorViewCtx } from '@milkdown/kit/core'
import {
  TextSelection,
} from '@milkdown/kit/prose/state'
import type { Node as ProseNode, NodeType } from '@milkdown/kit/prose/model'
import type { EditorView } from '@milkdown/kit/prose/view'
import { newlineInCode, splitBlock } from '@milkdown/kit/prose/commands'
import { $node, $useKeymap } from '@milkdown/kit/utils'
import {
  normalizeLayoutDirectiveAttributes,
  serializeDirectiveAttributes,
  type DirectiveNode,
  type LayoutDirectiveAttributesMap,
  type LayoutDirectiveName,
} from '../../../src'

type LayoutHtmlAttribute = {
  defaultValue: string | number
  parse: (element: HTMLElement) => string | number
  render: (attributes: Record<string, unknown>) => Record<string, string>
}

const layoutContainerNodeNames = new Set([
  'layoutStack',
  'layoutGrid',
  'layoutCell',
  'layoutBox',
  'layoutAvoid',
  'layoutGroup',
])

function isDirectChildOfLayoutContainer(nodeName: string): boolean {
  return layoutContainerNodeNames.has(nodeName)
}

function createParagraphNode(
  paragraphType: NodeType,
): ProseNode | null {
  return paragraphType.createAndFill()
}

function isEmptyParagraphNode(node: ProseNode): boolean {
  return node.type.name === 'paragraph' && node.content.size === 0
}

function serializeDirectiveChildren(
  state: any,
  node: ProseNode,
) {
  node.content.forEach((child, _offset, index) => {
    const isLastChild = index === node.childCount - 1

    if (isEmptyParagraphNode(child)) {
      if (!isLastChild) {
        state.addNode('html', undefined, '<br />')
      }
      return
    }

    state.next(child)
  })
}

function insertParagraphAfterSelection(view: EditorView) {
  const { state } = view
  const { $from } = state.selection
  const insertPosition = $from.after()
  const paragraphType = state.schema.nodes.paragraph

  if (!paragraphType) {
    return false
  }

  const paragraph = createParagraphNode(paragraphType)

  if (!paragraph) {
    return false
  }

  const tr = state.tr.insert(insertPosition, paragraph)
  tr.setSelection(TextSelection.create(tr.doc, insertPosition + 1))
  view.dispatch(tr.scrollIntoView())

  return true
}

function handleLayoutContainerEnter(view: EditorView) {
  const { state } = view
  const { selection } = state
  const { $from, empty } = selection

  if (!$from.parent.isTextblock || $from.depth < 1) {
    return false
  }

  const layoutContainer = $from.node($from.depth - 1)

  if (!isDirectChildOfLayoutContainer(layoutContainer.type.name)) {
    return false
  }

  if (newlineInCode(state, view.dispatch)) {
    return true
  }

  const parentNode = $from.parent
  const isAtEndOfTextblock = $from.parentOffset === parentNode.content.size
  const isEmptyParagraph =
    parentNode.type.name === 'paragraph' && parentNode.content.size === 0
  const isHeadingAtEnd =
    parentNode.type.name === 'heading' && empty && isAtEndOfTextblock

  if (isHeadingAtEnd || isEmptyParagraph) {
    return insertParagraphAfterSelection(view)
  }

  return splitBlock(state, view.dispatch)
}

function numberDataAttribute(
  attributeName: string,
  defaultValue: number,
): LayoutHtmlAttribute {
  const htmlAttribute = `data-layout-${attributeName}`

  return {
    defaultValue,
    parse: element => {
      const value = element.getAttribute(htmlAttribute)

      if (value === null || value === '') {
        return defaultValue
      }

      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? numericValue : defaultValue
    },
    render: attributes => {
      const value = attributes[attributeName]
      return value === defaultValue ? {} : { [htmlAttribute]: String(value) }
    },
  }
}

function stringDataAttribute(
  attributeName: string,
  defaultValue: string,
): LayoutHtmlAttribute {
  const htmlAttribute = `data-layout-${attributeName}`

  return {
    defaultValue,
    parse: element => element.getAttribute(htmlAttribute) ?? defaultValue,
    render: attributes => {
      const value = attributes[attributeName]
      return value === defaultValue ? {} : { [htmlAttribute]: String(value) }
    },
  }
}

function createNodeAttributes(
  spec: Record<string, LayoutHtmlAttribute>,
): Record<string, { default: string | number }> {
  return Object.fromEntries(
    Object.entries(spec).map(([key, value]) => [
      key,
      { default: value.defaultValue },
    ]),
  )
}

function parseNodeAttributes(
  spec: Record<string, LayoutHtmlAttribute>,
  element: HTMLElement,
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(spec).map(([key, value]) => [key, value.parse(element)]),
  )
}

function renderNodeAttributes(
  spec: Record<string, LayoutHtmlAttribute>,
  attributes: Record<string, unknown>,
): Record<string, string> {
  return Object.assign(
    {},
    ...Object.values(spec).map(value => value.render(attributes)),
  )
}

function getDirectiveAttributes<T extends LayoutDirectiveName>(
  directive: T,
  node: DirectiveNode,
): LayoutDirectiveAttributesMap[T] {
  return normalizeLayoutDirectiveAttributes(
    directive,
    node.attributes as Record<string, unknown> | null | undefined,
  )
}

function createDirectiveContainerNode<T extends Exclude<LayoutDirectiveName, 'break'>>(
  directive: T,
  nodeName: string,
  attributeSpec: Record<string, LayoutHtmlAttribute>,
) {
  return $node(nodeName, () => ({
    attrs: createNodeAttributes(attributeSpec),
    content: 'block+',
    defining: true,
    group: 'block',
    parseDOM: [
      {
        getAttrs: dom => parseNodeAttributes(attributeSpec, dom as HTMLElement),
        tag: `div[data-layout-directive="${directive}"]`,
      },
    ],
    parseMarkdown: {
      match: node =>
        node.type === 'containerDirective' && node.name === directive,
      runner: (state, node, type) => {
        state.openNode(type, getDirectiveAttributes(directive, node as DirectiveNode))
        if (node.children) {
          state.next(node.children)
        }
        state.closeNode()
      },
    },
    toDOM: node => [
      'div',
      {
        'data-layout-directive': directive,
        class: `layout-directive layout-${directive}`,
        ...renderNodeAttributes(attributeSpec, node.attrs as Record<string, unknown>),
      },
      0,
    ],
    toMarkdown: {
      match: node => node.type.name === nodeName,
      runner: (state, node) => {
        const attributes = serializeDirectiveAttributes(
          directive,
          node.attrs as Record<string, unknown>,
        )

        state.openNode(
          'containerDirective',
          undefined,
          attributes
            ? { attributes, name: directive }
            : { name: directive },
        )
        serializeDirectiveChildren(state, node)
        state.closeNode()
      },
    },
  }))
}

function createDirectiveLeafNode(
  directive: 'break',
  nodeName: string,
) {
  return $node(nodeName, () => ({
    atom: true,
    defining: true,
    group: 'block',
    parseDOM: [{ tag: `div[data-layout-directive="${directive}"]` }],
    parseMarkdown: {
      match: node => node.type === 'leafDirective' && node.name === directive,
      runner: (state, _node, type) => {
        state.addNode(type)
      },
    },
    selectable: true,
    toDOM: () => [
      'div',
      {
        'data-layout-directive': directive,
        class: `layout-directive layout-${directive}`,
      },
    ],
    toMarkdown: {
      match: node => node.type.name === nodeName,
      runner: state => {
        state.addNode('leafDirective', undefined, undefined, {
          name: directive,
        })
      },
    },
  }))
}

export const layoutStackNode = createDirectiveContainerNode(
  'stack',
  'layoutStack',
  {
    gap: numberDataAttribute('gap', 0),
  },
)

export const layoutGridNode = createDirectiveContainerNode(
  'grid',
  'layoutGrid',
  {
    cols: numberDataAttribute('cols', 12),
    gap: numberDataAttribute('gap', 0),
  },
)

export const layoutCellNode = createDirectiveContainerNode(
  'cell',
  'layoutCell',
  {
    span: numberDataAttribute('span', 1),
  },
)

export const layoutBoxNode = createDirectiveContainerNode(
  'box',
  'layoutBox',
  {
    bg: stringDataAttribute('bg', 'none'),
    border: stringDataAttribute('border', 'none'),
    margin: numberDataAttribute('margin', 0),
    overflow: stringDataAttribute('overflow', 'clip'),
    padding: numberDataAttribute('padding', 0),
    radius: numberDataAttribute('radius', 0),
    shadow: stringDataAttribute('shadow', 'none'),
  },
)

export const layoutAvoidNode = createDirectiveContainerNode(
  'avoid',
  'layoutAvoid',
  {},
)

export const layoutGroupNode = createDirectiveContainerNode(
  'group',
  'layoutGroup',
  {},
)

export const layoutBreakNode = createDirectiveLeafNode(
  'break',
  'layoutBreak',
)

export const layoutKeymap = $useKeymap('layout', {
  HandleLayoutEnter: {
    shortcuts: 'Enter',
    command: ctx => () => {
      const view = ctx.get(editorViewCtx)
      return handleLayoutContainerEnter(view)
    },
    priority: 1000,
  },
})

export const milkdownLayoutPlugins = [
  layoutStackNode,
  layoutGridNode,
  layoutCellNode,
  layoutBoxNode,
  layoutAvoidNode,
  layoutGroupNode,
  layoutBreakNode,
  layoutKeymap.ctx,
  layoutKeymap.shortcuts,
]
