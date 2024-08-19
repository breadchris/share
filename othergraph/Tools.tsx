import React from 'react';
import { Button, Icon } from '@blueprintjs/core'
import { shared, useShared } from './shared'
import { reLayout, generateReactflowLayout, RF, test } from './Stage'
import { state } from './state'
import * as actions from './actions'
import { randBg } from './util'
import { collaboration } from './collaboration'

function createGhost(type: string) {
  const ghost = document.createElement('div')
  ghost.classList.add(`ghost-${type}`)
  ghost.style.width = `${shared.compHeight * 2}px`
  ghost.style.height = `${shared.compHeight * 1.5}px`
  if (type === 'group') {
    ghost.style.background = randBg()
  }
  document.body.appendChild(ghost)
  return ghost
}

function initAdd(type: string, x: number, y: number) {
  const ghost = createGhost(type)
  ghost.style.left = `${x - 10}px`
  ghost.style.top = `${y - 10}px`

  function handleMousemove(e: MouseEvent) {
    ghost.style.left = `${e.clientX - 10}px`
    ghost.style.top = `${e.clientY - 10}px`
    const p = RF.inst().project({
      x: e.clientX,
      y: e.clientY - 50,
    })
    const nodes = RF.inst()
      .getIntersectingNodes({
        x: p.x - 2,
        y: p.y - 2,
        width: 5,
        height: 5,
      })
      .filter((n) => n.type === 'GROUP')

    if (nodes.length) {
      const n = nodes[nodes.length - 1]
      if (n.id !== state.adding.over) {
        state.adding.over = n.id
      }
    } else if (state.adding.over) {
      state.adding.over = ''
    }
  }

  function handleDrop() {
    document.body.removeEventListener('mousemove', handleMousemove)
    window.removeEventListener('click', handleDrop)

    actions.addElement({
      type,
      toId: state.adding.over,
      els: test.elements,
      bg: ghost.style.background,
    })
    collaboration.update(test)

    ghost.remove()
    if (state.adding.over) {
      state.adding.over = ''
    }
  }

  document.body.addEventListener('mousemove', handleMousemove)
  setTimeout(() => {
    window.addEventListener('click', handleDrop)
  }, 1)
}

type SpacerProps = {
  space?: number
}

function Spacer(props: SpacerProps) {
  return <div style={{ paddingLeft: props.space || 10 }} />
}

export function AddTools() {
  return (
    <div className="flex">
      <Button
        icon="cube"
        text="Component"
        onClick={(e) => {
          initAdd('comp', e.clientX, e.clientY)
        }}
      />
      <Spacer />
      <Button
        icon="square"
        text="Group"
        onClick={(e) => {
          initAdd('group', e.clientX, e.clientY)
        }}
      />
    </div>
  )
}

export function LayoutTools() {
  const s = useShared()

  return (
    <div className="flex">
      <Button
        active={s.edgeType === 'default'}
        icon="many-to-many"
        text="Bezier"
        onClick={() => {
          shared.edgeType = 'default'
          generateReactflowLayout()
        }}
      />
      <Spacer />
      <Button
        active={s.edgeType === 'step'}
        icon="key-enter"
        text="Step"
        onClick={() => {
          shared.edgeType = 'step'
          generateReactflowLayout()
        }}
      />
      <Spacer />
      <Button
        active={s.edgeType === 'straight'}
        icon="flow-linear"
        text="Straight"
        onClick={() => {
          shared.edgeType = 'straight'
          generateReactflowLayout()
        }}
      />
      <Spacer />
      <Button
        active={s.edgeType === 'points'}
        icon="trending-up"
        text="Points"
        onClick={() => {
          shared.edgeType = 'points'
          generateReactflowLayout()
        }}
      />
      <Spacer />
      <Button
        active={s.edgeType === 'pointsStraight'}
        icon="slash"
        text="Points Straight"
        onClick={() => {
          shared.edgeType = 'pointsStraight'
          generateReactflowLayout()
        }}
      />
      <Spacer />
      <Button
        active={s.direction === 'LR'}
        icon={
          <Icon
            icon="layout-hierarchy"
            style={{ transform: 'rotate(-90deg)' }}
          />
        }
        onClick={() => {
          shared.direction = 'LR'
          reLayout()
        }}
      />
      <Spacer />
      <Button
        active={s.direction === 'RL'}
        icon={
          <Icon
            icon="layout-hierarchy"
            style={{ transform: 'rotate(90deg)' }}
          />
        }
        onClick={() => {
          shared.direction = 'RL'
          reLayout()
        }}
      />
      <Spacer />
      <Button
        active={s.direction === 'TB'}
        icon="layout-hierarchy"
        onClick={() => {
          shared.direction = 'TB'
          reLayout()
        }}
      />
      <Spacer />
      <Button
        active={s.direction === 'BT'}
        icon={
          <Icon
            icon="layout-hierarchy"
            style={{ transform: 'rotate(180deg)' }}
          />
        }
        onClick={() => {
          shared.direction = 'BT'
          reLayout()
        }}
      />
    </div>
  )
}

export function ResetTool() {
  return (
    <Button
      outlined
      intent="danger"
      icon="refresh"
      text="Reset Design"
      onClick={() => {
        test.elements = []
        test.connections = []
        test.elMap = {}
        collaboration.resetCollabState()
        collaboration.update(test)
      }}
    />
  )
}
