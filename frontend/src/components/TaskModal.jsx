import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Loader2, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

export default function TaskModal({
  isOpen,
  onClose,
  taskToEdit,
  teams,
  defaultTeamId,
  onTaskSaved,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize or reset form state when modal opens or taskToEdit changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (taskToEdit) {
        setTitle(taskToEdit.title || '');
        setDescription(taskToEdit.description || '');
        setTeamId(taskToEdit.team_id ? String(taskToEdit.team_id) : '');
        setAssignedTo(taskToEdit.assigned_to ? String(taskToEdit.assigned_to) : '');
        setStatus(taskToEdit.status || 'Pending');
        setDueDate(
          taskToEdit.due_date ? taskToEdit.due_date.substring(0, 10) : ''
        );
      } else {
        setTitle('');
        setDescription('');
        const initialTeamId = defaultTeamId ? String(defaultTeamId) : (teams[0]?.id ? String(teams[0].id) : '');
        setTeamId(initialTeamId);
        setAssignedTo('');
        setStatus('Pending');
        setDueDate('');
      }
    }
  }, [isOpen, taskToEdit, defaultTeamId, teams]);

  // Dynamically load members whenever selected team changes
  useEffect(() => {
    if (teamId) {
      const fetchMembers = async () => {
        try {
          setLoadingMembers(true);
          const res = await api.get(`/teams/${teamId}/members`);
          if (res.data?.success) {
            setTeamMembers(res.data.members || []);
          }
        } catch (err) {
          console.error('Failed to load team members:', err);
          setTeamMembers([]);
        } finally {
          setLoadingMembers(false);
        }
      };
      fetchMembers();
    } else {
      setTeamMembers([]);
    }
  }, [teamId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    if (!teamId) {
      setError('Please select a team for this task.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      team_id: parseInt(teamId, 10),
      assigned_to: assignedTo ? parseInt(assignedTo, 10) : null,
      status: status,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    };

    try {
      setIsSubmitting(true);
      if (taskToEdit) {
        // Update task
        const res = await api.put(`/tasks/${taskToEdit.id}`, payload);
        onTaskSaved(res.data.task, 'updated');
      } else {
        // Create task
        const res = await api.post('/tasks', payload);
        onTaskSaved(res.data.task, 'created');
      }
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              {taskToEdit ? 'Edit Task' : 'Create New Task'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design Landing Page UI"
              className="w-full text-sm font-medium px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, acceptance criteria, or details..."
              className="w-full text-sm font-medium px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition resize-none"
            />
          </div>

          {/* Team and Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Team <span className="text-red-500">*</span>
              </label>
              <select
                disabled={Boolean(taskToEdit)} // Cannot move task across teams in update per API
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white transition disabled:bg-slate-100 disabled:text-slate-500"
              >
                {teams.length === 0 && <option value="">No teams available</option>}
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white transition"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assignee
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={loadingMembers}
                className="w-full text-sm font-medium px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white transition"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white transition"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{taskToEdit ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
