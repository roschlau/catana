import {toast} from 'sonner'

/**
 * Like toast.warning, but also logs the `message` and anything contained in `data.logData` to the console.
 */
export const displayWarning = (message: Message, data?: Data) => {
  console.debug('TOAST WARN: ' + message, data?.logData)
  return toast.warning(message, data)
}

/**
 * Like toast.error, but also logs the `message` and anything contained in `data.logData` to the console.
 */
export const displayError = (message: Message, data?: Data) => {
  console.warn('TOAST ERROR: ' + message, data?.logData)
  return toast.warning(message, data)
}

type Message = Parameters<typeof toast>[0]
type Data = ExclusiveIntersection<Parameters<typeof toast>[1], { logData?: unknown }>

/**
 * Like `A & B`, but resolves to never if A and B share _any_ keys, making sure we're not accidentally combining two
 * types that dangerously overlap.
 */
type ExclusiveIntersection<A, B> = keyof A & keyof B extends never ? A & B : never
