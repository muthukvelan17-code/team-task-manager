"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FolderKanban, Plus, MoreVertical, X, Calendar, AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  deadline: string | null;
  _count: { tasks: number };
  owner: { id: string, name: string };
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    deadline: "",
    priority: "MEDIUM",
    status: "ACTIVE",
    memberIds: [] as string[]
  });
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) {
      showNotification('error', 'Project Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (res.ok) {
        await fetchProjects();
        setShowCreate(false);
        setNewProject({ name: "", description: "", deadline: "", priority: "MEDIUM", status: "ACTIVE", memberIds: [] });
        showNotification('success', 'Project created successfully!');
      } else {
        const errorData = await res.json();
        showNotification('error', errorData.error || 'Failed to create project');
      }
    } catch (error) {
      showNotification('error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Optimistic update
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        showNotification('success', 'Project deleted successfully');
        setProjectToDelete(null);
      } else {
        const errorData = await res.json();
        showNotification('error', errorData.error || 'Failed to delete project');
      }
    } catch (error) {
      showNotification('error', 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
  </div>;

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-16">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg flex items-center space-x-3 z-[60] text-white animate-in slide-in-from-top-2 fade-in duration-300 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-2">Manage your team projects and workspaces.</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Delete Project?</h2>
            <p className="text-slate-500 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-700">"{projectToDelete.name}"</span>? 
              This action cannot be undone and will remove all associated tasks.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Create New Project</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="E.g., Website Redesign"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-slate-800"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  placeholder="What is this project about?"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none h-24 resize-none transition-all text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none bg-white transition-all text-slate-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Team Members</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer hover:text-pink-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={newProject.memberIds.includes(user.id)}
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...newProject.memberIds, user.id]
                            : newProject.memberIds.filter(id => id !== user.id);
                          setNewProject({ ...newProject, memberIds: ids });
                        }}
                        className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span>{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none bg-white transition-all text-slate-800"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Creating...' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="block group relative">
            <Link href={`/dashboard/projects/${project.id}`} className="block h-full">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-pink-200 transition-all duration-200 relative overflow-hidden h-full flex flex-col">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  project.priority === 'HIGH' ? 'bg-red-500' :
                  project.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-pink-50 text-pink-600 rounded-xl group-hover:bg-pink-100 transition-colors">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      project.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {project.status.replace("_", " ")}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{project.name}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow">{project.description || "No description provided."}</p>
                
                {project.deadline && (
                  <div className="flex items-center text-xs text-slate-500 mb-4 font-medium">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Due: {new Date(project.deadline).toLocaleDateString()}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{project._count?.tasks || 0}</span> Tasks
                  </div>
                  <div className="text-xs bg-slate-100 px-2.5 py-1.5 rounded-md text-slate-600 font-medium">
                    {project.owner?.name || 'Unknown'}
                  </div>
                </div>
              </div>
            </Link>

            {/* Quick Delete Button for Owner or Admin */}
            {(session?.user?.id === project.owner?.id || session?.user?.role === 'ADMIN') && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setProjectToDelete(project);
                }}
                className="absolute top-4 right-12 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      {projects.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-500 mb-6">Get started by creating your first team project.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Project</span>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-pink-600 hover:bg-pink-700 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(219,39,119,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-105 z-40 group"
        aria-label="Create New Project"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
