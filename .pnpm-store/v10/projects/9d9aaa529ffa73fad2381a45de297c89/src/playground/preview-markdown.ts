import type { JSONContent } from '@tiptap/core'
import {
  createLayoutDirectiveNode,
  getLayoutMarkdownManager,
  serializeDirectiveAttributes,
  serializeLayoutDocument,
  type LayoutDirectiveName,
} from '../../../src'
import type { PreviewPage } from './layout-types'

type DirectiveHtmlToken = {
  attributes?: Record<string, string>
  tokens?: unknown[]
}

type MarkedRendererContext = {
  parser: {
    parse: (tokens: unknown[]) => string
  }
}

const CONTAINER_DIRECTIVES: LayoutDirectiveName[] = [
  'stack',
  'grid',
  'cell',
  'box',
  'avoid',
  'group',
]

let previewMarkedConfigured = false

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function getDirectiveHtmlAttributes(
  directive: LayoutDirectiveName,
  attributes?: Record<string, string>,
): string {
  const normalizedAttributes = serializeDirectiveAttributes(directive, attributes)
  const htmlAttributes = [
    ['class', `layout-directive layout-${directive}`],
    ['data-layout-directive', directive],
  ]

  for (const [key, value] of Object.entries(normalizedAttributes ?? {})) {
    htmlAttributes.push([`data-layout-${key}`, value])
  }

  return htmlAttributes
    .map(([name, value]) => `${name}="${escapeHtmlAttribute(value)}"`)
    .join(' ')
}

function renderDirectiveHtml(
  directive: LayoutDirectiveName,
  token: DirectiveHtmlToken,
  innerHtml = '',
): string {
  const attributes = getDirectiveHtmlAttributes(directive, token.attributes)

  if (directive === 'break') {
    return `<div ${attributes}></div>`
  }

  return `<div ${attributes}>${innerHtml}</div>`
}

function ensurePreviewMarked() {
  const marked = getLayoutMarkdownManager().instance

  if (previewMarkedConfigured) {
    return marked
  }

  marked.use({
    extensions: [
      ...CONTAINER_DIRECTIVES.map(directive => ({
        name: `layout${directive[0]!.toUpperCase()}${directive.slice(1)}`,
        renderer(this: MarkedRendererContext, token: DirectiveHtmlToken) {
          const innerHtml = this.parser.parse(token.tokens ?? [])
          return renderDirectiveHtml(directive, token, innerHtml)
        },
      })),
      {
        name: 'layoutBreak',
        renderer(this: MarkedRendererContext, token: DirectiveHtmlToken) {
          return renderDirectiveHtml('break', token)
        },
      },
    ] as any,
  } as any)

  previewMarkedConfigured = true

  return marked
}

function createPreviewPageDocument(
  page: PreviewPage,
  rootGap: number,
  usesRootStack: boolean,
): JSONContent {
  if (!usesRootStack) {
    return {
      type: 'doc',
      content: page.nodes as JSONContent[],
    }
  }

  return {
    type: 'doc',
    content: [
      createLayoutDirectiveNode('stack', { gap: rootGap / 8 }, page.nodes as JSONContent[]),
    ],
  }
}

export function renderPreviewPageMarkdown(
  page: PreviewPage,
  rootGap: number,
  usesRootStack: boolean,
): string {
  return serializeLayoutDocument(
    createPreviewPageDocument(page, rootGap, usesRootStack),
  )
}

export function renderPreviewPageHtml(
  page: PreviewPage,
  rootGap: number,
  usesRootStack: boolean,
): string {
  const markdown = renderPreviewPageMarkdown(page, rootGap, usesRootStack)
  const marked = ensurePreviewMarked()
  const html = marked.parse(markdown)

  return typeof html === 'string' ? html : ''
}
