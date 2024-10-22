import React from 'react';
import 'reactflow/dist/style.css'
import { MouseEvent, useEffect } from 'react'
import { Colors } from '@blueprintjs/core'
import * as T from './types'
import { CustomNodeComp, CustomNodeGroup } from './Nodes'
import {
  CustomEdgePoints,
  CustomEdgePointsStraight,
  CustomConnectLine,
} from './Edge'
import { containsElement, copy } from './util'
import * as actions from './actions'
import { elementsToDagreReactflow } from './dagre'
import { state, events } from './state'
import { collaboration, CollabCompState } from './collaboration'
import {Node, OnConnectStartParams, ReactFlowInstance} from "@xyflow/react";
import {Connection} from "./types";

const testEls: T.Elements = []
const testConns: T.Connections = []

export const test = {
  elements: testEls,
  connections: testConns,
  elMap: {} as Record<string, T.ElMapData>,
}

type RFType = {
  inst(): ReactFlowInstance
}

export const RF: RFType = {
  inst() {
    return null as any
  },
}

const nodeTypes = {
  COMP: CustomNodeComp,
  GROUP: CustomNodeGroup,
}

const edgeTypes = {
  points: CustomEdgePoints,
  pointsStraight: CustomEdgePointsStraight,
}

function generateReactflowLayoutDagre(edgeDelay: number = 0) {
  const r = elementsToDagreReactflow(test.elements, test.connections)
  test.elMap = r.elementsMap
  console.log(test.elMap)
  RF.inst().setNodes(r.nodes)
  setTimeout(() => {
    RF.inst().setEdges(r.edges)
  }, edgeDelay)
}

export const generateReactflowLayout = generateReactflowLayoutDagre

export function reLayout() {
  document.body.classList.add('transitioning')
  document.body.classList.add('dragging')
  generateReactflowLayout()
  setTimeout(() => {
    document.body.classList.remove('dragging')
  }, 100)
  setTimeout(() => {
    document.body.classList.remove('transitioning')
    RF.inst().fitView({ duration: 250 })
  }, 500)
}

let groupDrop = ''
let performDrop = false
let dragging = false

const cState = collaboration.collabState

function handleOnNodeDrag(e: MouseEvent<Element>, node: Node<T.NodeData>) {
  if (!dragging) {
    dragging = true
    document.body.classList.add('dragging')
  }

  cState.interactions[node.id] = cState.interactions[node.id] || {
    selected: true,
    editing: false,
    dragging: {
      ...node.position,
      userId: collaboration.currentUser.id,
    },
  }
  cState.interactions[node.id].dragging = {
    ...node.position,
    userId: collaboration.currentUser.id,
  }

  const proj = RF.inst().project({
    x: e.clientX - 2,
    y: e.clientY - 2 - 50,
  })
  const nodes = RF.inst()
    .getIntersectingNodes({
      x: proj.x,
      y: proj.y,
      width: 5,
      height: 5,
    })
    .filter((n) => {
      const m = test.elMap[n.id]
      return n.id !== node.id && n.type === 'GROUP' && !m.path.includes(node.id)
    })

  const inmost = nodes.reduce(
    (prev, curr) => {
      const c = (curr.width || 0) * (curr.height || 0)
      const p = (prev.width || 0) * (prev.height || 0)
      if (c < p) return curr
      return prev
    },
    { id: '', width: 10000, height: 10000 } as any,
  )

  const m = test.elMap[node.id]
  if (containsElement(m.el, inmost.id)) {
    performDrop = false
    return
  }

  if (inmost.id || groupDrop) {
    performDrop = true
    groupDrop = inmost.id
    RF.inst().setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        className: inmost.id === n.id ? 'node-highlight' : '',
      })),
    )
  }
  if (!inmost.id) {
    groupDrop = ''
  }
}

function handleOnNodeDragStop(_: any, node: Node<T.NodeData>) {
  if (dragging) {
    document.body.classList.remove('dragging')
    dragging = false
  } else {
    return
  }

  cState.interactions[node.id].dragging = null

  if (performDrop) {
    performDrop = false
    const d = test.elMap[node.id]
    test.elements = actions.moveElement(
      d.el,
      d.parent,
      groupDrop,
      test.elements,
    )
    groupDrop = ''
    // reLayout()
    collaboration.update({ ...test })
  } else {
    generateReactflowLayout()
  }
}

function handleOnNodesDelete(nodes: Node<T.NodeData>[]) {
  const r = actions.removeElements({
    elements: test.elements,
    connections: test.connections,
    ids: nodes.map((n) => n.id),
  })
  test.elements = r.elements
  test.connections = r.connections
  // reLayout()
  collaboration.update({ ...test })
}

function handleOnConnectStart(_: MouseEvent, params: OnConnectStartParams) {
  document.body.classList.add('connecting')
  state.connecting.sourceId = params.nodeId || ''
}

function handleOnConnectStop() {
  document.body.classList.remove('connecting')
  state.connecting.sourceId = ''
}

function handleOnConnect(conn: Connection) {
  actions.addConnection({
    source: conn.source || '',
    target: conn.target || '',
    connections: test.connections,
  })
  // reLayout()
  collaboration.update(test)
}

function syncCollabState(s: CollabCompState) {
  test.elements = copy(s.elements)
  test.connections = copy(s.connections)
  test.elMap = copy(s.elMap)
  reLayout()
}

function handleOnInit(rf: ReactFlowInstance) {
  RF.inst = () => rf
  setTimeout(() => {
    syncCollabState(collaboration.state.data)
  }, 10)
}

events.on('CollapseGroup', 'UpdateElement', (id) => {
  actions.toggleGroupCollapse(id, test.elements)
  document.body.classList.add('dragging')
  document.body.classList.add('transitioning')
  collaboration.update(test)
  RF.inst().setEdges([])
  setTimeout(() => {
    generateReactflowLayout(300)
    setTimeout(() => {
      document.body.classList.remove('dragging')
    }, 100)
    setTimeout(() => {
      document.body.classList.remove('transitioning')
      RF.inst().fitView({ duration: 250 })
    }, 500)
  }, 10)
})

collaboration.init()

function CollabSync() {
  const c = collaboration.use()

  useEffect(() => {
    if (RF.inst()) {
      syncCollabState(c)
    }
  }, [c])

  return null
}

export function Stage() {
  return (
    <>
      <ReactFlow
        fitView
        defaultNodes={[]}
        defaultEdges={[]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={CustomConnectLine}
        onInit={handleOnInit}
        onNodeDrag={handleOnNodeDrag}
        onNodeDragStop={handleOnNodeDragStop}
        onNodesDelete={handleOnNodesDelete}
        onConnectStart={handleOnConnectStart}
        onConnectEnd={handleOnConnectStop}
        onConnect={handleOnConnect}
      >
        <Background color={Colors.GRAY1} />
      </ReactFlow>
      <CollabSync />
    </>
  )
}
