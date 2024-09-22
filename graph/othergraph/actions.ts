import * as T from './types'
import { walkTree, randBg } from './util'

type AddElementInput = {
  toId: string
  type: string
  els: T.Elements
  bg?: string
}

export function addElement({ toId, type, els, bg }: AddElementInput) {
  const num = Math.random().toString().slice(3, 6)
  const id = `${type}${num}`
  const El: T.Element = {
    id,
    name: `Comp ${num}`,
    type: 'comp',
  }

  if (type === 'group') {
    El.name = `Group ${num}`
    El.type = 'group'
    El.children = []
    El.collapsed = false
    El.bg = bg || randBg()
  }

  if (!toId) {
    els.push(El)
    return
  }

  els.forEach((el) => {
    walkTree(el, 'children', (child) => {
      if (child.id === toId && child.children) {
        child.children.push(El)
      }
    })
  })
}

type RemoveElementsInput = {
  ids: string[]
  elements: T.Elements
  connections: T.Connections
}

export function removeElements(input: RemoveElementsInput) {
  const remaining: string[] = []

  const els = input.elements.filter((el) => {
    if (input.ids.includes(el.id)) {
      return false
    }
    walkTree(el, 'children', (child) => {
      if (child.type === 'comp') {
        remaining.push(child.id)
      }
      if (child.children) {
        child.children = child.children.filter((c) => !input.ids.includes(c.id))
        child.children.forEach((c) => {
          if (c.type === 'comp') {
            remaining.push(c.id)
          }
        })
      }
    })
    return true
  })

  const conns = input.connections.filter(
    (c) => remaining.includes(c.comp1) && remaining.includes(c.comp2),
  )

  return {
    elements: els,
    connections: conns,
  }
}

export function updateElement(
  id: string,
  els: T.Elements,
  fn: (el: T.Element) => void,
) {
  els.forEach((_el) => {
    if (_el.id === id) {
      fn(_el)
      return
    }
    walkTree(_el, 'children', (child) => {
      if (child.id === id) {
        fn(child)
      }
    })
  })
}

type AddConnectionInput = {
  source: string
  target: string
  connections: T.Connections
}

export function addConnection(input: AddConnectionInput) {
  const num = Math.random().toString().slice(3, 8)
  const id = `conn${num}`
  input.connections.push({
    id,
    comp1: input.source,
    comp2: input.target,
  })
}

export function toggleGroupCollapse(id: string, els: T.Elements) {
  els.forEach((el) => {
    if (el.id === id) {
      el.collapsed = !el.collapsed
      return
    }

    walkTree(el, 'children', (_el) => {
      if (_el.id === id) {
        _el.collapsed = !_el.collapsed
      }
    })
  })
}

export function moveElement(
  el: T.Element,
  fromId: string,
  toId: string,
  elements: T.Elements,
) {
  const data = { elements }

  if (!fromId) {
    data.elements = data.elements.filter((e) => e.id !== el.id)
  }

  data.elements.forEach((_el) => {
    walkTree(_el, 'children', (n) => {
      if (n.id === fromId && n.children) {
        n.children = n.children.filter((e) => e.id !== el.id)
      }
      if (n.id === toId && n.children) {
        n.children.push(el)
      }
    })
  })

  if (!toId) {
    data.elements.push(el)
  }

  return data.elements
}
