"use client";

import { useState, useEffect } from "react";
import { Sidebar, type TabId } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { InvoicesView } from "@/components/invoices/InvoicesView";
import { WorkflowsView } from "@/components/workflows/WorkflowsView";
import { CompaniesView } from "@/components/companies/CompaniesView";
import { ArticlesView } from "@/components/articles/ArticlesView";
import { InventoryView } from "@/components/inventory/InventoryView";
import { TeamsView } from "@/components/teams/TeamsView";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EmployeesView } from "@/components/employees/EmployeesView";

import { NotificationsView } from "@/components/notifications/NotificationsView";
import { MessagesView } from "@/components/messages/MessagesView";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceModal } from "@/components/layout/WorkspaceModal";

export default function CRMApp() {
  const { user, company, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [contracts, setContracts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null);
  const [isWorkspaceDrawerOpen, setIsWorkspaceDrawerOpen] = useState(false);

  useEffect(() => {
    setWorkspaces((prev) => {
      const existing = prev.length > 0 ? prev : companies;
      const merged = [
        ...(company ? [{
          id: company.id,
          name: company.name,
          ice: company.ice,
          rc: company.rc,
          taxId: company.taxId,
          email: user?.email,
          phone: "+212 522 000000",
          address: "Headquarters",
          active: true,
          users: 1,
        }] : []),
        ...existing,
      ];
      return merged.filter((entry, index, self) => self.findIndex((candidate) => candidate.id === entry.id) === index);
    });
  }, [company, companies, user?.email]);

  useEffect(() => {
    if (company && user) {
      const primaryWorkspace = {
        id: company.id,
        name: company.name,
        ice: company.ice,
        rc: company.rc,
        taxId: company.taxId,
        email: user.email,
        phone: "+212 522 000000",
        address: "Headquarters",
        active: true,
        users: 1,
      };
      setWorkspaces((prev) => {
        const merged = [primaryWorkspace, ...companies.filter((entry) => entry.id !== company.id)];
        return merged.filter((entry, index, self) => self.findIndex((candidate) => candidate.id === entry.id) === index);
      });
      setActiveWorkspaceId((current) => current ?? company.id);
    }
  }, [company, user]);

  useEffect(() => {
    if (company) {
      setWorkspaces((prev) => {
        const primaryWorkspace = {
          id: company.id,
          name: company.name,
          ice: company.ice,
          rc: company.rc,
          taxId: company.taxId,
          email: user?.email,
          phone: "+212 522 000000",
          address: "Headquarters",
          active: true,
          users: 1,
        };
        const merged = [primaryWorkspace, ...companies.filter((entry) => entry.id !== company.id)];
        return merged.filter((entry, index, self) => self.findIndex((candidate) => candidate.id === entry.id) === index);
      });
    }
  }, [companies, company, user?.email]);

  useEffect(() => {
    if (activeWorkspaceId == null && workspaces.length > 0) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [activeWorkspaceId, workspaces]);

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">Loading...</div>;
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || null;

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar 
        activeTab={activeTab} 
        onChangeTab={(tab) => {
           // Clear company filter when navigating to other tabs unless it's workflows/marketplace
           if (tab !== "workflows" && tab !== "marketplace" && tab !== "my-rfps" && tab !== "my-bids" && tab !== "my-contracts" && tab !== "works") {
              setCompanyFilter(null);
           }
           setActiveTab(tab);
        }} 
        workspaces={workspaces}
        setWorkspaces={setWorkspaces}
        activeWorkspaceId={activeWorkspaceId ?? undefined}
        setActiveWorkspaceId={setActiveWorkspaceId}
        onAddWorkspace={() => setIsWorkspaceDrawerOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          workspaces={workspaces}
          setWorkspaces={setWorkspaces}
          activeWorkspaceId={activeWorkspaceId ?? undefined}
          setActiveWorkspaceId={setActiveWorkspaceId as any}
          onAddWorkspace={() => setIsWorkspaceDrawerOpen(true)}
        />
        <main className="flex-1 overflow-auto p-8 custom-scrollbar">
          {activeTab === "dashboard" && <Dashboard activeWorkspace={activeWorkspace} />}
          {activeTab === "invoices" && <InvoicesView />}
          {(activeTab === "workflows" || activeTab === "marketplace" || activeTab === "my-rfps" || activeTab === "my-bids" || activeTab === "my-contracts" || activeTab === "works") && (
             <WorkflowsView 
                initialTab={activeTab === "workflows" ? "marketplace" : activeTab as any} 
                contracts={contracts} 
                setContracts={setContracts} 
                companies={companies}
                setCompanies={setCompanies}
                companyFilter={companyFilter}
                setCompanyFilter={setCompanyFilter}
                activeWorkspaceId={activeWorkspaceId ?? undefined}
                workspaces={workspaces}
             />
          )}
          {activeTab === "companies" && (
             <CompaniesView 
                companies={companies}
                setCompanies={setCompanies}
                companyFilter={companyFilter}
                setCompanyFilter={setCompanyFilter}
                setActiveTab={setActiveTab}
             />
          )}
          {activeTab === "articles" && <ArticlesView />}
          {activeTab === "inventory" && <InventoryView />}
          {activeTab === "teams" && <TeamsView />}
          {activeTab === "employees" && <EmployeesView />}
          {activeTab === "calendar" && <CalendarView contracts={contracts} />}
          {activeTab === "notifications" && <NotificationsView />}
          {activeTab === "messages" && <MessagesView />}
          {(activeTab as string === "organization") && (
             <div className="flex items-center justify-center h-full text-slate-400 font-medium">
               Select Teams or Employees from the sidebar.
             </div>
          )}
          {(activeTab as string === "communication") && (
             <div className="flex items-center justify-center h-full text-slate-400 font-medium">
               Select Messages or Notifications from the sidebar.
             </div>
          )}
          {(activeTab as string === "sales") && (
             <div className="flex items-center justify-center h-full text-slate-400 font-medium">
               Select Invoices or Contracts & Bids from the sidebar.
             </div>
          )}
        </main>
      </div>

      <WorkspaceModal 
        isOpen={isWorkspaceDrawerOpen}
        onClose={() => setIsWorkspaceDrawerOpen(false)}
        onAdd={(newWorkspace) => {
          setWorkspaces(prev => [...prev, newWorkspace]);
          setActiveWorkspaceId(newWorkspace.id);
          setIsWorkspaceDrawerOpen(false);
        }}
      />
    </div>
  );
}
