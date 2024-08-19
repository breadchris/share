import { proxy, useSnapshot } from 'valtio'
import { createBus } from './util'

type State = {
  adding: {
    type: '' | 'COMP' | 'GROUP'
    over: string
    startX: number
    startY: number
  }
  connecting: {
    sourceId: string
  }
}

export const state = proxy<State>({
  adding: {
    type: '',
    over: '',
    startX: 0,
    startY: 0,
  },
  connecting: {
    sourceId: '',
  },
})

export function useAppState() {
  const s = useSnapshot(state)
  return s as State
}

type Events = {
  CollapseGroup: string
}

export const events = createBus<Events>()
