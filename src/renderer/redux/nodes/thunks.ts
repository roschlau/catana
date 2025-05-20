import {AppDispatch, RootState} from '../store'
import {resolveNode} from './helpers'
import {nanoid} from '@reduxjs/toolkit'
import {focusRestoreRequested} from '../ui/uiSlice'
import {nodeIndented, nodeOutdented, nodeSplit, titleUpdated} from './nodesSlice'

export function indentNode(nodeId: string, element: HTMLTextAreaElement) {
  return (dispatch: AppDispatch) => {
    dispatch(nodeIndented({ nodeId }))
    dispatch(focusRestoreRequested({
      nodeId,
      selectionStart: element.selectionStart,
      selectionEnd: element.selectionEnd,
    }))
  }
}

export function outdentNode(nodeId: string, viewPath: string[], element: HTMLTextAreaElement) {
  return (dispatch: AppDispatch) => {
    dispatch(nodeOutdented({ nodeId, viewPath }))
    dispatch(focusRestoreRequested({
      nodeId,
      selectionStart: element.selectionStart,
      selectionEnd: element.selectionEnd,
    }))
  }
}

export function splitNode(nodeId: string, isExpanded: boolean, selectionStart: number, selectionEnd: number) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const splitIndex = selectionStart
    const { node, link } = resolveNode(getState().nodes.present, nodeId)
    if (selectionEnd !== splitIndex) {
      dispatch(titleUpdated({ nodeId, title: node.title.slice(0, splitIndex) + node.title.slice(selectionEnd) }))
    }
    const parentId = isExpanded
      ? node.id
      : (link ?? node).parentNodeId ?? node.id
    const newNodeId = nanoid()
    dispatch(nodeSplit({ nodeId, newNodeId, atIndex: splitIndex, parentId }))
    dispatch(focusRestoreRequested({
      nodeId: newNodeId,
      selectionStart: 0,
      selectionEnd: 0,
    }))
  }
}
