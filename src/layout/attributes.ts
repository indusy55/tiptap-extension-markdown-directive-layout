import type {
  LayoutDirectiveAttributesMap,
  LayoutDirectiveName,
  RawAttributes,
} from './schema'
import { isRecord } from './schema'

function getRawAttributeMap(raw: RawAttributes): Record<string, unknown> {
  return isRecord(raw) ? raw : {}
}

function assertNoUnknownAttributes(
  directive: LayoutDirectiveName,
  raw: RawAttributes,
  allowed: string[],
): void {
  const rawAttributes = getRawAttributeMap(raw)
  const unknownKeys = Object.keys(rawAttributes).filter(
    key =>
      !allowed.includes(key)
      && rawAttributes[key] !== undefined
      && rawAttributes[key] !== null,
  )

  if (unknownKeys.length > 0) {
    throw new Error(
      `Directive "${directive}" does not support attributes: ${unknownKeys.join(', ')}`,
    )
  }
}

function readNumberAttribute(
  directive: LayoutDirectiveName,
  raw: RawAttributes,
  key: string,
  defaultValue: number,
  minimum = 0,
  maximum = Number.POSITIVE_INFINITY,
): number {
  const rawAttributes = getRawAttributeMap(raw)
  const rawValue = rawAttributes[key]

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue
  }

  const numericValue =
    typeof rawValue === 'number' ? rawValue : Number(String(rawValue))

  if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
    throw new Error(
      `Directive "${directive}" expects "${key}" to be an integer number.`,
    )
  }

  if (numericValue < minimum || numericValue > maximum) {
    throw new Error(
      `Directive "${directive}" expects "${key}" to be between ${minimum} and ${maximum}.`,
    )
  }

  return numericValue
}

function readEnumAttribute<T extends string>(
  directive: LayoutDirectiveName,
  raw: RawAttributes,
  key: string,
  allowed: readonly T[],
  defaultValue: T,
): T {
  const rawAttributes = getRawAttributeMap(raw)
  const rawValue = rawAttributes[key]

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue
  }

  const value = String(rawValue) as T

  if (!allowed.includes(value)) {
    throw new Error(
      `Directive "${directive}" expects "${key}" to be one of: ${allowed.join(', ')}.`,
    )
  }

  return value
}

function readStringAttribute(
  raw: RawAttributes,
  key: string,
  defaultValue: string,
): string {
  const rawAttributes = getRawAttributeMap(raw)
  const rawValue = rawAttributes[key]

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue
  }

  return String(rawValue)
}

export function normalizeLayoutDirectiveAttributes<T extends LayoutDirectiveName>(
  directive: T,
  raw?: Partial<LayoutDirectiveAttributesMap[T]> | RawAttributes,
): LayoutDirectiveAttributesMap[T] {
  switch (directive) {
    case 'stack':
      assertNoUnknownAttributes(directive, raw, ['gap'])
      return {
        gap: readNumberAttribute(directive, raw, 'gap', 0, 0),
      } as LayoutDirectiveAttributesMap[T]
    case 'grid':
      assertNoUnknownAttributes(directive, raw, ['cols', 'gap'])
      return {
        cols: readNumberAttribute(directive, raw, 'cols', 12, 1, 24),
        gap: readNumberAttribute(directive, raw, 'gap', 0, 0),
      } as LayoutDirectiveAttributesMap[T]
    case 'cell':
      assertNoUnknownAttributes(directive, raw, ['span'])
      return {
        span: readNumberAttribute(directive, raw, 'span', 1, 1, 24),
      } as LayoutDirectiveAttributesMap[T]
    case 'box':
      assertNoUnknownAttributes(directive, raw, [
        'padding',
        'margin',
        'border',
        'radius',
        'bg',
        'shadow',
        'overflow',
      ])
      return {
        padding: readNumberAttribute(directive, raw, 'padding', 0, 0),
        margin: readNumberAttribute(directive, raw, 'margin', 0, 0),
        border: readEnumAttribute(
          directive,
          raw,
          'border',
          ['none', 'subtle', 'strong'],
          'none',
        ),
        radius: readNumberAttribute(directive, raw, 'radius', 0, 0),
        bg: readStringAttribute(raw, 'bg', 'none'),
        shadow: readEnumAttribute(
          directive,
          raw,
          'shadow',
          ['none', 'sm', 'md', 'lg'],
          'none',
        ),
        overflow: readEnumAttribute(
          directive,
          raw,
          'overflow',
          ['clip', 'visible'],
          'clip',
        ),
      } as LayoutDirectiveAttributesMap[T]
    case 'break':
      assertNoUnknownAttributes(directive, raw, [])
      return {} as LayoutDirectiveAttributesMap[T]
    case 'avoid':
      assertNoUnknownAttributes(directive, raw, [])
      return {} as LayoutDirectiveAttributesMap[T]
    case 'group':
      assertNoUnknownAttributes(directive, raw, [])
      return {} as LayoutDirectiveAttributesMap[T]
    default: {
      const unreachable: never = directive
      throw new Error(`Unsupported layout directive: ${String(unreachable)}`)
    }
  }
}

export function serializeDirectiveAttributes(
  directive: LayoutDirectiveName,
  rawAttributes?: Record<string, unknown>,
): Record<string, string> | undefined {
  const serialized: Record<string, string> = {}

  switch (directive) {
    case 'stack': {
      const attributes = normalizeLayoutDirectiveAttributes('stack', rawAttributes)
      if (attributes.gap !== 0) {
        serialized.gap = String(attributes.gap)
      }
      break
    }
    case 'grid': {
      const attributes = normalizeLayoutDirectiveAttributes('grid', rawAttributes)
      if (attributes.cols !== 12) {
        serialized.cols = String(attributes.cols)
      }
      if (attributes.gap !== 0) {
        serialized.gap = String(attributes.gap)
      }
      break
    }
    case 'cell': {
      const attributes = normalizeLayoutDirectiveAttributes('cell', rawAttributes)
      if (attributes.span !== 1) {
        serialized.span = String(attributes.span)
      }
      break
    }
    case 'box': {
      const attributes = normalizeLayoutDirectiveAttributes('box', rawAttributes)
      if (attributes.padding !== 0) {
        serialized.padding = String(attributes.padding)
      }
      if (attributes.margin !== 0) {
        serialized.margin = String(attributes.margin)
      }
      if (attributes.border !== 'none') {
        serialized.border = attributes.border
      }
      if (attributes.radius !== 0) {
        serialized.radius = String(attributes.radius)
      }
      if (attributes.bg !== 'none') {
        serialized.bg = attributes.bg
      }
      if (attributes.shadow !== 'none') {
        serialized.shadow = attributes.shadow
      }
      if (attributes.overflow !== 'clip') {
        serialized.overflow = attributes.overflow
      }
      break
    }
    case 'avoid':
    case 'break':
    case 'group':
      break
    default: {
      const unreachable: never = directive
      throw new Error(`Unsupported layout directive: ${String(unreachable)}`)
    }
  }

  return Object.keys(serialized).length > 0 ? serialized : undefined
}
