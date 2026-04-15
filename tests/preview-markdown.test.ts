import { describe, expect, test } from 'vitest'
import { createLayoutDirectiveNode } from '../src'
import { renderPreviewPageHtml, renderPreviewPageMarkdown } from '../example/src/playground/preview-markdown'

describe('preview markdown renderer', () => {
  test('renders ordered lists through marked as ol', () => {
    const html = renderPreviewPageHtml(
      {
        index: 1,
        nodes: [
          {
            type: 'orderedList',
            attrs: { start: 1 },
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '第一项' }],
                  },
                ],
              },
            ],
          },
        ],
      },
      16,
      false,
    )

    expect(html).toContain('<ol>')
    expect(html).not.toContain('<ul>')
  })

  test('preserves ordered list start when it is not 1', () => {
    const html = renderPreviewPageHtml(
      {
        index: 1,
        nodes: [
          {
            type: 'orderedList',
            attrs: { start: 3 },
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '第三项' }],
                  },
                ],
              },
            ],
          },
        ],
      },
      16,
      false,
    )

    expect(html).toContain('<ol start="3">')
  })

  test('renders layout directives with the same data attributes used by preview styles', () => {
    const markdown = renderPreviewPageMarkdown(
      {
        index: 1,
        nodes: [
          createLayoutDirectiveNode('box', { padding: 2, border: 'subtle' }, [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Hello' }],
            },
          ]),
        ],
      },
      16,
      false,
    )

    const html = renderPreviewPageHtml(
      {
        index: 1,
        nodes: [
          createLayoutDirectiveNode('box', { padding: 2, border: 'subtle' }, [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Hello' }],
            },
          ]),
        ],
      },
      16,
      false,
    )

    expect(markdown).toContain(':::box{padding="2" border="subtle"}')
    expect(html).toContain('class="layout-directive layout-box"')
    expect(html).toContain('data-layout-padding="2"')
    expect(html).toContain('data-layout-border="subtle"')
  })
})
