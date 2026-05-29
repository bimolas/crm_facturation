"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Plus, Search, Filter, ArrowLeft, Mail, 
  MapPin, Briefcase, ChevronRight, Download, MoreVertical, 
  CheckCircle, Shield, Tag, X, FileText, User, Loader2, AlertCircle
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "../../utils/api";

export function TeamsView() {
  const [viewState, setViewState] = useState<"list" | "detail" | "create" | "edit">("list");
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch teams on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/teams")
      .then((data: any) => {
        setTeams(data || []);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load teams");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateTeam = async (newTeam: any) => {
    try {
      const created = await api.post("/teams", newTeam);
      setTeams((prev) => [created, ...prev]);
      setViewState("list");
    } catch (err: any) {
      setError(err.message || "Failed to create team");
    }
  };

  const handleUpdateTeam = async (teamId: any, updates: any) => {
    try {
      const updated = await api.patch(`/teams/${teamId}`, updates);
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...updated } : t)));
      setSelectedTeam((prev: any) => (prev?.id === teamId ? { ...prev, ...updated } : prev));
      setViewState("detail");
    } catch (err: any) {
      setError(err.message || "Failed to update team");
    }
  };

  const handleSelectTeam = async (team: any) => {
    // Fetch full team detail (members + assigned work items)
    try {
      const detail = await api.get(`/teams/${team.id}`);
      setSelectedTeam(detail || team);
    } catch {
      setSelectedTeam(team);
    }
    setViewState("detail");
  };

  const handleAddMember = async (teamId: any, userId: any) => {
    try {
      await api.post(`/teams/${teamId}/members`, { userId });
      // Refresh team detail
      const detail = await api.get(`/teams/${teamId}`);
      setSelectedTeam(detail);
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, members: detail.members } : t)));
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (teamId: any, userId: any) => {
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      // Refresh team detail
      const detail = await api.get(`/teams/${teamId}`);
      setSelectedTeam(detail);
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, members: detail.members } : t)));
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-500 text-sm">Loading teams...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <AnimatePresence mode="wait">
        {viewState === "list" && (
          <TeamList 
            key="list" 
            teams={teams}
            onCreate={() => setViewState("create")} 
            onSelect={handleSelectTeam}
          />
        )}
        {viewState === "detail" && (
          <TeamDetail 
            key="detail" 
            team={selectedTeam} 
            onBack={() => setViewState("list")}
            onEdit={() => setViewState("edit")}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
          />
        )}
        {viewState === "create" && (
          <TeamForm 
            key="create" 
            onBack={() => setViewState("list")} 
            onSubmit={handleCreateTeam}
          />
        )}
        {viewState === "edit" && selectedTeam && (
          <TeamForm
            key="edit"
            initialData={selectedTeam}
            onBack={() => setViewState("detail")}
            onSubmit={(updates: any) => handleUpdateTeam(selectedTeam.id, updates)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamList({ teams, onCreate, onSelect }: { teams: any[], onCreate: () => void, onSelect: (t: any) => Promise<void> }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterManager, setFilterManager] = useState("");
  const [filterHasProjects, setFilterHasProjects] = useState("");

  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const managerName = t.manager?.name || t.manager?.email || t.manager || '';
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.tags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesManager = filterManager ? managerName === filterManager : true;
      const memberCount = Array.isArray(t.members) ? t.members.length : (t.members || 0);
      const activeProjects = t.activeProjects ?? (t.workItems?.length ?? 0);
      const matchesProjects = filterHasProjects === "yes" ? activeProjects > 0 : filterHasProjects === "no" ? activeProjects === 0 : true;
      return matchesSearch && matchesManager && matchesProjects;
    });
  }, [searchQuery, teams, filterManager, filterHasProjects]);

  const uniqueManagers = useMemo(() => Array.from(new Set(teams.map(t => t.manager?.name || t.manager?.email || t.manager || '').filter(Boolean))), [teams]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-sm text-slate-500 mt-1">Organize users, tag skill sets, and allocate teams to specific immaterial services or projects.</p>
        </div>
        <button onClick={onCreate} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Create Team
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3 w-full max-w-lg">
               <div className="relative flex-1">
                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teams, managers or skills..." 
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
                   <label className="block text-xs font-semibold text-slate-700 mb-1">Manager</label>
                   <select value={filterManager} onChange={(e) => setFilterManager(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                      <option value="">All Managers</option>
                      {uniqueManagers.map((manager: any) => <option key={manager} value={manager}>{manager}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1">Has Active Projects</label>
                   <select value={filterHasProjects} onChange={(e) => setFilterHasProjects(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                      <option value="">Any</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                   </select>
                </div>
             </div>
          )}
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-[#f8fafc] text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Team Name</th>
              <th className="px-6 py-3">Manager</th>
              <th className="px-6 py-3 text-center">Members</th>
              <th className="px-6 py-3">Progress</th>
              <th className="px-6 py-3 relative"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team) => (
              <tr key={team.id} onClick={() => onSelect(team)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                <td className="px-6 py-4">
                   <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 mr-3 flex items-center justify-center shrink-0">
                         <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                         <span className="font-bold text-slate-900 block">{team.name}</span>
                         <span className="text-xs text-slate-500">{team.description}</span>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                   {team.manager?.name || team.manager?.email || team.manager || '—'}
                </td>
                <td className="px-6 py-4 text-center">
                   <div className="flex justify-center -space-x-2">
                     {[1,2,3].slice(0, Math.min(3, Array.isArray(team.members) ? team.members.length : (team.members || 0))).map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center relative z-10 overflow-hidden">
                           <User className="w-4 h-4 text-slate-500" />
                        </div>
                     ))}
                     {(Array.isArray(team.members) ? team.members.length : (team.members || 0)) > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-600 relative z-20">
                           +{(Array.isArray(team.members) ? team.members.length : (team.members || 0)) - 3}
                        </div>
                     )}
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col space-y-1 w-32">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                         <span>{team.activeProjects ?? (team.workItems?.length ?? 0)} Projects</span>
                         <span className="text-blue-600">{team.projectProgress ?? 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                         <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${team.projectProgress ?? 0}%` }}></div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                   </button>
                </td>
              </tr>
            ))}
            {filteredTeams.length === 0 && (
               <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No teams found matching your search.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function TeamDetail({ team, onBack, onEdit, onAddMember, onRemoveMember }: { 
  team: any, 
  onBack: () => void,
  onEdit: () => void,
  onAddMember: (teamId: any, userId: any) => Promise<void>,
  onRemoveMember: (teamId: any, userId: any) => Promise<void>
}) {
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  if (!team) return null;

  const members: any[] = team.members || [];
  const workItems: any[] = team.workItems || team.assignedWorkItems || [];

  const handleAddMember = async () => {
    if (!addMemberUserId.trim()) return;
    setAddingMember(true);
    try {
      await onAddMember(team.id, addMemberUserId.trim());
      setAddMemberUserId("");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: any) => {
    await onRemoveMember(team.id, userId);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-[1200px] mx-auto pb-10">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teams
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-8 flex items-start justify-between bg-gradient-to-r from-[#F8FAFC] to-white relative">
          <div className="flex items-start space-x-6 relative z-10">
             <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                <Users className="w-8 h-8 text-indigo-600" />
             </div>
             <div className="pt-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-1.5">{team.name}</h1>
                <p className="text-slate-500 text-sm mb-2">{team.description}</p>
                <div className="flex items-center space-x-3 mb-3">
                   <div className="flex items-center space-x-1.5 text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Manager: {team.manager?.name || team.manager}</span>
                   </div>
                </div>
                <div className="flex items-center space-x-2">
                   {(team.tags || []).map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-600 flex items-center shadow-sm">
                         <Tag className="w-3 h-3 mr-1 text-slate-400" /> {tag}
                      </span>
                   ))}
                </div>
             </div>
          </div>
          <div className="flex items-center space-x-3 relative z-10">
             <button onClick={onEdit} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm">
                Edit Team
             </button>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-200 bg-[#f8fafc]/50">
           <div className="p-8 border-r border-slate-200 bg-white">
              <h3 className="font-bold text-slate-900 flex items-center mb-6">
                 <Shield className="w-5 h-5 mr-2 text-slate-400" /> Team Members ({members.length})
              </h3>
              <div className="space-y-3">
                 {members.map((member: any) => (
                    <div 
                       key={member.id || member.userId}
                       onClick={() => setSelectedMember(member)}
                       className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                    >
                       <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                             <User className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                               {member.user?.email || member.email || `User ${member.userId || member.id}`}
                             </p>
                             <p className="text-xs text-slate-500">{member.user?.role || member.role || 'Member'}</p>
                          </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         <button
                           onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.user?.id || member.userId || member.id); }}
                           className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                           title="Remove member"
                         >
                           <X className="w-4 h-4" />
                         </button>
                         <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                       </div>
                    </div>
                 ))}
                 {members.length === 0 && (
                   <p className="text-sm text-slate-400 text-center py-4">No members yet.</p>
                 )}
                 {/* Add member input */}
                 <div className="flex items-center space-x-2 mt-4">
                   <input
                     type="text"
                     value={addMemberUserId}
                     onChange={(e) => setAddMemberUserId(e.target.value)}
                     placeholder="User ID to add..."
                     className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                     onKeyDown={(e) => { if (e.key === "Enter") handleAddMember(); }}
                   />
                   <button
                     onClick={handleAddMember}
                     disabled={addingMember || !addMemberUserId.trim()}
                     className="px-3 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center"
                   >
                     {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                   </button>
                 </div>
              </div>
           </div>
           
           <div className="p-8 bg-[#F8FAFC]">
              <h3 className="font-bold text-slate-900 flex items-center mb-6">
                 <Briefcase className="w-5 h-5 mr-2 text-slate-400" /> Assigned Work Items
              </h3>
              <div className="space-y-4">
                 {workItems.length === 0 && (
                   <p className="text-sm text-slate-400 text-center py-4">No work items assigned.</p>
                 )}
                 {workItems.map((work: any) => (
                   <div key={work.id} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                         <span className={clsx(
                           "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase",
                           work.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                           work.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                           "bg-slate-100 text-slate-600"
                         )}>{work.status}</span>
                         <span className="text-xs text-slate-500">{work.type}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{work.title}</p>
                      {work.description && <p className="text-xs text-slate-500 mt-1">{work.description}</p>}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Member Details Popover */}
        <AnimatePresence>
           {selectedMember && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end">
                 <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
                    <div className="px-6 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                       <h2 className="text-lg font-bold text-slate-900">Member Overview</h2>
                       <button onClick={() => setSelectedMember(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                       <div className="flex flex-col items-center text-center border-b border-slate-100 pb-6 mb-6">
                          <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center mb-4 border-4 border-slate-50">
                             <User className="w-8 h-8 text-slate-500" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {selectedMember.user?.email || selectedMember.email || `User ${selectedMember.userId || selectedMember.id}`}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium">{selectedMember.user?.role || selectedMember.role || 'Member'}</p>
                       </div>
                    </div>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TeamForm({ onBack, onSubmit, initialData }: { onBack: () => void, onSubmit: (team: any) => void, initialData?: any }) {
  const [formData, setFormData] = useState({
     name: initialData?.name || '',
     manager: initialData?.manager?.name || initialData?.manager || 'Sarah Jenkins',
     department: 'Engineering',
     budget: '',
     description: initialData?.description || '',
     tags: (initialData?.tags || []).join(', ')
  });

  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     const teamData = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
     };
     onSubmit(teamData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end">
      <motion.div 
         initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col"
      >
         <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div>
               <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Edit Team' : 'Create New Team'}</h2>
               <p className="text-sm text-slate-500">Define capabilities, manager, and organize users.</p>
            </div>
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
               <span className="sr-only">Close</span><X className="w-5 h-5" />
            </button>
         </div>

         <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
            <form id="team-form" className="space-y-6" onSubmit={handleSubmit}>
               <section className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Team Name</label>
                        <input 
                           required type="text" placeholder="e.g. Graphic Design Services" 
                           value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                           className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" 
                        />
                     </div>
                     <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Manager Lead</label>
                        <select 
                           value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})}
                           className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white"
                        >
                           <option>Sarah Jenkins</option>
                           <option>Marcus Webb</option>
                           <option>Priya Patel</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                        <select 
                           value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                           className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white"
                        >
                           <option>Engineering</option>
                           <option>Marketing</option>
                           <option>Legal</option>
                           <option>Operations</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Allocated Budget ($)</label>
                        <input 
                           type="number" placeholder="250000" 
                           value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})}
                           className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" 
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description & Mandate</label>
                     <textarea 
                        required rows={3} placeholder="What is the primary function of this team?" 
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white resize-none"
                     ></textarea>
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Capabilities / Tags (comma separated)</label>
                     <input 
                        type="text" placeholder="Design, AWS, Marketing" 
                        value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" 
                     />
                  </div>
                  <div className="pt-2">
                     <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-700">Assign Members</label>
                        <button type="button" className="text-xs text-blue-600 font-medium hover:underline flex items-center">
                           <Plus className="w-3 h-3 mr-1" /> Add New Employee
                        </button>
                     </div>
                     <div className="p-4 border border-slate-200 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-center space-y-2">
                        <User className="w-6 h-6 text-slate-400" />
                        <p className="text-xs text-slate-500">No members assigned yet. You can create users in the Employees section and assign them here.</p>
                     </div>
                  </div>
               </section>
               <button type="submit" id="submit-team-form" className="hidden">Submit</button>
            </form>
         </div>

         <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
            <button onClick={onBack} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => document.getElementById('submit-team-form')?.click()} className="px-5 py-2.5 text-sm font-medium bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center">
               <CheckCircle className="w-4 h-4 mr-2" /> Save Team
            </button>
         </div>
      </motion.div>
    </motion.div>
  );
}
