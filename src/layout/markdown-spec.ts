import type {
  JSONContent,
  MarkdownParseHelpers,
  MarkdownParseResult,
  MarkdownRendererHelpers,
  MarkdownToken,
  MarkdownTokenizer,
} from '@tiptap/core'
import {
  createDirectiveContainerTokenizer,
  createDirectiveLeafTokenizer,
  renderDirectiveMarkdown,
  type DirectiveMarkdownToken,
} from '../directive'
import { createLayoutDirectiveNode } from './nodes'
import {
  normalizeLayoutDirectiveAttributes,
  serializeDirectiveAttributes,
} from './attributes'
import {
  CONTAINER_LAYOUT_DIRECTIVE_NAMES,
  LAYOUT_NODE_NAMES,
  type ContainerLayoutDirectiveName,
  type LayoutDirectiveName,
} from './schema'

function renderContainerDirectiveMarkdown(
  directive: ContainerLayoutDirectiveName,
  node: JSONContent,
  helpers: MarkdownRendererHelpers,
): string {
  const content = helpers.renderChildren(node.content ?? [], '\n\n')
  return renderDirectiveMarkdown({
    kind: 'container',
    directiveName: directive,
    attributes: serializeDirectiveAttributes(
      directive,
      node.attrs as Record<string, unknown> | undefined,
    ),
    content,
  })
}

export function createContainerDirectiveMarkdownSpec(
  directive: ContainerLayoutDirectiveName,
): {
  parseMarkdown: (
    token: MarkdownToken,
    helpers: MarkdownParseHelpers,
  ) => MarkdownParseResult
  renderMarkdown: (
    node: JSONContent,
    helpers: MarkdownRendererHelpers,
  ) => string
  markdownTokenizer: MarkdownTokenizer
} {
  return {
    parseMarkdown(token, helpers) {
      const content = helpers.parseChildren(
        (token as DirectiveMarkdownToken).tokens ?? [],
      )

      return createLayoutDirectiveNode(
        directive,
        normalizeLayoutDirectiveAttributes(
          directive,
          (token as DirectiveMarkdownToken).attributes,
        ),
        content,
      )
    },
    renderMarkdown(node, helpers) {
      return renderContainerDirectiveMarkdown(directive, node, helpers)
    },
    markdownTokenizer: createDirectiveContainerTokenizer({
      tokenName: LAYOUT_NODE_NAMES[directive],
      directiveName: directive,
      directiveNames: CONTAINER_LAYOUT_DIRECTIVE_NAMES,
    }),
  }
}

export function createLeafDirectiveMarkdownSpec(
  directive: Extract<LayoutDirectiveName, 'break'>,
): {
  parseMarkdown: () => MarkdownParseResult
  renderMarkdown: (node: JSONContent) => string
  markdownTokenizer: MarkdownTokenizer
} {
  return {
    parseMarkdown() {
      return createLayoutDirectiveNode(directive)
    },
    renderMarkdown(node) {
      return renderDirectiveMarkdown({
        kind: 'leaf',
        directiveName: directive,
        attributes: serializeDirectiveAttributes(
          directive,
          node.attrs as Record<string, unknown> | undefined,
        ),
      })
    },
    markdownTokenizer: createDirectiveLeafTokenizer({
      tokenName: LAYOUT_NODE_NAMES[directive],
      directiveName: directive,
    }),
  }
}
