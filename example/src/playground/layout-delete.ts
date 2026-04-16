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
