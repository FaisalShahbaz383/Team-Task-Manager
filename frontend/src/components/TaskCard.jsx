import React from 'react';
import { Calendar, User, MoreVertical, Edit2, Trash2, CheckCircle, Clock, PlayCircle } from 'lucide-react';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'Completed';

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusConfig = {
    Pending: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock,
    },
    'In Progress': {
      badge: 'bg-brand-50 text-brand-700 border-brand-200',
      dot: 'bg-brand-500',
      icon: PlayCircle,
    },
    Completed: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
    },
  };

  const currentStatus = statusConfig[task.status] || statusConfig.Pending;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-4 sm:p-5 flex flex-col justify-between group">
      <div>
        {/* Top Header: Team & Status */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
            {task.team_name}
          </span>

          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStatus.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
              <span>{task.status}</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className={`text-sm sm:text-base font-bold text-slate-900 mb-1.5 leading-snug line-clamp-2 ${
          task.status === 'Completed' ? 'line-through text-slate-500' : ''
        }`}>
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-4">
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Metadata and Actions */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          {/* Due Date */}
          <div
            className={`flex items-center gap-1.5 font-medium ${
              isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {task.due_date ? formatDueDate(task.due_date) : 'No due date'}
            </span>
            {isOverdue && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold">
                Overdue
              </span>
            )}
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-1.5">
            {task.assigned_to ? (
              <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee_name}`}>
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">
                  {task.assignee_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-medium text-slate-700 truncate max-w-[100px]">
                  {task.assignee_name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">Unassigned</span>
            )}
          </div>
        </div>

        {/* Status quick select & Edit/Delete triggers */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
