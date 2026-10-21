import React from 'react';
import { CheckCircle2, Clock, PlayCircle, ListTodo, TrendingUp } from 'lucide-react';

export default function StatsOverview({ tasks }) {
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'Pending').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    {
      label: 'Total Tasks',
      value: total,
      icon: ListTodo,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
    {
      label: 'Pending',
      value: pending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: PlayCircle,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
      border: 'border-brand-200',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</h4>
            </div>
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} border ${stat.border}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
