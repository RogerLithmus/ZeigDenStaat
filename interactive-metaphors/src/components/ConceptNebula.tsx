import React, { useState, useEffect, useRef, useMemo } from "react";
import { mockStateData } from "../data/mockData";
import type { Ministry, Agency } from "../data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { Orbit, Sparkles, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ConceptNebulaProps {
  onSelectEntity: (entity: { type: "ministry" | "agency"; data: Ministry | Agency; parentMinistryName?: string }) => void;
  selectedEntity: any;
}

export const ConceptNebula: React.FC<ConceptNebulaProps> = ({ onSelectEntity, selectedEntity }) => {
  const [blackHoleMass, setBlackHoleMass] = useState<number>(0);
  const [isBlackHoleActive, setIsBlackHoleActive] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);
  const requestRef = useRef<number>(0);

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

  // Update starting default zoom based on responsive container width & galaxy size
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && mockStateData.length > 0) {
      const maxOrbitRadius = 150 + mockStateData.length * 25;
      const layoutSize = maxOrbitRadius * 2 + 160;
      const zoomX = (dimensions.width * 0.9) / layoutSize;
      const zoomY = (dimensions.height * 0.9) / layoutSize;
      const idealZoom = Math.min(1.2, Math.max(0.3, Math.min(zoomX, zoomY)));

      defaultZoomRef.current = idealZoom;
      defaultPanRef.current = { x: 0, y: 0 };

      setZoom(idealZoom);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [dimensions.width, dimensions.height]);

  // Bind mouse-wheel scroll zoom to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Avoid zoom conflict on slider inputs
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

  // Animation frame tick loop to update orbital angles in real-time
  useEffect(() => {
    const update = () => {
      setTick((prev) => prev + 0.012);
      requestRef.current = requestAnimationFrame(update);
    };
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const handleReset = () => {
    setBlackHoleMass(0);
    setIsBlackHoleActive(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBlackHoleMass(val);
    setIsBlackHoleActive(val > 0);
  };

  // Drag Panning Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only

    const target = e.target as HTMLElement;
    // Don't pan when dragging interactive sliders, buttons or stars
    if (target.closest("button") || target.closest(".group") || target.closest("input")) {
      return;
    }

    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetStartRef.current = { ...panOffset };
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragDistanceRef.current = Math.sqrt(dx * dx + dy * dy);

    setPanOffset({
      x: dragOffsetStartRef.current.x + dx,
      y: dragOffsetStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Fixed coordinates inside panned 1200x1200px universe centered at (600, 600)
  const univSize = 1200;
  const cx = univSize / 2;
  const cy = univSize / 2;

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[75vh] rounded-3xl overflow-hidden bg-[#090514] border border-violet-900/40 shadow-inner flex flex-col select-none ${
        isDraggingRef.current ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Deep Space Background Layer */}
      <div className="absolute inset-0 bg-radial-gradient from-violet-950/20 via-black to-black opacity-95 pointer-events-none" />

      {/* Floating Space Dust Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-45">
        <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-purple-500 rounded-full blur-[2px] animate-pulse" />
        <div className="absolute top-[70%] left-[15%] w-1.5 h-1.5 bg-cyan-400 rounded-full blur-[1px] animate-ping duration-[3s]" />
        <div className="absolute top-[40%] left-[80%] w-2 h-2 bg-pink-500 rounded-full blur-[2px] animate-pulse" />
        <div className="absolute top-[80%] left-[75%] w-1 h-1 bg-amber-300 rounded-full blur-[1px] animate-pulse duration-[1.5s]" />
      </div>

      {/* Cosmic Nebulous Clouds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none" />

      {/* Concept Header */}
      <div className="absolute top-6 left-6 z-20 max-w-sm pointer-events-none">
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Orbit className="text-purple-400 animate-spin-slow" size={24} />
          Bürokratie-Kosmos
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Das Staatsgefüge als galaktische Sternenkarte. Sonnen stehen für Ministerien (Glow = Budget). Ihre umkreisenden Planeten stellen Ämter dar.
        </p>
      </div>

      {/* Galaxy Camera Control Buttons */}
      <div className="absolute top-6 right-6 z-20 flex gap-2 bg-slate-950/80 border border-violet-900/50 backdrop-blur-md rounded-xl p-1.5 shadow-md">
        <button
          onClick={() => setZoom(prev => Math.min(2.5, prev * 1.25))}
          title="Vergrößern"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-violet-900/30 active:scale-95 transition-all"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(0.35, prev / 1.25))}
          title="Verkleinern"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-violet-900/30 active:scale-95 transition-all"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={() => { setPanOffset({ ...defaultPanRef.current }); setZoom(defaultZoomRef.current); }}
          title="Kamera zurücksetzen"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-violet-900/30 active:scale-95 transition-all"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* The Central Solar System / Cosmos Board (Infinite Universe Field) */}
      <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
        
        {/* GPU Accelerated Cosmic Coordinate Space Wrapper */}
        <div 
          className="absolute origin-center transition-transform duration-75 select-none"
          style={{
            width: `${univSize}px`,
            height: `${univSize}px`,
            top: `calc(50% - ${cy}px)`,
            left: `calc(50% - ${cx}px)`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          }}
        >
          {/* Render central vortex (Black Hole Singularity) */}
          <AnimatePresence>
            {isBlackHoleActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1 + blackHoleMass / 20, opacity: 0.8 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute z-10 w-24 h-24 rounded-full bg-black border-4 border-dashed border-purple-500/80 shadow-[0_0_50px_rgba(168,85,247,0.7)] flex items-center justify-center pointer-events-none"
                style={{
                  top: cy - 48,
                  left: cx - 48,
                }}
              >
                {/* Spinning Vortex Overlay */}
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-950 via-black to-indigo-950 animate-spin-slow opacity-90 relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-purple-500/40 animate-ping opacity-35" />
                  <div className="absolute w-4 h-4 bg-white rounded-full blur-[4px] opacity-80" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Stars & Moons with elegant staggered Archimedean Spiral Orbits */}
          {mockStateData.map((m, idx) => {
            const isStarCollapsed = isBlackHoleActive && m.budget < blackHoleMass;

            // Wide spacing distribution dynamically scaled with the number of ministries to prevent neighbor overlap
            const N = mockStateData.length;
            const minRadius = 100;
            const maxRadius = 150 + N * 25; 
            const starOrbitRadius = minRadius + (idx / (mockStateData.length - 1 || 1)) * (maxRadius - minRadius);
            
            // Slower orbital velocity for outer stars
            const starSpeed = 0.22 - (idx / mockStateData.length) * 0.12;
            
            // Stagger start angles along an Archimedean Galaxy Spiral on load
            const spiralStaggerAngle = (idx / mockStateData.length) * Math.PI * 4; 
            const starAngle = tick * starSpeed + spiralStaggerAngle;

            // Star Coordinates relative to (600, 600)
            let sx = cx + Math.cos(starAngle) * starOrbitRadius;
            let sy = cy + Math.sin(starAngle) * starOrbitRadius;

            // Spiral into black hole suction calculation if budget is swallowed
            if (isStarCollapsed) {
              const spiralTick = Math.max(0, 1 - (blackHoleMass - m.budget) / (blackHoleMass || 1));
              const collapsedRadius = starOrbitRadius * spiralTick;
              const fastAngle = starAngle + (1 - spiralTick) * 8.5; // spin faster at the event horizon
              sx = cx + Math.cos(fastAngle) * collapsedRadius;
              sy = cy + Math.sin(fastAngle) * collapsedRadius;
            }

            const empDelta = Math.sqrt(datasetRanges.maxEmployees) - Math.sqrt(datasetRanges.minEmployees) || 1;
            const budDelta = Math.sqrt(datasetRanges.maxBudget) - Math.sqrt(datasetRanges.minBudget) || 1;

            const normEmp = (Math.sqrt(m.employees) - Math.sqrt(datasetRanges.minEmployees)) / empDelta;
            const normBud = (Math.sqrt(m.budget) - Math.sqrt(datasetRanges.minBudget)) / budDelta;

            const starSize = 22 + normEmp * 28; // Dynamic scale: 22px to 50px
            const isStarSelected = selectedEntity?.data?.id === m.id;

            return (
              <React.Fragment key={m.id}>
                {/* Majestic Galaxy Orbit Rings around the Black Hole */}
                {!isStarCollapsed && (
                  <div
                    className="absolute border border-purple-950/20 rounded-full pointer-events-none"
                    style={{
                      width: starOrbitRadius * 2,
                      height: starOrbitRadius * 2,
                      top: cy - starOrbitRadius,
                      left: cx - starOrbitRadius,
                    }}
                  />
                )}

                {/* Subordinate Agencies (Planets orbiting their Ministry star) */}
                {m.agencies.map((a, aIdx) => {
                  const isPlanetCollapsed = isBlackHoleActive && (a.budget < blackHoleMass || isStarCollapsed);

                  // Keep orbital paths compact (26px to 50px) to prevent system cross-collisions
                  const planetOrbitRadius = 26 + aIdx * 9;
                  const planetSpeed = 0.75 + aIdx * 0.25;
                  const planetAngle = tick * planetSpeed + (aIdx * Math.PI);

                  // Absolute Coordinates of moons
                  let px = sx + Math.cos(planetAngle) * planetOrbitRadius;
                  let py = sy + Math.sin(planetAngle) * planetOrbitRadius;

                  // Black Hole suction for moons
                  if (isPlanetCollapsed) {
                    const spiralTick = Math.max(0, 1 - (blackHoleMass - a.budget) / (blackHoleMass || 1));
                    const currentRadiusToCenter = Math.sqrt(Math.pow(px - cx, 2) + Math.pow(py - cy, 2));
                    const collapsedRadius = currentRadiusToCenter * spiralTick;
                    const fastAngle = Math.atan2(py - cy, px - cx) + (1 - spiralTick) * 11;
                    px = cx + Math.cos(fastAngle) * collapsedRadius;
                    py = cy + Math.sin(fastAngle) * collapsedRadius;
                  }

                  const normAgencyEmp = (Math.sqrt(a.employees) - Math.sqrt(datasetRanges.minEmployees)) / empDelta;
                  const planetSize = 8 + normAgencyEmp * 10; // Dynamic scale: 8px to 18px
                  const isPlanetSelected = selectedEntity?.data?.id === a.id;

                  return (
                    <motion.div
                      key={a.id}
                      className="absolute cursor-pointer z-20 group"
                      onClick={() => onSelectEntity({ type: "agency", data: a, parentMinistryName: m.name })}
                      style={{
                        top: py - planetSize / 2,
                        left: px - planetSize / 2,
                      }}
                      animate={{
                        scale: isPlanetCollapsed ? 0 : 1,
                        opacity: isPlanetCollapsed ? 0 : 1,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Orbital body planet */}
                      <div
                        className={`rounded-full relative border transition-all ${
                          isPlanetSelected
                            ? "bg-white shadow-[0_0_15px_#818cf8] border-indigo-300"
                            : "bg-slate-700 hover:bg-slate-500 hover:scale-125"
                        }`}
                        style={{
                          width: planetSize,
                          height: planetSize,
                          borderColor: m.color,
                          boxShadow: `0 0 10px ${m.color}50`,
                        }}
                      >
                        {/* Compact Moon Orbit Path */}
                        <div
                          className="absolute border border-dashed border-slate-700/10 rounded-full pointer-events-none"
                          style={{
                            width: planetOrbitRadius * 2,
                            height: planetOrbitRadius * 2,
                            top: planetSize / 2 - planetOrbitRadius,
                            left: planetSize / 2 - planetOrbitRadius,
                          }}
                        />

                        {/* Agency Tag Hover Tooltip */}
                        <span className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-300 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
                          {a.abbreviation}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Central Star (Ministry) */}
                <motion.div
                  className="absolute cursor-pointer z-30 group"
                  onClick={() => onSelectEntity({ type: "ministry", data: m })}
                  style={{
                    top: sy - starSize / 2,
                    left: sx - starSize / 2,
                  }}
                  animate={{
                    scale: isStarCollapsed ? 0 : isStarSelected ? 1.2 : 1,
                    opacity: isStarCollapsed ? 0 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 12 }}
                >
                  <div
                    className={`rounded-full flex items-center justify-center relative font-black text-[9px] text-white tracking-wider transition-all duration-300 ${
                      isStarSelected
                        ? "shadow-[0_0_35px_rgba(255,255,255,1.0)] border border-white scale-105"
                        : "hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.75)] border border-white/15"
                    }`}
                    style={{
                      width: starSize,
                      height: starSize,
                      backgroundColor: m.color,
                      boxShadow: `0 0 ${14 + normBud * 26}px ${m.color}bb`,
                    }}
                  >
                    {m.abbreviation}

                    {/* Solar flares/glow animations around sun */}
                    <div
                      className="absolute inset-[-6px] rounded-full border border-dashed animate-spin-slow pointer-events-none animate-duration-[20s]"
                      style={{ borderColor: `${m.color}30` }}
                    />
                    <div
                      className="absolute inset-[-12px] rounded-full border border-double border-white/5 animate-pulse pointer-events-none"
                    />

                    {/* Ministry tooltip label */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 bg-slate-950/90 border border-slate-800 text-xs font-bold text-white px-2 py-0.5 rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                      {m.name} ({m.budget} Mrd. €)
                    </span>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Galactic Bottom Control Board (Budget Schwarzes Loch) */}
      <div className="p-6 bg-slate-950/90 border-t border-slate-900 backdrop-blur-md flex flex-col md:flex-row items-center gap-6 z-20">
        <div className="flex items-center gap-4 shrink-0 pointer-events-none">
          <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl">
            <Sparkles className={`text-purple-400 ${isBlackHoleActive ? "animate-spin-slow" : ""}`} size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5 font-sans">
              Budget-Vakuum (Schwarzes Loch)
              {isBlackHoleActive && (
                <span className="animate-pulse bg-purple-600 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">
                  SINGULARITÄT MASSIV
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Simuliert Sparauflagen als kosmisches Schwarzes Loch. Instanzen unterhalb der Grenzmasse werden hineingesaugt.
            </p>
          </div>
        </div>

        {/* Gravity controller slider */}
        <div className="flex-1 w-full flex items-center gap-4 no-zoom">
          <span className="text-xs font-bold text-slate-500 w-16">0 Mrd. €</span>
          <input
            type="range"
            min="0"
            max={datasetRanges.maxBudget}
            step={datasetRanges.maxBudget > 100 ? "1" : "0.1"}
            value={blackHoleMass}
            onChange={handleSliderChange}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-colors focus:outline-none"
          />
          <div className="w-28 text-right bg-slate-900 rounded-xl py-1.5 px-3 border border-slate-800">
            <span className="text-xs text-purple-400 font-mono font-extrabold">
              {blackHoleMass.toFixed(1)} Mrd. €
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={blackHoleMass === 0}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            blackHoleMass > 0
              ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-950/50"
              : "bg-slate-900 text-slate-600 cursor-not-allowed"
          }`}
        >
          <RotateCcw size={14} />
          Vakuum abschalten
        </button>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
