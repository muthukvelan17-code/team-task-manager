"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Calendar, User, CheckCircle2, Clock, ListTodo, X, Edit, Trash2, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface UserType {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignee: UserType | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  createdAt: string;
  tasks: Task[];
  owner: UserType;
  members: UserType[];
}

export default function ProjectDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session } = useSession();
  
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    assigneeId: ""
  });

  const [editProjectData, setEditProjectData] = useState({
    name: "",
    description: "",
    deadline: "",
    priority: "MEDIUM",
    status: "ACTIVE",
    memberIds: [] as string[]
  });

  useEffect(() => {
    if (id) fetchProject();
    if (session) fetchUsers();
  }, [id, session]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Project not found");
      const data = await res.json();
      setProject(data);
      setEditProjectData({
        name: data.name,
        description: data.description || "",
        deadline: data.deadline ? data.deadline.split('T')[0] : "",
        priority: data.priority,
        status: data.status,
        memberIds: data.members?.map((m: any) => m.id) || []
      });
    } catch (error) {
      showNotification("error", "Failed to load project details.");
      setTimeout(() => router.push("/dashboard/projects"), 2000);
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

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjectData.name) {
      showNotification('error', 'Project Title is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProjectData),
      });

      if (res.ok) {
        setShowEditProject(false);
        showNotification('success', 'Project updated successfully');
        fetchProject();
      } else {
        const errorData = await res.json();
        showNotification('error', errorData.error || 'Failed to update project');
      }
    } catch (error) {
      showNotification('error', 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification('success', 'Project deleted successfully');
        router.push("/dashboard/projects");
      } else {
        const data = await res.json();
        showNotification('error', data.error || "Failed to delete project");
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      showNotification('error', "An unexpected error occurred");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) {
      showNotification('error', 'Task Title is required');
      return;
    }

    setIsSubmittingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, projectId: id }),
      });

      if (res.ok) {
        setShowCreateTask(false);
        setNewTask({ title: "", description: "", dueDate: "", assigneeId: "" });
        showNotification('success', 'Task added successfully');
        fetchProject();
      } else {
        const errorData = await res.json();
        showNotification('error', errorData.error || 'Failed to add task');
      }
    } catch (error) {
      showNotification('error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      showNotification('error', 'Failed to update task status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "IN_PROGRESS": return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <ListTodo className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-700";
      case "OVERDUE": return "bg-red-100 text-red-700";
      default: return "bg-pink-100 text-pink-700";
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
        <p className="text-slate-500 font-medium">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-slate-500 mt-2">The project you are looking for does not exist or was deleted.</p>
        <Link href="/dashboard/projects" className="mt-6 text-pink-600 hover:underline">
          Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg flex items-center space-x-3 z-[60] text-white animate-in slide-in-from-top-2 fade-in duration-300 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium mb-2">
        <Link href="/dashboard/projects" className="hover:text-pink-600 transition-colors">Projects</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">{project.name}</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${
          project.priority === 'HIGH' ? 'bg-red-500' :
          project.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
        }`} />
        
        <div className="flex-1 ml-4">
          <div className="flex items-center space-x-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{project.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(project.status)}`}>
              {project.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-slate-600 text-lg max-w-3xl leading-relaxed">
            {project.description || "No description provided."}
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-8">
            <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-sm font-bold shadow-sm">
                {project.owner?.name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Owner</p>
                <p className="text-sm font-semibold text-slate-900">{project.owner?.name || 'Unknown'}</p>
              </div>
            </div>

            {project.deadline && (
              <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-sm">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Due Date</p>
                  <p className="text-sm font-semibold text-slate-900">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-sm">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Created</p>
                <p className="text-sm font-semibold text-slate-900">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center -space-x-3">
              {project.members?.slice(0, 5).map((member, i) => (
                <div 
                  key={member.id} 
                  className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shadow-sm"
                  title={member.name}
                >
                  {member.name[0]}
                </div>
              ))}
              {project.members?.length > 5 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shadow-sm">
                  +{project.members.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 mt-6 md:mt-0 ml-4 md:ml-0">
          {(session?.user?.id === project.owner?.id || session?.user?.role === 'ADMIN') && (
            <>
              <button
                onClick={() => setShowEditProject(true)}
                className="p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm"
                title="Edit Project"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all shadow-sm"
                title="Delete Project"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Edit Project</h2>
              <button onClick={() => setShowEditProject(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditProject} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editProjectData.name}
                  onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={editProjectData.description}
                  onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none h-24 resize-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editProjectData.deadline}
                    onChange={(e) => setEditProjectData({ ...editProjectData, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editProjectData.priority}
                    onChange={(e) => setEditProjectData({ ...editProjectData, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white transition-all"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editProjectData.status}
                  onChange={(e) => setEditProjectData({ ...editProjectData, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white transition-all"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Team Members</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer hover:text-pink-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={editProjectData.memberIds.includes(user.id)}
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...editProjectData.memberIds, user.id]
                            : editProjectData.memberIds.filter(id => id !== user.id);
                          setEditProjectData({ ...editProjectData, memberIds: ids });
                        }}
                        className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span>{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditProject(false)}
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
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Delete Project?</h2>
            <p className="text-slate-500 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-700">"{project.name}"</span>? 
              This action cannot be undone and will remove all associated tasks.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
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

      {/* Tasks Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
              Project Tasks
              <span className="ml-3 bg-pink-100 text-pink-700 text-sm py-1 px-3 rounded-full font-semibold">
                {project.tasks.length}
              </span>
            </h2>
          </div>
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Task List */}
        <div className="divide-y divide-slate-100">
          {project.tasks.length === 0 && (
            <div className="p-16 text-center text-slate-500 bg-slate-50/30">
              <ListTodo className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-medium text-slate-800 mb-2">No tasks yet</h3>
              <p>Create the first task to get this project rolling!</p>
            </div>
          )}
          
          {project.tasks.map((task) => (
            <div key={task.id} className="p-6 md:p-8 flex flex-col md:flex-row items-start justify-between hover:bg-slate-50/80 transition-colors group">
              <div className="flex items-start space-x-5 flex-1 mb-4 md:mb-0">
                <div className={`p-3 rounded-2xl shadow-sm border ${
                  task.status === "COMPLETED" ? "bg-green-50 border-green-100" : 
                  task.status === "IN_PROGRESS" ? "bg-yellow-50 border-yellow-100" : "bg-white border-slate-200"
                }`}>
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{task.title}</h4>
                  {task.description && <p className="text-slate-600 text-sm leading-relaxed mb-3 max-w-2xl">{task.description}</p>}
                  
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {task.dueDate && (
                      <div className="flex items-center text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                      <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {task.assignee ? task.assignee.name : "Unassigned"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center w-full md:w-auto mt-2 md:mt-0 ml-0 md:ml-6">
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className={`w-full md:w-auto px-4 py-2 rounded-xl text-sm font-bold border appearance-none cursor-pointer outline-none transition-all shadow-sm hover:shadow focus:ring-2 focus:ring-pink-500 ${
                    task.status === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                    task.status === "IN_PROGRESS" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">New Task</h2>
              <button onClick={() => setShowCreateTask(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                   className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  required
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none h-24 resize-none transition-all"
                  placeholder="Add more details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white transition-all"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center space-x-2 disabled:opacity-70"
                >
                  {isSubmittingTask && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmittingTask ? 'Saving...' : 'Save Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
