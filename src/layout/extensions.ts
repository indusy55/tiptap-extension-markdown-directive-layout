import {
  type Editor,
  defaultBlockAt,
  Extension,
  Node,
  mergeAttributes,
  type AnyExtension,
} from '@tiptap/core'
import {
  createContainerDirectiveMarkdownSpec,
  createLeafDirectiveMarkdownSpec,
} from './markdown-spec'
import { normalizeLayoutDirectiveAttributes } from './attributes'
import { createLayoutDirectiveNode } from './nodes'
import type {
  ContainerLayoutDirectiveName,
  LayoutDirectiveName,
  RawAttributes,
} from './schema'
import { CONTAINER_LAYOUT_DIRECTIVE_NAMES, LAYOUT_NODE_NAMES } from './schema'

type HtmlElementLike = {
  getAttribute: (name: string) => string | null
}

type LayoutHtmlAttribute = {
  default: unknown
  parseHTML: (element: HtmlElementLike) => unknown
  renderHTML: (attributes: Record<string, unknown>) => Record<string, string>
}

const layoutContainerNodeNameSet = new Set<string>(
  CONTAINER_LAYOUT_DIRECTIVE_NAMES.map(directive => LAYOUT_NODE_NAMES[directive]),
)

function isDirectChildOfLayoutContainer(editor: Editor): boolean {
  const { $from } = editor.state.selection

  if (!$from.parent.isTextblock || $from.depth < 1) {
    return false
  }

  return layoutContainerNodeNameSet.has($from.node($from.depth - 1).type.name)
}

function createDefaultBlockAfterSelection(editor: Editor): boolean {
  const { $from } = editor.state.selection
  const layoutContainerDepth = $from.depth - 1
  const layoutContainer = $from.node(layoutContainerDepth)
  const insertionIndex = $from.index(layoutContainerDepth) + 1
  const defaultBlockType = defaultBlockAt(
    layoutContainer.contentMatchAt(insertionIndex),
  )
  const defaultBlock = defaultBlockType?.createAndFill()

  if (!defaultBlock) {
    return false
  }

  const insertPosition = $from.after()

  return editor
    .chain()
    .command(({ tr }) => {
      tr.insert(insertPosition, defaultBlock)
      return true
    })
    .setTextSelection(insertPosition + 1)
    .run()
}

function handleLayoutContainerEnter(editor: Editor): boolean {
  const { selection } = editor.state
  const { $from, empty } = selection
  const parentNode = $from.parent
  const isAtEndOfTextblock = $from.parentOffset === parentNode.content.size
  const isEmptyParagraph =
    parentNode.type.name === 'paragraph' && parentNode.content.size === 0
  const isHeadingAtEnd = parentNode.type.name === 'heading' && empty && isAtEndOfTextblock

  if (editor.commands.newlineInCode()) {
    return true
  }

  if (isHeadingAtEnd || isEmptyParagraph) {
    return createDefaultBlockAfterSelection(editor)
  }

  return editor.commands.splitBlock()
}

function numberDataAttribute(
  attributeName: string,
  defaultValue: number,
): LayoutHtmlAttribute {
  const htmlAttribute = `data-layout-${attributeName}`

  return {
    default: defaultValue,
    parseHTML: (element: HtmlElementLike) => {
      const value = element.getAttribute(htmlAttribute)

      if (value === null || value === '') {
        return defaultValue
      }

      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? numericValue : defaultValue
    },
    renderHTML: (attributes: Record<string, unknown>) => {
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
    default: defaultValue,
    parseHTML: (element: HtmlElementLike) =>
      element.getAttribute(htmlAttribute) ?? defaultValue,
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes[attributeName]
      return value === defaultValue ? {} : { [htmlAttribute]: String(value) }
    },
  }
}

function createDirectiveNodeExtension(
  directive: LayoutDirectiveName,
  attributeSpec: Record<string, LayoutHtmlAttribute>,
) {
  const nodeName = LAYOUT_NODE_NAMES[directive]
  const isLeaf = directive === 'break'
  const markdownSpec = isLeaf
    ? createLeafDirectiveMarkdownSpec('break')
    : createContainerDirectiveMarkdownSpec(
        directive as ContainerLayoutDirectiveName,
      )

  return Node.create({
    name: nodeName,
    group: 'block',
    content: isLeaf ? undefined : 'block*',
    defining: true,
    atom: isLeaf,
    selectable: true,
    addAttributes() {
      return attributeSpec
    },
    parseHTML() {
      return [{ tag: `div[data-layout-directive="${directive}"]` }]
    },
    renderHTML({ HTMLAttributes }) {
      const attributes = mergeAttributes(
        {
          'data-layout-directive': directive,
          class: `layout-directive layout-${directive}`,
        },
        HTMLAttributes,
      )

      return isLeaf ? ['div', attributes] : ['div', attributes, 0]
    },
    parseMarkdown: markdownSpec.parseMarkdown,
    renderMarkdown: markdownSpec.renderMarkdown,
    markdownTokenizer: markdownSpec.markdownTokenizer,
  })
}

export const LayoutStack = createDirectiveNodeExtension('stack', {
  gap: numberDataAttribute('gap', 0),
})

export const LayoutGrid = createDirectiveNodeExtension('grid', {
  cols: numberDataAttribute('cols', 12),
  gap: numberDataAttribute('gap', 0),
})

export const LayoutCell = createDirectiveNodeExtension('cell', {
  span: numberDataAttribute('span', 1),
})

export const LayoutBox = createDirectiveNodeExtension('box', {
  padding: numberDataAttribute('padding', 0),
  margin: numberDataAttribute('margin', 0),
  border: stringDataAttribute('border', 'none'),
  radius: numberDataAttribute('radius', 0),
  bg: stringDataAttribute('bg', 'none'),
  shadow: stringDataAttribute('shadow', 'none'),
  overflow: stringDataAttribute('overflow', 'clip'),
})

export const LayoutAvoid = createDirectiveNodeExtension('avoid', {})
export const LayoutGroup = createDirectiveNodeExtension('group', {})
export const LayoutBreak = createDirectiveNodeExtension('break', {})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    layout: {
      insertLayoutDirective: (
        directive: LayoutDirectiveName,
        attributes?: RawAttributes,
      ) => ReturnType
      wrapInLayoutDirective: (
        directive: ContainerLayoutDirectiveName,
        attributes?: RawAttributes,
      ) => ReturnType
      updateLayoutDirectiveAttributes: (
        directive: LayoutDirectiveName,
        attributes?: RawAttributes,
      ) => ReturnType
    }
  }
}

export const Layout = Extension.create({
  name: 'layout',
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!isDirectChildOfLayoutContainer(editor)) {
          return false
        }

        return handleLayoutContainerEnter(editor)
      },
    }
  },
  addCommands() {
    return {
      insertLayoutDirective:
        (directive, attributes) =>
        ({ commands }) =>
          commands.insertContent(
            createLayoutDirectiveNode(directive, attributes),
          ),
      wrapInLayoutDirective:
        (directive, attributes) =>
        ({ commands }) =>
          commands.wrapIn(
            LAYOUT_NODE_NAMES[directive],
            normalizeLayoutDirectiveAttributes(directive, attributes),
          ),
      updateLayoutDirectiveAttributes:
        (directive, attributes) =>
        ({ commands }) =>
          commands.updateAttributes(
            LAYOUT_NODE_NAMES[directive],
            normalizeLayoutDirectiveAttributes(directive, attributes),
          ),
    }
  },
})

const layoutExtensions: AnyExtension[] = [
  Layout,
  LayoutStack,
  LayoutGrid,
  LayoutCell,
  LayoutBox,
  LayoutAvoid,
  LayoutGroup,
  LayoutBreak,
]

export const LayoutKit = Extension.create({
  name: 'layoutKit',
  addExtensions() {
    return [...layoutExtensions]
  },
})

export function getLayoutExtensions(): AnyExtension[] {
  return [...layoutExtensions]
}

export function createLayoutKit(): AnyExtension[] {
  return getLayoutExtensions()
}
