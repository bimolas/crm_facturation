"use client";

import { motion } from "motion/react";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Briefcase, 
  FolderKanban, 
  Package,
  CheckSquare,
  Headset,
  Settings,
  Activity,
  ChevronDown,
  MessageSquare,
  Plus
} from "lucide-react";
import { clsx } from "clsx";

export type TabId = "dashboard" | "invoices" | "workflows" | "companies" | "articles" | "calendar" | "teams" | "employees" | "notifications" | "messages" | "sales" | "organization" | "communication" | "marketplace" | "my-rfps" | "my-bids" | "my-contracts" | "inventory" | "works";

interface SidebarProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  workspaces?: any[];
  setWorkspaces?: any;
  activeWorkspaceId?: number;
  setActiveWorkspaceId?: any;
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

export function Sidebar({
  activeTab,
  onChangeTab,
  workspaces = [],
  activeWorkspaceId,
  setActiveWorkspaceId,
  onAddWorkspace,
}: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar", icon: CheckSquare },
    { id: "companies", label: "Customers", icon: Users },
    { 
      id: "organization", 
      label: "Organization", 
      icon: Users,
      subItems: [
        { id: "teams", label: "Teams" },
        { id: "employees", label: "Employees" },
      ]
    },
    { 
      id: "communication", 
      label: "Communication", 
      icon: MessageSquare,
      subItems: [
        { id: "messages", label: "Messages" },
        { id: "notifications", label: "Notifications" },
      ]
    },
    { 
      id: "sales", 
      label: "Sales", 
      icon: Activity,
      subItems: [
        { id: "invoices", label: "Invoices" },
      ]
    },
    { 
      id: "workflows", 
      label: "Contracts & Bids", 
      icon: FileText,
      subItems: [
        { id: "marketplace", label: "Marketplace" },
        { id: "my-rfps", label: "My RFPs" },
        { id: "my-bids", label: "My Bids" },
        { id: "my-contracts", label: "My Contracts" },
        { id: "works", label: "Works & Execution" },
      ]
    },
    { id: "articles", label: "Products", icon: FolderKanban },
    { id: "inventory", label: "Inventory", icon: Package },
  ];

  const othersItems = [
    { id: "support", label: "Support", icon: Headset },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#F8FAFC] border-r border-slate-200 h-screen flex flex-col pt-6 pb-4">
      <div className="px-6 mb-8 flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">Effix</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="mb-2">
          <p className="px-2 text-xs font-semibold text-slate-400 tracking-wider mb-2">MAIN</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab));
              return (
                <div key={item.id}>
                  <button
                    onClick={() => item.subItems ? onChangeTab(item.subItems[0].id as TabId) : onChangeTab(item.id as TabId)}
                    className={clsx(
                      "w-full flex items-center justify-between px-2 py-2.5 rounded-lg transition-colors group",
                      isActive ? "bg-white shadow-sm border border-slate-200" : "hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={clsx(
                        "w-5 h-5",
                        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      )} />
                      <span className={clsx(
                        "text-sm font-medium",
                        isActive ? "text-blue-900" : "text-slate-600"
                      )}>{item.label}</span>
                    </div>
                    {item.subItems && (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Sub-items block */}
                  {item.subItems && isActive && (
                    <div className="mt-1 ml-9 space-y-1">
                      {item.subItems.map(subItem => (
                        <button
                          key={subItem.id}
                          onClick={() => onChangeTab(subItem.id as TabId)}
                          className={clsx(
                            "w-full text-left px-2 py-2 rounded-md text-sm transition-colors",
                            activeTab === subItem.id 
                              ? "text-blue-600 font-medium bg-blue-50/50" 
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          )}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── WORKSPACES — matching reference screenshot ── */}
        {workspaces.length > 0 && (
          <div className="mb-2 mt-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-xs font-semibold text-slate-400 tracking-wider">WORKSPACES</p>
              <button
                onClick={() => onAddWorkspace?.()}
                className="px-2 py-0.5 text-[11px] font-semibold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors flex items-center"
              >
                <Plus className="w-3 h-3 mr-0.5" /> ADD
              </button>
            </div>
            <div className="space-y-0.5">
              {workspaces.map((workspace, idx) => {
                const isActiveWorkspace = activeWorkspaceId === workspace.id;
                const initials = getCompanyInitials(workspace.name || "WS");
                const colorScheme = INITIAL_COLORS[idx % INITIAL_COLORS.length];
                return (
                  <button
                    key={workspace.id}
                    onClick={() => setActiveWorkspaceId?.(workspace.id)}
                    className={clsx(
                      "w-full flex items-center justify-between px-2 py-2.5 rounded-lg transition-all group",
                      isActiveWorkspace
                        ? "bg-white shadow-sm border border-blue-200"
                        : "hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                        isActiveWorkspace
                          ? "bg-blue-900 text-white"
                          : `${colorScheme.bg} ${colorScheme.text}`
                      )}>
                        {initials}
                      </div>
                      <span className={clsx(
                        "text-sm font-medium truncate",
                        isActiveWorkspace ? "text-slate-900" : "text-slate-600"
                      )}>
                        {workspace.name}
                      </span>
                    </div>
                    {isActiveWorkspace && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          <p className="px-2 text-xs font-semibold text-slate-400 tracking-wider mb-2">OTHERS</p>
          <div className="space-y-1">
            {othersItems.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center space-x-3 px-2 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <item.icon className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-auto">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">👋</span>
            <p className="font-semibold text-slate-900 text-sm">Hey Buddy,</p>
          </div>
          <p className="text-xs text-slate-500 mb-4">You have 10 days left in your trial period.</p>
          
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
            <div className="bg-blue-900 h-1.5 rounded-full" style={{ width: '40%' }}></div>
          </div>
          
          <button className="w-full py-2 bg-white border border-slate-200 text-slate-900 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center">
            Upgrade plan <span className="ml-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
