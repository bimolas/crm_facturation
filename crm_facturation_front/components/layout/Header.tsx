"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Search, Share2, MessageSquare, Bell, User, CheckCircle, Package, 
  Building2, ChevronDown, Plus, X, Briefcase, Mail, Phone, MapPin 
} from "lucide-react";
import { clsx } from "clsx";

interface HeaderProps {
  workspaces?: any[];
  setWorkspaces?: any;
  activeWorkspaceId?: number;
  setActiveWorkspaceId?: (id: number) => void;
  onAddWorkspace?: () => void;
}

function getCompanyInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const INITIAL_COLORS = [
  { bg: "bg-blue-900", text: "text-white" },
  { bg: "bg-slate-200", text: "text-slate-600" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
];

export function Header({
  workspaces = [],
  setWorkspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  onAddWorkspace
}: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState([
     { name: "Sarah Jenkins", role: "Manager", msg: "Can you send the Q2 reports?", time: "2m" },
     { name: "Marcus Webb", role: "Designer", msg: "Here is the Figma link.", time: "10m" }
  ]);

  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendReply = () => {
     if (!replyText.trim()) return;
     const newMsg = {
        name: "You",
        role: "Admin",
        msg: replyText,
        time: "Just now"
     };
     setMessages([newMsg, ...messages]);
     setReplyText("");
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const activeInitials = getCompanyInitials(activeWorkspace?.name || "WS");

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-30">
      <div className="flex items-center bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2 w-96 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
        />
        <div className="ml-2 flex items-center justify-center p-1 border border-slate-200 rounded bg-white text-[10px] text-slate-400 font-medium">
          ⌘1
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 border-r border-slate-200 pr-4 relative">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => { setShowMsg(!showMsg); setShowNotif(false); setShowWorkspaceMenu(false); }}
              className={clsx(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors relative",
                showMsg ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
            </button>

            {showMsg && (
               <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                     <span className="font-bold text-slate-900 text-sm">Quick Messages</span>
                     <button className="text-xs text-blue-600 hover:underline">View All</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                     {messages.map((m, i) => (
                        <div key={i} className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-slate-400" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                 <span className="text-sm font-bold text-slate-900 truncate">{m.name}</span>
                                 <span className="text-[10px] text-slate-400">{m.time}</span>
                              </div>
                              <p className="text-xs text-slate-500 truncate">{m.msg}</p>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50 relative bottom-0">
                     <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1">
                        <input 
                           type="text" 
                           placeholder="Quick reply..." 
                           value={replyText}
                           onChange={(e) => setReplyText(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                           className="flex-1 bg-transparent text-xs py-1 px-2 outline-none" 
                        />
                        <button onClick={handleSendReply} className="text-blue-600 text-xs font-medium px-2">Send</button>
                     </div>
                  </div>
               </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => { setShowNotif(!showNotif); setShowMsg(false); setShowWorkspaceMenu(false); }}
              className={clsx(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors relative",
                showNotif ? "bg-red-50 text-red-600" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {showNotif && (
               <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                     <span className="font-bold text-slate-900 text-sm">Notifications</span>
                     <button className="text-xs text-blue-600 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                     {[
                        { title: "Action Required", icon: CheckCircle, text: "PO-942 requires approval", time: "10m" },
                        { title: "Delivery", icon: Package, text: "Equipment delivered to Hub", time: "2h" }
                     ].map((n, i) => (
                        <div key={i} className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex items-start space-x-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                              <n.icon className="w-4 h-4 text-slate-500" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                 <span className="text-sm font-bold text-slate-900 truncate">{n.title}</span>
                                 <span className="text-[10px] text-slate-400">{n.time}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{n.text}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </div>
        </div>
        
        {/* ── Workspace Dropdown — matches reference screenshot ── */}
        <div className="relative" ref={workspaceMenuRef}>
          <button 
            onClick={() => { setShowWorkspaceMenu(!showWorkspaceMenu); setShowMsg(false); setShowNotif(false); }}
            className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity bg-white border border-slate-200 rounded-lg py-1.5 px-3 shadow-sm hover:bg-slate-50"
          >
            <div className="w-7 h-7 rounded-md bg-blue-900 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
               {activeInitials}
            </div>
            <span className="text-sm font-semibold text-slate-900 leading-none truncate max-w-[140px] hidden sm:block">
              {activeWorkspace?.name || "Select Workspace"}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 flex flex-col">
              {/* Switch Company Header */}
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch Company</p>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                  {workspaces.length} Managed
                </span>
              </div>

              {/* Company List */}
              <div className="px-2 pb-2 max-h-64 overflow-y-auto">
                {workspaces.map((ws, idx) => {
                  const isActive = activeWorkspaceId === ws.id;
                  const initials = getCompanyInitials(ws.name || "WS");
                  const colorScheme = INITIAL_COLORS[idx % INITIAL_COLORS.length];
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspaceId?.(ws.id);
                        setShowWorkspaceMenu(false);
                      }}
                      className={clsx(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all",
                        isActive ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                      )}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={clsx(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                          isActive
                            ? "bg-blue-900 text-white"
                            : `${colorScheme.bg} ${colorScheme.text}`
                        )}>
                          {initials}
                        </div>
                        <div className="text-left min-w-0">
                          <p className={clsx(
                            "text-sm font-semibold truncate",
                            isActive ? "text-slate-900" : "text-slate-700"
                          )}>
                            {ws.name}
                          </p>
                          <p className="text-[11px] text-slate-400">Administrator</p>
                        </div>
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Create Managed Company Action */}
              <div className="px-2 py-2 border-t border-slate-100 bg-white">
                <button 
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    onAddWorkspace?.();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Managed Company</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
