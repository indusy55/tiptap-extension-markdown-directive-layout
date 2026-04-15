import { describe, expect, test } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import {
  Layout,
  LayoutKit,
  createLayoutDirectiveNode,
  getLayoutExtensions,
  isLayoutNodeName,
  nodeNameToDirective,
} from '../src'

describe('layout extensions', () => {
  function getLayoutEnterShortcut() {
    return Layout.config.addKeyboardShortcuts?.call({}).Enter
  }

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

  test('maps between public directive names and internal node names', () => {
    expect(nodeNameToDirective('layoutBox')).toBe('box')
    expect(nodeNameToDirective('paragraph')).toBeNull()
    expect(isLayoutNodeName('layoutGrid')).toBe(true)
    expect(isLayoutNodeName('heading')).toBe(false)
  })

  test('turns heading end Enter into a new default block inside the same layout container', () => {
    const editor = new Editor({
      immediatelyRender: false,
      extensions: [StarterKit, LayoutKit],
      content: {
        type: 'doc',
        content: [
          createLayoutDirectiveNode('box', {}, [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'The Story' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'After' }],
            },
          ]),
        ],
      },
    })

    let headingEnd = 0

    editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'heading' && node.textContent === 'The Story') {
        headingEnd = position + node.nodeSize - 1
        return false
      }

      return true
    })

    editor.commands.setTextSelection(headingEnd)

    const enter = getLayoutEnterShortcut()

    expect(enter?.({ editor })).toBe(true)
    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [
        {
          type: 'layoutBox',
          attrs: {
            padding: 0,
            margin: 0,
            border: 'none',
            radius: 0,
            bg: 'none',
            shadow: 'none',
            overflow: 'clip',
          },
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'The Story' }],
            },
            { type: 'paragraph' },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'After' }],
            },
          ],
        },
      ],
    })

    editor.destroy()
  })

  test('keeps direct child blocks inside the same layout container on repeated Enter', () => {
    const editor = new Editor({
      immediatelyRender: false,
      extensions: [StarterKit, LayoutKit],
      content: {
        type: 'doc',
        content: [
          createLayoutDirectiveNode('box', {}, [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'The Story' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'After' }],
            },
          ]),
        ],
      },
    })

    let headingEnd = 0

    editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'heading' && node.textContent === 'The Story') {
        headingEnd = position + node.nodeSize - 1
        return false
      }

      return true
    })

    editor.commands.setTextSelection(headingEnd)

    const enter = getLayoutEnterShortcut()

    expect(enter?.({ editor })).toBe(true)
    expect(enter?.({ editor })).toBe(true)
    expect(enter?.({ editor })).toBe(true)

    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [
        {
          type: 'layoutBox',
          attrs: {
            padding: 0,
            margin: 0,
            border: 'none',
            radius: 0,
            bg: 'none',
            shadow: 'none',
            overflow: 'clip',
          },
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'The Story' }],
            },
            { type: 'paragraph' },
            { type: 'paragraph' },
            { type: 'paragraph' },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'After' }],
            },
          ],
        },
      ],
    })

    editor.destroy()
  })

  test('creates another paragraph instead of leaving the layout container from an empty paragraph', () => {
    const editor = new Editor({
      immediatelyRender: false,
      extensions: [StarterKit, LayoutKit],
      content: {
        type: 'doc',
        content: [
          createLayoutDirectiveNode('box', {}, [
            { type: 'paragraph' },
          ]),
        ],
      },
    })

    editor.commands.setTextSelection(2)

    const enter = getLayoutEnterShortcut()

    expect(enter?.({ editor })).toBe(true)
    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [
        {
          type: 'layoutBox',
          attrs: {
            padding: 0,
            margin: 0,
            border: 'none',
            radius: 0,
            bg: 'none',
            shadow: 'none',
            overflow: 'clip',
          },
          content: [
            { type: 'paragraph' },
            { type: 'paragraph' },
          ],
        },
      ],
    })

    editor.destroy()
  })
})
