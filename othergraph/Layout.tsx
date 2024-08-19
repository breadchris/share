import React from 'react';
import { Colors } from '@blueprintjs/core'

const toolbarHeight = 50

export function TopToolbar(props: any) {
  return (
    <div
      className="p-2 bp4-dark"
      style={{
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '100%',
        height: `${toolbarHeight}px`,
        background: Colors.DARK_GRAY1,
      }}
    >
      <div className="flex between">{props.children}</div>
    </div>
  )
}

export function StageWrap(props: any) {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${toolbarHeight}px`,
        left: '0px',
        width: '100%',
        height: `calc(100% - ${toolbarHeight * 2}px)`,
        background: Colors.LIGHT_GRAY1,
      }}
    >
      {props.children}
    </div>
  )
}

export function BottomToolbar(props: any) {
  return (
    <div
      className="p-2 bp4-dark flex between"
      style={{
        position: 'absolute',
        bottom: '0px',
        left: '0px',
        width: '100%',
        height: `${toolbarHeight}px`,
        background: Colors.DARK_GRAY1,
      }}
    >
      {props.children}
    </div>
  )
}
