import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, LogOut, Plus, Users, User } from 'lucide-react';

export default function Navbar({ onOpenNewTask, onOpenNewTeam, activeTeam }) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                TeamFlow
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 rounded-md border border-brand-200">
                  Manager
                </span>
              </span>
            </div>
          </div>

          {/* Quick Actions & User Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Create Team Button */}
            <button
              type="button"
              onClick={onOpenNewTeam}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>New Team</span>
            </button>

            {/* Create Task Button */}
            <button
              type="button"
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm hover:shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>

            {/* User Profile Info */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
                  <p className="text-[11px] font-medium text-slate-500 truncate max-w-[140px] mt-0.5">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
