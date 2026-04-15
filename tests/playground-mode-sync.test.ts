import { describe, expect, test } from 'vitest'
import { createLayoutDirectiveNode } from '../src'
import {
  canonicalizeSourceMarkdown,
  parseSourceMarkdown,
  resolveModeSwitch,
} from '../example/src/playground/source-sync'

describe('playground mode sync', () => {
  test('canonicalizes markdown when switching from visual to source', () => {
    const documentJson = {
      type: 'doc',
      content: [
        createLayoutDirectiveNode('box', {}, [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello' }],
          },
        ]),
      ],
    }

    expect(
      resolveModeSwitch({
        currentMode: 'visual',
        nextMode: 'source',
        documentJson,
        sourceMarkdown: 'stale',
        parseError: '',
      }),
    ).toEqual({
      nextMode: 'source',
      sourceMarkdown: canonicalizeSourceMarkdown(documentJson),
    })
  })

  test('keeps source mode active when markdown is invalid', () => {
    const documentJson = {
      type: 'doc',
      content: [
        createLayoutDirectiveNode('box', {}, []),
      ],
    }

    expect(
      resolveModeSwitch({
        currentMode: 'source',
        nextMode: 'visual',
        documentJson,
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
    expect(parsed.documentJson).not.toBeNull()

    expect(
      resolveModeSwitch({
        currentMode: 'source',
        nextMode: 'visual',
        documentJson: parsed.documentJson!,
        sourceMarkdown: ':::box\n\nHello\n\n:::',
        parseError: '',
      }),
    ).toEqual({
      nextMode: 'visual',
      sourceMarkdown: canonicalizeSourceMarkdown(parsed.documentJson!),
    })
  })
})
