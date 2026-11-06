import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'cyan', trend }) {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20',
      glow: 'shadow-cyan-950/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      textAccent: 'text-cyan-400',
    },
    purple: {
      border: 'border-purple-500/20',
      glow: 'shadow-purple-950/20',
      iconBg: 'bg-purple-500/10 text-purple-400',
      textAccent: 'text-purple-400',
    },
    emerald: {
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-950/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      textAccent: 'text-emerald-400',
    },
    rose: {
      border: 'border-rose-500/20',
      glow: 'shadow-rose-950/20',
      iconBg: 'bg-rose-500/10 text-rose-400',
      textAccent: 'text-rose-400',
    },
    amber: {
      border: 'border-amber-500/20',
      glow: 'shadow-amber-950/20',
      iconBg: 'bg-amber-500/10 text-amber-400',
      textAccent: 'text-amber-400',
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border ${scheme.border} shadow-lg ${scheme.glow} transition-all duration-300 hover:scale-[1.02] hover:border-opacity-50`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
