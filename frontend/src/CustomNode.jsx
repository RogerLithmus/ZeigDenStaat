import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Landmark, Building2, Layers, Users, CircleDollarSign } from 'lucide-react';

const ICON_MAP = {
  Staat: Landmark,
  Ministerium: Building2,
  Behörde: Layers,
};

export default function CustomNode({ data, selected }) {
  const IconComponent = ICON_MAP[data.type] || Layers;
  
  // Custom styling based on node type
  let cardClass = "";
  let glowClass = "";
  let badgeClass = "";
  let borderClass = "";
  
  if (data.type === 'Staat') {
    borderClass = selected ? 'border-emerald-400' : 'border-emerald-500/30';
    cardClass = 'bg-slate-900/90 hover:bg-slate-900 border backdrop-blur-md';
    glowClass = selected ? 'shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/50' : 'shadow-lg shadow-black/40';
    badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  } else if (data.type === 'Ministerium') {
    borderClass = selected ? 'border-blue-400' : 'border-blue-500/30';
    cardClass = 'bg-slate-900/95 hover:bg-slate-900 border backdrop-blur-md';
    glowClass = selected ? 'shadow-[0_0_25px_rgba(59,130,246,0.4)] ring-2 ring-blue-500/50' : 'shadow-lg shadow-black/40';
    badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  } else {
    borderClass = selected ? 'border-slate-400' : 'border-slate-700/80';
    cardClass = 'bg-slate-900/90 hover:bg-slate-900 border backdrop-blur-md';
    glowClass = selected ? 'shadow-[0_0_20px_rgba(148,163,184,0.25)] ring-1 ring-slate-400/30' : 'shadow-md shadow-black/30';
    badgeClass = 'bg-slate-800 text-slate-400 border border-slate-700';
  }

  return (
    <div className={`p-4 rounded-xl transition-all duration-300 w-[260px] ${cardClass} ${borderClass} ${glowClass}`}>
      {/* Top Handle */}
      {data.type !== 'Staat' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-2.5 h-2.5 !bg-slate-600 !border-slate-800 border-2 rounded-full transition-transform hover:scale-125"
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${data.type === 'Staat' ? 'bg-emerald-500/10 text-emerald-400' : data.type === 'Ministerium' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-300'}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-sm tracking-wide truncate max-w-[130px]" title={data.name}>
              {data.short || data.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[130px] font-medium" title={data.name}>
              {data.name}
            </div>
          </div>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeClass}`}>
          {data.type}
        </span>
      </div>

      {/* Key info indicators inside the node */}
      {(data.budget || data.employees) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          {data.budget && (
            <span className="flex items-center gap-1 font-mono text-emerald-400/90 font-medium">
              <CircleDollarSign className="h-3 w-3 text-slate-500" />
              {data.budget}
            </span>
          )}
          {data.employees && (
            <span className="flex items-center gap-1 font-mono text-slate-300">
              <Users className="h-3 w-3 text-slate-500" />
              {data.employees}
            </span>
          )}
        </div>
      )}

      {/* Bottom Handle */}
      {data.children && data.children.length > 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2.5 h-2.5 !bg-slate-600 !border-slate-800 border-2 rounded-full transition-transform hover:scale-125"
        />
      )}
    </div>
  );
}
