import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, UserPlus, Users, Crown, Mail, Loader2, Check } from 'lucide-react';

export default function TeamMembersModal({ isOpen, onClose, team, onMemberAdded }) {
  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && team) {
      setError('');
      setSuccessMsg('');
      setMemberEmail('');
      loadMembers();
    }
  }, [isOpen, team]);

  const loadMembers = async () => {
    if (!team) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/teams/${team.id}/members`);
      if (res.data?.success) {
        setMembers(res.data.members || []);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load team members.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!memberEmail.trim()) {
      setError('Please enter user email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post(`/teams/${team.id}/members`, {
        email: memberEmail.trim(),
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Member added successfully!');
        setMemberEmail('');
        await loadMembers();
        if (onMemberAdded) onMemberAdded(team.id);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-lg text-slate-900">{team.name} Members</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              View and invite team members to collaborate on tasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Invite Member by Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Add</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{successMsg}</span>
              </p>
            )}
          </form>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Current Members ({members.length})
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 flex justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                        {member.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">{member.name}</p>
                          {member.is_owner && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                              <Crown className="w-2.5 h-2.5 text-amber-500" />
                              <span>Owner</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{member.email}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
