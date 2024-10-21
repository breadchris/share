import '~/lib/go/wasm_exec.js'
import * as Comlink from 'comlink'
import { FileSystemWrapper, type IWriter } from '~/lib/go/node/fs'
import { processStub } from '../lib/go/node/process'
import { type GoWebAssemblyInstance, GoWrapper, wrapGlobal } from '../lib/go'

export type WriteListener = (data: ArrayBuffer) => void

export interface Stdio {
  stdout: WriteListener
  stderr: WriteListener
}

export interface StartupParams {
  env?: Record<string, string>
  args?: string[]
}

export interface ExecParams {
  /**
   * WebAssembly program binary
   */
  image: ArrayBuffer

  /**
   * Program execution params.
   */
  params?: StartupParams
}

export interface GoExecutor {
  /**
   * Attaches event listeners and initializes an executor.
   * @param stdio
   */
  initialize: (stdio: Stdio) => void

  /**
   * Starts Go WebAssembly program and returns exit code.
   */
  run: (params: ExecParams) => Promise<number>
}

const intoWriter = (writeFn: WriteListener): IWriter => ({
  write: (data) => {
    writeFn(data)
    return data.byteLength
  },
})

class WorkerHandler implements GoExecutor {
  private stdio: Stdio | undefined

  initialize(stdio: Stdio) {
    this.stdio = stdio
  }

  async run({ image, params }: ExecParams) {
    if (!this.stdio) {
      throw new Error('standard i/o streams are not configured')
    }

    const fs = new FileSystemWrapper(intoWriter(this.stdio.stdout), intoWriter(this.stdio.stderr))
    const mocks = {
      mocked: true,
      process: processStub,
      fs,
    }

    const go = new GoWrapper(new globalThis.Go(), {
      globalValue: wrapGlobal(mocks, globalThis),
    })

    const { instance } = await WebAssembly.instantiate(image, go.importObject)
    return await new Promise<number>((resolve, reject) => {
      go.onExit = (code) => {
        console.log('Go: WebAssembly program finished with code:', code)
        resolve(code)
      }
      go.run(instance as GoWebAssemblyInstance, params?.args).catch(reject)
    })
  }
}

Comlink.expose(new WorkerHandler())
