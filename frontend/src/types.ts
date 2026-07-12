export interface NodeData {
  id: string
  name: string
  abbrev: string
  type: 'parliament' | 'ministry'
  x: number
  y: number
  location: string
  description: string
  head: string
}

export interface EdgeData {
  from: string
  to: string
}

export interface BackendNode {
  id: string
  name: string
  parentId?: string | null
  depth: number
  classification: string
  jurisdiction: string
  location?: string
  description: string
  head: string
  abbrev?: string
}

export interface BackendEdge {
  from: string
  to: string
}
