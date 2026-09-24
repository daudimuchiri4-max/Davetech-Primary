import React, { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}) => {
  const colorStyles = {
    blue: 'bg-blue-50/90 text-blue-700 border-blue-150',
    emerald: 'bg-emerald-50/90 text-emerald-700 border-emerald-150',
    amber: 'bg-amber-50/90 text-amber-700 border-amber-150',
    rose: 'bg-rose-50/90 text-rose-700 border-rose-150',
    indigo: 'bg-indigo-50/90 text-indigo-700 border-indigo-150',
    purple: 'bg-purple-50/90 text-purple-700 border-purple-150',
  };

  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${colorStyles[color]}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center flex-wrap gap-1.5 mt-2.5 text-xs text-slate-500">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md text-[11px] ${
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                    : 'text-rose-700 bg-rose-50 border border-rose-100'
                }`}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                )}
                <span>{trend.value}</span>
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
