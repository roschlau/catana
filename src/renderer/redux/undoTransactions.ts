import {AppDispatch, RootState} from './store'
import {UnknownAction} from '@reduxjs/toolkit'


let nextTransactionKey = 0

/**
 * A thunk action creator to run multiple dispatched actions while marking them as part of the same conceptual
 * transaction, meaning that redux-undo should group them together for the purposes of undoing and redoing.
 * This is accomplished by automatically adding the same `undoTransactionKey` to the `meta` property of all dispatched
 * actions.
 *
 * Be aware: transactions use the normal groupBy behavior of redux-undo, so they are only guaranteed to be undone/redone
 * as a single unit if no other actions are dispatched in between the actions of the transaction.
 */
export function createUndoTransaction<ReturnType>(
  callback: (dispatch: AppDispatch, getState: () => RootState) => ReturnType,
): (dispatch: AppDispatch, getState: () => RootState) => ReturnType {
  return (dispatch, getState) => {
    const undoTransactionKey = `undo_group_${nextTransactionKey++}`

    // This is the special dispatch function that will be passed to the callback.
    // It augments actions with the undoTransactionKey and correctly handles nested thunks.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const dispatchWithGroup: AppDispatch = (actionOrThunk: UnknownAction | Function) => {
      if (typeof actionOrThunk === 'function') {
        // If it's a thunk, execute it, passing this same `dispatchWithGroup`
        // and `getState`. This ensures that actions dispatched by nested thunks
        // are also part of the same group.
        return actionOrThunk(dispatchWithGroup, getState, undefined)
      } else if (typeof actionOrThunk === 'object') {
        // If it's a plain action object, add the `undoGroupId` to its meta field.
        return dispatch({
          ...actionOrThunk,
          meta: {
            ...(actionOrThunk.meta || {}), // Preserve existing meta properties
            undoTransactionKey,
          },
        })
      }
    }

    // Execute the user's callback, providing the special dispatch function and getState.
    return callback(dispatchWithGroup, getState)
  }
}

/**
 * Returns the undo transaction key of this action, if it exists.
 */
export function getUndoTransactionKey(action: UnknownAction): string | undefined {
  if (action.meta) {
    const groupKey = (action.meta as Record<string, unknown>).undoTransactionKey as string | undefined
    if (groupKey) return groupKey
    return undefined
  }
}
