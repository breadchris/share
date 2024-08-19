import React from 'react';
import { memo, useEffect, useState } from 'react'
import { Button, Icon } from '@blueprintjs/core'
import { Handle, NodeProps, Position, useUpdateNodeInternals } from 'reactflow'
import * as T from './types'
import { shared } from './shared'
import { useOnChange } from './util'
import { events, useAppState } from './state'
import * as actions from './actions'
import { test } from './Stage'
import { collaboration } from './collaboration'
import { UserTagList } from './Users'

function sortByAxis(hs: T.NodeHandleData[], axis: 'x' | 'y', len: number) {
  const count = hs.length + 1
  return hs
    .sort((a, b) => {
      return a[axis] - b[axis]
    })
    .map((h, i) => {
      const seg = len / count
      h[axis] = seg * (i + 1)
      return h
    })
}

export function organizeHandles(
  handles: T.NodeHandleData[],
  w: number,
  h: number,
) {
  if (!shared.distributeHandles) return

  let top: T.NodeHandleData[] = []
  let bottom: T.NodeHandleData[] = []
  let left: T.NodeHandleData[] = []
  let right: T.NodeHandleData[] = []

  handles.forEach((h) => {
    if (h.x === 0) {
      left.push(h)
    } else if (h.x === w) {
      right.push(h)
    } else if (h.y === 0) {
      top.push(h)
    } else {
      bottom.push(h)
    }
  })

  sortByAxis(top, 'x', w)
  sortByAxis(bottom, 'x', w)
  sortByAxis(left, 'y', h)
  sortByAxis(right, 'y', h)
}

export function getHandlePosition(h: T.NodeHandleData, w: number, ht: number) {
  const isSource = h.type === 'source'
  let pos = Position.Bottom
  let x = h.x
  let y = h.y

  if (x === 0) {
    pos = Position.Left
    if (isSource) x -= 0
    if (y === 0) y += shared.padding / 2
    if (y === ht) y -= shared.padding / 2
  } else if (y === 0) {
    pos = Position.Top
  } else if (x === w) {
    pos = Position.Right
  } else if (y === ht) {
    pos = Position.Bottom
  }

  if (pos === Position.Right) x -= 2
  if (pos === Position.Bottom) y -= 2

  return { x, y, pos }
}

type NameUpdaterProps = {
  id: string
  name: string
  userId: string
}

function NameUpdater(props: NameUpdaterProps) {
  const [showInput, setShowInput] = useState(false)

  return (
    <>
      {showInput && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const input = document.getElementById(
              'CompNameInput',
            ) as HTMLInputElement
            if (input) {
              actions.updateElement(props.id, test.elements, (el) => {
                el.name = input.value
              })
              input.blur()
              // reLayout()
              collaboration.update(test)
            }
          }}
        >
          <input
            id="CompNameInput"
            defaultValue={props.name}
            onBlur={() => {
              setShowInput(false)
              collaboration.removeEditing(props.id, props.userId)
            }}
          />
        </form>
      )}
      {!showInput && (
        <span
          className="comp-name"
          onDoubleClick={() => {
            setShowInput(true)
            collaboration.addEditing(props.id, props.userId)
            setTimeout(() => {
              const input = document.getElementById(
                'CompNameInput',
              ) as HTMLInputElement
              input?.focus()
              input?.setSelectionRange(0, props.name.length)
            }, 5)
          }}
        >
          {props.name}
        </span>
      )}
    </>
  )
}

type UserEditingBlockProps = {
  text: string
}

function UserEditingBlock(props: UserEditingBlockProps) {
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 200,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(255,255,255,0.75)',
        borderRadius: '3px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          display: 'block',
          marginTop: '5px',
          fontSize: 8,
          fontWeight: 'bold',
          fontFamily: 'monospace',
        }}
      >
        {props.text}
      </span>
    </div>
  )
}

const ghostDragMap: Record<string, HTMLDivElement> = {}

function NodeComp(props: NodeProps<T.NodeData>) {
  const { data, selected } = props
  const s = useAppState()
  const isTarget = s.connecting.sourceId && s.connecting.sourceId !== props.id
  const hKey = JSON.stringify(data.handles)
  const updateInternals = useUpdateNodeInternals()

  const user = collaboration.currentUser
  const usersSelecting = collaboration.useSelected(props.id) || []
  const selectingFilter = usersSelecting.filter((id) => id !== user.id)
  const usersEditing = collaboration.useEditing(props.id) || []
  const editingFilter = usersEditing.filter((id) => id !== user.id)
  const isEditing = editingFilter.length > 0 && !usersEditing.includes(user.id)

  const ni = collaboration.useNodeInteractions(props.id)
  const isUserDragging = ni?.dragging?.userId === user.id

  useOnChange(ni?.dragging, () => {
    let g = ghostDragMap[props.id]

    if (ni?.dragging) {
      if (ni.dragging.userId !== user.id) {
        if (!g) {
          const n = document.querySelector(`[data-id="${props.id}"]`)
          if (n) {
            g = document.createElement('div')
            const t = document.createTextNode(data.element.name)
            g.appendChild(t)
            g.className = 'react-flow__node ghost-node-comp'
            g.style.width = `${data.width}px`
            g.style.height = `${data.height}px`
            ghostDragMap[props.id] = g
            const nodes = document.querySelector('.react-flow__nodes')
            if (nodes) {
              nodes.appendChild(g)
            }
          }
        }
        g.style.transform = `translate(${ni.dragging.x}px, ${ni.dragging.y}px)`
      }
    } else if (g) {
      g.remove()
      delete ghostDragMap[props.id]
    }
  })

  organizeHandles(data.handles, data.width, data.height)

  useEffect(() => {
    setTimeout(() => {
      updateInternals(props.id)
    }, 1)
  }, [hKey, props.id, updateInternals])

  useEffect(() => {
    return () => {
      if (selected) {
        collaboration.collabState.selected[props.id] = []
      }
    }
  }, [selected, props.id])

  useOnChange(selected, () => {
    if (selected && !usersSelecting.includes(user.id)) {
      collaboration.addSelected(props.id, user.id)
    } else if (!selected && usersSelecting.includes(user.id)) {
      collaboration.removeSelected(props.id, user.id)
    }
  })

  return (
    <div
      style={{
        background: 'white',
        width: data.width,
        height: data.height,
        border: '2px solid #000',
        borderRadius: 3,
        outline: selected ? '3px solid cyan' : undefined,
      }}
    >
      {data.handles.map((h) => {
        const { x, y, pos } = getHandlePosition(h, data.width, data.height)

        return (
          <Handle
            key={h.id}
            id={h.id}
            type={h.type}
            position={pos}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              opacity: 0,
            }}
          />
        )
      })}
      <div className="edge-connector-wrap">
        <Handle
          type={isTarget ? 'target' : 'source'}
          id="connector-handle"
          position={Position.Bottom}
          className="edge-connector"
          style={{
            zIndex: isTarget ? 3 : 1,
          }}
        />
        <div className="drag-me edge-connector-inner">
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textAlign: 'center',
            }}
          >
            <NameUpdater
              id={props.id}
              name={data.element.name}
              userId={user.id}
            />
          </div>
        </div>
      </div>
      {selectingFilter.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 201,
          }}
        >
          <UserTagList userIds={selectingFilter} nodeId={props.id} />
        </div>
      )}
      {isEditing && <UserEditingBlock text="Updating..." />}
      {ni?.dragging && !isUserDragging && <UserEditingBlock text="" />}
    </div>
  )
}

export const CustomNodeComp = memo(NodeComp)

function NodeGroup(props: NodeProps<T.NodeDataBase>) {
  const { data, selected } = props
  const { over } = useAppState().adding
  const isOver = over === data.element.id
  const hKey = JSON.stringify(data.handles)
  const updateInternals = useUpdateNodeInternals()
  const user = collaboration.currentUser
  const usersSelecting = collaboration.useSelected(props.id) || []
  const selectingFilter = usersSelecting.filter((id) => id !== user.id)
  const usersEditing = collaboration.useEditing(props.id) || []
  const editingFilter = usersEditing.filter((id) => id !== user.id)
  const isEditing = editingFilter.length > 0 && !usersEditing.includes(user.id)

  organizeHandles(data.handles, data.width, data.height)

  useEffect(() => {
    setTimeout(() => {
      updateInternals(props.id)
    }, 1)
  }, [hKey, props.id, updateInternals])

  useOnChange(selected, () => {
    if (selected && !usersSelecting.includes(user.id)) {
      collaboration.addSelected(props.id, user.id)
    } else if (!selected && usersSelecting.includes(user.id)) {
      collaboration.removeSelected(props.id, user.id)
    }
  })

  return (
    <div
      style={{
        background: data.bg || 'rgba(0,0,0,0.02)',
        width: data.width,
        height: data.height,
        border: `2px dashed ${isOver ? '#f00' : '#000'}`,
        borderRadius: 3,
        outline: selected ? '3px solid cyan' : undefined,
      }}
    >
      {data.handles.map((h) => {
        const { x, y, pos } = getHandlePosition(h, data.width, data.height)
        return (
          <Handle
            key={h.id}
            id={h.id}
            type={h.type}
            position={pos}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              opacity: 0,
            }}
          />
        )
      })}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          fontSize: 10,
          width: '100%',
          padding: '3px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: '#000',
        }}
      >
        <span className="group-name">
          {data.element.collapsed ? (
            ' '
          ) : (
            <NameUpdater
              id={props.id}
              name={data.element.name}
              userId={user.id}
            />
          )}
        </span>
        <Button
          small
          minimal
          icon={
            <Icon
              size={8}
              icon={data.element.collapsed ? 'plus' : 'minus'}
              color="black"
            />
          }
          style={{
            width: 16,
            height: 16,
            minWidth: 16,
            minHeight: 16,
          }}
          onClick={() => {
            events.emit('CollapseGroup', data.element.id)
          }}
        />
      </div>
      {data.element.collapsed && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textAlign: 'center',
          }}
        >
          <NameUpdater
            id={props.id}
            name={data.element.name}
            userId={user.id}
          />
        </div>
      )}
      {selectingFilter.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 201,
          }}
        >
          <UserTagList userIds={selectingFilter} nodeId={props.id} />
        </div>
      )}
      {isEditing && <UserEditingBlock text="Updating..." />}
    </div>
  )
}

export const CustomNodeGroup = memo(NodeGroup)
