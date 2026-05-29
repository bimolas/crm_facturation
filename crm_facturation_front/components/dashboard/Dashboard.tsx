"use client";

import { motion } from "motion/react";
import { CopyPlus, TrendingUp, BriefcaseBusiness, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function Dashboard({ activeWorkspace }: { activeWorkspace?: any }) {
  const performanceData: any[] = [];
  const summaryStats = [
    { title: "Pending Invoices", value: "—", icon: CopyPlus, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Converted Leads", value: "—", icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50" },
    { title: "Projects In Progress", value: "—", icon: BriefcaseBusiness, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Tasks Not Finished", value: "—", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const sampleTasks: any[] = [];
  const sampleTodos: any[] = [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-[1600px] mx-auto pb-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Live metrics are not connected yet for {activeWorkspace?.name || "Current Workspace"}
          </p>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
          Manage Widgets
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center space-x-4 relative">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-slate-400" />
                Payment Records
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-teal-400 mr-2"></span> Last Week Payments</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-100 mr-2"></span> This Week Payments</div>
                <div className="flex outline outline-1 outline-slate-200 rounded-lg overflow-hidden">
                   <button className="px-3 py-1 bg-slate-50 font-medium">Weekly</button>
                </div>
              </div>
            </div>
            <div className="p-6 h-80">
              {performanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No payment data connected yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="thisWeek" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lastWeek" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center space-x-6 text-sm font-medium">
               <button className="text-blue-600 border-b-2 border-blue-600 pb-4 -mb-4">Tasks</button>
               <button className="text-slate-500 hover:text-slate-900 pb-4 -mb-4">Projects</button>
               <button className="text-slate-500 hover:text-slate-900 pb-4 -mb-4">Reminders</button>
            </div>
            <div className="p-0">
               <table className="w-full text-sm text-left">
                  <thead className="bg-[#f8fafc] text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                       <th className="px-6 py-3 font-medium">#</th>
                       <th className="px-6 py-3 font-medium">Name</th>
                       <th className="px-6 py-3 font-medium">Start Date</th>
                       <th className="px-6 py-3 font-medium">Priority</th>
                       <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleTasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">No tasks connected yet.</td>
                      </tr>
                    ) : sampleTasks.map((task, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 text-slate-500">{task.id}</td>
                           <td className="px-6 py-4 font-medium text-slate-900">{task.name}</td>
                           <td className="px-6 py-4 text-slate-500">{task.date}</td>
                           <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                 task.priority === 'Low' ? 'bg-green-100 text-green-700' : 
                                 task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                                 'bg-red-100 text-red-700'
                              }`}>
                                 {task.priority}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                                <span className={`inline-flex items-center text-xs font-medium ${
                                   task.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${task.status === 'Completed' ? 'bg-green-600' : 'bg-blue-600'}`}></span>
                                  {task.status}
                                </span>
                           </td>
                        </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900">To-Do items</h3>
                <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-sm hover:bg-slate-50">+ To-Do</button>
             </div>
             
             <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 tracking-wider">ONGOING</p>
                {sampleTodos.length === 0 ? (
                  <div className="p-3 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-500">
                    No to-do items connected yet.
                  </div>
                ) : sampleTodos.map((todo, index) => (
                  <div key={index} className="p-3 border border-slate-200 rounded-lg">
                    {todo.title}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
