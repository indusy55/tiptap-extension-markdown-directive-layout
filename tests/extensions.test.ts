import { describe, expect, test } from 'vitest'
import {
  LayoutKit,
  createLayoutDirectiveNode,
  getLayoutExtensions,
} from '../src'

describe('layout extensions', () => {
  test('exports a complete tiptap kit', () => {
    expect(LayoutKit.name).toBe('layoutKit')
    expect(getLayoutExtensions()).toHaveLength(8)
  })

  test('creates leaf and container nodes with normalized attrs', () => {
    expect(createLayoutDirectiveNode('break')).toEqual({
      type: 'layoutBreak',
      attrs: {},
    })

    expect(createLayoutDirectiveNode('stack', { gap: '2' }, [])).toEqual({
      type: 'layoutStack',
      attrs: { gap: 2 },
      content: [],
    })
  })
})
