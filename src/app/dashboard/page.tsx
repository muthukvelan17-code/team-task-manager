"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CheckCircle2, Clock, ListTodo, AlertCircle, FolderKanban, CheckSquare, Loader2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  project: { id: string; name: string };
}

export default function DashboardOverview() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchStats()]).finally(() => setLoading(false));
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const dashboardStats = [
    { label: "Active Projects", value: stats?.activeProjects ?? 0, icon: FolderKanban, color: "text-pink-600", bg: "bg-pink-100" },
    { label: "My Tasks", value: stats?.myTasks?.total ?? 0, icon: ListTodo, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Completed", value: stats?.myTasks?.completed ?? 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { label: "Overdue Projects", value: stats?.overdueProjects ?? 0, icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
  ];

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
      <p className="text-slate-500 font-medium">Loading dashboard overview...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Here's a quick look at your team's workspace.</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/projects" className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-2">
            <FolderKanban className="w-5 h-5" />
            <span>Projects</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-center group">
            <div className={`p-4 rounded-xl ${stat.bg} mr-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-pink-600" />
              Recent Activity
            </h2>
            <Link href="/dashboard/tasks" className="text-sm font-bold text-pink-600 hover:text-pink-700 flex items-center">
              View All Tasks <CheckSquare className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl ${
                    task.status === "COMPLETED" ? "bg-green-100 text-green-600" :
                    task.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-600" :
                    "bg-pink-100 text-pink-600"
                  }`}>
                    {task.status === "COMPLETED" ? <CheckCircle2 className="w-5 h-5" /> : 
                     task.status === "IN_PROGRESS" ? <Clock className="w-5 h-5" /> : 
                     <ListTodo className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-bold group-hover:text-pink-600 transition-colors">{task.title}</h4>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{task.project.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    task.status === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                    task.status === "IN_PROGRESS" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-pink-50 text-pink-700 border-pink-200"
                  }`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium text-lg">No recent activity found.</p>
                <p className="text-sm mt-1">Start by assigning tasks to your team.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-pink-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-pink-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Team Capacity</h3>
              <p className="text-pink-100 text-sm mb-6">You have {tasks.filter(t => t.status !== 'COMPLETED').length} active tasks across {stats?.activeProjects ?? 0} projects.</p>
              <Link href="/dashboard/tasks" className="inline-flex items-center space-x-2 bg-white text-pink-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-50 transition-colors">
                <span>Manage Workflow</span>
              </Link>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Critical Items
            </h3>
            <div className="space-y-4">
              {tasks.filter(t => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < new Date()).slice(0, 3).map(task => (
                <div key={task.id} className="p-4 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-sm font-bold text-red-800 truncate">{task.title}</p>
                  <p className="text-[10px] text-red-600 font-semibold mt-1">OVERDUE • {task.project.name}</p>
                </div>
              ))}
              {tasks.filter(t => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < new Date()).length === 0 && (
                <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-2xl text-center font-medium">All items are on track! 🎉</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
