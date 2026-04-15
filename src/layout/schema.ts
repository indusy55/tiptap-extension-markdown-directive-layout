export const LAYOUT_DIRECTIVE_NAMES = [
  'stack',
  'grid',
  'cell',
  'box',
  'break',
  'avoid',
  'group',
] as const

export const CONTAINER_LAYOUT_DIRECTIVE_NAMES = [
  'stack',
  'grid',
  'cell',
  'box',
  'avoid',
  'group',
] as const

export type LayoutDirectiveName = (typeof LAYOUT_DIRECTIVE_NAMES)[number]
export type ContainerLayoutDirectiveName =
  (typeof CONTAINER_LAYOUT_DIRECTIVE_NAMES)[number]

export interface StackAttributes {
  gap: number
}

export interface GridAttributes {
  cols: number
  gap: number
}

export interface CellAttributes {
  span: number
}

export interface BoxAttributes {
  padding: number
  margin: number
  border: 'none' | 'subtle' | 'strong'
  radius: number
  bg: string
  shadow: 'none' | 'sm' | 'md' | 'lg'
  overflow: 'clip' | 'visible'
}

export interface AvoidAttributes {}

export interface GroupAttributes {}

export interface BreakAttributes {}

export interface LayoutDirectiveAttributesMap {
  stack: StackAttributes
  grid: GridAttributes
  cell: CellAttributes
  box: BoxAttributes
  break: BreakAttributes
  avoid: AvoidAttributes
  group: GroupAttributes
}

export const LAYOUT_NODE_NAMES = {
  stack: 'layoutStack',
  grid: 'layoutGrid',
  cell: 'layoutCell',
  box: 'layoutBox',
  break: 'layoutBreak',
  avoid: 'layoutAvoid',
  group: 'layoutGroup',
} as const

export type LayoutNodeName =
  (typeof LAYOUT_NODE_NAMES)[LayoutDirectiveName]

export type RawAttributes = Record<string, unknown> | null | undefined

const layoutDirectiveNameSet = new Set<LayoutDirectiveName>(
  LAYOUT_DIRECTIVE_NAMES,
)

const containerDirectiveNameSet = new Set<ContainerLayoutDirectiveName>(
  CONTAINER_LAYOUT_DIRECTIVE_NAMES,
)

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isLayoutDirectiveName(
  value: string,
): value is LayoutDirectiveName {
  return layoutDirectiveNameSet.has(value as LayoutDirectiveName)
}

export function isContainerLayoutDirectiveName(
  value: string,
): value is ContainerLayoutDirectiveName {
  return containerDirectiveNameSet.has(value as ContainerLayoutDirectiveName)
}
