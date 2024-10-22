import React from 'react';
import Dagre from './dagre'
import { MarkerType, Edge, Node } from 'reactflow'
import * as T from './types'
import { shared } from './shared'
import { sortItemsBy } from './util'

const _g = new Dagre.graphlib.Graph()
export type DagreGraph = typeof _g
export type DagreNode = ReturnType<typeof _g.node>
export type DagreEdge = ReturnType<typeof _g.edge>

const groupW = shared.compHeight + shared.padding

const maxLineChar = 18

function dynamicWidthHeight(name: string) {
  let longest = 0
  let line = ''
  const parts = name.split(' ')
  const lines: string[] = []

  if (parts.length > 1) {
    parts.forEach((part, i) => {
      const lastLine = i === parts.length - 1
      const linePlus = `${line} ${part}`

      if (linePlus.length > maxLineChar) {
        lines.push(line)
        if (line.length > longest) {
          longest = line.length
        }
        if (lastLine) {
          lines.push(part)
        }
        line = ''
      } else {
        line += line ? ` ${part}` : part
        if (line.length > longest) {
          longest = line.length
        }
        if (lastLine) {
          lines.push(line)
        }
      }
    })
  } else {
    lines.push(name)
    longest = name.length
  }

  let width = longest * 11
  let height = shared.compHeight

  width = width < shared.compHeight ? shared.compHeight : width
  const mult = lines.length - 1
  height = height + mult * (shared.compHeight / 4)

  return {
    lines,
    longest,
    width,
    height,
  }
}

function elementsToNodes(_els: T.Elements, g: DagreGraph) {
  const elementsFlat: T.Elements = []
  const elementsMap: Record<string, T.ElMapData> = {}
  const els = sortItemsBy(_els, 'id')

  function setEl(
    el: T.Element,
    par?: T.Element,
    path?: string[],
    skip?: boolean,
  ) {
    elementsFlat.push(el)
    elementsMap[el.id] = { parent: '', el, path: [] }

    if (par) {
      elementsMap[el.id].parent = par.id
      elementsMap[el.id].path = [...(path || []), par.id]
    }

    if (el.type === 'comp' && !skip) {
      const { width, height } = dynamicWidthHeight(el.name)
      g.setNode(el.id, {
        label: el.id,
        width: shared.dynamicCompWidth ? width : shared.compWidth,
        height: shared.dynamicCompWidth ? height : shared.compHeight,
      })
    }

    if (el.type === 'group' && !skip) {
      const { width, height } = dynamicWidthHeight(el.name)
      const hasChildren = el.children?.length
      const dynamic = !el.collapsed && hasChildren
      g.setNode(el.id, {
        label: el.id,
        width: dynamic ? undefined : shared.dynamicCompWidth ? width : groupW,
        height: dynamic
          ? undefined
          : shared.dynamicCompWidth
          ? height
          : groupW / 2,
      })
    }

    if (el.children) {
      sortItemsBy(el.children, 'id').forEach((c) =>
        setEl(c, el, elementsMap[el.id].path, skip || el.collapsed),
      )
    }
  }

  els.forEach((el) => setEl(el))

  elementsFlat.forEach((el) => {
    const pId = elementsMap[el.id].parent
    if (pId) {
      if (!elementsMap[pId].el.collapsed) {
        g.setParent(el.id, elementsMap[el.id].parent)
      }
    }
  })

  return {
    elementsFlat,
    elementsMap,
  }
}

export function elementsToDagre(els: T.Elements, conns: T.Connections) {
  const g = new Dagre.graphlib.Graph({
    compound: true,
    multigraph: true,
  })

  const l = elementsToNodes(els, g)
  const comps = l.elementsFlat.filter((e) => e.type === 'comp')
  const dir = shared.dynamicLayoutDirection
    ? comps.length > conns.length
      ? 'TB'
      : 'LR'
    : shared.direction

  g.setGraph({
    rankdir: dir,
    nodesep: shared.padding / 2,
    edgesep: shared.padding / 2,
  })

  conns.forEach((conn) => {
    const el1 = l.elementsMap[conn.comp1]
    const el2 = l.elementsMap[conn.comp2]
    let c1 = conn.comp1
    let c2 = conn.comp2

    el1.path.some((id) => {
      if (l.elementsMap[id].el.collapsed) {
        c1 = id
        return true
      }
      return false
    })

    el2.path.some((id) => {
      if (l.elementsMap[id].el.collapsed) {
        c2 = id
        return true
      }
      return false
    })

    if (c1 !== c2) {
      const label = `${conn.id}/${c1}/${c2}`
      g.setEdge(c1, c2, { label }, conn.id)
    }
  })

  Dagre.layout(g)

  const nodeMap: Record<string, DagreNode> = {}

  const nodes = g
    .nodes()
    .map((n) => {
      const _n = g.node(n)
      nodeMap[n] = _n
      return _n
    })
    .filter(Boolean)
  const edges = g.edges().map((e) => g.edge(e))

  return {
    g,
    nodes,
    edges,
    nodeMap,
    ...l,
  }
}

function updateAnchor(node: DagreNode) {
  return {
    x: node.x - node.width / 2,
    y: node.y - node.height / 2,
  }
}

type DagreLayoutData = ReturnType<typeof elementsToDagre>

export function dagreToReactflow(input: DagreLayoutData) {
  const nodes: Record<string, Node> = {}
  const edges: Edge[] = []

  input.nodes.forEach((n) => {
    const id = n.label || ''
    const { el, parent } = input.elementsMap[id]
    const p = input.elementsMap[parent]
    const a = updateAnchor(n)

    const node: Node<T.NodeDataBase> = {
      id,
      position: {
        x: a.x,
        y: a.y,
      },
      data: {
        width: n.width,
        height: n.height,
        bg: el.bg,
        element: el,
        handles: [],
      },
    }

    if (el.type === 'comp') {
      node.type = 'COMP'
      node.zIndex = 15
      node.dragHandle = '.drag-me'
    }
    if (el.type === 'group') {
      node.type = 'GROUP'
      node.zIndex = 5
    }
    if (p) {
      const par = updateAnchor(input.nodeMap[parent])
      if (!p.el.collapsed) {
        node.parentNode = parent
        node.position.x -= par.x
        node.position.y -= par.y
      }
    }

    nodes[id] = node
  })

  input.edges.forEach((edge) => {
    const { points, label } = edge
    const [connId, sId, tId] = label.split('/')
    const sourceHandle = `${label}_source`
    const targetHandle = `${label}_target`
    const sNode = input.nodeMap[sId]
    const tNode = input.nodeMap[tId]
    const [sPos] = points
    const tPos = points[points.length - 1]
    const sAnchor = updateAnchor(sNode)
    const tAnchor = updateAnchor(tNode)

    nodes[sId].data.handles.push({
      id: sourceHandle,
      type: 'source',
      x: Math.round(sPos.x - sAnchor.x),
      y: Math.round(sPos.y - sAnchor.y),
    })

    nodes[tId].data.handles.push({
      id: targetHandle,
      type: 'target',
      x: Math.round(tPos.x - tAnchor.x),
      y: Math.round(tPos.y - tAnchor.y),
    })

    edges.push({
      id: connId,
      source: sId,
      target: tId,
      sourceHandle,
      targetHandle,
      zIndex: 10,
      type: shared.edgeType,
      data: {
        points,
        nodeWidth: sNode.width,
        nodeHeight: sNode.height,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#000',
      },
      style: {
        stroke: '#000',
        strokeWidth: 1.5,
      },
    })
  })

  return {
    nodes: Object.values(nodes),
    edges,
    elementsMap: input.elementsMap,
  }
}

export function elementsToDagreReactflow(
  els: T.Elements,
  conns: T.Connections,
) {
  const l = elementsToDagre(els, conns)
  return dagreToReactflow(l)
}
