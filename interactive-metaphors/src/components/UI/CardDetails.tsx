import React from "react";
import type { Ministry, Agency } from "../../data/mockData";
import { X, Landmark, Users, Calendar, Award, ShieldAlert, Coffee, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CardDetailsProps {
  entity: {
    type: "ministry" | "agency";
    data: Ministry | Agency;
    parentMinistryName?: string;
  } | null;
  onClose: () => void;
}

export const CardDetails: React.FC<CardDetailsProps> = ({ entity, onClose }) => {
  if (!entity) return null;

  const isMinistry = entity.type === "ministry";
  const m = entity.data as Ministry;
  const a = entity.data as Agency;

  const name = m.name;
  const abbreviation = m.abbreviation;
  const budget = m.budget;
  const employees = m.employees;
  const description = m.description;
  const quirk = m.quirk;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/50"
      >
        {/* Glowing Top Border */}
        <div
          className={`h-2 w-full bg-gradient-to-r ${
            isMinistry ? m.gradient : "from-teal-400 to-indigo-500"
          }`}
        />

        <div className="p-6 relative text-slate-200">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200"
          >
            <X size={18} />
          </button>

          {/* Badge */}
          <span
            className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mb-3 ${
              isMinistry
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
            }`}
          >
            {isMinistry ? "Bundesministerium" : `Behörde / Nachgeordnet (unter ${entity.parentMinistryName})`}
          </span>

          {/* Title & Abbreviation */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className={`p-2.5 rounded-xl ${
                isMinistry ? "bg-slate-800" : "bg-slate-800/60"
              }`}
            >
              <Landmark
                size={24}
                className={isMinistry ? "text-cyan-400" : "text-indigo-400"}
              />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
                {name}
              </h3>
              <p className="text-sm font-semibold text-slate-400 mt-0.5">
                {abbreviation}
              </p>
            </div>
          </div>

          {/* Main Metrics Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-slate-800/40 p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Landmark size={12} className="text-emerald-400" />
                Budget
              </span>
              <p className="text-lg font-extrabold text-white mt-1">
                {budget.toLocaleString("de-DE")} Mrd. €
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/40 p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Users size={12} className="text-cyan-400" />
                Personal
              </span>
              <p className="text-lg font-extrabold text-white mt-1">
                {employees.toLocaleString("de-DE")}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h4 className="text-[10px] text-slate-400 uppercase font-bold mb-1">
              Zuständigkeit & Auftrag
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-800/50">
              {description}
            </p>
          </div>

          {/* Ministry Specifics */}
          {isMinistry && (
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="rounded-lg bg-slate-950/20 p-2 border border-slate-800/30">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Gegründet</span>
                <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                  <Calendar size={11} className="text-slate-400" />
                  {m.foundingYear}
                </span>
              </div>
              <div className="rounded-lg bg-slate-950/20 p-2 border border-slate-800/30">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Machtgewicht</span>
                <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                  <Award size={11} className="text-amber-400" />
                  {m.politicalWeight}/10
                </span>
              </div>
              <div className="rounded-lg bg-slate-950/20 p-2 border border-slate-800/30 overflow-hidden">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Leitung</span>
                <span className="text-[10px] font-bold text-slate-300 block truncate mt-0.5">
                  {m.ministerName.split(" ").pop()}
                </span>
              </div>
            </div>
          )}

          {/* Administrative Fun Stats */}
          <div className="mb-4">
            <h4 className="text-[10px] text-slate-400 uppercase font-bold mb-2">
              Bürokratischer Fingerabdruck
            </h4>
            <div className="space-y-2 rounded-xl bg-slate-950/40 p-3 border border-slate-800/60 text-xs">
              {/* Faxgerät-Dichte */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Printer size={12} className="text-indigo-400" />
                  Fax-Dichte (pro 10 MA)
                </span>
                <span className="font-mono font-bold text-indigo-300">
                  {isMinistry ? (m.id === "bmf" ? 8.8 : m.id === "bmg" ? 5.5 : m.id === "bmvg" ? 5.95 : 7.7) : a.faxRatio}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{
                    width: `${
                      (isMinistry ? (m.id === "bmf" ? 8.8 : m.id === "bmg" ? 5.5 : m.id === "bmvg" ? 5.95 : 7.7) : a.faxRatio) * 10
                    }%`,
                  }}
                />
              </div>

              {/* Kaffeeverbrauch */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Coffee size={12} className="text-amber-400" />
                  Kaffee-Konsum (l / Jahr / MA)
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {isMinistry ? (m.id === "bmf" ? 197.5 : m.id === "bmg" ? 280 : m.id === "bmvg" ? 320 : 292.5) : a.coffeeIndex} l
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${
                      ((isMinistry ? (m.id === "bmf" ? 197.5 : m.id === "bmg" ? 280 : m.id === "bmvg" ? 320 : 292.5) : a.coffeeIndex) /
                        450) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Systemische Anomalie (Quirk) */}
          <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/20 p-3 flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide">
                Systemische Auffälligkeit
              </h5>
              <p className="text-xs text-cyan-300/90 leading-relaxed mt-0.5 italic">
                "{quirk}"
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
