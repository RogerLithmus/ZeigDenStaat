import React, { useRef, useEffect, useState, useMemo } from "react";
import { mockStateData } from "../data/mockData";
import type { Ministry, Agency } from "../data/mockData";
import rough from "roughjs";
import { Eraser, MousePointer, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ConceptSketchProps {
  onSelectEntity: (entity: { type: "ministry" | "agency"; data: Ministry | Agency; parentMinistryName?: string }) => void;
  selectedEntity: any;
}

interface SketchNode {
  id: string;
  type: "ministry" | "agency";
  abbreviation: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  budget: number;
  employees: number;
  color: string;
  originalData: any;
  parentName?: string;
}

export const ConceptSketch: React.FC<ConceptSketchProps> = ({ onSelectEntity, selectedEntity }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Canvas Sizing States
  const [dimensions, setDimensions] = useState({ width: 850, height: 550 });
  const canvasWidth = dimensions.width;
  const canvasHeight = dimensions.height;

  // Tools & State
  const [tool, setTool] = useState<"pointer" | "eraser">("pointer");
  const [erasedIds, setErasedIds] = useState<Set<string>>(new Set());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [erasedAmount, setErasedAmount] = useState<number>(0);

  // Camera State
  const [zoom, setZoom] = useState<number>(0.85);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera Drag References
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);

  // Track Container Size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(400, width),
        height: Math.max(300, height)
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const defaultZoomRef = useRef<number>(0.85);
  const defaultPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Global Precompute ranges
  const datasetRanges = useMemo(() => {
    let minBudget = Infinity;
    let maxBudget = -Infinity;
    let minEmployees = Infinity;
    let maxEmployees = -Infinity;

    mockStateData.forEach((m) => {
      if (m.budget < minBudget) minBudget = m.budget;
      if (m.budget > maxBudget) maxBudget = m.budget;
      if (m.employees < minEmployees) minEmployees = m.employees;
      if (m.employees > maxEmployees) maxEmployees = m.employees;

      m.agencies.forEach((a) => {
        if (a.budget < minBudget) minBudget = a.budget;
        if (a.budget > maxBudget) maxBudget = a.budget;
        if (a.employees < minEmployees) minEmployees = a.employees;
        if (a.employees > maxEmployees) maxEmployees = a.employees;
      });
    });

    // Healthy fallbacks
    if (minBudget === maxBudget) { minBudget = 0.1; maxBudget = Math.max(1.0, maxBudget); }
    if (minEmployees === maxEmployees) { minEmployees = 10; maxEmployees = Math.max(100, maxEmployees); }

    return { minBudget, maxBudget, minEmployees, maxEmployees };
  }, []);

  // Generous concentric dual-ring staggered node layout (Zero-Overlap Guaranteed)
  const sketchNodes = useMemo<SketchNode[]>(() => {
    const list: SketchNode[] = [];
    
    // Dynamically scale concentric radii based on the number of ministries to prevent clumping
    const N = mockStateData.length;
    const baseRadiusX = 220 + N * 10;
    const baseRadiusY = 150 + N * 7;

    const empDelta = Math.sqrt(datasetRanges.maxEmployees) - Math.sqrt(datasetRanges.minEmployees) || 1;
    const budDelta = Math.sqrt(datasetRanges.maxBudget) - Math.sqrt(datasetRanges.minBudget) || 1;

    mockStateData.forEach((m, idx) => {
      const angle = (idx / mockStateData.length) * Math.PI * 2 - Math.PI / 2;
      const isEven = idx % 2 === 0;

      // Stagger radius: even items inner, odd items outer to separate neighbor clusters
      const rX = isEven ? baseRadiusX - 90 : baseRadiusX + 90;
      const rY = isEven ? baseRadiusY - 65 : baseRadiusY + 65;

      const xPos = Math.cos(angle) * rX;
      const yPos = Math.sin(angle) * rY;

      // Square-root normalization for visual compressed scalability
      const normEmp = (Math.sqrt(m.employees) - Math.sqrt(datasetRanges.minEmployees)) / empDelta;
      const normBud = (Math.sqrt(m.budget) - Math.sqrt(datasetRanges.minBudget)) / budDelta;

      // Scale box size based on budget (height) and employees (width)
      const wWidth = 75 + normEmp * 50;  // Range: 75px to 125px
      const hHeight = 50 + normBud * 45; // Range: 50px to 95px

      list.push({
        id: m.id,
        type: "ministry",
        abbreviation: m.abbreviation,
        name: m.name,
        x: xPos,
        y: yPos,
        w: wWidth,
        h: hHeight,
        budget: m.budget,
        employees: m.employees,
        color: m.color,
        originalData: m,
      });

      // Orbit subordinate agencies
      m.agencies.forEach((a, aIdx) => {
        // Stagger angles slightly around parent position to avoid overlaps
        const angleOffset = aIdx === 0 ? -0.32 : aIdx === 1 ? 0.32 : 0;
        
        // Inner ministries project inward (towards central space)
        // Outer ministries project outward (towards surrounding space)
        const projectionAngle = angle + angleOffset + (isEven ? Math.PI : 0);
        
        // comfortable dynamic radius spacing from parent
        const radius = 95 + normBud * 25; 
        
        const ax = xPos + Math.cos(projectionAngle) * radius;
        const ay = yPos + Math.sin(projectionAngle) * radius;

        const normAgencyEmp = (Math.sqrt(a.employees) - Math.sqrt(datasetRanges.minEmployees)) / empDelta;
        const normAgencyBud = (Math.sqrt(a.budget) - Math.sqrt(datasetRanges.minBudget)) / budDelta;

        const aWidth = 55 + normAgencyEmp * 30;   // Range: 55px to 85px
        const aHeight = 35 + normAgencyBud * 25;  // Range: 35px to 60px

        list.push({
          id: a.id,
          type: "agency",
          abbreviation: a.abbreviation,
          name: a.name,
          x: ax,
          y: ay,
          w: aWidth,
          h: aHeight,
          budget: a.budget,
          employees: a.employees,
          color: m.color,
          originalData: a,
          parentName: m.name,
        });
      });
    });

    return list;
  }, [datasetRanges]);

  // Bounding-Box Camera Auto-Centering
  useEffect(() => {
    if (canvasWidth > 0 && canvasHeight > 0 && sketchNodes.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      sketchNodes.forEach((node) => {
        const halfW = node.w / 2;
        const halfH = node.h / 2;
        if (node.x - halfW < minX) minX = node.x - halfW;
        if (node.x + halfW > maxX) maxX = node.x + halfW;
        if (node.y - halfH < minY) minY = node.y - halfH;
        if (node.y + halfH > maxY) maxY = node.y + halfH;
      });

      const layoutWidth = maxX - minX || 1;
      const layoutHeight = maxY - minY || 1;
      const lCenterX = (minX + maxX) / 2;
      const lCenterY = (minY + maxY) / 2;

      const zoomX = (canvasWidth * 0.85) / layoutWidth;
      const zoomY = (canvasHeight * 0.82) / layoutHeight;
      const idealZoom = Math.min(1.2, Math.max(0.35, Math.min(zoomX, zoomY)));

      defaultZoomRef.current = idealZoom;
      defaultPanRef.current = {
        x: -lCenterX * idealZoom,
        y: -lCenterY * idealZoom
      };

      setZoom(idealZoom);
      setPanOffset(defaultPanRef.current);
    }
  }, [canvasWidth, canvasHeight, sketchNodes]);

  // Compute virtual budget savings
  useEffect(() => {
    let saved = 0;
    sketchNodes.forEach(node => {
      if (erasedIds.has(node.id)) {
        saved += node.budget;
      }
    });
    setErasedAmount(parseFloat(saved.toFixed(2)));
  }, [erasedIds, sketchNodes]);

  // Main draw engine inside useEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina High-DPI support scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    // Clear and scale
    ctx.clearRect(0, 0, canvasWidth * dpr, canvasHeight * dpr);
    ctx.scale(dpr, dpr);

    // Save initial state, translate and scale camera viewport
    ctx.save();
    ctx.translate(canvasWidth / 2 + panOffset.x, canvasHeight / 2 + panOffset.y);
    ctx.scale(zoom, zoom);

    // Initialize roughjs on transformed canvas
    const rc = rough.canvas(canvas);

    // Draw background texture grid (hand-drawn grid lines extending infinitely)
    const gridSize = 50;
    const gridLimitX = 1500;
    const gridLimitY = 1000;
    
    for (let x = -gridLimitX; x <= gridLimitX; x += gridSize) {
      rc.line(x, -gridLimitY, x, gridLimitY, { roughness: 0.7, stroke: "rgba(0,0,0,0.03)" });
    }
    for (let y = -gridLimitY; y <= gridLimitY; y += gridSize) {
      rc.line(-gridLimitX, y, gridLimitX, y, { roughness: 0.7, stroke: "rgba(0,0,0,0.03)" });
    }

    // 1. Draw Connections (Wiggly dotted lines) below nodes
    sketchNodes.forEach((node) => {
      if (node.type === "agency") {
        const parent = sketchNodes.find((n) => n.type === "ministry" && n.originalData.agencies.some((a: any) => a.id === node.id));
        if (parent && !erasedIds.has(node.id) && !erasedIds.has(parent.id)) {
          rc.line(parent.x, parent.y, node.x, node.y, {
            roughness: 1.8,
            bowing: 1.2,
            stroke: "#4E4E4E",
            strokeWidth: 1.5,
            strokeLineDash: [6, 6],
          });
        }
      }
    });

    // 2. Draw Nodes (Sketched houses & agencies)
    sketchNodes.forEach((node) => {
      if (erasedIds.has(node.id)) return;

      const isHovered = hoveredNodeId === node.id;
      const isSelected = selectedEntity?.data?.id === node.id;

      // Theme colors and fill styles
      let highlightStroke = "#1E1E1E";
      let fillStyle: "hachure" | "solid" | "zigzag" | "cross-hatch" = "hachure";
      let fillColor = "transparent";

      if (isHovered || isSelected) {
        highlightStroke = node.type === "ministry" ? node.color : "#4F46E5";
        fillColor = `${highlightStroke}20`; // translucent highlit background
      }

      // Draw offset sketch shadow box
      rc.rectangle(node.x - node.w / 2 + 4, node.y - node.h / 2 + 4, node.w, node.h, {
        roughness: 1.8,
        stroke: "rgba(0,0,0,0.12)",
        strokeWidth: 1.0,
      });

      if (node.type === "ministry") {
        // Sketched House / Ministry Shape with triangular roof
        rc.polygon(
          [
            [node.x - node.w / 2 - 5, node.y - node.h / 2],
            [node.x, node.y - node.h / 2 - 25],
            [node.x + node.w / 2 + 5, node.y - node.h / 2],
          ],
          {
            roughness: 1.5,
            stroke: highlightStroke,
            strokeWidth: isHovered || isSelected ? 2.5 : 1.5,
            fill: (isHovered || isSelected) ? fillColor : undefined,
          }
        );

        // Main body rectangle
        rc.rectangle(node.x - node.w / 2, node.y - node.h / 2, node.w, node.h, {
          roughness: 1.2,
          stroke: highlightStroke,
          strokeWidth: isHovered || isSelected ? 2.2 : 1.5,
          fill: (isHovered || isSelected) ? fillColor : "rgba(255,255,255,0.78)",
          fillStyle: fillStyle,
        });

        // Architectural columns inside the ministry building
        rc.line(node.x - node.w * 0.3, node.y - node.h / 2 + 10, node.x - node.w * 0.3, node.y + node.h / 2 - 10, { roughness: 1.5, stroke: highlightStroke });
        rc.line(node.x, node.y - node.h / 2 + 10, node.x, node.y + node.h / 2 - 10, { roughness: 1.5, stroke: highlightStroke });
        rc.line(node.x + node.w * 0.3, node.y - node.h / 2 + 10, node.x + node.w * 0.3, node.y + node.h / 2 - 10, { roughness: 1.5, stroke: highlightStroke });
      } else {
        // Sketched Agency box (wind-swept office building)
        rc.rectangle(node.x - node.w / 2, node.y - node.h / 2, node.w, node.h, {
          roughness: 1.4,
          stroke: highlightStroke,
          strokeWidth: isHovered || isSelected ? 2.2 : 1.2,
          fill: (isHovered || isSelected) ? fillColor : "rgba(255,255,255,0.78)",
          fillStyle: "zigzag",
          fillWeight: 0.8,
        });

        // Small windows
        rc.circle(node.x - node.w * 0.25, node.y, 8, { roughness: 1.0, stroke: highlightStroke, strokeWidth: 1 });
        rc.circle(node.x, node.y, 8, { roughness: 1.0, stroke: highlightStroke, strokeWidth: 1 });
        rc.circle(node.x + node.w * 0.25, node.y, 8, { roughness: 1.0, stroke: highlightStroke, strokeWidth: 1 });
      }

      // Render sketched details texts manually on the canvas
      ctx.font = "bold 13px 'Architects Daughter', cursive, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isHovered || isSelected ? highlightStroke : "#1E1E1E";
      ctx.fillText(node.abbreviation, node.x, node.y - 5);

      ctx.font = "9px monospace";
      ctx.fillStyle = "#10B981";
      ctx.fillText(`${node.budget} Mrd. €`, node.x, node.y + 15);
    });

    ctx.restore();
  }, [canvasWidth, canvasHeight, hoveredNodeId, erasedIds, selectedEntity, zoom, panOffset, sketchNodes]);

  // Translate screen coordinates to local coordinate space
  const getLocalCoords = (mx: number, my: number) => {
    const lx = (mx - canvasWidth / 2 - panOffset.x) / zoom;
    const ly = (my - canvasHeight / 2 - panOffset.y) / zoom;
    return { x: lx, y: ly };
  };

  // Handle pointer hover and active dragging on canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Handle Active Dragging (Camera Pan)
    if (isDraggingRef.current && tool === "pointer") {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      
      setPanOffset({
        x: dragOffsetStartRef.current.x + dx,
        y: dragOffsetStartRef.current.y + dy
      });
      return;
    }

    // Translate coordinates
    const local = getLocalCoords(mx, my);

    // Eraser brush action
    if (tool === "eraser" && isErasing) {
      sketchNodes.forEach((node) => {
        if (erasedIds.has(node.id)) return;

        const dx = node.x - local.x;
        const dy = node.y - local.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 45) {
          const newErased = new Set(erasedIds);
          newErased.add(node.id);

          if (node.type === "ministry") {
            node.originalData.agencies.forEach((a: any) => newErased.add(a.id));
          }
          setErasedIds(newErased);
        }
      });
      return;
    }

    // Normal Node Hover detection
    let foundNodeId: string | null = null;
    sketchNodes.forEach((node) => {
      if (erasedIds.has(node.id)) return;

      const halfW = node.w / 2;
      const halfH = node.h / 2;
      if (
        local.x >= node.x - halfW && 
        local.x <= node.x + halfW && 
        local.y >= node.y - halfH && 
        local.y <= node.y + halfH
      ) {
        foundNodeId = node.id;
      }
    });

    setHoveredNodeId(foundNodeId);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (tool === "eraser") {
      setIsErasing(true);
      handleMouseMove(e); // trigger erase immediately
    } else {
      // Start Dragging Camera
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      dragOffsetStartRef.current = { ...panOffset };
      dragDistanceRef.current = 0;
    }
  };

  const handleMouseUp = () => {
    if (tool === "pointer" && isDraggingRef.current) {
      isDraggingRef.current = false;
      // If client dragged less than 5px, trigger a click!
      if (dragDistanceRef.current < 5 && hoveredNodeId) {
        const clickedNode = sketchNodes.find((n) => n.id === hoveredNodeId);
        if (clickedNode) {
          onSelectEntity({
            type: clickedNode.type,
            data: clickedNode.originalData,
            parentMinistryName: clickedNode.parentName,
          });
        }
      }
    }
    setIsErasing(false);
  };

  // Camera toolbar button handlers
  const handleZoomIn = () => setZoom(prev => Math.min(2.5, prev * 1.25));
  const handleZoomOut = () => setZoom(prev => Math.max(0.35, prev / 1.25));
  const handleResetCamera = () => {
    setZoom(defaultZoomRef.current);
    setPanOffset({ ...defaultPanRef.current });
  };

  const handleResetEraser = () => {
    setErasedIds(new Set());
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[75vh] rounded-3xl overflow-hidden bg-[#FAF6EE] border-4 border-dashed border-[#8B7E66] shadow-xl flex flex-col font-comic text-[#1E1E1E]"
    >
      {/* Cartoon Sketched Border Overlay */}
      <div className="absolute inset-0 border-2 border-double border-[#4E4E4E]/25 pointer-events-none" />

      {/* Sketched Concept Header */}
      <div className="absolute top-6 left-6 z-20 max-w-sm pointer-events-none">
        <h2 className="text-2xl font-bold tracking-tight text-[#1E1E1E] flex items-center gap-1.5 font-comic">
          <span className="text-[#E11D48] rotate-3 text-3xl font-extrabold">Comic</span> Skizzen-Staat
        </h2>
        <p className="text-xs text-[#5C5549] mt-0.5 leading-relaxed font-sans font-medium">
          Ein handgezeichneter Entwurf des Staatsapparates. Brechen wir die ministerielle Steifheit mit einem humorvollen Kritzel-Blick auf!
        </p>
      </div>

      {/* Sketched Tools panel & Camera controls */}
      <div className="absolute top-6 right-6 z-20 flex flex-wrap gap-2 pointer-events-auto bg-white/85 backdrop-blur border-2 border-[#1E1E1E] rounded-xl p-1.5 shadow-md">
        {/* Interaction Modes */}
        <div className="flex gap-1 border-r border-[#1E1E1E]/30 pr-1.5 mr-1">
          <button
            onClick={() => setTool("pointer")}
            title="Zeiger zum Verschieben und Auswählen"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all border ${
              tool === "pointer"
                ? "bg-[#1E1E1E] text-[#FAF6EE] border-[#1E1E1E]"
                : "text-[#1E1E1E] border-transparent hover:bg-slate-200"
            }`}
          >
            <MousePointer size={14} />
            Zeiger (Verschieben)
          </button>
          <button
            onClick={() => setTool("eraser")}
            title="Radiergummi zum Kürzen"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all border ${
              tool === "eraser"
                ? "bg-[#EC4899] text-white border-[#EC4899]"
                : "text-[#1E1E1E] border-transparent hover:bg-slate-200"
            }`}
          >
            <Eraser size={14} />
            Radierer
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex gap-1">
          <button
            onClick={handleZoomIn}
            title="Vergrößern"
            className="p-1.5 rounded-lg text-[#1E1E1E] hover:bg-slate-200 border border-transparent active:scale-95 transition-all"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={handleZoomOut}
            title="Verkleinern"
            className="p-1.5 rounded-lg text-[#1E1E1E] hover:bg-slate-200 border border-transparent active:scale-95 transition-all"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={handleResetCamera}
            title="Zentrieren"
            className="p-1.5 rounded-lg text-[#1E1E1E] hover:bg-slate-200 border border-transparent active:scale-95 transition-all"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main interactive Canvas */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`transition-all duration-75 ${
            tool === "eraser"
              ? "cursor-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 viewBox=%220 0 32 32%22><circle cx=%2216%22 cy=%2216%22 r=%2214%22 fill=%22%23ec4899%22 fill-opacity=%220.4%22 stroke=%22%23ec4899%22 stroke-width=%222%22/></svg>'),_pointer]"
              : isDraggingRef.current 
                ? "cursor-grabbing" 
                : "cursor-grab"
          }`}
        />
      </div>

      {/* Sketched Bottom Controls */}
      <div className="p-5 bg-white/90 border-t-4 border-double border-[#8B7E66] backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-[#FAF6EE] border-2 border-[#1E1E1E] rounded-xl rotate-[-2deg]">
            <Eraser className="text-[#EC4899]" size={22} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#1E1E1E] font-comic">
              Der Radiergummi der Anarchie
            </h4>
            <p className="text-[11px] font-sans font-medium text-[#5C5549] mt-0.5">
              Wähle den Radierer, klicke und streiche über Gebäude, um sie wegzuradieren und Haushaltsgelder einzusparen!
            </p>
          </div>
        </div>

        {/* Saved state dashboard indicator */}
        <div className="flex items-center gap-4">
          <div className="bg-[#FAF6EE] border-2 border-[#1E1E1E] rounded-xl px-4 py-1.5 flex flex-col items-center rotate-[1deg] shadow-sm">
            <span className="text-[9px] uppercase font-sans font-bold text-slate-500">
              Virtuelle Budgetersparnis
            </span>
            <span className="font-mono text-lg font-black text-[#10B981]">
              {erasedAmount.toFixed(2)} Mrd. €
            </span>
          </div>

          <button
            onClick={handleResetEraser}
            disabled={erasedIds.size === 0}
            className={`flex items-center gap-1.5 px-4 py-2 border-2 border-[#1E1E1E] rounded-xl text-xs font-bold font-sans transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#1e1e1e] ${
              erasedIds.size > 0
                ? "bg-[#FAF6EE] hover:bg-slate-100 text-[#1E1E1E]"
                : "bg-slate-200/50 text-slate-400 border-slate-300 cursor-not-allowed shadow-none"
            }`}
          >
            <RotateCcw size={13} />
            Wiederaufbau
          </button>
        </div>
      </div>
    </div>
  );
};

