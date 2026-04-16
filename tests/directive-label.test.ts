import { describe, expect, test } from 'vitest'
import type { DirectiveNode } from '../src'
import {
  createContainerDirectiveChildren,
  deserializeDirectiveLabel,
  extractDirectiveLabel,
  getDirectiveLabelText,
  serializeDirectiveLabel,
  stripContainerDirectiveLabel,
} from '../example/src/playground/directive-label'

describe('directive label helpers', () => {
  test('extracts container directive labels from the leading label paragraph', () => {
    const node: DirectiveNode = {
      type: 'containerDirective',
      name: 'box',
      children: [
        {
          type: 'paragraph',
          data: { directiveLabel: true },
          children: [{ type: 'text', value: 'Lead' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Body' }],
        },
      ],
    }

    expect(extractDirectiveLabel(node)).toEqual([
      { type: 'text', value: 'Lead' },
    ])
    expect(stripContainerDirectiveLabel(node)).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', value: 'Body' }],
      },
    ])
  })

  test('extracts leaf directive labels from children', () => {
    const node: DirectiveNode = {
      type: 'leafDirective',
      name: 'break',
      children: [{ type: 'text', value: 'Gap' }],
    }

    expect(extractDirectiveLabel(node)).toEqual([
      { type: 'text', value: 'Gap' },
    ])
  })

  test('rebuilds container markdown children with directiveLabel metadata', () => {
    expect(
      createContainerDirectiveChildren({
        label: [{ type: 'text', value: 'Lead' }],
        content: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Body' }],
          },
        ],
      }),
    ).toEqual([
      {
        type: 'paragraph',
        data: { directiveLabel: true },
        children: [{ type: 'text', value: 'Lead' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', value: 'Body' }],
      },
    ])
  })

  test('serializes and deserializes stored labels', () => {
    const label = [
      { type: 'text', value: 'Lead ' },
      {
        type: 'emphasis',
        children: [{ type: 'text', value: 'bold' }],
      },
    ]

    expect(deserializeDirectiveLabel(serializeDirectiveLabel(label)!)).toEqual(label)
    expect(getDirectiveLabelText(label)).toBe('Lead bold')
  })
})
