import * as Comlink from 'comlink'
import type { WorkerHandler } from './analyzer.worker'
import type { IDisposable } from 'monaco-editor'

export type AnalyzerWorker = Comlink.Remote<WorkerHandler>

export const spawnAnalyzerWorker = (): [AnalyzerWorker, IDisposable] => {
  const worker = new Worker(new URL('/dist/wasmcode/analyzer/analyzer.worker.js', import.meta.url), {
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
