import * as Comlink from 'comlink'
import type { WorkerHandler } from './language.worker'
import type { IDisposable } from 'monaco-editor'

export type LanguageWorker = Comlink.Remote<WorkerHandler>

export const spawnLanguageWorker = (): [LanguageWorker, IDisposable] => {
  // TODO breadchris needs to be dist?
  const worker = new Worker(new URL('/static/wasmcode/language.worker.js', import.meta.url), {
    type: 'module',
  })

  const proxy = Comlink.wrap<WorkerHandler>(worker)
  const dispose = {
    dispose: () => {
      proxy[Comlink.releaseProxy]()
      worker.terminate()
    },
  }

  return [proxy, dispose]
}
