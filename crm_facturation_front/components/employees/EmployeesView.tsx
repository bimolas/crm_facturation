"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Plus, Search, Filter, ArrowLeft, MoreVertical, 
  CheckCircle, Briefcase, Tag, X, User
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "../../utils/api";

export function EmployeesView() {
  const [viewState, setViewState] = useState<"list" | "create">("list");
   const [employees, setEmployees] = useState<any[]>([]);

   useEffect(() => {
      let cancelled = false;

      api.get("/users")
         .then((usersData: any[]) => {
            if (cancelled) return;

            setEmployees(Array.isArray(usersData)
               ? usersData.map((user: any) => ({
                     id: user.id,
                     name: user.name || user.fullName || user.email?.split("@")[0] || `User ${user.id}`,
                     role: user.role,
                     email: user.email,
                     status: user.isActive === false ? "Inactive" : "Active",
                     teams: Array.isArray(user.teams) ? user.teams : [],
                     skills: Array.isArray(user.skills) ? user.skills : [],
                  }))
               : []);
         })
         .catch(() => {
            if (!cancelled) {
               setEmployees([]);
            }
         });

      return () => {
         cancelled = true;
      };
   }, []);

  const handleCreateEmployee = (newEmp: any) => {
     setEmployees([...employees, { ...newEmp, id: Date.now(), status: 'Active', teams: [] }]);
     setViewState("list");
  };

  return (
    <AnimatePresence mode="wait">
      {viewState === "list" && (
        <EmployeeList 
          key="list" 
          employees={employees}
          onCreate={() => setViewState("create")} 
        />
      )}
      {viewState === "create" && (
        <EmployeeForm 
          key="create" 
          onBack={() => setViewState("list")} 
          onSubmit={handleCreateEmployee}
        />
      )}
    </AnimatePresence>
  );
}

function EmployeeList({ employees, onCreate }: { employees: any[], onCreate: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = filterRole ? emp.role === filterRole : true;
      const matchesStatus = filterStatus ? emp.status === filterStatus : true;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchQuery, employees, filterRole, filterStatus]);

  // Derive unique roles
  const uniqueRoles = useMemo(() => Array.from(new Set(employees.map(e => e.role))), [employees]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Manage personnel, roles, and skills.</p>
        </div>
        <button onClick={onCreate} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
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
                    placeholder="Search employees, roles, skills..." 
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
                   <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                   <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                      <option value="">All Roles</option>
                      {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                   <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                      <option value="">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                   </select>
                </div>
             </div>
          )}
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-[#f8fafc] text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Employee</th>
              <th className="px-6 py-3">Role & Skills</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 relative"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                   <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 mr-3 flex items-center justify-center shrink-0 overflow-hidden">
                         <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                         <span className="font-bold text-slate-900 block">{emp.name}</span>
                         <span className="text-xs text-slate-500">{emp.email}</span>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4">
                    <p className="font-medium text-slate-900 mb-1">{emp.role}</p>
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      {emp.skills.map((skill: string) => (
                         <span key={skill} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {skill}
                         </span>
                      ))}
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={clsx(
                      "inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-semibold border",
                      emp.status === "Active" ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"
                   )}>
                      {emp.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                   </button>
                </td>
              </tr>
            ))}
            {filteredEmployees.length === 0 && (
               <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No employees found matching your search.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function EmployeeForm({ onBack, onSubmit }: { onBack: () => void, onSubmit: (emp: any) => void }) {
  const [formData, setFormData] = useState({
     name: '',
     email: '',
     role: '',
     skills: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     onSubmit({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
     });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end">
      <motion.div 
         initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col"
      >
         <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div>
               <h2 className="text-xl font-bold text-slate-900">Add New Employee</h2>
               <p className="text-sm text-slate-500">Create a user profile to assign to teams.</p>
            </div>
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
               <span className="sr-only">Close</span><X className="w-5 h-5" />
            </button>
         </div>

         <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
            <form id="emp-form" className="space-y-6" onSubmit={handleSubmit}>
               <section className="space-y-5">
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                     <input required type="text" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                     <input required type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role / Job Title</label>
                     <input required type="text" placeholder="e.g. Frontend Developer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Skills & Qualifications (Tags)</label>
                     <input type="text" placeholder="Press enter to add tag (comma separated)" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                  </div>
               </section>
               <button type="submit" id="submit-emp-form" className="hidden">Submit</button>
            </form>
         </div>

         <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
            <button onClick={onBack} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => document.getElementById('submit-emp-form')?.click()} className="px-5 py-2.5 text-sm font-medium bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center">
               <CheckCircle className="w-4 h-4 mr-2" /> Save Employee
            </button>
         </div>
      </motion.div>
    </motion.div>
  );
}
