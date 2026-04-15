import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import type { MarkdownRoot } from './nodes'
import { remarkLayoutDirectives } from './remark'

export interface LayoutMarkdownProcessorOptions {
  bullet?: '-' | '*' | '+'
}

let layoutMarkdownProcessor:
  | ReturnType<typeof createLayoutMarkdownProcessor>
  | null = null

export function createLayoutMarkdownProcessor(
  options: LayoutMarkdownProcessorOptions = {},
) {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkLayoutDirectives)
    .use(remarkStringify, {
      bullet: options.bullet ?? '-',
      fences: true,
      listItemIndent: 'one',
    })
}

export function getLayoutMarkdownProcessor() {
  if (!layoutMarkdownProcessor) {
    layoutMarkdownProcessor = createLayoutMarkdownProcessor()
  }

  return layoutMarkdownProcessor
}

function stripPositions(root: MarkdownRoot): MarkdownRoot {
  visit(root, node => {
    delete (node as { position?: unknown }).position
  })

  return root
}

export function parseLayoutMarkdown(markdown: string): MarkdownRoot {
  const processor = getLayoutMarkdownProcessor()
  return stripPositions(
    processor.runSync(processor.parse(markdown)) as MarkdownRoot,
  )
}

export function stringifyLayoutMarkdown(root: MarkdownRoot): string {
  const processor = getLayoutMarkdownProcessor()
  const normalized = processor.runSync(root) as MarkdownRoot
  return processor.stringify(normalized as never).trimEnd()
}

export function normalizeLayoutMarkdown(markdown: string): string {
  return stringifyLayoutMarkdown(parseLayoutMarkdown(markdown))
}
