"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Box, Shield, Package, X, Users, AlertTriangle
} from "lucide-react";
import { clsx } from "clsx";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";

import { api } from "../../utils/api";

// Map API eventType to display type
function mapEventType(eventType: string): 'material' | 'service' {
  if (eventType === 'PACKAGING' || eventType === 'DEPARTURE' || eventType === 'ARRIVAL') {
    return 'material';
  }
  return 'service';
}

export function CalendarView({ 
  contracts: passedContracts,
  onNavigateToContract,
}: { 
  contracts?: any[];
  onNavigateToContract?: (contractId: number) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date("2026-06-01"));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [apiEvents, setApiEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Fetch calendar events from API on mount and on month change
  useEffect(() => {
    const from = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const to = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    setLoading(true);
    setError(null);

    api.get(`/calendar/events?from=${from}&to=${to}`)
      .then((data: any[]) => {
        setApiEvents(data || []);
      })
      .catch((err: any) => {
        console.error("Failed to fetch calendar events:", err);
        setError("Failed to load calendar events. Showing local data if available.");
        setApiEvents([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);

  const days = [];
  let day = startDate;
  for (let i = 0; i < 35; i++) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Build events dictionary
  const events: Record<string, any[]> = {};

  if (apiEvents.length > 0) {
    // Use API events when available
    apiEvents.forEach((calEvent: any) => {
      const dateStr = calEvent.eventDate;
      if (!events[dateStr]) events[dateStr] = [];
      events[dateStr].push({
        type: mapEventType(calEvent.eventType),
        title: `${calEvent.workflow?.title || 'Contract'}: ${calEvent.eventType}`,
        contractId: calEvent.workflowId,
        workItemId: calEvent.workItemId,
        hasConflict: calEvent.hasConflict,
        conflictingWorkItemIds: calEvent.conflictingWorkItemIds,
        eventType: calEvent.eventType,
        rawEvent: calEvent,
        // For slide-over detail rendering:
        contract: { 
          id: calEvent.workflowId, 
          title: calEvent.workflow?.title, 
          type: calEvent.workflow?.workflowType 
        },
        workItem: calEvent.workItem,
      });
    });
  } else if (passedContracts && passedContracts.length > 0) {
    // Fall back to contract-based event derivation when no API events
    passedContracts.forEach(contract => {
      contract.timeline.forEach((milestone: any, idx: number) => {
        if (!events[milestone.date]) events[milestone.date] = [];
        events[milestone.date].push({
          type: contract.type,
          title: `${contract.title}: ${milestone.label}`,
          contract: contract,
          stepIndex: idx
        });
      });

      // Map contract workflows (works) and individual tasks as events stretching over durationDays
      (contract.works || []).forEach((work: any) => {
        (work.tasks || []).forEach((task: any) => {
          if (!task.date || task.date === "TBD") return;
          try {
            const taskStart = new Date(task.date);
            const duration = task.durationDays && Number(task.durationDays) > 0 ? Number(task.durationDays) : 1;

            for (let d = 0; d < duration; d++) {
              const currentEventDate = addDays(taskStart, d);
              const dateStr = format(currentEventDate, 'yyyy-MM-dd');

              if (!events[dateStr]) events[dateStr] = [];
              events[dateStr].push({
                type: "task",
                id: task.id,
                title: `${task.title} (${task.assignee || "Unassigned"})`,
                task: task,
                contract: contract,
                work: work,
                daySpanIndex: d + 1,
                totalDuration: duration
              });
            }
          } catch (e) {
            console.error("Invalid task date format:", task.date);
          }
        });
      });
    });
  }

  // For active contract range display (backward compat)
  const contracts = passedContracts || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operational Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Track material goods delivery and immaterial service schedules.</p>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
               <button className="px-3 py-1 bg-white shadow-sm rounded-md text-sm font-medium text-slate-900">Month</button>
               <button className="px-3 py-1 rounded-md text-sm font-medium text-slate-500 hover:text-slate-900">Week</button>
            </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-sm text-red-700 shrink-0">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
         <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC] shrink-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-slate-900">{format(currentDate, 'MMMM yyyy')}</h2>
              {loading && (
                <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <svg className="animate-spin w-3.5 h-3.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Loading…</span>
                </span>
              )}
            </div>
            <div className="flex space-x-2">
               <button onClick={prevMonth} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
               <button onClick={nextMonth} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
            </div>
         </div>

         <div className="grid grid-cols-7 border-b border-slate-200 shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
               <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 tracking-wider uppercase border-r border-slate-100 last:border-0">
                  {d}
               </div>
            ))}
         </div>

         <div className="grid grid-cols-7 flex-1">
            {days.map((date, i) => {
               const dateStr = format(date, 'yyyy-MM-dd');
               // @ts-ignore
               const dayEvents = events[dateStr] || [];
               
               const activeContracts = contracts.filter(contract => {
                 const start = new Date(contract.startDate);
                 const end = new Date(contract.deliveryDate);
                 return date >= start && date <= end;
               });
               
               const hasContent = dayEvents.length > 0 || activeContracts.length > 0;

               return (
                  <div 
                     key={date.toString()} 
                     onClick={() => hasContent && setSelectedDay(date)}
                     className={clsx(
                        "border-b border-r border-slate-100 last:border-r-0 p-2 relative transition-colors",
                        isSameMonth(date, currentDate) ? "bg-white" : "bg-slate-50/50",
                        hasContent ? "cursor-pointer hover:bg-blue-50/30" : "",
                        isSameDay(date, new Date("2026-06-01")) ? "bg-blue-50/10" : ""
                     )}
                  >
                     <span className={clsx(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                        isSameDay(date, new Date("2026-06-01")) ? "bg-blue-600 text-white" : 
                        isSameMonth(date, currentDate) ? "text-slate-900" : "text-slate-400"
                     )}>
                        {format(date, 'd')}
                     </span>
                     <div className="space-y-1">
                        {/* Show ongoing blocks (backward compat with passed contracts) */}
                        {activeContracts.map((ac, idx) => {
                           const hasMilestoneToday = dayEvents.some((ev: any) => ev.contract?.id === ac.id);
                           if (hasMilestoneToday) return null; // Let the milestone draw instead
                           return (
                              <div key={`ac-${idx}`} className={clsx(
                                 "px-2 py-0.5 text-[10px] font-bold rounded truncate border-l-2",
                                 ac.type === 'material' ? "bg-orange-50 text-orange-600 border-orange-400 opacity-75" : "bg-blue-50 text-blue-600 border-blue-400 opacity-75"
                              )}>
                                 {ac.title} (Active)
                              </div>
                           );
                        })}

                        {dayEvents.map((ev: any, idx: number) => (
                           <div key={idx} className={clsx(
                              "px-2 py-1 text-[10px] font-semibold rounded truncate flex items-center justify-between space-x-1",
                              ev.type === 'material' 
                                ? clsx("bg-orange-100 text-orange-800 border", ev.hasConflict ? "border-red-400" : "border-orange-200")
                                : ev.type === 'task' 
                                  ? clsx("bg-indigo-50 text-indigo-800 border font-normal animate-fade-in", ev.hasConflict ? "border-red-400" : "border-indigo-150")
                                  : clsx("bg-blue-100 text-blue-800 border", ev.hasConflict ? "border-red-400" : "border-blue-200")
                           )}>
                              <span className="truncate">
                                 {ev.type === 'task' ? `❑ ${ev.title}` : `★ ${ev.title}`}
                              </span>
                              <div className="flex items-center shrink-0 ml-1 space-x-1">
                                 {ev.hasConflict && (
                                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                                 )}
                                 {ev.type === 'task' && ev.totalDuration > 1 && (
                                    <span className="text-[8px] font-black text-indigo-400">
                                       {ev.daySpanIndex}/{ev.totalDuration}d
                                    </span>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )
            })}
         </div>
      </div>

      {/* Slide-over for Day Details */}
      <AnimatePresence>
         {selectedDay && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end">
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                     <div>
                        <h2 className="text-xl font-bold text-slate-900">{format(selectedDay, 'EEEE, MMM d, yyyy')}</h2>
                        <p className="text-sm text-slate-500">Day Schedule & Operations</p>
                     </div>
                     <button onClick={() => setSelectedDay(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 bg-slate-50">
                     {/* @ts-ignore */}
                     {events[format(selectedDay, 'yyyy-MM-dd')]?.map((ev: any, i: number) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                           <div className="p-4 border-b border-slate-100 bg-[#F8FAFC]">
                              <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center space-x-2 text-xs font-bold tracking-wider uppercase">
                                    {ev.type === 'material' ? (
                                       <span className="flex items-center text-orange-600"><Package className="w-3 h-3 mr-1" /> Material Goods</span>
                                    ) : ev.type === 'task' ? (
                                       <span className="flex items-center text-indigo-600"><Clock className="w-3 h-3 mr-1" /> Work Task ({ev.task?.status})</span>
                                    ) : (
                                       <span className="flex items-center text-blue-600"><Shield className="w-3 h-3 mr-1" /> Immaterial Service</span>
                                    )}
                                 </div>
                                 {ev.hasConflict && (
                                    <span className="flex items-center space-x-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                       <AlertTriangle className="w-3 h-3" />
                                       <span>Conflict</span>
                                    </span>
                                 )}
                              </div>
                              <h3 className="font-bold text-slate-900">{ev.title}</h3>
                              {/* Navigate to contract button for API events */}
                              {ev.contractId && onNavigateToContract && (
                                 <button
                                    onClick={() => {
                                       onNavigateToContract(ev.contractId);
                                       setSelectedDay(null);
                                    }}
                                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
                                 >
                                    View Contract →
                                 </button>
                              )}
                           </div>
                           
                           {ev.type === 'material' && ev.contract?.timeline ? (
                              <div className="p-4">
                                 <p className="text-sm text-slate-500 mb-4">Supply Chain & Operations track</p>
                                 <div className="relative pl-6 pb-2 border-l-2 border-slate-100 space-y-5">
                                    {ev.contract.timeline.map((step: any, idx: number) => {
                                       const isPast = idx < ev.contract.progress;
                                       const isCurrent = idx === ev.contract.progress;
                                       return (
                                          <div key={idx} className="relative">
                                             <span className={clsx("absolute -left-[29px] w-3 h-3 rounded-full ring-4 ring-white",
                                                isPast ? "bg-green-500" : isCurrent ? "bg-blue-500" : "bg-slate-200"
                                             )}></span>
                                             <p className={clsx("text-sm font-medium", 
                                                isPast ? "text-slate-900 line-through" : isCurrent ? "text-slate-900" : "text-slate-400"
                                             )}>
                                                {step.label}
                                             </p>
                                             {isCurrent && (
                                                <div className="mt-2 text-xs text-slate-505 bg-slate-50 p-2 rounded border border-slate-100">
                                                   Currently in progress. Target date: {step.date}
                                                </div>
                                             )}
                                             {isPast && (
                                                <p className="text-[10px] text-slate-400 mt-1">Completed on {step.date}</p>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           ) : ev.type === 'material' && ev.workItem ? (
                              // API-sourced material event
                              <div className="p-4">
                                 <p className="text-sm text-slate-500 mb-3">Material goods event</p>
                                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
                                    <div className="flex justify-between">
                                       <span className="font-semibold text-slate-500">Event Type:</span>
                                       <span className="font-medium">{ev.eventType}</span>
                                    </div>
                                    {ev.workItem?.title && (
                                       <div className="flex justify-between">
                                          <span className="font-semibold text-slate-500">Work Item:</span>
                                          <span className="font-medium">{ev.workItem.title}</span>
                                       </div>
                                    )}
                                    {ev.hasConflict && ev.conflictingWorkItemIds?.length > 0 && (
                                       <div className="flex justify-between">
                                          <span className="font-semibold text-red-500">Conflicting Items:</span>
                                          <span className="font-medium text-red-600">{ev.conflictingWorkItemIds.join(', ')}</span>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           ) : ev.type === 'task' ? (
                              <div className="p-4">
                                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 mb-4 space-y-1.5 text-xs text-slate-600">
                                    <div className="flex justify-between">
                                       <span className="font-semibold text-slate-500">Contract:</span>
                                       <span className="font-medium text-slate-705">{ev.contract?.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="font-semibold text-slate-505">Work Scope:</span>
                                       <span className="font-medium text-slate-755">{ev.work?.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="font-semibold text-slate-550">Assignee:</span>
                                       <span className="font-bold text-slate-900">{ev.task?.assignee || "Unassigned"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="font-semibold text-slate-550">Status:</span>
                                       <span className={clsx(
                                          "font-black tracking-wide uppercase px-1.5 py-0.5 rounded text-[10px]",
                                          ev.task?.status === "completed" ? "bg-green-100 text-green-755 border border-green-200" :
                                          ev.task?.status === "in-progress" ? "bg-blue-100 text-blue-755 border border-blue-200" : "bg-slate-200 text-slate-650 border border-slate-300"
                                       )}>{ev.task?.status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="font-semibold text-slate-500">Estimated Duration:</span>
                                       <span className="font-medium text-slate-705">{ev.totalDuration} days (Day {ev.daySpanIndex} of {ev.totalDuration})</span>
                                    </div>
                                 </div>

                                 <div className="mb-4">
                                    <p className="text-xs font-semibold text-slate-400 tracking-wider mb-2">DESCRIPTION</p>
                                    <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs leading-relaxed">
                                       {ev.task?.description || <span className="text-slate-400 italic">No description provided for this task.</span>}
                                    </div>
                                 </div>

                                 <div>
                                    <p className="text-xs font-semibold text-slate-400 tracking-wider mb-2">COMMENT THREAD ({ev.task?.comments?.length || 0})</p>
                                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                       {(ev.task?.comments || []).map((c: any, cidx: number) => (
                                          <div key={cidx} className="bg-white border border-slate-100 p-2.5 rounded-lg text-xs shadow-xs">
                                             <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400">
                                                <span className="font-bold text-slate-600">{c.author}</span>
                                                <span>{c.timestamp}</span>
                                             </div>
                                             <p className="text-slate-700 leading-relaxed">{c.text}</p>
                                          </div>
                                       ))}
                                       {(!ev.task?.comments || ev.task.comments.length === 0) && (
                                          <p className="text-xs text-slate-400 italic text-center py-4 bg-white rounded-lg border border-dashed border-slate-100">No comments posted yet.</p>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              // Service / immaterial event
                              <div className="p-4">
                                 {ev.contract?.timeline ? (
                                    <>
                                       <div className="flex items-center space-x-2 text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded-md">
                                          <Clock className="w-4 h-4 text-slate-400" /> 
                                          <span>Target Milestone Date: {ev.contract.timeline[ev.stepIndex]?.date}</span>
                                       </div>
                                       
                                       <div className="mb-4">
                                          <div className="flex items-center justify-between mb-1 text-sm">
                                             <span className="font-medium text-slate-900">Overall Progress</span>
                                             <span className="text-blue-600 font-bold">{Math.round((ev.contract.progress / (ev.contract.steps.length - 1)) * 100)}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 rounded-full h-2">
                                             <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(ev.contract.progress / (ev.contract.steps.length - 1)) * 100}%` }}></div>
                                          </div>
                                       </div>

                                       <div>
                                          <p className="text-xs font-semibold text-slate-400 tracking-wider mb-2">ASSIGNED VENDOR</p>
                                          <div className="flex items-center space-x-3 p-2 border border-slate-100 rounded-lg">
                                             <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                                <Users className="w-4 h-4 text-indigo-600" />
                                             </div>
                                             <div>
                                                <p className="text-sm font-bold text-slate-900 leading-tight">{ev.contract.vendor}</p>
                                                <p className="text-[10px] text-slate-500">Managing project delivery</p>
                                             </div>
                                          </div>
                                       </div>
                                    </>
                                 ) : (
                                    // API-sourced service event
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
                                       <div className="flex justify-between">
                                          <span className="font-semibold text-slate-500">Event Type:</span>
                                          <span className="font-medium">{ev.eventType}</span>
                                       </div>
                                       {ev.workItem?.title && (
                                          <div className="flex justify-between">
                                             <span className="font-semibold text-slate-500">Work Item:</span>
                                             <span className="font-medium">{ev.workItem.title}</span>
                                          </div>
                                       )}
                                       {ev.contract?.title && (
                                          <div className="flex justify-between">
                                             <span className="font-semibold text-slate-500">Contract:</span>
                                             <span className="font-medium">{ev.contract.title}</span>
                                          </div>
                                       )}
                                       {ev.hasConflict && ev.conflictingWorkItemIds?.length > 0 && (
                                          <div className="flex justify-between">
                                             <span className="font-semibold text-red-500">Conflicting Items:</span>
                                             <span className="font-medium text-red-600">{ev.conflictingWorkItemIds.join(', ')}</span>
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  );
}
