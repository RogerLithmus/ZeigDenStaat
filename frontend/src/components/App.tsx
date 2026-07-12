/* eslint-disable tailwindcss/no-custom-classname */
import { useState, useEffect } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { DetailPanel } from './DetailPanel'
import { NetworkCanvas } from './NetworkCanvas'
import { NodeData, EdgeData, BackendNode, BackendEdge } from '../types'
import { getAbbrev } from '../utils'

function App() {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      'http://localhost:5038/api/state-graph'

    fetch(backendUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Verbindungsfehler zum .NET Backend')
        return res.json()
      })
      .then((data: { nodes: BackendNode[]; edges: BackendEdge[] }) => {
        const ministriesCount =
          data.nodes.filter((n) => n.classification !== 'parliament').length ||
          9
        let ministryIndex = 0

        const mappedNodes: NodeData[] = data.nodes.map((node) => {
          const isParliament = node.classification === 'parliament'
          let x = 400
          let y = 300

          if (!isParliament) {
            const angle = ministryIndex * ((2 * Math.PI) / ministriesCount)
            x = 400 + 220 * Math.cos(angle)
            y = 300 + 220 * Math.sin(angle)
            ministryIndex++
          }

          return {
            id: node.id,
            name: node.name,
            abbrev: getAbbrev(node.name, node.abbrev),
            type: isParliament ? 'parliament' : 'ministry',
            x,
            y,
            location: node.location || 'Berlin',
            description: node.description,
            head: node.head
          }
        })

        console.log(mappedNodes)

        setNodes(mappedNodes)
        setEdges(data.edges)

        const centerNode =
          mappedNodes.find((n) => n.type === 'parliament') ||
          mappedNodes[0] ||
          null
        setSelectedNode(centerNode)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Fetch error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dominant text-on-dominant">
        <div className="space-y-4 text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-b-2 border-accent" />
          <p className="text-sm font-semibold">
            Lade Daten vom .NET Backend...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dominant p-4 text-on-dominant">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-secondary p-8 text-center shadow-2xl">
          <span className="text-4xl">❌</span>
          <h2 className="mt-4 text-xl font-bold">Verbindungsfehler</h2>
          <p className="mt-2 text-sm text-on-secondary/70">
            Die Daten konnten nicht vom .NET Backend geladen werden. Stellen Sie
            sicher, dass das Backend unter{' '}
            <code className="rounded bg-dominant/50 px-1 py-0.5 text-accent">
              http://localhost:5038
            </code>{' '}
            läuft.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-accent px-5 py-2.5 font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-95"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-dominant font-sans text-on-dominant selection:bg-accent selection:text-on-accent">
      <Header />
      <main className="relative flex grow flex-col lg:flex-row">
        <NetworkCanvas
          nodes={nodes}
          edges={edges}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
        />
        <DetailPanel selectedNode={selectedNode} />
      </main>
      <Footer />
    </div>
  )
}

export default App
