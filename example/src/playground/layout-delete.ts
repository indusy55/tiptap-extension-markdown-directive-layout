import type { Node as ProseNode } from '@milkdown/kit/prose/model'
import {
  EditorState,
  Selection,
  TextSelection,
} from '@milkdown/kit/prose/state'

const layoutContainerNodeNames = new Set([
  'layoutStack',
  'layoutGrid',
  'layoutCell',
  'layoutBox',
  'layoutAvoid',
  'layoutGroup',
])

const layoutStructuralNodeNames = new Set([
  ...layoutContainerNodeNames,
  'layoutBreak',
])

export type LayoutDeletionPlan = {
  endFrom: number
  endTo: number
  startFrom: number
  startTo: number
}

type LayoutDeleteDirection = 'backward' | 'forward'

function isLayoutContainerNode(node: ProseNode): boolean {
  return layoutContainerNodeNames.has(node.type.name)
}

function isLayoutStructuralNode(node: ProseNode): boolean {
  return layoutStructuralNodeNames.has(node.type.name)
}

function getSharedLayoutContainerDepth(
  selection: TextSelection,
): number | null {
  const maxDepth = Math.min(selection.$from.depth, selection.$to.depth)

  for (let depth = maxDepth; depth >= 0; depth -= 1) {
    const fromNode = selection.$from.node(depth)
    const toNode = selection.$to.node(depth)

    if (fromNode === toNode && isLayoutContainerNode(fromNode)) {
      return depth
    }
  }

  return null
}

function hasProtectedLayoutBoundarySibling(
  selection: TextSelection,
  direction: LayoutDeleteDirection,
): boolean {
  if (!selection.empty || !selection.$from.parent.isTextblock) {
    return false
  }

  const isBoundaryCursor = direction === 'forward'
    ? selection.$from.parentOffset === selection.$from.parent.content.size
    : selection.$from.parentOffset === 0

  if (!isBoundaryCursor) {
    return false
  }

  for (let depth = selection.$from.depth - 1; depth > 0; depth -= 1) {
    const node = selection.$from.node(depth)

    if (!isLayoutStructuralNode(node)) {
      continue
    }

    const parent = selection.$from.node(depth - 1)

    if (!isLayoutContainerNode(parent)) {
      continue
    }

    let isNodeBoundary = true

    for (
      let currentDepth = selection.$from.depth;
      currentDepth > depth;
      currentDepth -= 1
    ) {
      const parentDepth = currentDepth - 1
      const parentNode = selection.$from.node(parentDepth)
      const parentIndex = direction === 'forward'
        ? selection.$from.indexAfter(parentDepth)
        : selection.$from.index(parentDepth)
      const isParentBoundary = direction === 'forward'
        ? parentIndex === parentNode.childCount
        : parentIndex === 0

      if (!isParentBoundary) {
        isNodeBoundary = false
        break
      }
    }

    if (!isNodeBoundary) {
      continue
    }

    const index = selection.$from.index(depth - 1)
    const siblingIndex = direction === 'forward' ? index + 1 : index - 1

    if (siblingIndex < 0 || siblingIndex >= parent.childCount) {
      continue
    }

    if (isLayoutStructuralNode(parent.child(siblingIndex))) {
      return true
    }
  }

  return false
}

export function shouldBlockProtectedLayoutDelete(
  selection: Selection,
  direction: LayoutDeleteDirection,
): boolean {
  if (!(selection instanceof TextSelection)) {
    return false
  }

  return hasProtectedLayoutBoundarySibling(selection, direction)
}

export function getProtectedLayoutDeletionPlan(
  selection: Selection,
): LayoutDeletionPlan | null {
  if (!(selection instanceof TextSelection) || selection.empty) {
    return null
  }

  if (!selection.$from.parent.isTextblock || !selection.$to.parent.isTextblock) {
    return null
  }

  const sharedLayoutDepth = getSharedLayoutContainerDepth(selection)

  if (
    sharedLayoutDepth === null
    || selection.$from.depth <= sharedLayoutDepth
    || selection.$to.depth <= sharedLayoutDepth
  ) {
    return null
  }

  const startChild = selection.$from.node(sharedLayoutDepth + 1)
  const endChild = selection.$to.node(sharedLayoutDepth + 1)

  if (
    startChild === endChild
    || (
      !isLayoutStructuralNode(startChild)
      && !isLayoutStructuralNode(endChild)
    )
  ) {
    return null
  }

  return {
    endFrom: selection.$to.start(),
    endTo: selection.to,
    startFrom: selection.from,
    startTo: selection.$from.end(),
  }
}

export function createProtectedLayoutDeletionTransaction(
  state: EditorState,
) {
  const plan = getProtectedLayoutDeletionPlan(state.selection)

  if (!plan) {
    return null
  }

  const tr = state.tr

  if (plan.endFrom < plan.endTo) {
    tr.delete(plan.endFrom, plan.endTo)
  }

  const mappedStartFrom = tr.mapping.map(plan.startFrom, -1)
  const mappedStartTo = tr.mapping.map(plan.startTo, -1)

  if (mappedStartFrom < mappedStartTo) {
    tr.delete(mappedStartFrom, mappedStartTo)
  }

  const selectionPosition = tr.mapping.map(plan.startFrom, -1)
  tr.setSelection(TextSelection.near(tr.doc.resolve(selectionPosition)))

  return tr
}
