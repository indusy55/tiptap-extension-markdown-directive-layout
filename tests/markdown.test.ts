import { describe, expect, test } from 'vitest'
import {
  createLayoutDirectiveNode,
  getLayoutDirectiveData,
  normalizeLayoutMarkdown,
  parseLayoutMarkdown,
  remarkLayoutDirectiveEmptyLines,
  stringifyLayoutMarkdown,
} from '../src'

describe('layout markdown', () => {
  test('parses layout directives into mdast with normalized metadata', () => {
    const markdown = [
      '::::stack{gap=3}',
      ':::box{padding=2 bg="muted"}',
      '# 张三',
      ':::',
      '::break',
      '::::',
    ].join('\n')

    const root = parseLayoutMarkdown(markdown)
    const stack = root.children[0]
    const box = stack?.children?.[0]
    const pageBreak = stack?.children?.[1]

    expect(getLayoutDirectiveData(stack)).toEqual({
      attributes: { gap: 3 },
      kind: 'container',
      name: 'stack',
    })
    expect(getLayoutDirectiveData(box)).toEqual({
      attributes: {
        bg: 'muted',
        border: 'none',
        margin: 0,
        overflow: 'clip',
        padding: 2,
        radius: 0,
        shadow: 'none',
      },
      kind: 'container',
      name: 'box',
    })
    expect(getLayoutDirectiveData(pageBreak)).toEqual({
      attributes: {},
      kind: 'leaf',
      name: 'break',
    })
  })

  test('round-trips programmatic mdast through canonical markdown', () => {
    const root = {
      type: 'root' as const,
      children: [
        createLayoutDirectiveNode('grid', { cols: 6, gap: 2 }, [
          createLayoutDirectiveNode('cell', { span: 3 }, [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'left' }],
            },
          ]),
          createLayoutDirectiveNode('cell', { span: 3 }, [
            createLayoutDirectiveNode('box', { padding: 2, border: 'subtle' }, [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'right' }],
              },
            ]),
          ]),
        ]),
      ],
    }

    const markdown = stringifyLayoutMarkdown(root)

    expect(markdown).toContain('grid{cols="6" gap="2"}')
    expect(markdown).toContain('cell{span="3"}')
    expect(markdown).toContain('box{padding="2" border="subtle"}')
    expect(parseLayoutMarkdown(markdown)).toEqual(root)
  })

  test('omits default attributes from canonical markdown output', () => {
    const markdown = normalizeLayoutMarkdown([
      '::::grid{cols=12 gap=0}',
      ':::cell{span=1}',
      'defaulted',
      ':::',
      '::::',
    ].join('\n'))

    expect(markdown).toContain(':::grid')
    expect(markdown).not.toContain('cols=')
    expect(markdown).not.toContain('gap=')
    expect(markdown).not.toContain('span=')
  })

  test('rejects layout directives used with the wrong syntax', () => {
    expect(() => parseLayoutMarkdown('::box')).toThrow(/must use container syntax/)
    expect(() => parseLayoutMarkdown(':::break\n:::')).toThrow(/must use leaf syntax/)
  })

  test('round-trips directive labels through core markdown processing', () => {
    const containerMarkdown = [
      ':::box[Lead]',
      'Body',
      ':::',
    ].join('\n')
    const leafMarkdown = '::break[Gap]'

    expect(stringifyLayoutMarkdown(parseLayoutMarkdown(containerMarkdown))).toBe(
      containerMarkdown,
    )
    expect(stringifyLayoutMarkdown(parseLayoutMarkdown(leafMarkdown))).toBe(
      leafMarkdown,
    )
  })

  test('converts layout container <br /> markers into empty paragraphs for editor parsers', () => {
    const root = {
      type: 'root' as const,
      children: [
        createLayoutDirectiveNode('box', {}, [
          {
            type: 'heading',
            depth: 2,
            children: [{ type: 'text', value: 'Title' }],
          },
          { type: 'html', value: '<br />' },
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Body' }],
          },
        ]),
      ],
    }

    remarkLayoutDirectiveEmptyLines()(root)

    expect(root.children[0]?.children).toEqual([
      {
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: 'Title' }],
      },
      {
        type: 'paragraph',
        children: [],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', value: 'Body' }],
      },
    ])
  })
})
