import React from 'react';
import TaskCard from './TaskCard';
import { Clock, PlayCircle, CheckCircle, Plus } from 'lucide-react';

export default function KanbanBoard({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onOpenNewTask,
}) {
  const columns = [
    {
      id: 'Pending',
      title: 'Pending',
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'In Progress',
      title: 'In Progress',
      icon: PlayCircle,
      color: 'text-brand-700 bg-brand-50 border-brand-200',
      badgeBg: 'bg-brand-100 text-brand-800',
    },
    {
      id: 'Completed',
      title: 'Completed',
      icon: CheckCircle,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {columns.map((col) => {
        const Icon = col.icon;
        const columnTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${col.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">{col.title}</h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.badgeBg}`}>
                {columnTasks.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnTasks.length === 0 ? (
                <div className="h-36 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-xs text-slate-400">No {col.title.toLowerCase()} tasks</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>

            {/* Quick Add Button at bottom of Pending column */}
            {col.id === 'Pending' && (
              <button
                type="button"
                onClick={onOpenNewTask}
                className="mt-3 w-full py-2 px-3 border border-dashed border-slate-300 hover:border-brand-400 hover:bg-white rounded-xl text-xs font-semibold text-slate-600 hover:text-brand-600 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
