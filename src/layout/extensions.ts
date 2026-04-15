import {
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
import { LAYOUT_NODE_NAMES } from './schema'

type HtmlElementLike = {
  getAttribute: (name: string) => string | null
}

type LayoutHtmlAttribute = {
  default: unknown
  parseHTML: (element: HtmlElementLike) => unknown
  renderHTML: (attributes: Record<string, unknown>) => Record<string, string>
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
