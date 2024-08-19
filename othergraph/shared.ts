import { proxy, useSnapshot } from 'valtio'

const padding = 50

export const shared = proxy({
  compWidth: padding * 4,
  compHeight: padding * 1.5,
  padding: padding,
  edgeType: 'default',
  direction: 'LR',
  distributeHandles: true,
  dynamicCompWidth: true,
  dynamicLayoutDirection: false,
})

export function useShared() {
  const s = useSnapshot(shared)
  return s
}
