import { describe, expect, test } from 'vitest'
import { Schema } from '../example/node_modules/@milkdown/kit/lib/prose/model.js'
import {
  EditorState,
  TextSelection,
} from '../example/node_modules/@milkdown/kit/lib/prose/state.js'
import {
  createProtectedLayoutDeletionTransaction,
  getProtectedLayoutDeletionPlan,
  shouldBlockProtectedLayoutDelete,
} from '../example/src/playground/layout-delete'

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    text: { group: 'inline' },
    paragraph: { content: 'text*', group: 'block' },
    heading: { content: 'text*', group: 'block' },
    layoutStack: { content: 'block+', group: 'block' },
    layoutGrid: { content: 'block+', group: 'block' },
    layoutCell: { content: 'block+', group: 'block' },
    layoutBox: { content: 'block+', group: 'block' },
    layoutGroup: { content: 'block+', group: 'block' },
    layoutBreak: { group: 'block' },
  },
  marks: {},
})

function getTextRange(
  doc: ReturnType<typeof schema.nodeFromJSON>,
  text: string,
): { from: number, to: number } {
  let range: { from: number, to: number } | null = null

  doc.descendants((node, pos) => {
    if (!range && node.isText && node.text === text) {
      range = {
        from: pos,
        to: pos + node.nodeSize,
      }
      return false
    }

    return undefined
  })

  if (!range) {
    throw new Error(`Missing text node: ${text}`)
  }

  return range
}

describe('layout delete protection', () => {
  test('blocks forward delete at the end of a box before a sibling grid', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'layoutStack',
          content: [
            {
              type: 'layoutBox',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'peace' }],
                },
              ],
            },
            {
              type: 'layoutGrid',
              content: [
                {
                  type: 'layoutCell',
                  content: [
                    {
                      type: 'layoutBox',
                      content: [
                        {
                          type: 'heading',
                          content: [{ type: 'text', text: 'The Story' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
    const startRange = getTextRange(doc, 'peace')
    const selection = TextSelection.create(doc, startRange.to, startRange.to)

    expect(shouldBlockProtectedLayoutDelete(selection, 'forward')).toBe(true)
    expect(shouldBlockProtectedLayoutDelete(selection, 'backward')).toBe(false)
  })

  test('blocks forward delete at the end of a box before break and group', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'layoutStack',
          content: [
            {
              type: 'layoutBox',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'surprise' }],
                },
              ],
            },
            {
              type: 'layoutBreak',
            },
            {
              type: 'layoutGroup',
              content: [
                {
                  type: 'layoutBox',
                  content: [
                    {
                      type: 'heading',
                      content: [{ type: 'text', text: 'The Lesson' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
    const startRange = getTextRange(doc, 'surprise')
    const selection = TextSelection.create(doc, startRange.to, startRange.to)

    expect(shouldBlockProtectedLayoutDelete(selection, 'forward')).toBe(true)
  })

  test('keeps grid as a sibling when deleting across box and grid', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'layoutStack',
          content: [
            {
              type: 'layoutBox',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'peace' }],
                },
              ],
            },
            {
              type: 'layoutGrid',
              content: [
                {
                  type: 'layoutCell',
                  content: [
                    {
                      type: 'layoutBox',
                      content: [
                        {
                          type: 'heading',
                          content: [{ type: 'text', text: 'The Story' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
    const startRange = getTextRange(doc, 'peace')
    const endRange = getTextRange(doc, 'The Story')
    const selection = TextSelection.create(
      doc,
      startRange.to - 2,
      endRange.from + 3,
    )
    const state = EditorState.create({ doc, schema, selection })

    const plan = getProtectedLayoutDeletionPlan(selection)
    const tr = createProtectedLayoutDeletionTransaction(state)

    expect(plan).toEqual({
      endFrom: endRange.from,
      endTo: endRange.from + 3,
      startFrom: startRange.to - 2,
      startTo: startRange.to,
    })
    expect(tr).not.toBeNull()

    const stack = tr!.doc.child(0)
    expect(stack.childCount).toBe(2)
    expect(stack.child(0).type.name).toBe('layoutBox')
    expect(stack.child(1).type.name).toBe('layoutGrid')
    expect(stack.child(0).textContent).toBe('pea')
    expect(stack.child(1).textContent).toBe(' Story')
  })

  test('keeps break and group siblings when deleting across them', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'layoutStack',
          content: [
            {
              type: 'layoutBox',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'surprise' }],
                },
              ],
            },
            {
              type: 'layoutBreak',
            },
            {
              type: 'layoutGroup',
              content: [
                {
                  type: 'layoutBox',
                  content: [
                    {
                      type: 'heading',
                      content: [{ type: 'text', text: 'The Lesson' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
    const startRange = getTextRange(doc, 'surprise')
    const endRange = getTextRange(doc, 'The Lesson')
    const selection = TextSelection.create(
      doc,
      startRange.to - 2,
      endRange.from + 3,
    )
    const state = EditorState.create({ doc, schema, selection })
    const tr = createProtectedLayoutDeletionTransaction(state)

    expect(tr).not.toBeNull()

    const stack = tr!.doc.child(0)
    expect(stack.childCount).toBe(3)
    expect(stack.child(0).type.name).toBe('layoutBox')
    expect(stack.child(1).type.name).toBe('layoutBreak')
    expect(stack.child(2).type.name).toBe('layoutGroup')
    expect(stack.child(0).textContent).toBe('surpri')
    expect(stack.child(2).textContent).toBe(' Lesson')
  })

  test('does not protect deletion inside the same box across normal blocks', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'layoutStack',
          content: [
            {
              type: 'layoutBox',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Alpha' }],
                },
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Beta' }],
                },
              ],
            },
          ],
        },
      ],
    })
    const startRange = getTextRange(doc, 'Alpha')
    const endRange = getTextRange(doc, 'Beta')
    const selection = TextSelection.create(
      doc,
      startRange.to - 2,
      endRange.from + 2,
    )

    expect(getProtectedLayoutDeletionPlan(selection)).toBeNull()
  })

  test('does not block forward delete inside a box before a normal paragraph', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'layoutStack',
          content: [
            {
              type: 'layoutBox',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Alpha' }],
                },
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Beta' }],
                },
              ],
            },
          ],
        },
      ],
    })
    const startRange = getTextRange(doc, 'Alpha')
    const selection = TextSelection.create(doc, startRange.to, startRange.to)

    expect(shouldBlockProtectedLayoutDelete(selection, 'forward')).toBe(false)
  })
})
