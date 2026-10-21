import React from 'react';
import { Search, Filter, LayoutGrid, Kanban, List, User } from 'lucide-react';

export default function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  assigneeFilter,
  onAssigneeChange,
  teamMembers,
  currentUserId,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by title or details..."
          className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-slate-50/50"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="text-xs sm:text-sm font-medium border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={assigneeFilter}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="text-xs sm:text-sm font-medium border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition cursor-pointer"
          >
            <option value="all">All Assignees</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
            {teamMembers && teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} {member.id === currentUserId ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            title="Card Grid View"
            className={`p-1.5 rounded-md transition ${
              viewMode === 'cards'
                ? 'bg-white text-brand-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('kanban')}
            title="Kanban Board View"
            className={`p-1.5 rounded-md transition ${
              viewMode === 'kanban'
                ? 'bg-white text-brand-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Kanban className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Table List View"
            className={`p-1.5 rounded-md transition ${
              viewMode === 'table'
                ? 'bg-white text-brand-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
