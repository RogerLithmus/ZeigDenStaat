import React, { useState, useEffect, useRef, useMemo } from "react";
import { mockStateData } from "../data/mockData";
import type { Ministry, Agency } from "../data/mockData";
import { motion } from "framer-motion";
import { Waves, Compass, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ConceptDeepSeaProps {
  onSelectEntity: (entity: { type: "ministry" | "agency"; data: Ministry | Agency; parentMinistryName?: string }) => void;
  selectedEntity: any;
}

interface SonarPing {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
}

export const ConceptDeepSea: React.FC<ConceptDeepSeaProps> = ({ onSelectEntity, selectedEntity }) => {
  // Viewport Sizing States
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 850, height: 550 });

  // Camera State
  const [zoom, setZoom] = useState<number>(0.8);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Panning Drag references
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);

  // Spotlight coordinates in local abyssal space coordinates
  const [localPos, setLocalPos] = useState<{ x: number; y: number }>({ x: 600, y: 400 });

  const tickRef = useRef<number>(0);
  const pingIdRef = useRef<number>(0);

  const [sonarPings, setSonarPings] = useState<SonarPing[]>([]);
  const [tick, setTick] = useState<number>(0);
  const [flashlightOn, setFlashlightOn] = useState<boolean>(true);

  // 1. Global Precompute ranges for database-agnostic scaling
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

    // Fallbacks to avoid infinity/NaN if dataset is empty or static
    if (minBudget === maxBudget) { minBudget = 0.1; maxBudget = Math.max(1.0, maxBudget); }
    if (minEmployees === maxEmployees) { minEmployees = 10; maxEmployees = Math.max(100, maxEmployees); }

    return { minBudget, maxBudget, minEmployees, maxEmployees };
  }, []);

  const getNormBudget = (budget: number) => {
    const { minBudget, maxBudget } = datasetRanges;
    if (maxBudget === minBudget) return 0.5;
    return (Math.sqrt(budget) - Math.sqrt(minBudget)) / (Math.sqrt(maxBudget) - Math.sqrt(minBudget));
  };

  const getNormEmployees = (employees: number) => {
    const { minEmployees, maxEmployees } = datasetRanges;
    if (maxEmployees === minEmployees) return 0.5;
    return (Math.sqrt(employees) - Math.sqrt(minEmployees)) / (Math.sqrt(maxEmployees) - Math.sqrt(minEmployees));
  };

  // 2. Dynamic Ocean Dimensions & Layout Settings
  const oceanW = 1200;
  const N = mockStateData.length;
  const oceanH = useMemo(() => {
    return Math.max(2200, 600 + N * 150);
  }, [N]);
  const cx = oceanW / 2;
  const cy = oceanH / 2;

  const [depthLimit, setDepthLimit] = useState<number>(3000);

  // Sync depthLimit with oceanH when dataset loads
  useEffect(() => {
    setDepthLimit(oceanH);
  }, [oceanH]);

  // Resize Observer for tracking viewport dimensions
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

  const defaultZoomRef = useRef<number>(0.8);
  const defaultPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update starting default zoom & pan based on responsive container dimensions
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const targetZoom = Math.min(0.95, Math.max(0.45, dimensions.width / 1150));
      defaultZoomRef.current = targetZoom;
      // Focus the viewport vertically around local y = 350 (top of the abyss)
      defaultPanRef.current = {
        x: 0,
        y: (cy - 350) * targetZoom
      };

      setZoom(targetZoom);
      setPanOffset(defaultPanRef.current);
    }
  }, [dimensions.width, dimensions.height, cy]);

  // Bind mouse-wheel scroll zoom to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input") || target.closest(".no-zoom")) return;

      e.preventDefault();
      const zoomFactor = 1.05;
      setZoom((prevZoom) => {
        const nextZoom = e.deltaY < 0 
          ? Math.min(2.5, prevZoom * zoomFactor) 
          : Math.max(0.3, prevZoom / zoomFactor);
        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Floating physics animation loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      tickRef.current += 0.015;
      setTick(tickRef.current);

      // Grow sonar pings
      setSonarPings((prevPings) =>
        prevPings
          .map((ping) => ({ ...ping, radius: ping.radius + 6 }))
          .filter((ping) => ping.radius < ping.maxRadius)
      );

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Coordinate transformations
  const getLocalCoords = (mx: number, my: number) => {
    const lx = (mx - dimensions.width / 2 - panOffset.x) / zoom + cx;
    const ly = (my - dimensions.height / 2 - panOffset.y) / zoom + cy;
    return { x: lx, y: ly };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Handle Active Dragging Camera
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragDistanceRef.current = Math.sqrt(dx * dx + dy * dy);

      setPanOffset({
        x: dragOffsetStartRef.current.x + dx,
        y: dragOffsetStartRef.current.y + dy
      });
      return;
    }

    // Set local spotlight position
    const local = getLocalCoords(mx, my);
    setLocalPos(local);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only

    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".group") || target.closest("input")) {
      return;
    }

    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetStartRef.current = { ...panOffset };
    dragDistanceRef.current = 0;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only trigger ping if we didn't drag the viewport
    if (dragDistanceRef.current >= 5) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const local = getLocalCoords(clickX, clickY);

    // Spawn Sonar Ping
    const newPing: SonarPing = {
      id: pingIdRef.current++,
      x: local.x,
      y: local.y,
      radius: 0,
      maxRadius: 280,
    };
    setSonarPings((prev) => [...prev, newPing]);
  };

  const handleReset = () => {
    setDepthLimit(oceanH);
    setSonarPings([]);
    setFlashlightOn(true);
    setZoom(defaultZoomRef.current);
    setPanOffset(defaultPanRef.current);
  };

  // Grid coordinates mapping - dynamically distributed over 3 spacious columns
  const seaNodes = useMemo(() => {
    return mockStateData.map((m, idx) => {
      // Dynamic physical depth representation from 400m down to (oceanH - 200)m
      const maxDepth = oceanH - 200;
      const baseDepth = 400 + (idx / (mockStateData.length - 1 || 1)) * (maxDepth - 400);

      // Distribute across 3 columns to fully resolve coordinate congestion
      const colIdx = idx % 3;
      let xPos = 600; // middle
      if (colIdx === 0) xPos = 250;
      else if (colIdx === 2) xPos = 950;

      // Evenly scale vertical offsets down the dynamic oceanH abyss
      const yPos = 180 + (idx / (mockStateData.length - 1 || 1)) * (oceanH - 550);

      const numAgencies = m.agencies.length;

      return {
        id: m.id,
        type: "ministry" as const,
        name: m.name,
        abbreviation: m.abbreviation,
        depth: baseDepth,
        x: xPos,
        y: yPos,
        budget: m.budget,
        employees: m.employees,
        color: m.color,
        quirk: m.quirk,
        originalData: m,
        agencies: m.agencies.map((a, aIdx) => {
          const agencyDepth = baseDepth + 150 + aIdx * 100;
          
          // Fan out agency nodes downwards relative to parent column
          let angle: number;
          if (numAgencies === 1) {
            if (colIdx === 0) angle = Math.PI * 0.25;
            else if (colIdx === 2) angle = Math.PI * 0.75;
            else angle = Math.PI * 0.5;
          } else {
            // Distribute between startAngle and endAngle based on column index
            let startAngle = Math.PI * 0.35;
            let endAngle = Math.PI * 0.65;
            if (colIdx === 0) {
              startAngle = Math.PI * 0.1;
              endAngle = Math.PI * 0.45;
            } else if (colIdx === 2) {
              startAngle = Math.PI * 0.9;
              endAngle = Math.PI * 0.55;
            }
            
            // Distribute linearly
            const step = (endAngle - startAngle) / (numAgencies - 1 || 1);
            angle = startAngle + aIdx * step;
          }

          // Alternate radius slightly for odd/even agency indices to avoid crowding
          const radius = 100 + (aIdx % 2 === 0 ? 0 : 25);
          const ax = xPos + Math.cos(angle) * radius;
          const ay = yPos + Math.sin(angle) * radius;

          return {
            id: a.id,
            type: "agency" as const,
            name: a.name,
            abbreviation: a.abbreviation,
            depth: agencyDepth,
            x: ax,
            y: ay,
            budget: a.budget,
            employees: a.employees,
            quirk: a.quirk,
            originalData: a,
          };
        }),
      };
    });
  }, [oceanH]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseMove} // ensure drag state updates
      onClick={handleCanvasClick}
      className={`relative w-full h-[75vh] rounded-3xl overflow-hidden bg-[#01040D] border border-teal-900/30 shadow-inner flex flex-col select-none ${
        isDraggingRef.current ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Background Water Strata */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-950/20 via-[#010612] to-black opacity-95 pointer-events-none" />

      {/* Floating plankton particles */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-[30%] left-[20%] w-1.5 h-1.5 bg-teal-400 rounded-full blur-[1px] animate-pulse" />
        <div className="absolute top-[60%] left-[80%] w-1 h-1 bg-cyan-300 rounded-full blur-[0.5px] animate-pulse duration-[2s]" />
        <div className="absolute top-[80%] left-[40%] w-2 h-2 bg-teal-500 rounded-full blur-[2px] animate-pulse duration-[3s]" />
        <div className="absolute top-[10%] left-[70%] w-1.5 h-1.5 bg-indigo-400 rounded-full blur-[1px] animate-pulse duration-[2.5s]" />
      </div>

      {/* Concept Header */}
      <div className="absolute top-6 left-6 z-30 max-w-sm pointer-events-none">
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Waves className="text-teal-400 animate-pulse" size={24} />
          Biolumineszenter Tiefsee-Apparat
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Das Staatsgefüge als Organismus im abyssalen Ozean. Glow-Pulsfrequenz = Budget, Volumen = Mitarbeiter.
        </p>
      </div>

      {/* Spotlight Flashlight & Camera Controls */}
      <div className="absolute top-6 right-6 z-30 flex gap-2 pointer-events-auto">
        {/* Camera zoom & reset toolbar */}
        <div className="flex gap-1 bg-slate-950/80 border border-teal-900/50 backdrop-blur-md rounded-xl p-1.5 shadow-md mr-2">
          <button
            onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.min(2.5, prev * 1.25)); }}
            title="Vergrößern"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-teal-900/30 active:scale-95 transition-all"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.max(0.35, prev / 1.25)); }}
            title="Verkleinern"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-teal-900/30 active:scale-95 transition-all"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            title="Kamera zurücksetzen"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-teal-900/30 active:scale-95 transition-all"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setFlashlightOn(!flashlightOn);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            flashlightOn
              ? "bg-teal-500 text-slate-950 border-teal-400 font-extrabold shadow-md shadow-teal-900/50"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
        >
          <Compass size={14} />
          {flashlightOn ? "Scheinwerfer AN" : "Scheinwerfer AUS"}
        </button>
      </div>

      {/* The Abyssal Water Space */}
      <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
        
        {/* GPU Accelerated Abyssal Viewport Space */}
        <div 
          className="absolute origin-center transition-transform duration-75 select-none"
          style={{
            width: `${oceanW}px`,
            height: `${oceanH}px`,
            top: `calc(50% - ${cy}px)`,
            left: `calc(50% - ${cx}px)`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          }}
        >
          {/* Render expanding Sonar Waves in local space */}
          {sonarPings.map((ping) => (
            <div
              key={ping.id}
              className="absolute border border-teal-400/40 rounded-full pointer-events-none animate-fade-out"
              style={{
                width: ping.radius * 2,
                height: ping.radius * 2,
                top: ping.y - ping.radius,
                left: ping.x - ping.radius,
                boxShadow: "0 0 20px rgba(20,184,166,0.15), inset 0 0 20px rgba(20,184,166,0.05)",
              }}
            />
          ))}

          {/* Render Deep Sea Creatures */}
          {seaNodes.map((node) => {
            const isStarDrowned = node.depth > depthLimit;

            // Organism float animation
            const mFloat = Math.sin(tick * 1.5 + node.depth * 0.005) * 12;

            // Check if local spotlight coordinates hover over it
            const dxM = node.x - localPos.x;
            const dyM = (node.y + mFloat) - localPos.y;
            const distM = Math.sqrt(dxM * dxM + dyM * dyM);
            const isStarInSpotlight = distM < 160;

            // Check if local sonar ping touches it
            const isHitBySonar = sonarPings.some((ping) => {
              const dxS = node.x - ping.x;
              const dyS = (node.y + mFloat) - ping.y;
              const distS = Math.sqrt(dxS * dxS + dyS * dyS);
              return Math.abs(distS - ping.radius) < 25;
            });

            // Glow intensity calculations
            const isStarSelected = selectedEntity?.data?.id === node.id;
            const pulseSpeed = 1.0 + node.budget * 0.15;
            const pulseGlow = 0.5 + Math.sin(tick * 3 * pulseSpeed) * 0.4;
            const starGlowOpacity = isStarSelected ? 1 : isHitBySonar ? 0.95 : isStarInSpotlight || !flashlightOn ? 0.8 : 0.08;

            const normEmp = getNormEmployees(node.employees);
            const normBud = getNormBudget(node.budget);
            const size = 55 + normEmp * 40; // dynamically scale from 55px to 95px

            return (
              <React.Fragment key={node.id}>
                {/* Bioluminescent Connection Tendrils between ministries and agencies */}
                {!isStarDrowned &&
                  node.agencies.map((a) => {
                    const isAgencyDrowned = a.depth > depthLimit;
                    if (isAgencyDrowned) return null;

                    const aFloat = Math.sin(tick * 1.8 + a.depth * 0.005) * 10;
                    return (
                      <svg
                        key={a.id}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      >
                        <path
                          d={`M ${node.x} ${node.y + mFloat + size / 2 - 10} Q ${(node.x + a.x) / 2 + Math.sin(tick) * 15} ${(node.y + mFloat + a.y + aFloat) / 2} ${a.x} ${a.y + aFloat - 10}`}
                          fill="none"
                          stroke={node.color}
                          strokeWidth={1.2}
                          className="opacity-25"
                          strokeDasharray="4,4"
                        />
                      </svg>
                    );
                  })}

                {/* Subordinate Polyps (Agencies) */}
                {!isStarDrowned &&
                  node.agencies.map((a) => {
                    const isAgencyDrowned = a.depth > depthLimit;
                    const aFloat = Math.sin(tick * 1.8 + a.depth * 0.005) * 10;

                    const dxPa = a.x - localPos.x;
                    const dyPa = (a.y + aFloat) - localPos.y;
                    const distPa = Math.sqrt(dxPa * dxPa + dyPa * dyPa);
                    const isAgencyInSpotlight = distPa < 140;

                    const isAgencyHitBySonar = sonarPings.some((ping) => {
                      const dxS = a.x - ping.x;
                      const dyS = (a.y + aFloat) - ping.y;
                      const distS = Math.sqrt(dxS * dxS + dyS * dyS);
                      return Math.abs(distS - ping.radius) < 25;
                    });

                    const isAgencySelected = selectedEntity?.data?.id === a.id;
                    const aGlowOpacity = isAgencySelected ? 1 : isAgencyHitBySonar ? 0.95 : isAgencyInSpotlight || !flashlightOn ? 0.8 : 0.05;

                    const normAgencyEmp = getNormEmployees(a.employees);
                    const normAgencyBud = getNormBudget(a.budget);
                    const aSize = 35 + normAgencyEmp * 20; // dynamically scale from 35px to 55px

                    return (
                      <motion.div
                        key={a.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntity({ type: "agency", data: a.originalData, parentMinistryName: node.name });
                        }}
                        className="absolute cursor-pointer z-20 group"
                        style={{
                          top: a.y + aFloat - aSize / 2,
                          left: a.x - aSize / 2,
                        }}
                        animate={{
                          scale: isAgencyDrowned ? 0.4 : 1,
                          opacity: isAgencyDrowned ? 0 : 1,
                        }}
                        transition={{ duration: 0.8 }}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div
                            className={`rounded-full flex items-center justify-center border transition-all duration-300 ${
                              isAgencySelected
                                ? "bg-white border-teal-400 shadow-[0_0_20px_#14b8a6] scale-110"
                                : "bg-[#0b1329] border-teal-500/30 hover:border-teal-400"
                            }`}
                            style={{
                              opacity: aGlowOpacity,
                              boxShadow: isAgencyInSpotlight || isAgencyHitBySonar || isAgencySelected
                                ? `0 0 ${15 + normAgencyBud * 15}px ${node.color}cc`
                                : `none`,
                              width: `${aSize}px`,
                              height: `${aSize}px`,
                            }}
                          >
                            <span className="text-[9px] font-extrabold text-teal-300">
                              {a.abbreviation}
                            </span>
                          </div>
                          
                          {/* Tentacle visuals */}
                          <div className="flex gap-1 mt-0.5 opacity-40">
                            <div className="w-0.5 h-3 bg-teal-500 rounded animate-bounce" style={{ animationDelay: "0.1s" }} />
                            <div className="w-0.5 h-4 bg-teal-400 rounded animate-bounce" style={{ animationDelay: "0.3s" }} />
                            <div className="w-0.5 h-3 bg-teal-500 rounded animate-bounce" style={{ animationDelay: "0.2s" }} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                {/* Central Leviathan Medusa (Ministry) */}
                <motion.div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntity({ type: "ministry", data: node.originalData });
                  }}
                  className="absolute cursor-pointer z-30 group"
                  style={{
                    top: node.y + mFloat - size / 2,
                    left: node.x - size / 2,
                  }}
                  animate={{
                    scale: isStarDrowned ? 0.3 : isStarSelected ? 1.15 : 1,
                    opacity: isStarDrowned ? 0 : 1,
                  }}
                  transition={{ duration: 0.8 }}
                >
                  <div
                    className={`rounded-full flex flex-col items-center justify-center relative font-black text-[10px] text-white tracking-widest transition-all duration-500 ${
                      isStarSelected
                        ? "shadow-[0_0_35px_rgba(255,255,255,1.0)] border border-white scale-105"
                        : "hover:scale-105 border border-white/5"
                    }`}
                    style={{
                      backgroundColor: `${node.color}25`,
                      borderColor: node.color,
                      opacity: starGlowOpacity,
                      boxShadow: isStarInSpotlight || isHitBySonar || isStarSelected
                        ? `0 0 ${40 + pulseGlow * 30 + normBud * 25}px ${node.color}ee, inset 0 0 15px ${node.color}99`
                        : `0 0 ${8 + normBud * 12}px ${node.color}20`,
                      width: `${size}px`,
                      height: `${size}px`,
                    }}
                  >
                    {node.abbreviation}
                    <span className="text-[8px] font-mono text-emerald-400 mt-1 font-extrabold">
                      {node.budget}B
                    </span>

                    {/* Pulsing Bioluminescent Halo */}
                    <div
                      className="absolute inset-[-8px] rounded-full border border-dashed animate-spin-slow pointer-events-none"
                      style={{ borderColor: `${node.color}30` }}
                    />

                    {/* Glowing Floating Tentacles */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 flex gap-1.5 opacity-60">
                      <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-transparent rounded-full animate-[pulse_1.2s_infinite]" />
                      <div className="w-1 h-8 bg-gradient-to-b from-teal-400 to-transparent rounded-full animate-[pulse_1.5s_infinite]" style={{ animationDelay: "0.2s" }} />
                      <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-transparent rounded-full animate-[pulse_1.1s_infinite]" style={{ animationDelay: "0.4s" }} />
                    </div>

                    {/* Label */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-950/90 border border-slate-800 text-xs font-bold text-white px-2 py-0.5 rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                      {node.name}
                    </span>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}

          {/* Real-time GPU Accelerated spotlight mask overlay */}
          {flashlightOn && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply transition-all duration-75"
              style={{
                background: `radial-gradient(circle 160px at ${localPos.x}px ${localPos.y}px, transparent 100%, rgba(2,6,23,0.985) 100%)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Abyssal Depth-Pressure Bottom controls */}
      <div className="p-6 bg-slate-950/90 border-t border-slate-900 backdrop-blur-md flex flex-col md:flex-row items-center gap-6 z-30">
        <div className="flex items-center gap-4 shrink-0 pointer-events-none">
          <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-2xl">
            <Waves className="text-teal-400 animate-pulse" size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5 font-sans">
              Tiefen-Druck-Regler
              {depthLimit < oceanH && (
                <span className="bg-teal-500 text-slate-950 text-[9px] uppercase font-black px-1.5 py-0.5 rounded animate-pulse">
                  DRUCK ERHÖHT
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Filtert Behörden nach ihrer administrative Tiefe (Meeresmeter). Zu hohem Druck weichen Ämter aus.
            </p>
          </div>
        </div>

        {/* Depth pressure slider */}
        <div className="flex-1 w-full flex items-center gap-4 no-zoom">
          <span className="text-xs font-bold text-slate-500 w-16 font-sans">0 m</span>
          <input
            type="range"
            min="300"
            max={oceanH}
            step="10"
            value={depthLimit}
            onChange={(e) => setDepthLimit(parseInt(e.target.value))}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 transition-colors focus:outline-none"
          />
          <div className="w-28 text-right bg-slate-900 rounded-xl py-1.5 px-3 border border-slate-800">
            <span className="text-xs text-teal-400 font-mono font-extrabold">
              {depthLimit.toLocaleString("de-DE")} m
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={depthLimit === oceanH}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            depthLimit < oceanH
              ? "bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-md shadow-teal-950/50"
              : "bg-slate-900 text-slate-600 cursor-not-allowed"
          }`}
        >
          <RotateCcw size={14} />
          Auftauchen
        </button>
      </div>
    </div>
  );
};

