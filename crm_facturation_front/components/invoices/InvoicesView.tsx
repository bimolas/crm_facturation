"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Search, Filter, Download, ChevronUp, ChevronDown, 
  MoreVertical, FileText, ArrowLeft, Send, CheckCircle, CopyPlus
} from "lucide-react";
import { clsx } from "clsx";
const INVOICES: any[] = [];

export function InvoicesView() {
  const [viewState, setViewState] = useState<"list" | "detail" | "create" | "payment-methods">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const handleSelect = (inv: any) => {
    setSelectedInvoice(inv);
    setViewState("detail");
  };

  return (
    <AnimatePresence mode="wait">
      {viewState === "list" && (
        <InvoiceList 
          key="list" 
          onCreate={() => setViewState("create")} 
          onSelect={handleSelect} 
          onManagePayments={() => setViewState("payment-methods")}
        />
      )}
      {viewState === "detail" && (
        <InvoiceDetail 
          key="detail" 
          invoice={selectedInvoice} 
          onBack={() => setViewState("list")} 
        />
      )}
      {viewState === "create" && (
        <InvoiceForm 
          key="create" 
          onBack={() => setViewState("list")} 
        />
      )}
      {viewState === "payment-methods" && (
        <PaymentMethodsView 
          key="payment-methods" 
          onBack={() => setViewState("list")} 
        />
      )}
    </AnimatePresence>
  );
}

function InvoiceList({ onCreate, onSelect, onManagePayments }: { onCreate: () => void, onSelect: (inv: any) => void, onManagePayments: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Unpaid: true, Paid: true });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = useMemo(() => {
    return INVOICES.filter(inv => 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const groups = useMemo(() => {
    const statuses = ["Unpaid", "Paid", "Partially", "Overdue", "Draft"];
    return statuses.map((status) => ({
      name: status,
      count: filteredInvoices.filter((invoice) => invoice.status === status).length,
      color: status === "Unpaid" ? "text-blue-600" : status === "Paid" ? "text-teal-600" : status === "Partially" ? "text-emerald-600" : status === "Overdue" ? "text-rose-600" : "text-slate-600",
      bg: status === "Unpaid" ? "bg-blue-50" : status === "Paid" ? "bg-teal-50" : status === "Partially" ? "bg-emerald-50" : status === "Overdue" ? "bg-rose-50" : "bg-slate-50",
    }));
  }, [filteredInvoices]);

  const toggleGroup = (group: string) => {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-[1600px] mx-auto pb-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onManagePayments} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            Payment Methods
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            Batch Payment
          </button>
          <button 
            onClick={onCreate}
            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {groups.map(g => (
          <div key={g.name} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{g.name}</p>
              <h3 className="text-xl font-bold text-slate-900">0{g.count} <span className="text-xs text-slate-400 font-normal">/ 0{g.count}</span></h3>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${g.bg}`}>
              <FileText className={`w-5 h-5 ${g.color}`} />
            </div>
          </div>
        ))}
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
                 placeholder="Search invoices, customers, tags..." 
                 className="w-64 pl-9 pr-4 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" 
              />
            </div>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-600 font-medium flex items-center hover:bg-slate-50">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </button>
          </div>
        </div>

        <div>
          {["Unpaid", "Paid", "Partially", "Overdue", "Draft"].map((groupName) => {
             const groupInvoices = filteredInvoices.filter(i => i.status === groupName);
             const isExpanded = expanded[groupName];
             
             return (
               <div key={groupName} className="border-b border-slate-200 last:border-0">
                 <button 
                   onClick={() => toggleGroup(groupName)}
                   className="w-full flex items-center px-6 py-3 bg-[#f8fafc]/50 hover:bg-[#f8fafc] transition-colors"
                 >
                   {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 mr-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 mr-2" />}
                   <span className="text-sm font-semibold text-slate-700">{groupName}</span>
                   <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">{groupInvoices.length}</span>
                 </button>

                 {isExpanded && groupInvoices.length > 0 && (
                   <table className="w-full text-sm text-left">
                     <thead className="text-slate-400 font-medium hidden">
                       {/* Hidden header since we just want columns to align */}
                       <tr>
                         <th className="px-6 py-3">Invoice</th>
                         <th className="px-6 py-3">Customer</th>
                         <th className="px-6 py-3">Email</th>
                         <th className="px-6 py-3">Date</th>
                         <th className="px-6 py-3">Amount</th>
                         <th className="px-6 py-3">Tags</th>
                       </tr>
                     </thead>
                     <tbody>
                       {groupInvoices.map((inv, idx) => (
                         <tr 
                           key={idx} 
                           onClick={() => onSelect(inv)}
                           className="border-t border-slate-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
                         >
                           <td className="px-6 py-4">
                             <div className="flex items-center">
                               <input onClick={e => e.stopPropagation()} type="checkbox" className="mr-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                               <span className="font-medium text-slate-900">{inv.id}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex items-center">
                               <div className="w-8 h-8 rounded-full bg-indigo-100 mr-3 shrink-0 overflow-hidden">
                                  <img src={`https://picsum.photos/seed/${inv.id}/100/100`} alt="" referrerPolicy="no-referrer" />
                               </div>
                               <span className="font-medium text-slate-700">{inv.customer.split(' ')[0]}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-slate-500">
                             <div>{inv.email}</div>
                             <div className="text-xs text-blue-600 flex items-center mt-1"><CopyPlus className="w-3 h-3 mr-1" /> Copy</div>
                           </td>
                           <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                           <td className="px-6 py-4 font-medium text-emerald-600">{inv.amount}</td>
                           <td className="px-6 py-4">
                             <div className="flex items-center space-x-2">
                               {inv.tags.map((tag: string) => (
                                 <span key={tag} className="px-2 py-1 rounded text-xs font-medium border border-slate-200 text-slate-600">
                                   {tag}
                                 </span>
                               ))}
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 )}
                 {isExpanded && groupInvoices.length === 0 && (
                   <div className="px-6 py-8 text-center text-slate-400 text-sm border-t border-slate-100">
                     No invoices found.
                   </div>
                 )}
               </div>
             );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function InvoiceDetail({ invoice, onBack }: { invoice: any, onBack: () => void }) {
  if (!invoice) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-[1000px] mx-auto pb-10"
    >
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Invoices
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">Invoice {invoice.id}</h1>
              <span className={clsx(
                "px-2.5 py-1 rounded text-xs font-semibold",
                invoice.status === "Paid" ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-800"
              )}>
                {invoice.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm">Issued on {invoice.date.split(" - ")[0]}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center">
              <Download className="w-4 h-4 mr-2" /> PDF
            </button>
            <button className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center shadow-sm">
              <Send className="w-4 h-4 mr-2" /> Send Reminder
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wider mb-3">BILLED TO</p>
              <p className="text-lg font-bold text-slate-900">{invoice.customer}</p>
              <p className="text-slate-500 mt-1">{invoice.email}</p>
              <p className="text-slate-500 mt-1">123 Street Name, City, Country</p>
            </div>
            <div className="text-right">
               <p className="text-xs font-semibold text-slate-400 tracking-wider mb-3">TOTAL DUE</p>
               <p className="text-4xl font-bold text-slate-900">{invoice.amount}</p>
               <p className="text-slate-500 mt-2">Due by {invoice.date.split(" - ")[1]}</p>
            </div>
          </div>

          <table className="w-full text-sm text-left mb-8">
            <thead className="bg-[#f8fafc] text-slate-500 font-medium border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Rate</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-4 font-medium text-slate-900">Custom Software Development</td>
                <td className="px-4 py-4 text-right text-slate-600">$1,000.00</td>
                <td className="px-4 py-4 text-right text-slate-600">1</td>
                <td className="px-4 py-4 text-right font-medium text-slate-900">$1,000.00</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-4 font-medium text-slate-900">Cloud Server Hosting (Annual)</td>
                <td className="px-4 py-4 text-right text-slate-600">$234.00</td>
                <td className="px-4 py-4 text-right text-slate-600">1</td>
                <td className="px-4 py-4 text-right font-medium text-slate-900">$234.00</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{invoice.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax (20%)</span>
                <span className="font-medium text-slate-900">{invoice.tax}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-slate-900">{invoice.amount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InvoiceForm({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-[800px] mx-auto pb-10"
    >
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center">
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 mr-4 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Create New Invoice</h1>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onBack(); }}>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Customer</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-700 bg-white">
                <option>Select a customer...</option>
                <option>Mikel Jordan</option>
                <option>David Smith</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Invoice Date</label>
              <input type="date" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-700" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900">Line Items</h3>
            </div>
            
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-slate-500 px-2">
               <div className="col-span-6">Item</div>
               <div className="col-span-2">Qty</div>
               <div className="col-span-3">Price</div>
               <div className="col-span-1"></div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
               <div className="col-span-6">
                 <input type="text" placeholder="Description" className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none" />
               </div>
               <div className="col-span-2">
                 <input type="number" placeholder="1" className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none" />
               </div>
               <div className="col-span-3">
                 <input type="number" placeholder="0.00" className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none" />
               </div>
               <div className="col-span-1 text-center">
                 <button type="button" className="text-slate-400 hover:text-red-500">×</button>
               </div>
            </div>

            <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
              <Plus className="w-4 h-4 mr-1" /> Add Line Item
            </button>
          </div>

          <div className="pt-6 border-t border-slate-200 flex items-center justify-end space-x-4">
            <button type="button" onClick={onBack} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-lg font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-sm flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" /> Save & Generate
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function PaymentMethodsView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-[800px] mx-auto pb-10"
    >
      <div className="flex items-center mb-8">
         <button onClick={onBack} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 mr-4 hover:bg-slate-50 transition-colors">
           <ArrowLeft className="w-4 h-4" />
         </button>
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Methods</h1>
            <p className="text-slate-500 text-sm">Manage how your company pays and receives payments.</p>
         </div>
      </div>

      <div className="space-y-6">
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
               <div>
                  <h2 className="text-lg font-bold text-slate-900">Bank Transfers (ACH / Wire)</h2>
                  <p className="text-sm text-slate-500">Standard B2B payment method for large invoices.</p>
               </div>
               <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Add Bank Account</button>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center">
                     <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold mr-4">
                        CH
                     </div>
                     <div>
                        <p className="font-semibold text-slate-900">Chase Business Checking</p>
                        <p className="text-xs text-slate-500">**** **** 1234 • Routing ****456</p>
                     </div>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                     <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold tracking-wider">DEFAULT Payouts</span>
                     <button className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
               <div>
                  <h2 className="text-lg font-bold text-slate-900">Credit & Debit Cards</h2>
                  <p className="text-sm text-slate-500">Automatic billing and smaller vendor payments.</p>
               </div>
               <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Add Card</button>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                  <div className="flex items-center">
                     <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0v2H4V6h16zm0 12H4v-6h16v6z"></path></svg>
                     </div>
                     <div>
                        <p className="font-semibold text-slate-900">Visa Corporate</p>
                        <p className="text-xs text-slate-500">**** 4242 • Expires 12/28</p>
                     </div>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                     <button className="text-slate-400 hover:text-slate-600 font-medium">Remove</button>
                     <button className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
