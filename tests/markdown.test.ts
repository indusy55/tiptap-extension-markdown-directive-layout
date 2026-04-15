import { describe, expect, test } from 'vitest'
import {
  createLayoutMarkdownManager,
  createLayoutDirectiveNode,
  parseLayoutDocument,
  serializeLayoutDocument,
} from '../src'

describe('layout markdown', () => {
  test('parses remark-directive container syntax into tiptap json', () => {
    const markdown = [
      '::::stack{gap=3}',
      '',
      ':::box{padding=2 bg="muted"}',
      '',
      '# 张三',
      '',
      ':::',
      '',
      '::break',
      '',
      '::::',
    ].join('\n')

    expect(parseLayoutDocument(markdown)).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'layoutStack',
          attrs: {
            gap: 3,
          },
          content: [
            {
              type: 'layoutBox',
              attrs: {
                padding: 2,
                margin: 0,
                border: 'none',
                radius: 0,
                bg: 'muted',
                shadow: 'none',
                overflow: 'clip',
              },
              content: [
                {
                  type: 'heading',
                  attrs: {
                    level: 1,
                  },
                  content: [{ type: 'text', text: '张三' }],
                },
              ],
            },
            {
              type: 'layoutBreak',
              attrs: {},
            },
          ],
        },
      ],
    })
  })

  test('round-trips tiptap json through remark-directive markdown', () => {
    const document = {
      type: 'doc',
      content: [
        createLayoutDirectiveNode('grid', { cols: 6, gap: 2 }, [
          createLayoutDirectiveNode('cell', { span: 3 }, [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'left' }],
            },
          ]),
          createLayoutDirectiveNode('cell', { span: 3 }, [
            createLayoutDirectiveNode('box', { padding: 2, border: 'subtle' }, [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'right' }],
              },
            ]),
          ]),
        ]),
      ],
    }

    const markdown = serializeLayoutDocument(document)

    expect(markdown).toContain('grid{cols="6" gap="2"}')
    expect(markdown).toContain('cell{span="3"}')
    expect(markdown).toContain('box{padding="2" border="subtle"}')
    expect(parseLayoutDocument(markdown)).toEqual(document)
  })

  test('exposes a preconfigured markdown manager based on official markdown support', () => {
    const manager = createLayoutMarkdownManager()
    const markdown = ':::box\n\nhello\n\n:::'

    expect(manager.parse(markdown)).toEqual(parseLayoutDocument(markdown))
    expect(manager.serialize(parseLayoutDocument(markdown))).toBe(
      serializeLayoutDocument(parseLayoutDocument(markdown)),
    )
  })
})
