"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, AlertCircle, CheckCircle2, Circle, Clock, ArrowUp, ArrowDown, FolderKanban, User } from "lucide-react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string };
  assignee: { id: string; name: string } | null;
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
        
        // Extract unique projects for the filter dropdown
        const uniqueProjects = new Map();
        data.forEach((task: Task) => {
          if (task.project && !uniqueProjects.has(task.project.id)) {
            uniqueProjects.set(task.project.id, task.project);
          }
        });
        setProjects(Array.from(uniqueProjects.values()));
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter !== "ALL") {
      result = result.filter(t => t.status === statusFilter);
    }
    
    if (priorityFilter !== "ALL") {
      result = result.filter(t => t.priority === priorityFilter);
    }

    if (projectFilter !== "ALL") {
      result = result.filter(t => t.project?.id === projectFilter);
    }

    result.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [tasks, statusFilter, priorityFilter, projectFilter, sortDirection]);

  const isOverdue = (dateString: string | null, status: string) => {
    if (!dateString || status === "COMPLETED") return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  if (loading) return (
    <div className="p-8 text-slate-500 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mb-4"></div>
        <span className="font-medium">Loading tasks...</span>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-[80vh]">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">All Tasks</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and track all assignments across every project.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500 font-medium shadow-sm transition-all"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select 
            className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500 font-medium shadow-sm transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          
          <select 
            className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500 font-medium shadow-sm transition-all"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <button 
            onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
            className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium shadow-sm"
          >
            Due Date
            {sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-200 border-dashed shadow-sm">
            <div className="w-24 h-24 bg-pink-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-pink-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No tasks found</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-lg leading-relaxed">No tasks match your current filters. Great job staying on top of things!</p>
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status);
            return (
              <div key={task.id} className={`bg-white border rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6 ${overdue ? 'border-red-300 bg-red-50/30' : 'border-slate-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-xl font-bold ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h3>
                    {overdue && (
                      <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Overdue
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium mt-3">
                    {task.project?.name ? (
                      <Link href={`/dashboard/projects/${task.project.id}`} className="flex items-center gap-1.5 text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                        <FolderKanban className="w-4 h-4" />
                        {task.project.name}
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <FolderKanban className="w-4 h-4" />
                        No Project
                      </span>
                    )}
                    
                    {task.dueDate && (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm bg-white ${overdue ? 'text-red-600 border-red-200' : 'text-slate-600 border-slate-200'}`}>
                        <Calendar className="w-4 h-4" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}

                    <span className="flex items-center gap-1.5 text-slate-600 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg">
                      <User className="w-4 h-4" />
                      {task.assignee ? task.assignee.name : "Unassigned"}
                    </span>
                    
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border ${
                      task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {task.priority || "Medium"} Priority
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-slate-500 text-sm mt-4 line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {task.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 border-t xl:border-t-0 pt-4 xl:pt-0 mt-2 xl:mt-0">
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 w-full xl:w-auto">
                    <button
                      onClick={() => updateStatus(task.id, "PENDING")}
                      className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${task.status === "PENDING" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <Circle className="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> Todo
                    </button>
                    <button
                      onClick={() => updateStatus(task.id, "IN_PROGRESS")}
                      className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${task.status === "IN_PROGRESS" ? "bg-pink-500 text-white shadow-sm" : "text-slate-400 hover:text-pink-500"}`}
                    >
                      <Clock className="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> In Progress
                    </button>
                    <button
                      onClick={() => updateStatus(task.id, "COMPLETED")}
                      className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${task.status === "COMPLETED" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:text-emerald-500"}`}
                    >
                      <CheckCircle2 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> Done
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
