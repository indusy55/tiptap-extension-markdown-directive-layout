import { describe, expect, test } from 'vitest'
import {
  createLayoutDirectiveNode,
  getLayoutDirectiveData,
  isDirectiveNode,
  isLayoutDirectiveNode,
} from '../src'

describe('layout nodes', () => {
  test('creates leaf and container directive nodes with normalized metadata', () => {
    const pageBreak = createLayoutDirectiveNode('break')
    const stack = createLayoutDirectiveNode('stack', { gap: '2' }, [])

    expect(pageBreak).toEqual({
      data: {
        layoutDirective: {
          attributes: {},
          kind: 'leaf',
          name: 'break',
        },
      },
      name: 'break',
      type: 'leafDirective',
    })

    expect(stack).toEqual({
      attributes: { gap: '2' },
      children: [],
      data: {
        layoutDirective: {
          attributes: { gap: 2 },
          kind: 'container',
          name: 'stack',
        },
      },
      name: 'stack',
      type: 'containerDirective',
    })
  })

  test('detects generic directive nodes and layout directive nodes', () => {
    const layoutNode = createLayoutDirectiveNode('group')
    const genericNode = {
      type: 'containerDirective',
      name: 'note',
      children: [],
    }

    expect(isDirectiveNode(layoutNode)).toBe(true)
    expect(isLayoutDirectiveNode(layoutNode)).toBe(true)
    expect(getLayoutDirectiveData(layoutNode)).toEqual({
      attributes: {},
      kind: 'container',
      name: 'group',
    })

    expect(isDirectiveNode(genericNode)).toBe(true)
    expect(isLayoutDirectiveNode(genericNode)).toBe(false)
    expect(getLayoutDirectiveData(genericNode)).toBeNull()
  })
})
