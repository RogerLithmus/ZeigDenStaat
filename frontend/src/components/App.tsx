/* eslint-disable tailwindcss/no-custom-classname */
import { useState, useRef, useEffect } from 'react'
import { MinistryIcon, hasMinistryIcon } from './MinistryIcons'

interface NodeData {
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

interface EdgeData {
  from: string
  to: string
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 410 410"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M205 410C318.218 410 410 318.218 410 205C410 91.7816 318.218 0 205 0C91.7816 0 0 91.7816 0 205C0 318.218 91.7816 410 205 410ZM205 360C290.604 360 360 290.604 360 205C360 119.396 290.604 50 205 50C119.396 50 50 119.396 50 205C50 290.604 119.396 360 205 360Z"
        fill="currentColor"
      />
    </svg>
  )
}

function getAbbrev(name: string, abbrev?: string): string {
  if (abbrev) return abbrev

  const match = name.match(/\(([^)]+)\)/)
  if (match) return match[1]
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

interface BackendNode {
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

interface BackendEdge {
  from: string
  to: string
}

function App() {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)

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

  // Zooming with mouse wheel inside SVG
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const zoomIntensity = 0.1
    const nextScale =
      e.deltaY < 0 ? scale * (1 + zoomIntensity) : scale * (1 - zoomIntensity)
    setScale(Math.max(0.3, Math.min(4, nextScale)))
  }

  // Panning/Dragging event handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - translateX, y: e.clientY - translateY }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return
    setTranslateX(e.clientX - dragStart.current.x)
    setTranslateY(e.clientY - dragStart.current.y)
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setScale((prev) => Math.min(4, prev + 0.15))
  const handleZoomOut = () => setScale((prev) => Math.max(0.3, prev - 0.15))
  const handleReset = () => {
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
  }

  // Bind mouse wheel programmatically with passive: false to prevent body scrolling
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault()
    }

    svgEl.addEventListener('wheel', preventScroll, { passive: false })
    return () => {
      svgEl.removeEventListener('wheel', preventScroll)
    }
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
      {/* HEADER: Blank header with logo + name */}
      <header className="sticky top-0 z-50 border-b border-accent/15 bg-secondary/95 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg border border-accent/20 bg-accent/10 p-1">
              <LogoIcon className="size-7 text-accent" />
            </div>
            <span className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-on-secondary">
              <span className="text-accent">🏛️</span> ZeigDenStaat
            </span>
          </div>
        </div>
      </header>

      {/* CANVAS MAIN BODY */}
      <main className="relative flex grow flex-col lg:flex-row">
        {/* Left Side: SVG Network Canvas */}
        <div className="relative h-[500px] grow cursor-grab select-none overflow-hidden bg-dominant active:cursor-grabbing lg:h-[calc(100vh-140px)]">
          <div className="absolute left-4 top-4 z-20 flex gap-2">
            <button
              onClick={handleZoomIn}
              className="flex size-10 items-center justify-center rounded-lg border border-accent/20 bg-secondary text-lg font-bold text-on-secondary transition-all duration-150 hover:border-accent hover:bg-accent hover:text-on-accent active:scale-95"
              title="Vergrößern"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              className="flex size-10 items-center justify-center rounded-lg border border-accent/20 bg-secondary text-lg font-bold text-on-secondary transition-all duration-150 hover:border-accent hover:bg-accent hover:text-on-accent active:scale-95"
              title="Verkleinern"
            >
              -
            </button>
            <button
              onClick={handleReset}
              className="flex h-10 items-center justify-center rounded-lg border border-accent/20 bg-secondary px-3 text-xs font-semibold uppercase tracking-wider text-on-secondary transition-all duration-150 hover:border-accent hover:bg-accent hover:text-on-accent active:scale-95"
              title="Ansicht zurücksetzen"
            >
              Reset
            </button>
          </div>

          <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-accent/15 bg-secondary/80 px-3 py-1.5 text-[10px] uppercase tracking-wider text-on-secondary/80 backdrop-blur">
            🖱️ Ziehen zum Bewegen | Scrollen zum Zoomen
          </div>

          <svg
            ref={svgRef}
            data-testid="network-svg"
            className="size-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onWheel={handleWheel}
          >
            <style>
              {`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
                .animate-edge {
                  stroke-dasharray: 6, 4;
                  animation: dash 1.5s linear infinite;
                }
              `}
            </style>

            {/* Transform Group containing the graph elements */}
            <g
              transform={`translate(${translateX}, ${translateY}) scale(${scale})`}
            >
              {/* Draw Edges */}
              {edges.map((edge, index) => {
                const fromNode = nodes.find((n) => n.id === edge.from)
                const toNode = nodes.find((n) => n.id === edge.to)
                if (!fromNode || !toNode) return null

                return (
                  <line
                    key={`edge-${index}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#4d90ff"
                    strokeWidth="1.5"
                    strokeOpacity="0.45"
                    className="animate-edge"
                  />
                )
              })}

              {/* Draw Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id
                const isParliament = node.type === 'parliament'

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedNode(node)
                    }}
                    className="group cursor-pointer"
                  >
                    {/* Glowing highlight circle for selected node */}
                    <circle
                      r={isParliament ? 42 : 28}
                      fill="none"
                      stroke={isSelected ? '#4d90ff' : 'transparent'}
                      strokeWidth="2"
                      className="animate-pulse opacity-60 transition-all duration-300"
                    />

                    {/* Background Node Circle */}
                    <circle
                      r={isParliament ? 32 : 20}
                      fill={isParliament ? '#06327a' : '#03183b'}
                      stroke={isSelected ? '#4d90ff' : '#06327a'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all duration-300 group-hover:scale-110 group-hover:stroke-accent/70"
                    />

                    {/* Node Text Label */}
                    <text
                      y={isParliament ? 52 : 36}
                      textAnchor="middle"
                      fill={isSelected ? '#4d90ff' : '#ffffff'}
                      className={`select-none text-[10px] font-bold tracking-wide transition-colors duration-200 ${
                        isParliament ? 'text-xs' : ''
                      }`}
                    >
                      {node.abbrev}
                    </text>

                    {/* Visual icon representation inside circles */}
                    {(() => {
                      if (
                        node.type === 'ministry' &&
                        hasMinistryIcon(node.abbrev)
                      ) {
                        return (
                          <g transform="translate(-12, -12)">
                            <MinistryIcon
                              abbrev={node.abbrev}
                              width={24}
                              height={24}
                              className="transition-transform duration-300 group-hover:scale-110"
                            />
                          </g>
                        )
                      }
                      return (
                        <text
                          y="5"
                          textAnchor="middle"
                          className={`select-none transition-transform duration-300 group-hover:scale-110 ${
                            isParliament ? 'text-lg' : 'text-xs'
                          }`}
                        >
                          {isParliament ? '🏛️' : '💼'}
                        </text>
                      )
                    })()}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        {/* Right Side: Detail/Inspector Panel */}
        <div className="flex w-full shrink-0 flex-col justify-between border-t border-accent/20 bg-secondary p-6 shadow-2xl lg:w-[400px] lg:border-l lg:border-t-0 lg:p-8">
          {selectedNode ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                {(() => {
                  if (
                    selectedNode.type === 'ministry' &&
                    hasMinistryIcon(selectedNode.abbrev)
                  ) {
                    return (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 p-2 shadow-inner">
                        <MinistryIcon
                          abbrev={selectedNode.abbrev}
                          className="size-full"
                        />
                      </div>
                    )
                  }
                  return (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 p-2 text-2xl shadow-inner">
                      {selectedNode.type === 'parliament' ? '🏛️' : '💼'}
                    </div>
                  )
                })()}
                <div className="grow">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-accent">
                    {selectedNode.type === 'parliament'
                      ? 'Haupt-Organ / Bundestag'
                      : 'Bundesministerium'}
                  </span>
                  <h2 className="mt-1 text-2xl font-black leading-tight text-on-secondary">
                    {selectedNode.name}
                  </h2>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-accent shadow-md shadow-accent/20">
                    📍 {selectedNode.location}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-accent/10 pt-5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-on-secondary/50">
                    Beschreibung
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-on-secondary/90">
                    {selectedNode.description}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-on-secondary/50">
                    Leitung
                  </div>
                  <div className="mt-1 text-sm font-semibold text-on-secondary">
                    {selectedNode.head}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-16 text-center text-on-secondary/50">
              <span className="text-3xl">🏛️</span>
              <p className="text-sm">
                Wählen Sie eine Behörde im Canvas aus, um Details anzuzeigen.
              </p>
            </div>
          )}

          <div className="mt-8 border-t border-accent/10 pt-4 text-[10px] leading-relaxed text-on-secondary/40">
            💡 Der Deutsche Bundestag steht im Zentrum der Gesetzgebung. Die
            Bundesministerien leiten die jeweiligen Bundesressorts und sind dem
            Parlament gegenüber auskunftspflichtig.
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-accent/15 bg-secondary py-12 text-on-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <LogoIcon className="size-7 text-accent" />
                <span className="text-lg font-bold tracking-tight">
                  ZeigDenStaat
                </span>
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-on-secondary/70">
                Ein Projekt zur Förderung der Transparenz und Übersicht über die
                föderalen und kommunalen Verwaltungsstrukturen des deutschen
                Staates.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
                Projekt Links
              </h4>
              <ul className="space-y-2 text-xs text-on-secondary/80">
                <li>
                  <a
                    href="#hero"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Übersicht
                  </a>
                </li>
                <li>
                  <a
                    href="#stats"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Statistik-Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="#explorer"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Daten-Explorer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
                Rechtliches
              </h4>
              <ul className="space-y-2 text-xs text-on-secondary/80">
                <li>
                  <a
                    href="#"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Impressum
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Datenschutz
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors duration-200 hover:text-accent"
                  >
                    Nutzungsbedingungen
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-accent/10 pt-8 sm:flex-row">
            <p className="text-[11px] text-on-secondary/50">
              &copy; {new Date().getFullYear()} ZeigDenStaat. Visualisierung von
              42.233 Institutionen.
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-on-secondary/50">
              Erstellt mit <span className="text-red-500">❤️</span> für
              Transparenz.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
