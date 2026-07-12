/* eslint-disable tailwindcss/no-custom-classname */
import React, { useEffect, useRef, useState } from 'react'
import { NodeData, EdgeData } from '../types'
import { MinistryIcon, hasMinistryIcon } from './MinistryIcons'

interface NetworkCanvasProps {
  nodes: NodeData[]
  edges: EdgeData[]
  selectedNode: NodeData | null
  onSelectNode: (node: NodeData) => void
}

export function NetworkCanvas({
  nodes,
  edges,
  selectedNode,
  onSelectNode
}: NetworkCanvasProps) {
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)

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

  return (
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
                  onSelectNode(node)
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
  )
}
