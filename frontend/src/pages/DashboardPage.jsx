import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsOverview from '../components/StatsOverview';
import FilterBar from '../components/FilterBar';
import TaskCard from '../components/TaskCard';
import KanbanBoard from '../components/KanbanBoard';
import TaskTable from '../components/TaskTable';
import TaskModal from '../components/TaskModal';
import CreateTeamModal from '../components/CreateTeamModal';
import TeamMembersModal from '../components/TeamMembersModal';
import { Plus, Users, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  // Core Data State
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // UI / Filter States
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'kanban' | 'table'
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isTeamMembersModalOpen, setIsTeamMembersModalOpen] = useState(false);

  // Show temporary toast feedback
  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // 1. Fetch Teams
  const fetchTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);
      const res = await api.get('/teams');
      if (res.data?.success) {
        setTeams(res.data.teams || []);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // 2. Fetch Team Members for active team (used in assignee filter)
  const fetchTeamMembers = useCallback(async (teamId) => {
    if (!teamId) {
      setTeamMembers([]);
      return;
    }
    try {
      const res = await api.get(`/teams/${teamId}/members`);
      if (res.data?.success) {
        setTeamMembers(res.data.members || []);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      setTeamMembers([]);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers(selectedTeamId);
  }, [selectedTeamId, fetchTeamMembers]);

  // 3. Fetch Tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const params = {};
      if (selectedTeamId) params.team_id = selectedTeamId;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (assigneeFilter === 'me') {
        params.assigned_to = user?.id;
      } else if (assigneeFilter === 'unassigned') {
        params.assigned_to = 'unassigned';
      } else if (assigneeFilter !== 'all') {
        params.assigned_to = assigneeFilter;
      }

      const res = await api.get('/tasks', { params });
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [selectedTeamId, statusFilter, assigneeFilter, user?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Active Team Object
  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  // Local Client-side Search Filter (in addition to server filters for instantaneous responsiveness)
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.assignee_name && t.assignee_name.toLowerCase().includes(query))
    );
  }, [tasks, searchQuery]);

  // Task Actions
  const handleOpenCreateTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSaved = (savedTask, action) => {
    showFeedback(
      action === 'created' ? 'Task created successfully!' : 'Task updated successfully!'
    );
    fetchTasks();
    fetchTeams();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      showFeedback(`Status updated to "${newStatus}".`);
    } catch (err) {
      showFeedback(err.friendlyMessage || 'Failed to update status.', 'error');
      fetchTasks(); // Rollback on failure
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showFeedback('Task deleted successfully.');
      fetchTeams();
    } catch (err) {
      showFeedback(err.friendlyMessage || 'Failed to delete task.', 'error');
    }
  };

  const handleTeamCreated = (newTeam) => {
    showFeedback(`Team "${newTeam.name}" created!`);
    fetchTeams();
    setSelectedTeamId(newTeam.id);
  };

  const handleMemberAdded = () => {
    fetchTeams();
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onOpenNewTask={handleOpenCreateTask}
        onOpenNewTeam={() => setIsCreateTeamModalOpen(true)}
        activeTeam={currentTeam}
      />

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <Sidebar
          teams={teams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={(id) => {
            setSelectedTeamId(id);
            setAssigneeFilter('all');
          }}
          onOpenNewTeam={() => setIsCreateTeamModalOpen(true)}
          onOpenTeamMembers={() => setIsTeamMembersModalOpen(true)}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Notification Toast */}
          {feedback && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in slide-in-from-top-2 duration-200 ${
                feedback.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* Header Banner for Selected View */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currentTeam ? currentTeam.name : 'All Workspace Tasks'}
                </h1>
                {currentTeam?.is_owner && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Owner
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {currentTeam
                  ? currentTeam.description || 'Collaborative team task board and assignments.'
                  : 'Consolidated overview across all teams you belong to.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentTeam && (
                <button
                  type="button"
                  onClick={() => setIsTeamMembersModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Members ({currentTeam.member_count || 1})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenCreateTask}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs hover:shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            </div>
          </div>

          {/* High-level Status Overview Cards */}
          <StatsOverview tasks={filteredTasks} />

          {/* Search & Dynamic Filter Bar */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            assigneeFilter={assigneeFilter}
            onAssigneeChange={setAssigneeFilter}
            teamMembers={teamMembers}
            currentUserId={user?.id}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Loading Indicator */}
          {loadingTasks ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
              <p className="text-xs font-medium text-slate-500">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No tasks found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                {searchQuery || statusFilter !== 'all' || assigneeFilter !== 'all'
                  ? 'Try clearing your search query or adjusting your filters to find what you need.'
                  : teams.length === 0
                  ? 'Create your first team to start adding collaborative tasks.'
                  : 'Get started by creating the first task for this workspace.'}
              </p>
              {teams.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsCreateTeamModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create a Team</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreateTask}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Task</span>
                </button>
              )}
            </div>
          ) : viewMode === 'kanban' ? (
            /* Kanban Board View */
            <KanbanBoard
              tasks={filteredTasks}
              onEditTask={handleOpenEditTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onOpenNewTask={handleOpenCreateTask}
            />
          ) : viewMode === 'table' ? (
            /* Table View */
            <TaskTable
              tasks={filteredTasks}
              onEdit={handleOpenEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          ) : (
            /* Responsive Cards Grid View (Default) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleOpenEditTask}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        teams={teams}
        defaultTeamId={selectedTeamId}
        onTaskSaved={handleTaskSaved}
      />

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onTeamCreated={handleTeamCreated}
      />

      {/* Team Members Management Modal */}
      <TeamMembersModal
        isOpen={isTeamMembersModalOpen}
        onClose={() => setIsTeamMembersModalOpen(false)}
        team={currentTeam}
        onMemberAdded={handleMemberAdded}
      />
    </div>
  );
}
