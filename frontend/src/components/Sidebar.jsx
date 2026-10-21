import React from 'react';
import { Users, Plus, Layers, UserPlus, CheckCircle, ChevronRight } from 'lucide-react';

export default function Sidebar({
  teams,
  selectedTeamId,
  onSelectTeam,
  onOpenNewTeam,
  onOpenTeamMembers,
}) {
  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Users className="w-4 h-4 text-brand-600" />
          <span>Your Teams</span>
        </div>
        <button
          onClick={onOpenNewTeam}
          title="Create New Team"
          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links & Team List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* All Tasks Item */}
        <button
          onClick={() => onSelectTeam(null)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
            selectedTeamId === null
              ? 'bg-brand-50 text-brand-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Layers className={`w-4 h-4 ${selectedTeamId === null ? 'text-brand-600' : 'text-slate-400'}`} />
            <span className="truncate">All My Tasks</span>
          </div>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-200/60 text-slate-600 font-bold">
            All
          </span>
        </button>

        <div className="pt-2 pb-1 px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspaces ({teams.length})
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 mb-2">You don't belong to any teams yet.</p>
            <button
              onClick={onOpenNewTeam}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create a team</span>
            </button>
          </div>
        ) : (
          teams.map((team) => {
            const isSelected = selectedTeamId === team.id;
            return (
              <div
                key={team.id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-brand-50 text-brand-800 font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => onSelectTeam(team.id)}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isSelected ? 'bg-brand-600 ring-2 ring-brand-200' : 'bg-slate-300'
                    }`}
                  />
                  <span className="truncate">{team.name}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isSelected ? 'bg-brand-200/60 text-brand-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {team.member_count || 1} {team.member_count === 1 ? 'mbr' : 'mbrs'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Active Team Footer Action (Manage Members) */}
      {selectedTeamId && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => onOpenTeamMembers(selectedTeamId)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 rounded-lg shadow-xs transition"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-600" />
            <span>Manage Team Members</span>
          </button>
        </div>
      )}
    </aside>
  );
}
