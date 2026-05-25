import { useState } from "react";
import { mockStateData } from "./data/mockData";
import type { Ministry, Agency } from "./data/mockData";
import { ConceptCity } from "./components/ConceptCity";
import { ConceptSketch } from "./components/ConceptSketch";
import { ConceptNebula } from "./components/ConceptNebula";
import { ConceptDeepSea } from "./components/ConceptDeepSea";
import { CardDetails } from "./components/UI/CardDetails";
import { Landmark, Users, Activity, Eye, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ConceptType = "city" | "sketch" | "nebula" | "deepsea";

export default function App() {
  const [activeConcept, setActiveConcept] = useState<ConceptType>("city");
  const [selectedEntity, setSelectedEntity] = useState<{
    type: "ministry" | "agency";
    data: Ministry | Agency;
    parentMinistryName?: string;
  } | null>(null);

  // Compute overall state aggregations
  const totalBudget = mockStateData.reduce((acc, m) => {
    const directBudget = m.budget;
    const agencyBudget = m.agencies.reduce((sum, a) => sum + a.budget, 0);
    return acc + directBudget + agencyBudget;
  }, 0);

  const totalEmployees = mockStateData.reduce((acc, m) => {
    const directEmployees = m.employees;
    const agencyEmployees = m.agencies.reduce((sum, a) => sum + a.employees, 0);
    return acc + directEmployees + agencyEmployees;
  }, 0);

  const handleSelectEntity = (entity: any) => {
    setSelectedEntity(entity);
  };

  const handleSwitchConcept = (concept: ConceptType) => {
    setActiveConcept(concept);
    setSelectedEntity(null); // Clear selected details on switch
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Main Top Header Navbar */}
      <header className="relative w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Landmark size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Zeig den Staat
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Alternative Metaphern
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Radikale Transparenz der deutschen Behörden durch unkonventionelle Design-Modelle.
            </p>
          </div>
        </div>

        {/* Global Key Stats Summary Badge */}
        <div className="flex items-center gap-6 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          <div className="flex items-center gap-2 px-1">
            <Activity className="text-emerald-500 animate-pulse" size={16} />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Staatsetat (Gesamt)</span>
              <span className="text-sm font-black text-emerald-400">{totalBudget.toFixed(2)} Mrd. €</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex items-center gap-2 px-1">
            <Users className="text-cyan-400" size={16} />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Personalstärke</span>
              <span className="text-sm font-black text-cyan-400">{totalEmployees.toLocaleString("de-DE")} MA</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Swapper Hub Controller tabs */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6 relative z-30">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900/40 p-2.5 rounded-2xl border border-slate-900 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-cyan-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">
              Wähle eine innovative visuelle Metapher, um den Behörden-Apparat spielerisch zu navigieren:
            </span>
          </div>

          {/* Glowing Tab Switches */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {[
              { id: "city", label: "3D Stadt", desc: "Isometrischer Hochhaus-Dschungel", color: "text-cyan-400 border-cyan-500/20" },
              { id: "sketch", label: "Comic Skizze", desc: "Interaktives Handgekritzel", color: "text-red-400 border-red-500/20" },
              { id: "nebula", label: "Kosmos", desc: "Planetare Umlaufbahnen", color: "text-purple-400 border-purple-500/20" },
              { id: "deepsea", label: "Tiefsee", desc: "Biolumineszentes Biotop", color: "text-teal-400 border-teal-500/20" },
            ].map((tab) => {
              const isActive = activeConcept === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSwitchConcept(tab.id as ConceptType)}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center gap-0.5 border ${
                    isActive
                      ? "bg-slate-900 border-slate-700 text-white shadow-lg shadow-black/40 scale-105"
                      : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <span className="tracking-wide">{tab.label}</span>
                  <span className="text-[9px] font-normal text-slate-500 block leading-none">{tab.desc}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderglow"
                      className="absolute -bottom-[2px] left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Viewport container that displays the active visual metaphor */}
        <div className="relative w-full overflow-hidden flex-1 rounded-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeConcept}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="w-full h-full"
            >
              {activeConcept === "city" && (
                <ConceptCity onSelectEntity={handleSelectEntity} selectedEntity={selectedEntity} />
              )}
              {activeConcept === "sketch" && (
                <ConceptSketch onSelectEntity={handleSelectEntity} selectedEntity={selectedEntity} />
              )}
              {activeConcept === "nebula" && (
                <ConceptNebula onSelectEntity={handleSelectEntity} selectedEntity={selectedEntity} />
              )}
              {activeConcept === "deepsea" && (
                <ConceptDeepSea onSelectEntity={handleSelectEntity} selectedEntity={selectedEntity} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Detailed State Card Modal */}
      <CardDetails entity={selectedEntity} onClose={() => setSelectedEntity(null)} />

      {/* Modern Slick Dark Mode Footer */}
      <footer className="w-full border-t border-slate-900/80 bg-slate-950 py-5 text-center text-xs text-slate-500 z-30">
        <p className="flex items-center justify-center gap-1.5">
          <span>Zeig den Staat Metaphors Prototype</span>
          <span>•</span>
          <span>Entwickelt von Antigravity</span>
          <span>•</span>
          <Eye size={12} className="text-indigo-500 animate-pulse" />
          <span>Radikale Transparenz für mündige Bürger</span>
        </p>
      </footer>
    </div>
  );
}
