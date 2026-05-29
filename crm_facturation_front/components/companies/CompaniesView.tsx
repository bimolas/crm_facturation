"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, Plus, Search, Filter, ArrowLeft, Mail, 
  MapPin, FileDigit, Briefcase, Users, ChevronRight, 
  Download, MoreVertical, CreditCard
} from "lucide-react";
import { clsx } from "clsx";

interface CompaniesViewProps {
  companies: any[];
  setCompanies: React.Dispatch<React.SetStateAction<any[]>>;
  companyFilter: string | null;
  setCompanyFilter: (filter: string | null) => void;
  setActiveTab: (tab: any) => void;
}

export function CompaniesView({ 
  companies, 
  setCompanies, 
  companyFilter, 
  setCompanyFilter, 
  setActiveTab 
}: CompaniesViewProps) {
  const [viewState, setViewState] = useState<"list" | "detail" | "create">("list");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const handleSelect = (company: any) => {
    setSelectedCompany(company);
    setViewState("detail");
  };

  const handleCreateCompany = (newCompany: any) => {
    setCompanies((prev) => [newCompany, ...prev]);
    setViewState("list");
  };

  return (
    <AnimatePresence mode="wait">
      {viewState === "list" && (
        <CompanyList 
          key="list" 
          companies={companies}
          onCreate={() => setViewState("create")} 
          onSelect={handleSelect} 
        />
      )}
      {viewState === "detail" && (
        <CompanyDetail 
          key="detail" 
          company={selectedCompany} 
          onBack={() => setViewState("list")} 
          setCompanyFilter={setCompanyFilter}
          setActiveTab={setActiveTab}
        />
      )}
      {viewState === "create" && (
        <CompanyForm 
          key="create" 
          onBack={() => setViewState("list")} 
          onSubmit={handleCreateCompany}
        />
      )}
    </AnimatePresence>
  );
}

function CompanyList({ companies, onCreate, onSelect }: { companies: any[], onCreate: () => void, onSelect: (company: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.ice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, companies]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-[1600px] mx-auto pb-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers & Companies</h1>
          <p className="text-sm text-slate-500 mt-1">
             Manage customers, client companies, and connected vendors you work with. These are automatically added once they accept your bids, or they can be manually linked directly from active marketplace offers.
          </p>
        </div>
        <button 
          onClick={onCreate}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-600 font-medium flex items-center hover:bg-slate-50">
               <Download className="w-4 h-4 mr-2" /> Export
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies, ICE, RC..." 
                className="w-64 pl-9 pr-4 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-600 font-medium flex items-center hover:bg-slate-50">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </button>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-[#f8fafc] text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Identifiers (ICE/RC)</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3 text-center">Users</th>
              <th className="px-6 py-3 text-center">Workflows</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 relative"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => (
              <tr 
                key={company.id} 
                onClick={() => onSelect(company)}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 mr-3 flex items-center justify-center shrink-0">
                       <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                       <span className="font-bold text-slate-900 block">{company.name}</span>
                       <span className="text-xs text-slate-500">{company.address.split(',')[1]}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                     <div className="flex items-center text-xs text-slate-600"><FileDigit className="w-3 h-3 mr-1.5 text-slate-400" /> {company.ice}</div>
                     <div className="flex items-center text-xs text-slate-600"><CreditCard className="w-3 h-3 mr-1.5 text-slate-400" /> {company.rc}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  <div className="flex items-center text-xs"><Mail className="w-3 h-3 mr-1.5" /> {company.email}</div>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {company.users}
                   </span>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                      {company.workflows} Active
                   </span>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "inline-flex items-center px-2 py-1 rounded text-xs font-semibold",
                    company.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {company.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                   </button>
                </td>
              </tr>
            ))}
            {filteredCompanies.length === 0 && (
               <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No companies found.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function CompanyDetail({ 
  company, 
  onBack,
  setCompanyFilter,
  setActiveTab
}: { 
  company: any, 
  onBack: () => void,
  setCompanyFilter: (filter: string | null) => void,
  setActiveTab: (tab: any) => void
}) {
  const [activeTab, setActiveTabState] = useState("Overview");

  if (!company) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-[1200px] mx-auto pb-10"
    >
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Companies
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-8 flex items-start justify-between bg-gradient-to-r from-[#F8FAFC] to-white relative">
          <div className="flex items-start space-x-6 relative z-10">
             <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                <Building2 className="w-10 h-10 text-indigo-600" />
             </div>
             <div className="pt-2">
                <div className="flex items-center space-x-3 mb-2">
                   <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
                   <span className={clsx(
                     "px-2.5 py-1 rounded text-xs font-semibold",
                     company.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-800"
                   )}>
                     {company.active ? "Active" : "Inactive"}
                   </span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-slate-500">
                   <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {company.address}</span>
                   <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5" /> {company.email}</span>
                </div>
             </div>
          </div>
          <div className="flex items-center space-x-3 relative z-10">
             <button 
                onClick={() => {
                   setCompanyFilter(company.name);
                   setActiveTab("marketplace");
                }}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-sm flex items-center"
             >
                <Briefcase className="w-4 h-4 mr-2" /> View Marketplace Offers
             </button>
             <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm">
                Edit Profile
             </button>
          </div>
        </div>

        <div className="grid grid-cols-4 border-t border-slate-200 divide-x divide-slate-200 bg-[#f8fafc]/50">
           {[
             { label: "ICE Identifier", value: company.ice },
             { label: "RC Number", value: company.rc },
             { label: "Tax Identifier", value: company.taxId },
             { label: "Company Role", value: "Buyer / Vendor" },
           ].map((stat, i) => (
             <div key={i} className="p-4 text-center">
                <p className="text-xs font-semibold text-slate-400 tracking-wider mb-1">{stat.label}</p>
                <p className="font-medium text-slate-900">{stat.value}</p>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          {["Overview", "Internal Users", "Procurement Workflows"].map((tab) => (
             <button 
                key={tab} 
                onClick={() => setActiveTabState(tab)}
                className={clsx(
                   "px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                   activeTab === tab ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
             >
                {tab}
             </button>
          ))}
        </div>

        <div className="p-8">
           {activeTab === "Overview" && (
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <h3 className="font-bold text-slate-900 flex items-center">
                       <Briefcase className="w-5 h-5 mr-2 text-slate-400" /> Recent Activity
                    </h3>
                    {/* Activity timeline placeholder */}
                    <div className="pl-4 border-l-2 border-slate-100 space-y-6">
                       <div className="relative">
                          <span className="absolute -left-[21px] w-3 h-3 bg-blue-500 rounded-full ring-4 ring-white"></span>
                          <p className="text-sm font-medium text-slate-900">Submitted Bid for <strong>IT Services</strong></p>
                          <p className="text-xs text-slate-500 mt-1">2 days ago</p>
                       </div>
                       <div className="relative">
                          <span className="absolute -left-[21px] w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-white"></span>
                          <p className="text-sm font-medium text-slate-900">Paid Invoice <strong>#CIV-012001</strong></p>
                          <p className="text-xs text-slate-500 mt-1">5 days ago</p>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h3 className="font-bold text-slate-900 flex items-center">
                       <Users className="w-5 h-5 mr-2 text-slate-400" /> Key Contacts
                    </h3>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">AM</div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">Ahmed Manager</p>
                                <p className="text-xs text-slate-500">Company Admin</p>
                             </div>
                          </div>
                          <button className="text-slate-400 hover:text-blue-600"><ChevronRight className="w-4 h-4" /></button>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === "Internal Users" && (
              <div className="text-center py-12">
                 <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-slate-900">User Directory</h3>
                 <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto mb-6">Manage roles and permissions for employees within {company.name}.</p>
                 <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm">
                    Invite New User
                 </button>
              </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}


function CompanyForm({ onBack, onSubmit }: { onBack: () => void, onSubmit: (newCompany: any) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ice, setIce] = useState("");
  const [rc, setRc] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      id: Date.now(),
      name,
      ice: ice || `ICE-${Math.floor(1000000 + Math.random() * 9000000)}`,
      rc: rc || `RC-${Math.floor(100000 + Math.random() * 900000)}`,
      taxId: taxId || `TAX-${Math.floor(100000 + Math.random() * 900000)}`,
      email: email || "info@company.com",
      phone: phone || "",
      address: address || "Casablanca, Morocco",
      active: true,
      users: 1,
      workflows: 0
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end"
    >
      <motion.div 
         initial={{ x: '100%' }}
         animate={{ x: 0 }}
         exit={{ x: '100%' }}
         transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
      >
         <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div>
               <h2 className="text-xl font-bold text-slate-900">Add New Company</h2>
               <p className="text-sm text-slate-500">Register a new client or vendor in the system.</p>
            </div>
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
               <span className="sr-only">Close</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
         </div>

         <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
            <form className="space-y-8" onSubmit={handleSubmit}>
               <section className="space-y-6">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Business Profile</h3>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Legal Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corporation Ltd." className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                           <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@company.com" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                        </div>
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                           <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+212 500 000000" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                        </div>
                     </div>
                  </div>
               </section>

               <section className="space-y-6">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Legal Identifiers (Morocco)</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">ICE (Identifiant Commun de l&apos;Entreprise)</label>
                        <input type="text" value={ice} onChange={e => setIce(e.target.value)} placeholder="e.g. 000000000000000" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white font-mono text-sm" />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">RC (Registre de Commerce)</label>
                        <input type="text" value={rc} onChange={e => setRc(e.target.value)} placeholder="e.g. 123456" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white font-mono text-sm" />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tax Identifier (IF)</label>
                        <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="e.g. 98765432" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white font-mono text-sm" />
                     </div>
                  </div>
               </section>

               <section className="space-y-6">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Location & Assets</h3>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Physical Address</label>
                     <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Full street address, city, region" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white resize-none"></textarea>
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Logo URL / File</label>
                     <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                        <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-700 mb-1">Click to upload or drag & drop</p>
                        <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF (max. 2MB)</p>
                     </div>
                  </div>
               </section>
               
               {/* Hidden button for form submission triggered by footer button */}
               <button type="submit" id="submit-company-form" className="hidden">Submit</button>
            </form>
         </div>

         <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
            <button onClick={onBack} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors">
               Cancel
            </button>
            <button 
               onClick={() => document.getElementById('submit-company-form')?.click()}
               className="px-5 py-2.5 text-sm font-medium bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
            >
               Save Company
            </button>
         </div>
      </motion.div>
    </motion.div>
  );
}
