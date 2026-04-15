import { describe, expect, test } from 'vitest'
import {
  normalizeLayoutDirectiveAttributes,
  serializeDirectiveAttributes,
} from '../src'

describe('layout attributes', () => {
  test('normalizes valid attributes against the layout spec', () => {
    expect(normalizeLayoutDirectiveAttributes('grid', { cols: '8', gap: 1 }))
      .toEqual({
        cols: 8,
        gap: 1,
      })
  })

  test('rejects unsupported values', () => {
    expect(() =>
      normalizeLayoutDirectiveAttributes('grid', { cols: 25 }),
    ).toThrow(/between 1 and 24/)
  })

  test('serializes only non-default attributes', () => {
    expect(
      serializeDirectiveAttributes('box', {
        padding: 2,
        border: 'subtle',
        bg: 'none',
      }),
    ).toEqual({
      padding: '2',
      border: 'subtle',
    })
  })
})
