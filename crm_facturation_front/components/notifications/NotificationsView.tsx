"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Bell, ArrowRight, Activity, CheckCircle, Package, Shield, Settings, Info, User, Clock, Search, Filter } from "lucide-react";
import { clsx } from "clsx";

export function NotificationsView() {
   const NOTIFICATIONS: any[] = [];

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");

  const filteredNotifications = NOTIFICATIONS.filter(n => {
     const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           n.author.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesType = filterType ? n.type === filterType : true;
     const matchesAuthor = filterAuthor ? n.author === filterAuthor : true;
     return matchesSearch && matchesType && matchesAuthor;
  });

  const uniqueAuthors = Array.from(new Set(NOTIFICATIONS.map(n => n.author)));
  const uniqueTypes = Array.from(new Set(NOTIFICATIONS.map(n => n.type)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications & Traceability</h1>
          <p className="text-sm text-slate-500 mt-1">Review alerts, pending actions, and detailed system trace logs from all team members.</p>
        </div>
        <div className="flex space-x-2">
           <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
             Mark all as read
           </button>
           <button className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
             <Settings className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-[#F8FAFC]">
          {["All", "Alerts", "Actions Required", "Traceability Logs"].map((tab, i) => (
             <button key={tab} className={clsx(
                "px-6 py-3.5 text-sm font-medium border-b-2 transition-colors",
                i === 0 ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
             )}>
                {tab}
             </button>
          ))}
        </div>
        
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3 w-full max-w-lg">
               <div className="relative flex-1">
                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notifications..." 
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" 
                 />
               </div>
               <button onClick={() => setShowFilters(!showFilters)} className={clsx("px-3 py-1.5 border border-slate-200 rounded text-sm font-medium flex items-center transition-colors", showFilters ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600 hover:bg-slate-50 bg-white")}>
                 <Filter className="w-4 h-4 mr-2" /> Advanced filters
               </button>
             </div>
          </div>
          {showFilters && (
             <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1">Author / System</label>
                   <select value={filterAuthor} onChange={(e) => setFilterAuthor(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                      <option value="">All Actors</option>
                      {uniqueAuthors.map((author: any) => <option key={author} value={author}>{author}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1">Notification Type</label>
                   <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                      <option value="">All Types</option>
                      {uniqueTypes.map((type: any) => <option key={type} value={type} className="capitalize">{type}</option>)}
                   </select>
                </div>
             </div>
          )}
        </div>

        <div className="divide-y divide-slate-100">
           {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No notifications available.
              </div>
           ) : filteredNotifications.map((notif) => (
              <div key={notif.id} className="p-6 hover:bg-slate-50 transition-colors flex items-start space-x-4 cursor-pointer group">
                 <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5", notif.bg)}>
                    <notif.icon className={clsx("w-5 h-5", notif.color)} />
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                       <h3 className="font-bold text-slate-900">{notif.title}</h3>
                       <span className="text-xs font-medium text-slate-400 flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {notif.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{notif.message}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                       <div className="flex items-center space-x-4">
                          <span className="flex items-center bg-slate-100 px-2.5 py-1 rounded-md text-slate-700"><User className="w-3.5 h-3.5 mr-1.5" /> Action by: <strong>{notif.author}</strong></span>
                          <span>Role: {notif.role}</span>
                       </div>
                       {notif.type === 'action' && (
                          <button className="text-blue-600 flex items-center hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                             Review Changes <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </button>
                       )}
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </motion.div>
  );
}
