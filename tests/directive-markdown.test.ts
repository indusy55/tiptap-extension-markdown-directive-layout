import { describe, expect, test } from 'vitest'
import {
  parseDirectiveAttributes,
  renderDirectiveMarkdown,
  serializeDirectiveAttributeString,
} from '../src'

describe('directive markdown helpers', () => {
  test('parses unquoted, double-quoted, single-quoted, and bare attributes', () => {
    expect(
      parseDirectiveAttributes(`gap=2 bg="muted surface" shadow='md' compact`),
    ).toEqual({
      gap: '2',
      bg: 'muted surface',
      shadow: 'md',
      compact: '',
    })
  })

  test('serializes attribute maps into canonical quoted markdown attrs', () => {
    expect(
      serializeDirectiveAttributeString({
        gap: '2',
        bg: 'muted',
      }),
    ).toBe('{gap="2" bg="muted"}')

    expect(serializeDirectiveAttributeString()).toBe('')
  })

  test('uses a longer fence when nested container content already contains directive fences', () => {
    const markdown = renderDirectiveMarkdown({
      kind: 'container',
      directiveName: 'stack',
      attributes: { gap: '2' },
      content: [
        '::::box{padding="1"}',
        'Hello',
        '::::',
      ].join('\n'),
    })

    expect(markdown).toBe(
      [
        ':::::stack{gap="2"}',
        '::::box{padding="1"}',
        'Hello',
        '::::',
        ':::::',
      ].join('\n'),
    )
  })

  test('renders leaf directives on a single line', () => {
    expect(
      renderDirectiveMarkdown({
        kind: 'leaf',
        directiveName: 'break',
      }),
    ).toBe('::break')
  })
})
