import React, { useState, useEffect, useRef, useMemo } from "react";
import { mockStateData } from "../data/mockData";
import type { Ministry, Agency } from "../data/mockData";
import { RotateCcw, Activity, Building2, ShieldAlert, ZoomIn, ZoomOut, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConceptCityProps {
  onSelectEntity: (entity: { type: "ministry" | "agency"; data: Ministry | Agency; parentMinistryName?: string }) => void;
  selectedEntity: any;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: "smoke" | "spark" | "data";
}

interface HoverCar {
  id: number;
  gx: number; // grid x
  gy: number; // grid y
  targetGx: number;
  targetGy: number;
  progress: number;
  speed: number;
  color: string;
  pathSegment: number;
}

interface VolumetricCloud {
  x: number;
  y: number;
  size: number;
  speed: number;
  elements: { dx: number; dy: number; r: number }[];
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
}

export const ConceptCity: React.FC<ConceptCityProps> = ({ onSelectEntity, selectedEntity }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seismographRef = useRef<HTMLCanvasElement | null>(null);
  
  // Interactive Camera State
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isCinematicMode, setIsCinematicMode] = useState<boolean>(true);
  
  const [earthquakeThreshold, setEarthquakeThreshold] = useState<number>(0);
  const [isSeismicTesting, setIsSeismicTesting] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<{ type: "ministry" | "agency"; data: any; parentName?: string } | null>(null);

  // References for dragging
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);

  // Simulation state caches
  const particlesRef = useRef<Particle[]>([]);
  const hoverCarsRef = useRef<HoverCar[]>([]);
  const cloudsRef = useRef<VolumetricCloud[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const timeRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);
  const systemLogsRef = useRef<string[]>([]);
  const lastLogTimeRef = useRef<number>(0);

  // Setup layout anchors on the canvas
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const canvasWidth = dimensions.width;
  const canvasHeight = dimensions.height;

  // Refs for tracking default viewport centering values
  const defaultZoomRef = useRef<number>(1.0);
  const defaultPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dynamically calculate budget and employee ranges across the active dataset
  const datasetRanges = useMemo(() => {
    let minBudget = Infinity, maxBudget = -Infinity;
    let minEmployees = Infinity, maxEmployees = -Infinity;

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

  // Symmetrical Diamond Concentric Grid Layout: Database-Agnostic Generation
  const gridPositions = useMemo(() => {
    const positions: { id: string; gx: number; gy: number }[] = [];
    if (mockStateData.length === 0) return positions;

    // Sort by political weight descending (heaviest = Kanzleramt at center)
    const sorted = [...mockStateData].sort((a, b) => b.politicalWeight - a.politicalWeight);
    const centerId = sorted[0].id;
    positions.push({ id: centerId, gx: 0, gy: 0 });

    const remaining = sorted.slice(1);
    let ringIdx = 1;

    while (remaining.length > 0) {
      const ringCapacity = ringIdx * 4; // Rings house 4, 8, 12... nodes
      const currentRingNodes = remaining.splice(0, ringCapacity);

      currentRingNodes.forEach((m, idxInRing) => {
        const angle = (idxInRing / currentRingNodes.length) * Math.PI * 2 + (ringIdx * Math.PI / 4);
        const radius = ringIdx * 0.9;
        const gx = Math.cos(angle) * radius;
        const gy = Math.sin(angle) * radius;

        positions.push({
          id: m.id,
          gx: Math.round(gx * 100) / 100,
          gy: Math.round(gy * 100) / 100
        });
      });
      ringIdx++;
    }

    return positions;
  }, []);

  // Helper to project grid to 2D screen coordinates (Standard isometric project matrix)
  const projectIso = (gx: number, gy: number, cx: number, cy: number) => {
    return {
      x: cx + (gx - gy) * 115,
      y: cy + (gx + gy) * 58
    };
  };

  // Helper to initialize volumetric clouds
  useEffect(() => {
    if (cloudsRef.current.length === 0) {
      const list: VolumetricCloud[] = [];
      for (let i = 0; i < 4; i++) {
        const elementsCount = 4 + Math.floor(Math.random() * 3);
        const elements = [];
        for (let j = 0; j < elementsCount; j++) {
          elements.push({
            dx: (Math.random() - 0.5) * 35,
            dy: (Math.random() - 0.5) * 18,
            r: 25 + Math.random() * 20
          });
        }
        list.push({
          x: Math.random() * canvasWidth,
          y: 50 + Math.random() * 200,
          size: 70 + Math.random() * 50,
          speed: 0.2 + Math.random() * 0.35,
          elements
        });
      }
      cloudsRef.current = list;
    }

    // Add initial system logs
    systemLogsRef.current = [
      "SYSTEM: Cybernetic Hologram Core v2.26 online.",
      `DE-GRID: Federal ministries parsed successfully [N=${mockStateData.length}].`,
      "RAYCAST: Isometric intersection matrix initialized."
    ];
  }, []);

  // Resize Observer to track container dimensions
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

  // Bounding-Box Camera Auto-Centering
  useEffect(() => {
    if (canvasWidth > 0 && canvasHeight > 0 && gridPositions.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      const baseCx = canvasWidth / 2;
      const baseCy = canvasHeight / 2 - 20;

      // Scan projected coordinates for all elements in layout
      mockStateData.forEach((m) => {
        const pos = gridPositions.find((p: { id: string }) => p.id === m.id) || { gx: 0, gy: 0 };
        const baseScreen = projectIso(pos.gx, pos.gy, baseCx, baseCy);

        // Building dimensions estimate
        const sizeEst = 60;
        if (baseScreen.x - sizeEst < minX) minX = baseScreen.x - sizeEst;
        if (baseScreen.x + sizeEst > maxX) maxX = baseScreen.x + sizeEst;
        if (baseScreen.y - 180 < minY) minY = baseScreen.y - 180; // height offset
        if (baseScreen.y + sizeEst > maxY) maxY = baseScreen.y + sizeEst;

        m.agencies.forEach((_a, aIdx) => {
          const angle = (aIdx / m.agencies.length) * Math.PI * 2 + (m.foundingYear * 0.15);
          const orbitRadius = 0.44;
          const agx = pos.gx + Math.cos(angle) * orbitRadius;
          const agy = pos.gy + Math.sin(angle) * orbitRadius;
          const aScreen = projectIso(agx, agy, baseCx, baseCy);

          if (aScreen.x - sizeEst < minX) minX = aScreen.x - sizeEst;
          if (aScreen.x + sizeEst > maxX) maxX = aScreen.x + sizeEst;
          if (aScreen.y - 75 < minY) minY = aScreen.y - 75;
          if (aScreen.y + sizeEst > maxY) maxY = aScreen.y + sizeEst;
        });
      });

      const layoutWidth = maxX - minX;
      const layoutHeight = maxY - minY;
      const lCenterX = (minX + maxX) / 2;
      const lCenterY = (minY + maxY) / 2;

      const zoomX = (canvasWidth * 0.85) / layoutWidth;
      const zoomY = (canvasHeight * 0.82) / layoutHeight;
      const idealZoom = Math.min(1.2, Math.max(0.45, Math.min(zoomX, zoomY)));

      defaultZoomRef.current = idealZoom;
      defaultPanRef.current = {
        x: (canvasWidth / 2 - lCenterX) * idealZoom,
        y: (canvasHeight / 2 - lCenterY) * idealZoom
      };

      // Set initial zoom and offset
      setZoom(idealZoom);
      setPanOffset(defaultPanRef.current);
    }
  }, [canvasWidth, canvasHeight, gridPositions]);

  // Dispatch random tactical logs
  const checkAndAddLogs = () => {
    if (Date.now() - lastLogTimeRef.current > 4200) {
      const messages = [
        `[OK] BND reports fax transmission traffic: NOMINAL`,
        `[INFO] BMF golden calculator calibration vector: SECURE`,
        `[SYS] MerzBot-9000 completed opposition grammar scan: 0 errors`,
        `[ALRT] Security: Verfassungsschutz kleingarten unit reporting active surveillance`,
        `[INFO] Bundeswehr steam-powered field coffee engine at 100% capacity`,
        `[SYS] BaFin card-indexing crypto transaction wallet: SYNCED`,
        `[OK] BMWK deregulation manual page count: 850 pages stable`,
        `[INFO] BMG entkoffeinierter Kamillentee inventory levels: NOMINAL`,
        `[SYS] Hover-cars network congestion: 0.04% delay`,
        `[ALRT] Environmental scan: BBSR concrete drying sensors reporting passive drying`
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      systemLogsRef.current.push(randomMsg);
      if (systemLogsRef.current.length > 5) {
        systemLogsRef.current.shift();
      }
      lastLogTimeRef.current = Date.now();
    }
  };

  // Build array of buildings dynamically using grid-space coordinates for pixel-perfect z-depth sorting
  const getCityBuildings = (cx: number, cy: number) => {
    const buildings: any[] = [];

    mockStateData.forEach((m) => {
      const pos = gridPositions.find((p: { id: string }) => p.id === m.id) || { gx: 0, gy: 0 };
      const baseScreen = projectIso(pos.gx, pos.gy, cx, cy);

      // Normalization factor computations using square roots for visual compressed scalability
      const empDelta = Math.sqrt(datasetRanges.maxEmployees) - Math.sqrt(datasetRanges.minEmployees) || 1;
      const budDelta = Math.sqrt(datasetRanges.maxBudget) - Math.sqrt(datasetRanges.minBudget) || 1;

      const normEmp = (Math.sqrt(m.employees) - Math.sqrt(datasetRanges.minEmployees)) / empDelta;
      const normBud = (Math.sqrt(m.budget) - Math.sqrt(datasetRanges.minBudget)) / budDelta;

      // Parent Skyscraper
      buildings.push({
        id: m.id,
        type: "ministry",
        abbreviation: m.abbreviation,
        name: m.name,
        budget: m.budget,
        employees: m.employees,
        color: m.color,
        gradient: m.gradient,
        originalData: m,
        baseX: baseScreen.x,
        baseY: baseScreen.y,
        gx: pos.gx,
        gy: pos.gy,
        size: 26 + normEmp * 22, // Dynamic scale between 26px and 48px footprint
        maxHeight: 35 + normBud * 125, // Dynamic scale between 35px and 160px height
        foundingYear: m.foundingYear
      });

      // Subordinate agencies orbit parent in true grid space!
      m.agencies.forEach((a, aIdx) => {
        const angle = (aIdx / m.agencies.length) * Math.PI * 2 + (m.foundingYear * 0.15);
        const orbitRadius = 0.44; // orbital distance in grid cells
        
        const agx = pos.gx + Math.cos(angle) * orbitRadius;
        const agy = pos.gy + Math.sin(angle) * orbitRadius;

        const aScreen = projectIso(agx, agy, cx, cy);
        const normAgencyEmp = (Math.sqrt(a.employees) - Math.sqrt(datasetRanges.minEmployees)) / empDelta;
        const normAgencyBud = (Math.sqrt(a.budget) - Math.sqrt(datasetRanges.minBudget)) / budDelta;

        buildings.push({
          id: a.id,
          type: "agency",
          abbreviation: a.abbreviation,
          name: a.name,
          budget: a.budget,
          employees: a.employees,
          color: m.color, // uses parent ministry color scheme
          originalData: a,
          parentName: m.name,
          baseX: aScreen.x,
          baseY: aScreen.y,
          gx: agx,
          gy: agy,
          size: 16 + normAgencyEmp * 16, // Dynamic scale between 16px and 32px footprint
          maxHeight: 20 + normAgencyBud * 50, // Dynamic scale between 20px and 70px height
          foundingYear: m.foundingYear + 10
        });
      });
    });

    return buildings;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setEarthquakeThreshold(val);
    setIsSeismicTesting(val > 0);
    
    // Add screen shake proportional to budget collapse pressure
    if (val > 0) {
      screenShakeRef.current = Math.min(6, val * 0.18);
      systemLogsRef.current.push(`[ALRT] Seismischer Druck gestiegen: Schwellenwert ${val.toFixed(1)}B EUR`);
      if (systemLogsRef.current.length > 5) systemLogsRef.current.shift();
    }
  };

  const handleReset = () => {
    setEarthquakeThreshold(0);
    setIsSeismicTesting(false);
    screenShakeRef.current = 10; // reconstruction shudder
    systemLogsRef.current.push("SYSTEM: Wiederaufbau des Staatshaushaltes eingeleitet.");
    if (systemLogsRef.current.length > 5) systemLogsRef.current.shift();
  };

  // Helper PNPOLY raycasting algorithm for pixel-perfect hover checks
  const isPointInPolygon = (x: number, y: number, poly: { x: number; y: number }[]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Drag-to-pan handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetStartRef.current = { ...panOffset };
    dragDistanceRef.current = 0;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDraggingRef.current) {
      setIsCinematicMode(false); // break cinematic sweep on user pan
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      
      setPanOffset({
        x: dragOffsetStartRef.current.x + dx,
        y: dragOffsetStartRef.current.y + dy
      });
      return;
    }

    // Interactive Raycast Hover System
    // Transform screen coordinates back to zoomed/panned coordinate space
    const tx = (mx - canvasWidth / 2) / zoom + canvasWidth / 2 - panOffset.x;
    const ty = (my - canvasHeight / 2) / zoom + canvasHeight / 2 - panOffset.y;

    const baseCx = canvasWidth / 2;
    const baseCy = canvasHeight / 2 - 20;
    const buildings = getCityBuildings(baseCx, baseCy);

    let hoveredBuildings: any[] = [];

    buildings.forEach((b) => {
      const isCollapsed = b.budget < earthquakeThreshold;
      if (isCollapsed) return;

      const halfSize = b.size / 2;
      const h = b.maxHeight; 

      // Define 3D Cuboid boundary vertices in base projected coordinate space
      const poly = [
        { x: b.baseX, y: b.baseY }, // Bottom Center
        { x: b.baseX + halfSize, y: b.baseY - halfSize * 0.5 }, // Bottom Right
        { x: b.baseX + halfSize, y: b.baseY - halfSize * 0.5 - h }, // Top Right
        { x: b.baseX, y: b.baseY - halfSize - h }, // Top Top
        { x: b.baseX - halfSize, y: b.baseY - halfSize * 0.5 - h }, // Top Left
        { x: b.baseX - halfSize, y: b.baseY - halfSize * 0.5 } // Bottom Left
      ];

      if (isPointInPolygon(tx, ty, poly)) {
        hoveredBuildings.push(b);
      }
    });

    if (hoveredBuildings.length > 0) {
      // Pick the hovered building closest to the camera (depth sorted by baseY)
      hoveredBuildings.sort((a, b) => b.baseY - a.baseY);
      const chosen = hoveredBuildings[0];

      setHoveredNode({
        type: chosen.type,
        data: chosen.originalData,
        parentName: chosen.parentName
      });
    } else {
      setHoveredNode(null);
    }
  };

  const handleCanvasMouseUp = () => {
    isDraggingRef.current = false;
    
    // If user dragged less than 5px, treat it as a crisp click!
    if (dragDistanceRef.current < 5 && hoveredNode) {
      onSelectEntity({
        type: hoveredNode.type,
        data: hoveredNode.data,
        parentMinistryName: hoveredNode.parentName
      });

      // Trigger shockwave pulse on click!
      const buildings = getCityBuildings(canvasWidth / 2, canvasHeight / 2 - 20);
      const chosenBuilding = buildings.find(b => b.id === hoveredNode.data.id);
      if (chosenBuilding) {
        shockwavesRef.current.push({
          x: chosenBuilding.baseX,
          y: chosenBuilding.baseY,
          radius: 0,
          maxRadius: 180,
          color: chosenBuilding.color
        });
      }
    }
  };

  // Zoom control helpers
  const triggerZoomIn = () => {
    setIsCinematicMode(false);
    setZoom((z) => Math.min(2.2, z + 0.15));
  };

  const triggerZoomOut = () => {
    setIsCinematicMode(false);
    setZoom((z) => Math.max(0.5, z - 0.15));
  };

  const resetCamera = () => {
    setIsCinematicMode(false);
    setZoom(defaultZoomRef.current);
    setPanOffset({ ...defaultPanRef.current });
  };

  // Main Canvas Render Loop
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
    ctx.scale(dpr, dpr);

    let animId: number;

    // Center base anchor coordinates
    const baseCx = canvasWidth / 2;
    const baseCy = canvasHeight / 2 - 20;

    const buildings = getCityBuildings(baseCx, baseCy);

    // Initialize building height trackers if not present
    buildings.forEach((b) => {
      if (b.currentHeight === undefined) {
        b.currentHeight = b.maxHeight;
      }
    });

    const render = () => {
      timeRef.current += 0.02;
      const time = timeRef.current;

      // Handle cinematic camera drift
      let currentZoom = zoom;
      let currentPanX = panOffset.x;
      let currentPanY = panOffset.y;

      if (isCinematicMode) {
        // Slow gentle panning oscillation representing passive surveillance drone sweep
        currentZoom = 0.95 + Math.sin(time * 0.4) * 0.08;
        currentPanX = Math.sin(time * 0.25) * 35;
        currentPanY = Math.cos(time * 0.3) * 15;
      }

      // Add scrolling tactical logs
      checkAndAddLogs();

      // Handle screen shake
      if (screenShakeRef.current > 0.05) {
        screenShakeRef.current *= 0.88;
      } else {
        screenShakeRef.current = 0;
      }
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current;

      // Clear viewport
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Apply dynamic shading matrix: Sun position orbits slowly in 3D
      const sunX = Math.cos(time * 0.18);
      const sunZ = Math.sin(time * 0.18);

      // Compute shading factors based on normal dot-product math
      // Left Face: normal is pointing to left, Right Face: normal points to right
      const leftShading = 0.45 + 0.32 * Math.cos(time * 0.18 + Math.PI * 0.7);
      const rightShading = 0.45 + 0.32 * Math.cos(time * 0.18 - Math.PI * 0.3);
      const roofShading = 0.72 + 0.22 * Math.sin(time * 0.18);

      // START TRANSFORMATION (Zoom, Pan, Screen Shake)
      ctx.save();
      ctx.translate(canvasWidth / 2 + shakeX, canvasHeight / 2 + shakeY);
      ctx.scale(currentZoom, currentZoom);
      ctx.translate(-canvasWidth / 2 + currentPanX, -canvasHeight / 2 + currentPanY);

      // Draw futuristic circuit-board style cyber grid floor
      ctx.strokeStyle = "rgba(79, 70, 229, 0.06)";
      ctx.lineWidth = 1;
      for (let i = -7; i <= 7; i++) {
        const start1 = projectIso(i, -7, baseCx, baseCy);
        const end1 = projectIso(i, 7, baseCx, baseCy);
        ctx.beginPath();
        ctx.moveTo(start1.x, start1.y);
        ctx.lineTo(end1.x, end1.y);
        ctx.stroke();

        const start2 = projectIso(-7, i, baseCx, baseCy);
        const end2 = projectIso(7, i, baseCx, baseCy);
        ctx.beginPath();
        ctx.moveTo(start2.x, start2.y);
        ctx.lineTo(end2.x, end2.y);
        ctx.stroke();
      }

      // Draw primary concentric glowing radar wave rings sweeping from Center BKAmt
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1.8;
      for (let r = 0; r < 3; r++) {
        const radius = ((time * 48 + r * 140) % 400);
        ctx.beginPath();
        ctx.ellipse(baseCx, baseCy, radius, radius * 0.51, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw physical boundary neon ring
      ctx.strokeStyle = "rgba(79, 70, 229, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const edge1 = projectIso(-5.0, -5.0, baseCx, baseCy);
      const edge2 = projectIso(5.0, -5.0, baseCx, baseCy);
      const edge3 = projectIso(5.0, 5.0, baseCx, baseCy);
      const edge4 = projectIso(-5.0, 5.0, baseCx, baseCy);
      ctx.moveTo(edge1.x, edge1.y);
      ctx.lineTo(edge2.x, edge2.y);
      ctx.lineTo(edge3.x, edge3.y);
      ctx.lineTo(edge4.x, edge4.y);
      ctx.closePath();
      ctx.stroke();

      // DRAW DYNAMIC SKYWALK BRIDGES
      // Connect Kanzleramt (0,0) to its nearest Ring 1 neighbors
      ctx.save();
      ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
      ctx.lineWidth = 2.5;
      const bCenter = buildings.find(b => b.gx === 0 && b.gy === 0 && b.type === "ministry");
      if (bCenter && bCenter.currentHeight > 10) {
        // Find the 4 nearest ministry buildings in Ring 1
        const ring1Buildings = buildings
          .filter(b => b.type === "ministry" && !(b.gx === 0 && b.gy === 0))
          .map(b => ({
            b,
            dist: Math.sqrt(b.gx * b.gx + b.gy * b.gy)
          }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 4)
          .map(item => item.b);

        ring1Buildings.forEach((bTarget) => {
          if (bTarget && bTarget.currentHeight > 10) {
            // Isometric middle-level sky bridges
            const midYCenter = bCenter.baseY - 22;
            const midYTarget = bTarget.baseY - 22;
            ctx.beginPath();
            ctx.moveTo(bCenter.baseX, midYCenter);
            ctx.lineTo(bTarget.baseX, midYTarget);
            ctx.stroke();

            // Pulsing data packet traversing skywalk
            const prog = (time * 0.4) % 1;
            const packX = bCenter.baseX + (bTarget.baseX - bCenter.baseX) * prog;
            const packY = midYCenter + (midYTarget - midYCenter) * prog;
            ctx.fillStyle = "#38BDF8";
            ctx.beginPath();
            ctx.arc(packX, packY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
      ctx.restore();

      // DRAW NEON ISOMETRIC STREETS
      ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
      ctx.lineWidth = 4;
      // Loop streets forming a secure diamond around inner core
      const streetLoops = [
        { from: { gx: -0.9, gy: -0.9 }, to: { gx: 0.9, gy: -0.9 } },
        { from: { gx: 0.9, gy: -0.9 }, to: { gx: 0.9, gy: 0.9 } },
        { from: { gx: 0.9, gy: 0.9 }, to: { gx: -0.9, gy: 0.9 } },
        { from: { gx: -0.9, gy: 0.9 }, to: { gx: -0.9, gy: -0.9 } }
      ];
      streetLoops.forEach((seg) => {
        const start = projectIso(seg.from.gx, seg.from.gy, baseCx, baseCy);
        const end = projectIso(seg.to.gx, seg.to.gy, baseCx, baseCy);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      });

      // UPDATE & DRAW ACTIVE HOVER CARS
      // Spawn vehicles if needed
      if (Math.random() < 0.05 && hoverCarsRef.current.length < 15) {
        const segIdx = Math.floor(Math.random() * streetLoops.length);
        const segment = streetLoops[segIdx];
        hoverCarsRef.current.push({
          id: Math.random(),
          gx: segment.from.gx,
          gy: segment.from.gy,
          targetGx: segment.to.gx,
          targetGy: segment.to.gy,
          progress: 0,
          speed: 0.008 + Math.random() * 0.012,
          color: Math.random() > 0.5 ? "#38BDF8" : "#F43F5E",
          pathSegment: segIdx
        });
      }

      hoverCarsRef.current = hoverCarsRef.current.filter((car) => {
        car.progress += car.speed;
        if (car.progress >= 1.0) {
          // Route vehicle to next connected segment
          const nextSegIdx = (car.pathSegment + 1) % streetLoops.length;
          const nextSeg = streetLoops[nextSegIdx];
          car.gx = nextSeg.from.gx;
          car.gy = nextSeg.from.gy;
          car.targetGx = nextSeg.to.gx;
          car.targetGy = nextSeg.to.gy;
          car.progress = 0;
          car.pathSegment = nextSegIdx;
        }

        const currentGx = car.gx + (car.targetGx - car.gx) * car.progress;
        const currentGy = car.gy + (car.targetGy - car.gy) * car.progress;
        const carPos = projectIso(currentGx, currentGy, baseCx, baseCy);

        // Draw hover-car glowing capsule
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.ellipse(carPos.x, carPos.y, 3, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hover car underglow trail
        ctx.strokeStyle = `${car.color}25`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const prevGx = car.gx + (car.targetGx - car.gx) * Math.max(0, car.progress - 0.12);
        const prevGy = car.gy + (car.targetGy - car.gy) * Math.max(0, car.progress - 0.12);
        const prevPos = projectIso(prevGx, prevGy, baseCx, baseCy);
        ctx.moveTo(carPos.x, carPos.y);
        ctx.lineTo(prevPos.x, prevPos.y);
        ctx.stroke();

        return true;
      });

      // UPDATE AND RENDER SHOCKWAVES
      ctx.save();
      shockwavesRef.current = shockwavesRef.current.filter((sw) => {
        sw.radius += 3.5;
        if (sw.radius >= sw.maxRadius) return false;

        const alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
        ctx.strokeStyle = `${sw.color}${Math.floor(alpha * 255).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 2.5 * alpha;
        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.51, 0, 0, Math.PI * 2);
        ctx.stroke();

        return true;
      });
      ctx.restore();

      // DRAW DYNAMIC FIBER-OPTIC FLOOR CABLES FOR HOVERED/SELECTED MINISTRY
      const activeEntity = hoveredNode || selectedEntity;
      if (activeEntity) {
        const activeId = activeEntity.data.id;
        const activeType = activeEntity.type;

        let parentId = "";
        let agencyIds: string[] = [];

        if (activeType === "ministry") {
          parentId = activeId;
          const ministryData = mockStateData.find((m) => m.id === activeId);
          if (ministryData) {
            agencyIds = ministryData.agencies.map((a) => a.id);
          }
        } else {
          // Find parent ministry of this agency
          const parentMinistry = mockStateData.find((m) => m.agencies.some((a) => a.id === activeId));
          if (parentMinistry) {
            parentId = parentMinistry.id;
            agencyIds = [activeId];
          }
        }

        const bParent = buildings.find((b) => b.id === parentId);
        if (bParent && bParent.currentHeight > 10) {
          ctx.save();
          agencyIds.forEach((aId) => {
            const bAgency = buildings.find((b) => b.id === aId);
            if (bAgency && bAgency.currentHeight > 10) {
              // Draw a neon fiber-optic line on the floor
              ctx.strokeStyle = `${bParent.color}a0`;
              ctx.lineWidth = 1.6;
              
              // Draw with a slight isometric wiggle/arc for cyber aesthetic
              ctx.beginPath();
              ctx.moveTo(bParent.baseX, bParent.baseY);
              
              // control point for a beautiful curve in isometric space
              const ctrlX = (bParent.baseX + bAgency.baseX) / 2;
              const ctrlY = (bParent.baseY + bAgency.baseY) / 2 - 12;
              ctx.quadraticCurveTo(ctrlX, ctrlY, bAgency.baseX, bAgency.baseY);
              ctx.stroke();

              // Draw moving data pulses along this curve
              const pulseCount = 2;
              for (let p = 0; p < pulseCount; p++) {
                const prog = ((time * 0.6) + (p / pulseCount)) % 1;
                // Quadratic bezier interpolation formula
                const t = prog;
                const pulseX = (1 - t) * (1 - t) * bParent.baseX + 2 * (1 - t) * t * ctrlX + t * t * bAgency.baseX;
                const pulseY = (1 - t) * (1 - t) * bParent.baseY + 2 * (1 - t) * t * ctrlY + t * t * bAgency.baseY;

                ctx.fillStyle = "#FFFFFF";
                ctx.beginPath();
                ctx.arc(pulseX, pulseY, 2.2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          });
          ctx.restore();
        }
      }

      // SORT ALL BUILDINGS BY true gridY/baseY to avoid any isometric Z-fighting!
      const sortedBuildings = [...buildings].sort((a, b) => a.baseY - b.baseY);

      // Render Drop Shadows footprint first (so they don't overlay building structures)
      sortedBuildings.forEach((b) => {
        const isCollapsed = b.budget < earthquakeThreshold;
        if (isCollapsed) return;

        const halfSize = b.size / 2;
        ctx.fillStyle = "rgba(2, 4, 8, 0.4)";
        ctx.beginPath();
        ctx.moveTo(b.baseX, b.baseY);
        ctx.lineTo(b.baseX - halfSize, b.baseY - halfSize * 0.5);
        ctx.lineTo(b.baseX, b.baseY - halfSize);
        ctx.lineTo(b.baseX + halfSize, b.baseY - halfSize * 0.5);
        ctx.closePath();
        ctx.fill();
      });

      // Render Buildings Prisms
      sortedBuildings.forEach((b) => {
        const isCollapsed = b.budget < earthquakeThreshold;
        const isHovered = hoveredNode?.data?.id === b.id;
        const isSelected = selectedEntity?.data?.id === b.id;

        // Dynamic budget collapse height melting animation
        const targetH = isCollapsed ? 0 : b.maxHeight;
        if (b.currentHeight === undefined) b.currentHeight = b.maxHeight;
        b.currentHeight += (targetH - b.currentHeight) * 0.1;

        const h = b.currentHeight;

        // Vibrational structural shake before collapse
        let bShakeX = 0;
        let bShakeY = 0;
        if (!isCollapsed && isSeismicTesting && b.budget > 0) {
          const diff = b.budget - earthquakeThreshold;
          if (diff < 5.0) {
            const shakeAmt = Math.max(0.6, (5.0 - diff) * 2.0);
            bShakeX = (Math.random() - 0.5) * shakeAmt;
            bShakeY = (Math.random() - 0.5) * shakeAmt;
          }
        }

        const bx = b.baseX + bShakeX;
        const by = b.baseY + bShakeY;

        // Collapsed dust & rubble chunk drawing
        if (isCollapsed && h < 2.5) {
          ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx - 8, by - 3); ctx.lineTo(bx + 6, by + 4);
          ctx.moveTo(bx + 7, by - 4); ctx.lineTo(bx - 7, by + 3);
          ctx.stroke();

          ctx.fillStyle = "rgba(71, 85, 105, 0.5)";
          ctx.fillRect(bx - 3, by - 1, 3, 2);
          ctx.fillRect(bx + 4, by + 1, 2, 2);

          // Collapse smoke particle puff trigger
          if (Math.random() < 0.04 && particlesRef.current.length < 50) {
            particlesRef.current.push({
              x: bx + (Math.random() - 0.5) * 12,
              y: by + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 1.0,
              vy: -0.2 - Math.random() * 0.6,
              life: 0,
              maxLife: 30 + Math.random() * 20,
              color: "rgba(148, 163, 184, 0.2)",
              size: 4 + Math.random() * 5,
              type: "smoke"
            });
          }
          return;
        }

        // Collapse sparks
        if (isSeismicTesting && isCollapsed && h > 4 && Math.random() < 0.22) {
          particlesRef.current.push({
            x: bx + (Math.random() - 0.5) * b.size,
            y: by - h + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 3,
            vy: -1 - Math.random() * 2,
            life: 0,
            maxLife: 15 + Math.random() * 15,
            color: b.color,
            size: 1.5 + Math.random() * 1.5,
            type: "spark"
          });
        }

        const halfSize = b.size / 2;
        const baseColor = b.color;

        // Shaded polygon points
        const ptBottomCenter = { x: bx, y: by };
        const ptBottomLeft = { x: bx - halfSize, y: by - halfSize * 0.5 };
        const ptBottomRight = { x: bx + halfSize, y: by - halfSize * 0.5 };

        const ptTopCenter = { x: bx, y: by - h };
        const ptTopLeft = { x: bx - halfSize, y: by - halfSize * 0.5 - h };
        const ptTopRight = { x: bx + halfSize, y: by - halfSize * 0.5 - h };
        const ptTopTop = { x: bx, y: by - halfSize - h };

        const strokeColor = isSelected ? "#FFFFFF" : isHovered ? "#38BDF8" : "rgba(255, 255, 255, 0.12)";
        const strokeWidth = isSelected ? 3.0 : isHovered ? 2.0 : 1.0;

        // Base Ring underglow
        if (h > 8) {
          ctx.strokeStyle = isSelected ? "rgba(255, 255, 255, 0.3)" : isHovered ? `${baseColor}90` : `${baseColor}15`;
          ctx.lineWidth = isHovered ? 1.8 : 1;
          ctx.beginPath();
          ctx.ellipse(bx, by, b.size * 0.75, b.size * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        let innerW = halfSize;
        
        if (b.type === "ministry") {
          // MINISTRIES: Dynamic Double Stage Skyscraper Core
          const baseH = h * 0.28;
          const ptMidCenter = { x: bx, y: by - baseH };
          const ptMidLeft = { x: bx - halfSize, y: by - halfSize * 0.5 - baseH };
          const ptMidRight = { x: bx + halfSize, y: by - halfSize * 0.5 - baseH };

          // LOWER STAGE LEFT FACE
          const gradLeft1 = ctx.createLinearGradient(ptBottomLeft.x, ptBottomLeft.y, ptMidLeft.x, ptMidLeft.y);
          gradLeft1.addColorStop(0, "rgba(4, 6, 12, 0.95)");
          gradLeft1.addColorStop(1, `${baseColor}45`);
          ctx.fillStyle = gradLeft1;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.beginPath();
          ctx.moveTo(ptBottomLeft.x, ptBottomLeft.y);
          ctx.lineTo(ptBottomCenter.x, ptBottomCenter.y);
          ctx.lineTo(ptMidCenter.x, ptMidCenter.y);
          ctx.lineTo(ptMidLeft.x, ptMidLeft.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Overlay left face dynamic sun shading
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 0.72 - leftShading)})`;
          ctx.beginPath();
          ctx.moveTo(ptBottomLeft.x, ptBottomLeft.y);
          ctx.lineTo(ptBottomCenter.x, ptBottomCenter.y);
          ctx.lineTo(ptMidCenter.x, ptMidCenter.y);
          ctx.lineTo(ptMidLeft.x, ptMidLeft.y);
          ctx.closePath();
          ctx.fill();

          // LOWER STAGE RIGHT FACE
          const gradRight1 = ctx.createLinearGradient(ptBottomCenter.x, ptBottomCenter.y, ptMidCenter.x, ptMidCenter.y);
          gradRight1.addColorStop(0, "rgba(6, 10, 20, 0.95)");
          gradRight1.addColorStop(1, `${baseColor}65`);
          ctx.fillStyle = gradRight1;
          ctx.beginPath();
          ctx.moveTo(ptBottomCenter.x, ptBottomCenter.y);
          ctx.lineTo(ptBottomRight.x, ptBottomRight.y);
          ctx.lineTo(ptMidRight.x, ptMidRight.y);
          ctx.lineTo(ptMidCenter.x, ptMidCenter.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Overlay right face dynamic sun shading
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 0.72 - rightShading)})`;
          ctx.beginPath();
          ctx.moveTo(ptBottomCenter.x, ptBottomCenter.y);
          ctx.lineTo(ptBottomRight.x, ptBottomRight.y);
          ctx.lineTo(ptMidRight.x, ptMidRight.y);
          ctx.lineTo(ptMidCenter.x, ptMidCenter.y);
          ctx.closePath();
          ctx.fill();

          // UPPER SPIRE (Narrower stage)
          innerW = halfSize * 0.82;
          const ptInnerBotCenter = { x: bx, y: by - baseH };
          const ptInnerBotLeft = { x: bx - innerW, y: by - innerW * 0.5 - baseH };
          const ptInnerBotRight = { x: bx + innerW, y: by - innerW * 0.5 - baseH };

          const ptInnerTopCenter = { x: bx, y: by - h };
          const ptInnerTopLeft = { x: bx - innerW, y: by - innerW * 0.5 - h };
          const ptInnerTopRight = { x: bx + innerW, y: by - innerW * 0.5 - h };
          const ptInnerTopTop = { x: bx, y: by - innerW - h };

          // UPPER LEFT FACE
          const gradLeft2 = ctx.createLinearGradient(ptInnerBotLeft.x, ptInnerBotLeft.y, ptInnerTopLeft.x, ptInnerTopLeft.y);
          gradLeft2.addColorStop(0, "rgba(5, 7, 15, 0.9)");
          gradLeft2.addColorStop(0.85, `${baseColor}50`);
          ctx.fillStyle = gradLeft2;
          ctx.beginPath();
          ctx.moveTo(ptInnerBotLeft.x, ptInnerBotLeft.y);
          ctx.lineTo(ptInnerBotCenter.x, ptInnerBotCenter.y);
          ctx.lineTo(ptInnerTopCenter.x, ptInnerTopCenter.y);
          ctx.lineTo(ptInnerTopLeft.x, ptInnerTopLeft.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sun shading overlay
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 0.72 - leftShading)})`;
          ctx.beginPath();
          ctx.moveTo(ptInnerBotLeft.x, ptInnerBotLeft.y);
          ctx.lineTo(ptInnerBotCenter.x, ptInnerBotCenter.y);
          ctx.lineTo(ptInnerTopCenter.x, ptInnerTopCenter.y);
          ctx.lineTo(ptInnerTopLeft.x, ptInnerTopLeft.y);
          ctx.closePath();
          ctx.fill();

          // UPPER RIGHT FACE
          const gradRight2 = ctx.createLinearGradient(ptInnerBotCenter.x, ptInnerBotCenter.y, ptInnerTopCenter.x, ptInnerTopCenter.y);
          gradRight2.addColorStop(0, "rgba(8, 12, 24, 0.9)");
          gradRight2.addColorStop(0.85, `${baseColor}80`);
          ctx.fillStyle = gradRight2;
          ctx.beginPath();
          ctx.moveTo(ptInnerBotCenter.x, ptInnerBotCenter.y);
          ctx.lineTo(ptInnerBotRight.x, ptInnerBotRight.y);
          ctx.lineTo(ptInnerTopRight.x, ptInnerTopRight.y);
          ctx.lineTo(ptInnerTopCenter.x, ptInnerTopCenter.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sun shading overlay
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 0.72 - rightShading)})`;
          ctx.beginPath();
          ctx.moveTo(ptInnerBotCenter.x, ptInnerBotCenter.y);
          ctx.lineTo(ptInnerBotRight.x, ptInnerBotRight.y);
          ctx.lineTo(ptInnerTopRight.x, ptInnerTopRight.y);
          ctx.lineTo(ptInnerTopCenter.x, ptInnerTopCenter.y);
          ctx.closePath();
          ctx.fill();

          // Dynamic Glass Sheen Reflection
          const sheenOffset = (time * 0.18) % 2.5 - 1.25;
          const sheenGradLeft = ctx.createLinearGradient(
            ptInnerTopLeft.x + sheenOffset * innerW, ptInnerTopLeft.y,
            ptInnerTopLeft.x + (sheenOffset + 0.3) * innerW, ptInnerTopLeft.y
          );
          sheenGradLeft.addColorStop(0, "rgba(255, 255, 255, 0)");
          sheenGradLeft.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
          sheenGradLeft.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = sheenGradLeft;
          ctx.beginPath();
          ctx.moveTo(ptInnerBotLeft.x, ptInnerBotLeft.y);
          ctx.lineTo(ptInnerBotCenter.x, ptInnerBotCenter.y);
          ctx.lineTo(ptInnerTopCenter.x, ptInnerTopCenter.y);
          ctx.lineTo(ptInnerTopLeft.x, ptInnerTopLeft.y);
          ctx.closePath();
          ctx.fill();

          // SPIRE ROOF
          ctx.fillStyle = isSelected ? "#FFFFFF" : isHovered ? `${baseColor}ff` : `${baseColor}dd`;
          ctx.beginPath();
          ctx.moveTo(ptInnerTopLeft.x, ptInnerTopLeft.y);
          ctx.lineTo(ptInnerTopCenter.x, ptInnerTopCenter.y);
          ctx.lineTo(ptInnerTopRight.x, ptInnerTopRight.y);
          ctx.lineTo(ptInnerTopTop.x, ptInnerTopTop.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Overlay roof sun shading
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, roofShading - 0.65) * 0.45})`;
          ctx.beginPath();
          ctx.moveTo(ptInnerTopLeft.x, ptInnerTopLeft.y);
          ctx.lineTo(ptInnerTopCenter.x, ptInnerTopCenter.y);
          ctx.lineTo(ptInnerTopRight.x, ptInnerTopRight.y);
          ctx.lineTo(ptInnerTopTop.x, ptInnerTopTop.y);
          ctx.closePath();
          ctx.fill();

          // Cyber Window Grids
          if (h > 24) {
            const rows = 6;
            const cols = 2;
            const osc = 0.5 + 0.5 * Math.sin(time * 3.8 + b.foundingYear);
            ctx.fillStyle = isHovered ? "#FFFFFF" : `rgba(255, 255, 255, ${0.3 + osc * 0.5})`;

            for (let r = 0; r < rows; r++) {
              const fract = (r + 1.2) / (rows + 1.2);
              const wY = by - baseH - (h - baseH) * fract;
              
              // Spire Left Windows
              for (let c = 0; c < cols; c++) {
                const cFract = (c + 0.5) / cols;
                const wX = bx - innerW * cFract;
                const wOffY = -innerW * cFract * 0.5;
                ctx.fillRect(wX - 1.0, wY + wOffY - 1, 2.0, 1.5);
              }
              // Spire Right Windows
              for (let c = 0; c < cols; c++) {
                const cFract = (c + 0.5) / cols;
                const wX = bx + innerW * cFract;
                const wOffY = -innerW * cFract * 0.5;
                ctx.fillRect(wX - 1.0, wY + wOffY - 1, 2.0, 1.5);
              }
            }
          }

          // ROOFTOP HIGH-FIDELITY HELIPAD DETAILS
          if (h > 35 && b.originalData.politicalWeight >= 9) {
            const padSize = innerW * 0.7;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(bx, by - h - innerW * 0.5, padSize, padSize * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Glowing "H" on helipad
            ctx.font = `bold ${Math.max(6, innerW * 0.4)}px monospace`;
            ctx.fillStyle = Math.floor(time * 4) % 2 === 0 ? "#10B981" : "rgba(255, 255, 255, 0.6)";
            ctx.textAlign = "center";
            ctx.fillText("H", bx, by - h - innerW * 0.4);

            // Blinking corner helipad beacons
            const beaconOn = Math.floor(time * 3) % 2 === 0;
            if (beaconOn) {
              ctx.fillStyle = "#EF4444";
              ctx.beginPath();
              ctx.arc(ptInnerTopLeft.x, ptInnerTopLeft.y, 2, 0, Math.PI * 2);
              ctx.arc(ptInnerTopRight.x, ptInnerTopRight.y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (h > 30) {
            // HIGH-FIDELITY ANTENNAS & ROTATING RADARS
            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(bx, by - h - innerW);
            ctx.lineTo(bx, by - h - innerW - 14);
            ctx.stroke();

            // Antennen warnblinker
            if (Math.floor(time * 4.5) % 2 === 0) {
              ctx.fillStyle = "#EF4444";
              ctx.beginPath();
              ctx.arc(bx, by - h - innerW - 14, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }

            // Tech Rotating Radar ellipse stretch simulation
            if (["bmbf", "bmdv"].includes(b.id)) {
              const radarW = 7 * Math.abs(Math.sin(time * 2.5));
              ctx.strokeStyle = "#06B6D4";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.ellipse(bx, by - h - innerW - 8, radarW, 3, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // HIGH-FIDELITY SEARCHLIGHT BEAMS
          if (h > 40 && b.originalData.politicalWeight >= 9) {
            ctx.save();
            const beamHeight = 150;
            const angleOsc = Math.sin(time * 0.8) * 12; // slow searching sway
            const beamGrad = ctx.createLinearGradient(bx, by - h - innerW, bx + angleOsc, by - h - innerW - beamHeight);
            beamGrad.addColorStop(0, `${baseColor}38`);
            beamGrad.addColorStop(0.4, `${baseColor}12`);
            beamGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(bx - 3, by - h - innerW);
            ctx.lineTo(bx + 3, by - h - innerW);
            ctx.lineTo(bx + angleOsc + 22, by - h - innerW - beamHeight);
            ctx.lineTo(bx + angleOsc - 22, by - h - innerW - beamHeight);
            ctx.closePath();
            ctx.fill();

            // Store searchlight beam endpoint coordinates for cloud illumination mapping
            b.searchlightEnd = { x: bx + angleOsc, y: by - h - innerW - beamHeight };
            ctx.restore();
          }

        } else {
          // AGENCIES: Technological Modular Cubic Nodes
          // LEFT FACE
          const gradLeft = ctx.createLinearGradient(ptBottomLeft.x, ptBottomLeft.y, ptTopLeft.x, ptTopLeft.y);
          gradLeft.addColorStop(0, "rgba(4, 8, 18, 0.9)");
          gradLeft.addColorStop(1, `${baseColor}35`);
          ctx.fillStyle = gradLeft;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.beginPath();
          ctx.moveTo(ptBottomLeft.x, ptBottomLeft.y);
          ctx.lineTo(ptBottomCenter.x, ptBottomCenter.y);
          ctx.lineTo(ptTopCenter.x, ptTopCenter.y);
          ctx.lineTo(ptTopLeft.x, ptTopLeft.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Overlay left face dynamic sun shading
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 0.72 - leftShading)})`;
          ctx.beginPath();
          ctx.moveTo(ptBottomLeft.x, ptBottomLeft.y);
          ctx.lineTo(ptBottomCenter.x, ptBottomCenter.y);
          ctx.lineTo(ptTopCenter.x, ptTopCenter.y);
          ctx.lineTo(ptTopLeft.x, ptTopLeft.y);
          ctx.closePath();
          ctx.fill();

          // RIGHT FACE
          const gradRight = ctx.createLinearGradient(ptBottomCenter.x, ptBottomCenter.y, ptTopCenter.x, ptTopCenter.y);
          gradRight.addColorStop(0, "rgba(6, 12, 24, 0.9)");
          gradRight.addColorStop(1, `${baseColor}65`);
          ctx.fillStyle = gradRight;
          ctx.beginPath();
          ctx.moveTo(ptBottomCenter.x, ptBottomCenter.y);
          ctx.lineTo(ptBottomRight.x, ptBottomRight.y);
          ctx.lineTo(ptTopRight.x, ptTopRight.y);
          ctx.lineTo(ptTopCenter.x, ptTopCenter.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Overlay right face dynamic sun shading
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 0.72 - rightShading)})`;
          ctx.beginPath();
          ctx.moveTo(ptBottomCenter.x, ptBottomCenter.y);
          ctx.lineTo(ptBottomRight.x, ptBottomRight.y);
          ctx.lineTo(ptTopRight.x, ptTopRight.y);
          ctx.lineTo(ptTopCenter.x, ptTopCenter.y);
          ctx.closePath();
          ctx.fill();

          // ROOF
          ctx.fillStyle = isSelected ? "#FFFFFF" : isHovered ? `${baseColor}cc` : `${baseColor}95`;
          ctx.beginPath();
          ctx.moveTo(ptTopLeft.x, ptTopLeft.y);
          ctx.lineTo(ptTopCenter.x, ptTopCenter.y);
          ctx.lineTo(ptTopRight.x, ptTopRight.y);
          ctx.lineTo(ptTopTop.x, ptTopTop.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Roof Sun shading
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, roofShading - 0.65) * 0.45})`;
          ctx.beginPath();
          ctx.moveTo(ptTopLeft.x, ptTopLeft.y);
          ctx.lineTo(ptTopCenter.x, ptTopCenter.y);
          ctx.lineTo(ptTopRight.x, ptTopRight.y);
          ctx.lineTo(ptTopTop.x, ptTopTop.y);
          ctx.closePath();
          ctx.fill();

          // Glowing energy circuits on modular agencies
          if (h > 12) {
            ctx.strokeStyle = isHovered ? "#FFFFFF" : `${baseColor}b5`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(bx - halfSize * 0.5, by - h * 0.5 - halfSize * 0.25);
            ctx.lineTo(bx, by - h * 0.5);
            ctx.lineTo(bx + halfSize * 0.5, by - h * 0.5 - halfSize * 0.25);
            ctx.stroke();
          }
        }

        // Real-time Holographic laser scanner vertical sweep line
        if (isHovered || isSelected) {
          const scanPos = 0.5 + 0.5 * Math.sin(time * 3.5);
          const scanY = by - h * scanPos;
          ctx.strokeStyle = isSelected ? "#FFFFFF" : "#38BDF8";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(bx - halfSize, scanY - halfSize * 0.5);
          ctx.lineTo(bx, scanY);
          ctx.lineTo(bx + halfSize, scanY - halfSize * 0.5);
          ctx.stroke();
        }

        // Floating retro HUD brackets and acronym overlays
        if (h > 12) {
          const labelY = by - h - (b.type === "ministry" ? innerW + 22 : 18);

          if (isHovered || isSelected) {
            // Target HUD connector beam
            ctx.strokeStyle = isSelected ? "#FFFFFF" : "#38BDF8";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(bx, by - h - (b.type === "ministry" ? innerW : 0));
            ctx.lineTo(bx, labelY + 12);
            ctx.stroke();

            // Holographic frame brackets
            ctx.beginPath();
            // Left bracket
            ctx.moveTo(bx - 26, labelY - 6);
            ctx.lineTo(bx - 30, labelY - 6);
            ctx.lineTo(bx - 30, labelY + 10);
            ctx.lineTo(bx - 26, labelY + 10);
            // Right bracket
            ctx.moveTo(bx + 26, labelY - 6);
            ctx.lineTo(bx + 30, labelY - 6);
            ctx.lineTo(bx + 30, labelY + 10);
            ctx.lineTo(bx + 26, labelY + 10);
            ctx.stroke();
          }

          ctx.font = "bold 9px monospace";
          ctx.fillStyle = isSelected ? "#FFFFFF" : isHovered ? "#38BDF8" : "#94A3B8";
          ctx.textAlign = "center";
          ctx.fillText(b.abbreviation, bx, labelY + 1);

          ctx.font = "bold 7.5px sans-serif";
          ctx.fillStyle = "#10B981";
          ctx.fillText(`${b.budget.toFixed(1)}B`, bx, labelY + 8);
        }
      });

      // UPDATE AND RENDER VOLUMETRIC ATMOSPHERIC CLOUDS
      ctx.save();
      cloudsRef.current.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > canvasWidth + 100) {
          cloud.x = -150;
          cloud.y = 50 + Math.random() * 200;
        }

        // Render soft translucent cloud shadow on grid floor
        ctx.fillStyle = "rgba(1, 3, 8, 0.22)";
        ctx.beginPath();
        ctx.ellipse(cloud.x, baseCy + 180, cloud.size * 1.5, cloud.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Render multiple overlapping gradient puffs
        cloud.elements.forEach((el) => {
          const cloudGrad = ctx.createRadialGradient(
            cloud.x + el.dx, cloud.y + el.dy, 2,
            cloud.x + el.dx, cloud.y + el.dy, el.r
          );
          cloudGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
          cloudGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.035)");
          cloudGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.arc(cloud.x + el.dx, cloud.y + el.dy, el.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Illuminate clouds if a security ministry searchlight cone overlaps it!
        buildings.forEach((b) => {
          if (b.searchlightEnd && b.currentHeight > 10) {
            // Distance checking between cloud center and beam endpoint
            const dx = b.searchlightEnd.x - cloud.x;
            const dy = b.searchlightEnd.y - cloud.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < cloud.size * 0.8) {
              const spotGrad = ctx.createRadialGradient(
                b.searchlightEnd.x, b.searchlightEnd.y, 1,
                b.searchlightEnd.x, b.searchlightEnd.y, 28
              );
              spotGrad.addColorStop(0, `${b.color}25`);
              spotGrad.addColorStop(1, "rgba(255,255,255,0)");
              ctx.fillStyle = spotGrad;
              ctx.beginPath();
              ctx.arc(b.searchlightEnd.x, b.searchlightEnd.y, 28, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      });
      ctx.restore();

      // Render glowing collapse sparks & smoke particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        if (p.life >= p.maxLife) return false;

        p.x += p.vx;
        p.y += p.vy;

        if (p.type === "smoke") {
          p.vy *= 0.98;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // spark drops with weight
          p.vy += 0.12;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        return true;
      });

      // RESTORE MATRIX TRANSFORMATION
      ctx.restore();

      // RENDER DETAILED NEON CYBERPUNK HUD OVERLAY FRAME
      ctx.save();
      ctx.strokeStyle = "rgba(99, 102, 241, 0.22)";
      ctx.lineWidth = 1.2;
      
      // Outer HUD frame path
      ctx.beginPath();
      ctx.rect(10, 10, canvasWidth - 20, canvasHeight - 20);
      ctx.stroke();

      // Corner target brackets
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2.2;
      const HUDOffsets = [
        { x: 10, y: 10, dx: 15, dy: 15 },
        { x: canvasWidth - 10, y: 10, dx: -15, dy: 15 },
        { x: 10, y: canvasHeight - 10, dx: 15, dy: -15 },
        { x: canvasWidth - 10, y: canvasHeight - 10, dx: -15, dy: -15 }
      ];
      HUDOffsets.forEach((b) => {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.dy);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(b.x + b.dx, b.y);
        ctx.stroke();
      });

      // Calibration ticks along top edge
      ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
      ctx.lineWidth = 1;
      for (let x = 60; x < canvasWidth - 60; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, 15);
        ctx.stroke();
      }

      // HUD Text telemetry readouts
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
      ctx.textAlign = "left";
      ctx.fillText("ZEIG_DEN_STAAT // HOLOGRAM_MATRIX_3D", 22, 24);
      ctx.fillText(`SUN_MATRIX: orbit_rad [${sunX.toFixed(2)}, ${sunZ.toFixed(2)}]`, 22, 34);

      ctx.textAlign = "right";
      ctx.fillText("GRID_DEPTH: Z-SORT ACTIVE", canvasWidth - 22, 24);
      ctx.fillText(`ZOOM: ${(currentZoom * 100).toFixed(0)}% // PAN: [${currentPanX.toFixed(0)}, ${currentPanY.toFixed(0)}]`, canvasWidth - 22, 34);

      // Bottom Right status label
      ctx.fillStyle = isCinematicMode ? "#E2E8F0" : "#94A3B8";
      ctx.fillText(
        isCinematicMode ? "SURVEILLANCE SCAN MODE: ACTIVE" : "MANUAL INTERACTION CONTROL: GRANTED",
        canvasWidth - 22, canvasHeight - 22
      );

      // BOTTOM LEFT: RENDER SCROLLING SATIRICAL TACTICAL LOGS
      ctx.textAlign = "left";
      systemLogsRef.current.forEach((log, logIdx) => {
        const isAlert = log.includes("[ALRT]");
        ctx.fillStyle = isAlert ? "#EF4444" : log.includes("[SYS]") ? "#38BDF8" : "rgba(34, 197, 94, 0.85)";
        ctx.fillText(log, 22, canvasHeight - 65 + logIdx * 10);
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [hoveredNode, earthquakeThreshold, isSeismicTesting, selectedEntity, zoom, panOffset, isCinematicMode, canvasWidth, canvasHeight]);

  // Seismograph Pulse Animation Canvas
  useEffect(() => {
    const sCanvas = seismographRef.current;
    if (!sCanvas) return;

    const sCtx = sCanvas.getContext("2d");
    if (!sCtx) return;

    let sAnimId: number;
    let wavePoints: number[] = Array(120).fill(25);

    const drawSeismograph = () => {
      sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);

      wavePoints.shift();
      const amplitude = isSeismicTesting ? earthquakeThreshold * 0.7 + Math.random() * 8 : 1.5 + Math.random() * 1.5;
      const waveVal = 25 + Math.sin(Date.now() * 0.025) * amplitude * (Math.random() > 0.5 ? 1 : -1);
      wavePoints.push(waveVal);

      // Grid
      sCtx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      sCtx.lineWidth = 1;
      for (let x = 0; x < sCanvas.width; x += 15) {
        sCtx.beginPath();
        sCtx.moveTo(x, 0);
        sCtx.lineTo(x, sCanvas.height);
        sCtx.stroke();
      }

      // Neon Line
      sCtx.strokeStyle = isSeismicTesting ? "#EF4444" : "#06B6D4";
      sCtx.lineWidth = 2;
      sCtx.shadowBlur = 6;
      sCtx.shadowColor = isSeismicTesting ? "#EF4444" : "#06B6D4";
      sCtx.beginPath();
      for (let i = 0; i < wavePoints.length; i++) {
        const xCoord = (i / (wavePoints.length - 1)) * sCanvas.width;
        if (i === 0) {
          sCtx.moveTo(xCoord, wavePoints[i]);
        } else {
          sCtx.lineTo(xCoord, wavePoints[i]);
        }
      }
      sCtx.stroke();
      sCtx.shadowBlur = 0;

      sAnimId = requestAnimationFrame(drawSeismograph);
    };

    sAnimId = requestAnimationFrame(drawSeismograph);
    return () => cancelAnimationFrame(sAnimId);
  }, [isSeismicTesting, earthquakeThreshold]);

  // Compute state statistics
  const totalPossible = mockStateData.length + mockStateData.flatMap(m => m.agencies).length;
  const standingCount = mockStateData.filter(m => m.budget >= earthquakeThreshold).length +
    mockStateData.flatMap(m => m.agencies).filter(a => a.budget >= earthquakeThreshold).length;
  const collapsedCount = totalPossible - standingCount;

  return (
    <div className="relative w-full h-[76vh] rounded-3xl overflow-hidden bg-[#03060f] border border-indigo-950/40 shadow-inner flex flex-col">
      {/* Background space layers */}
      <div className="absolute inset-0 bg-radial-gradient from-indigo-950/5 via-[#03060f] to-[#010205] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[350px] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none" />

      {/* Cybernetic HUD Header */}
      <div className="absolute top-6 left-6 z-20 max-w-md pointer-events-none select-none">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Activity className="text-indigo-400 animate-pulse" size={20} />
          ISOMETRISCHER HOLOGRAPHIE-STAAT (2026)
        </h2>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Kanzler-Metropole der Merz-Regierung. 3D-Volumenschattierung durch rotierende Sonnenstrahlen. Pulsierende Neon-Glows, Straßen-Junctions, Skywalks und Hover-Cars.
        </p>
      </div>

      {/* High-Tech Camera Controls Toolbar */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-slate-950/80 border border-slate-900 rounded-2xl p-1.5 shadow-lg select-none">
        <button
          onClick={triggerZoomIn}
          title="Heranzoomen"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={triggerZoomOut}
          title="Herauszoomen"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={resetCamera}
          title="Kamera zurücksetzen"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <RotateCcw size={15} />
        </button>
        <div className="h-5 w-px bg-slate-900 mx-1" />
        <button
          onClick={() => setIsCinematicMode(!isCinematicMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            isCinematicMode
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse"
              : "bg-slate-900/60 text-slate-500 border border-slate-900 hover:text-slate-300"
          }`}
        >
          <Compass size={12} className={isCinematicMode ? "animate-spin duration-[8s]" : ""} />
          Cinematic Scan
        </button>
      </div>

      {/* Canvas Viewport */}
      <div ref={containerRef} className="flex-1 w-full flex items-center justify-center relative select-none overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="cursor-grab active:cursor-grabbing"
        />

        {/* Hover Popover Info Badge */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute z-40 bg-slate-950/95 border border-indigo-900/50 text-xs px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-2xl pointer-events-none max-w-xs"
              style={{
                top: 80,
                left: 30,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[8px] uppercase font-black text-indigo-400 block tracking-widest">
                  {hoveredNode.type === "ministry" ? "Bundesministerium" : `Behörde (unter ${hoveredNode.parentName})`}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">
                  {hoveredNode.data.abbreviation}
                </span>
              </div>
              <span className="font-extrabold text-white leading-tight text-sm mt-0.5">
                {hoveredNode.data.name}
              </span>
              <div className="h-px bg-slate-900 my-1.5" />
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <span className="text-slate-500 block text-[9px]">Etat</span>
                  <span className="font-mono text-emerald-400 font-black text-xs">
                    {hoveredNode.data.budget.toFixed(2)} Mrd. €
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Personal</span>
                  <span className="font-mono text-cyan-400 font-black text-xs">
                    {hoveredNode.data.employees.toLocaleString("de-DE")} MA
                  </span>
                </div>
              </div>
              <div className="h-px bg-slate-900 my-1.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-[8px] uppercase font-bold">Amtlicher Quirk</span>
                <span className="text-[9.5px] italic text-slate-300 leading-snug">
                  "{hoveredNode.data.quirk}"
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Seismographic Budget Collapse Control Center */}
      <div className="p-5 bg-[#020409]/98 border-t border-indigo-950/50 backdrop-blur-md flex flex-col lg:flex-row items-center gap-6 z-20">
        
        {/* Left pulse header */}
        <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto">
          <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
            {isSeismicTesting ? (
              <ShieldAlert className="text-red-500 animate-bounce" size={22} />
            ) : (
              <Building2 className="text-indigo-400" size={22} />
            )}
          </div>
          <div>
            <h4 className="font-black text-white text-xs tracking-wider flex items-center gap-2">
              SEISMISCHER BUDGET-SIMULATOR (MERZ 2026)
              {isSeismicTesting && (
                <span className="animate-ping inline-flex h-2 w-2 rounded-full bg-red-500" />
              )}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">
              Simuliere Etatkürzungen. Behörden mit Budgets unter dem Schwellenwert zerfallen instantan in Staubwolken.
            </p>
          </div>
        </div>

        {/* Live seismograph line canvas */}
        <div className="h-12 w-32 border border-slate-900 rounded-xl bg-slate-950/50 overflow-hidden shrink-0 hidden md:block">
          <canvas ref={seismographRef} width={128} height={46} className="w-full h-full" />
        </div>

        {/* Seismographic slider */}
        <div className="flex-1 w-full flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-500 font-mono w-14 text-center">0.0 Mrd. €</span>
          <input
            type="range"
            min="0"
            max="60"
            step="0.2"
            value={earthquakeThreshold}
            onChange={handleSliderChange}
            className="flex-1 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />
          <div className="w-24 text-right bg-slate-950 rounded-xl py-1.5 px-3 border border-indigo-950/60 font-mono">
            <span className={`text-[11px] font-black ${isSeismicTesting ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>
              {earthquakeThreshold.toFixed(1)} B €
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-5 shrink-0 bg-slate-950/80 border border-slate-900/60 px-4 py-2 rounded-2xl text-[10px] select-none">
          <div>
            <span className="text-slate-500 block">Aktiv</span>
            <span className="text-emerald-400 font-mono font-bold">{standingCount}/{totalPossible}</span>
          </div>
          <div className="w-px h-6 bg-slate-900" />
          <div>
            <span className="text-slate-500 block">Kollabiert</span>
            <span className={`font-mono font-bold ${collapsedCount > 0 ? "text-red-400" : "text-slate-500"}`}>{collapsedCount}</span>
          </div>
        </div>

        {/* Reconstruction trigger button */}
        <button
          onClick={handleReset}
          disabled={earthquakeThreshold === 0}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
            earthquakeThreshold > 0
              ? "bg-gradient-to-r from-red-500 to-indigo-600 text-white hover:from-red-600 hover:to-indigo-700 shadow-md shadow-red-950/50 cursor-pointer"
              : "bg-slate-950 text-slate-700 border border-slate-900 cursor-not-allowed"
          }`}
        >
          <RotateCcw size={13} />
          Wiederaufbau
        </button>
      </div>
    </div>
  );
};
