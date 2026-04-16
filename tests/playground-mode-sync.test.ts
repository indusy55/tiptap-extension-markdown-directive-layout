import { describe, expect, test } from 'vitest'
import { createLayoutDirectiveNode } from '../src'
import {
  canonicalizeSourceMarkdown,
  parseSourceMarkdown,
  resolveModeSwitch,
} from '../example/src/playground/source-sync'

describe('playground mode sync', () => {
  test('canonicalizes markdown when switching from visual to source', () => {
    const committedMarkdown = canonicalizeSourceMarkdown(
      [
        ':::box',
        'Hello',
        ':::',
      ].join('\n'),
    )

    expect(
      resolveModeSwitch({
        currentMode: 'visual',
        nextMode: 'source',
        committedMarkdown,
        sourceMarkdown: 'stale',
        parseError: '',
      }),
    ).toEqual({
      nextMode: 'source',
      sourceMarkdown: committedMarkdown,
    })
  })

  test('keeps source mode active when markdown is invalid', () => {
    expect(
      resolveModeSwitch({
        currentMode: 'source',
        nextMode: 'visual',
        committedMarkdown: ':::box\nHello\n:::',
        sourceMarkdown: ':::box',
        parseError: 'Unclosed directive',
      }),
    ).toEqual({
      nextMode: 'source',
      sourceMarkdown: ':::box',
    })
  })

  test('canonicalizes valid source before returning to visual mode', () => {
    const parsed = parseSourceMarkdown(':::box\n\nHello\n\n:::')

    expect(parsed.parseError).toBe('')
    expect(parsed.documentAst).not.toBeNull()

    expect(
      resolveModeSwitch({
        currentMode: 'source',
        nextMode: 'visual',
        committedMarkdown: ':::box\n\nHello\n\n:::',
        sourceMarkdown: ':::box\n\nHello\n\n:::',
        parseError: '',
      }),
    ).toEqual({
      nextMode: 'visual',
      sourceMarkdown: ':::box\n\nHello\n\n:::',
    })
  })

  test('programmatic directives canonicalize through markdown', () => {
    const markdown = canonicalizeSourceMarkdown(
      [
        '::::grid{cols=12 gap=0}',
        ':::cell{span=1}',
        'Left',
        ':::',
        '::::',
      ].join('\n'),
    )

    expect(markdown).toContain(':::grid')
    expect(markdown).not.toContain('cols=')
    expect(markdown).not.toContain('gap=')
    expect(markdown).not.toContain('span=')
  })

  test('parseSourceMarkdown returns ast for programmatic directives', () => {
    const markdown = [
      '::::stack{gap="2"}',
      ':::box{padding="2"}',
      'Hello',
      ':::',
      '::::',
    ].join('\n')

    const parsed = parseSourceMarkdown(markdown)

    expect(parsed.parseError).toBe('')
    expect(parsed.documentAst?.children).toEqual([
      createLayoutDirectiveNode('stack', { gap: 2 }, [
        createLayoutDirectiveNode('box', { padding: 2 }, [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Hello' }],
          },
        ]),
      ]),
    ])
  })

  test('parseSourceMarkdown reports unsupported directives as parse errors', () => {
    const parsed = parseSourceMarkdown(':::foo\n:::')

    expect(parsed.parseError).toMatch(/Unsupported directive "foo"/)
    expect(parsed.documentAst).toBeNull()
  })
})
