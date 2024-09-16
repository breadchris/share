/**
 * Backend is Go version type
 */
export enum Backend {
  /**
   * Current Go version
   */
  Default = '',

  /**
   * Development branch (tip)
   */
  GoTip = 'gotip',

  /**
   * Previous Go version
   */
  GoPrev = 'goprev',
}

export enum EvalEventKind {
  Stdout = 'stdout',
  Stderr = 'stderr',
}

export interface ConvertResponse {
    code: string
}

export interface ShareResponse {
  snippetID: string
}

export interface EvalEvent {
  Message: string
  Kind: EvalEventKind
  Delay: number
}

export interface RunResponse {
  events: EvalEvent[]
}

export interface Cursor {
  line: number
  col: number
}

export interface ModifyRequest {
  code: string
  change: string
  cursor: Cursor
}

export interface ModifyResponse {
  code: string
}

export interface FilesPayload {
  files: Record<string, string>
}

export interface BuildResponse {
  fileName: string
  isTest?: boolean
  hasBenchmark?: boolean
  hasFuzz?: boolean
}

export interface VersionResponse {
  version: string
}

export interface VersionsInfo {
  playground: {
    current: string
    goprev: string
    gotip: string
  }

  wasm: string
}
