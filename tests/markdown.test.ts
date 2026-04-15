import { describe, expect, test } from 'vitest'
import {
  createLayoutMarkdownManager,
  createLayoutDirectiveNode,
  getLayoutMarkdownBaseExtensions,
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

  test('omits default attributes from canonical markdown output', () => {
    const markdown = serializeLayoutDocument({
      type: 'doc',
      content: [
        createLayoutDirectiveNode('grid', { cols: 12, gap: 0 }, [
          createLayoutDirectiveNode('cell', { span: 1 }, [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'defaulted' }],
            },
          ]),
        ]),
      ],
    })

    expect(markdown).toContain(':::grid')
    expect(markdown).not.toContain('cols=')
    expect(markdown).not.toContain('gap=')
    expect(markdown).not.toContain('span=')
  })

  test('exposes the default extension bundle used by the markdown manager', () => {
    const extensions = getLayoutMarkdownBaseExtensions()

    expect(extensions.length).toBeGreaterThan(1)
    expect(
      extensions.some(extension => 'name' in extension && extension.name === 'layoutKit'),
    ).toBe(false)
    expect(
      extensions.some(extension => 'name' in extension && extension.name === 'layout'),
    ).toBe(true)
    expect(
      extensions.some(extension => 'name' in extension && extension.name === 'layoutBox'),
    ).toBe(true)
  })
})
