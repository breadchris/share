import * as Comlink from 'comlink'
import {type WrappedGoModule, startAnalyzer, RunRequest, RunResponse, ParseRequest, ParseResponse} from './bootstrap'
import type * as monaco from 'monaco-editor'

export interface AnalyzeRequest {
  fileName: string
  contents: string
  modelVersionId: number
}

export interface AnalyzeResponse {
  fileName: string
  modelVersionId: number
  markers: monaco.editor.IMarkerData[] | null
}

// TODO: refactor this together with the Go worker API

const appendModelVersion = (markers: AnalyzeResponse['markers'], modelVersionId: number) => {
  if (!markers) {
    return null
  }

  return markers.map((marker) => ({ ...marker, modelVersionId }))
}

export class WorkerHandler {
  private mod?: WrappedGoModule
  private readonly initPromise = startAnalyzer()

  private async getModule() {
    this.mod ??= await this.initPromise
    return this.mod
  }

  async runCode(r: RunRequest): Promise<RunResponse> {
    const mod = await this.getModule()
    try {
        return await mod.runCode(r)
    } catch (e) {
        return {
          output: '',
          error: e.toString(),
        }
    }
  }

  async parseCode({ contents }: ParseRequest): Promise<ParseResponse> {
    const mod = await this.getModule()
    try {
        return await mod.parseCode(contents)
    } catch (e) {
        return {
          error: e.toString(),
          functions: [],
        }
    }
  }

  async checkSyntaxErrors({ fileName, modelVersionId, contents }: AnalyzeRequest): Promise<AnalyzeResponse> {
    const mod = await this.getModule()
    const { markers } = await mod.analyzeCode(contents)
    return {
      fileName,
      modelVersionId,
      markers: appendModelVersion(markers, modelVersionId),
    }
  }
}

Comlink.expose(new WorkerHandler())
