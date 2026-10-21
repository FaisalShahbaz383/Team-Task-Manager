import React from 'react';
import { Calendar, Edit2, Trash2, CheckCircle, Clock, PlayCircle } from 'lucide-react';

export default function TaskTable({ tasks, onEdit, onDelete, onStatusChange }) {
  const statusConfig = {
    Pending: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    'In Progress': {
      badge: 'bg-brand-50 text-brand-700 border-brand-200',
      dot: 'bg-brand-500',
    },
    Completed: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No tasks found matching your filters.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Task</th>
              <th className="py-3.5 px-4">Team</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Assignee</th>
              <th className="py-3.5 px-4">Due Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {tasks.map((task) => {
              const statusStyle = statusConfig[task.status] || statusConfig.Pending;
              const isOverdue =
                task.due_date &&
                new Date(task.due_date) < new Date() &&
                task.status !== 'Completed';

              return (
                <tr key={task.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{task.title}</div>
                    {task.description && (
                      <div className="text-slate-500 text-xs truncate max-w-xs">{task.description}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-medium">
                      {task.team_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      className={`text-xs font-semibold rounded-lg px-2 py-1 border ${statusStyle.badge} outline-none cursor-pointer`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    {task.assigned_to ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">
                          {task.assignee_name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs">{task.assignee_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                      {formatDueDate(task.due_date)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
