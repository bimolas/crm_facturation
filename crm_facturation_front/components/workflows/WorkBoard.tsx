"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Clock, Plus, Users, Calendar as CalendarIcon, CheckCircle2, 
  Circle, Trash2, ShieldCheck, Tag, GripVertical, X, MessageSquare, Send, AlignLeft,
  Paperclip, FileText, File, Link2, Upload, ExternalLink, Download, AlertCircle, Loader2
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "../../utils/api";

function getAvatarBg(name: string) {
  if (!name || name === "Unassigned") return "bg-slate-300 text-slate-600";
  const colors = [
    "bg-[#EA4335] text-white", // Google Red
    "bg-[#34A853] text-white", // Google Green
    "bg-[#4285F4] text-white", // Google Blue
    "bg-[#FBBC05] text-white", // Google Yellow
    "bg-[#A734BA] text-white", // Purple
    "bg-[#00A294] text-white", // Teal
    "bg-[#FF6D01] text-white", // Orange
    "bg-[#E91E63] text-white", // Pink
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(name: string) {
  if (!name || name === "Unassigned") return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function UserAvatar({ name, size = "md" }: { name: string, size?: "xs" | "sm" | "md" | "lg" }) {
  const bgClass = getAvatarBg(name);
  const initials = getInitials(name);
  
  const sizeClasses = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-7 h-7 text-xs",
    md: "w-10 h-10 text-sm font-semibold",
    lg: "w-12 h-12 text-base font-bold"
  };
  
  return (
    <div 
      className={clsx(
        "rounded-full flex items-center justify-center font-bold font-sans shadow-sm shrink-0 border border-white/10",
        sizeClasses[size], 
        bgClass
      )}
      title={name}
    >
      {initials}
    </div>
  );
}

function getFileIcon(type: string, name: string) {
  const nameLower = (name || "").toLowerCase();
  const typeLower = (type || "").toLowerCase();
  
  if (typeLower === "link" || nameLower.startsWith("http")) {
    return <Link2 className="w-4 h-4 text-indigo-500 shrink-0" />;
  }
  if (nameLower.endsWith(".pdf") || typeLower.includes("pdf")) {
    return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].some(ext => nameLower.endsWith(ext)) || typeLower.startsWith("image/")) {
    return <FileText className="w-4 h-4 text-emerald-505 shrink-0" />;
  }
  if (["doc", "docx", "txt", "rtf", "md"].some(ext => nameLower.endsWith(ext)) || typeLower.includes("document") || typeLower.includes("text")) {
    return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
  }
  if (["xls", "xlsx", "csv", "sheets"].some(ext => nameLower.endsWith(ext)) || typeLower.includes("excel") || typeLower.includes("spreadsheet")) {
    return <FileText className="w-4 h-4 text-green-600 shrink-0" />;
  }
  return <File className="w-4 h-4 text-slate-405 shrink-0" />;
}

let taskCounter = 500;

export function WorkBoard({ 
  work, 
  contract, 
  onBack, 
  onUpdateWork 
}: { 
  work: any, 
  contract: any, 
  onBack: () => void, 
  onUpdateWork: (contractId: string, workId: string, updatedFields: any) => void 
}) {
  const [tasks, setTasks] = useState<any[]>(work?.tasks || []);
   const [assignees, setAssignees] = useState<string[]>(["Unassigned"]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState<string | null>(null);
  const [isDraggingTaskId, setIsDraggingTaskId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<string | null>(null);

   useEffect(() => {
      let cancelled = false;

      api.get("/users")
         .then((usersData: any[]) => {
            if (cancelled) return;

            const names = Array.isArray(usersData)
               ? usersData
                     .map((user: any) => user.name || user.fullName || user.email?.split("@")[0] || user.email)
                     .filter(Boolean)
               : [];
            setAssignees(["Unassigned", ...Array.from(new Set(names))]);
         })
         .catch(() => {
            if (!cancelled) {
               setAssignees(["Unassigned"]);
            }
         });

      return () => {
         cancelled = true;
      };
   }, []);

  // Show a dismissible error banner that auto-clears after 5 s
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Fetch tasks from the API on mount
  useEffect(() => {
    if (!work?.id) return;
    setIsLoading(true);
    api.get(`/works/${work.id}/tasks`)
      .then((data: any) => {
        // API returns tasks grouped by status — flatten into a single array
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const flat: any[] = [
            ...(data.todo || []),
            ...(data["in-progress"] || []),
            ...(data.completed || []),
          ];
          setTasks(flat);
        } else if (Array.isArray(data)) {
          setTasks(data);
        }
      })
      .catch(() => {
        // Fall back to the tasks passed via props — no hard error on initial load
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work?.id]);

  // Task detail modal state variables
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [durationDraft, setDurationDraft] = useState(1);
  const [commentText, setCommentText] = useState("");
  const [showDescSaved, setShowDescSaved] = useState(false);

  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // Attachment state variables & refs
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addUploadedFiles = (fileList: FileList) => {
    if (!selectedTaskId || !activeTask) return;
    const currentAttachments = activeTask.attachments || [];
    const newAttachments = [...currentAttachments];

    Array.from(fileList).forEach(file => {
      // Create local object URL for previewing and downloading
      const fileUrl = URL.createObjectURL(file);
      
      let sizeStr = "Unknown size";
      if (file.size < 1024) {
        sizeStr = `${file.size} B`;
      } else if (file.size < 1024 * 1024) {
        sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      } else {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const cleanName = file.name.replace(/[^a-zA-Z5-9.-]/g, "_");
      newAttachments.push({
        id: `att_file_${cleanName}_${newAttachments.length}`,
        name: file.name,
        size: sizeStr,
        type: file.type || "application/octet-stream",
        url: fileUrl,
        source: "upload",
        createdAt: "Recently"
      });
    });

    updateTaskDetails(selectedTaskId, { attachments: newAttachments });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addUploadedFiles(e.target.files);
    }
  };

  const addWebLink = () => {
    if (!selectedTaskId || !activeTask || !linkUrl.trim()) return;
    const currentAttachments = activeTask.attachments || [];
    
    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const name = linkTitle.trim() || linkUrl.trim().replace(/^https?:\/\/(www\.)?/, "").substring(0, 30);

    const cleanLinkName = name.replace(/[^a-zA-Z0-9]/g, "_");
    const newAttachments = [
      ...currentAttachments,
      {
        id: `att_link_${cleanLinkName}_${currentAttachments.length}`,
        name,
        size: "External Link",
        type: "link",
        url: formattedUrl,
        source: "link",
        createdAt: "Recently"
      }
    ];

    updateTaskDetails(selectedTaskId, { attachments: newAttachments });
    setLinkTitle("");
    setLinkUrl("");
  };

  const deleteAttachment = (attId: string) => {
    if (!selectedTaskId || !activeTask) return;
    const currentAttachments = activeTask.attachments || [];
    const updated = currentAttachments.filter((alt: any) => alt.id !== attId);
    updateTaskDetails(selectedTaskId, { attachments: updated });
  };

  const openTaskDetails = (task: any) => {
    setSelectedTaskId(task.id);
    setDescDraft(task.description || "");
    setTitleDraft(task.title || "");
    setDurationDraft(Number(task.durationDays) || 1);
  };

  if (!work) return null;

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      setIsDraggingTaskId(taskId);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDraggingTaskId(null);
    setActiveDropCol(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setActiveDropCol(colId);
  };

  const handleDragLeave = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      moveTask(taskId, colId);
    }
    setIsDraggingTaskId(null);
    setActiveDropCol(null);
  };

  const syncTasks = (newTasks: any[]) => {
    setTasks(newTasks);
    
    // Automatically calculate Work status based on tasks progress
    let newStatus = work.status;
    const completedCount = newTasks.filter(t => t.status === "completed").length;
    const totalCount = newTasks.length;
    
    if (totalCount > 0) {
      if (completedCount === totalCount) {
         newStatus = "Completed";
      } else if (completedCount > 0 || newTasks.some(t => t.status === "in-progress")) {
         newStatus = "In Progress";
      } else {
         newStatus = "Pending";
      }
    } else {
      newStatus = "Pending";
    }
    
    onUpdateWork(contract.id, work.id, { tasks: newTasks, status: newStatus });
  };

  const moveTask = (taskId: string, newStatus: string) => {
    const previous = tasks;
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    syncTasks(updated);
    // Skip API call for temp IDs (not yet persisted)
    if (String(taskId).startsWith("T-")) return;
    api.patch(`/works/${work.id}/tasks/${taskId}`, { status: newStatus })
      .catch(() => {
        syncTasks(previous);
        showError("Failed to move task. Please try again.");
      });
  };

  const addTask = (status: string) => {
    if (!newTaskTitle.trim()) {
      setAddingTask(null);
      return;
    }
    const tempId = `T-${taskCounter++}`;
    const createdTask = { 
       id: tempId, 
       title: newTaskTitle, 
       status, 
       assignee: "Unassigned", 
       date: contract?.startDate || "2026-06-01",
       description: "",
       durationDays: 1,
       comments: []
    };
    // Optimistic add
    const optimistic = [...tasks, createdTask];
    syncTasks(optimistic);
    setNewTaskTitle("");
    setAddingTask(null);

    api.post(`/works/${work.id}/tasks`, {
      title: createdTask.title,
      status: createdTask.status,
      durationDays: createdTask.durationDays,
      dueDate: createdTask.date !== "TBD" ? createdTask.date : undefined,
    })
      .then((saved: any) => {
        if (saved?.id) {
          // Replace temp ID with real ID from API
          setTasks(prev => prev.map(t => t.id === tempId ? { ...t, ...saved, id: saved.id } : t));
        }
      })
      .catch(() => {
        // Revert — remove the optimistically added task
        setTasks(prev => prev.filter(t => t.id !== tempId));
        showError("Failed to create task. Please try again.");
      });
  };

  const changeAssignee = (taskId: string, newAssignee: string) => {
    // Assignee is stored as a display name locally; kept local-only until user IDs are wired
    const updated = tasks.map(t => t.id === taskId ? { ...t, assignee: newAssignee } : t);
    syncTasks(updated);
  };

  const changeDate = (taskId: string, newDate: string) => {
    const previous = tasks;
    const updated = tasks.map(t => t.id === taskId ? { ...t, date: newDate || "TBD" } : t);
    syncTasks(updated);
    if (String(taskId).startsWith("T-")) return;
    api.patch(`/works/${work.id}/tasks/${taskId}`, { dueDate: newDate || null })
      .catch(() => {
        syncTasks(previous);
        showError("Failed to update due date. Please try again.");
      });
  };

  const deleteTask = (taskId: string) => {
    const previous = tasks;
    const updated = tasks.filter(t => t.id !== taskId);
    syncTasks(updated);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
    if (String(taskId).startsWith("T-")) return;
    api.delete(`/works/${work.id}/tasks/${taskId}`)
      .catch(() => {
        syncTasks(previous);
        showError("Failed to delete task. Please try again.");
      });
  };

  // Fields that are persisted to the API (excludes local-only fields like attachments)
  const API_TASK_FIELDS = new Set(["title", "description", "status", "durationDays", "dueDate"]);

  const updateTaskDetails = (taskId: string, fields: any) => {
    const previous = tasks;
    const updated = tasks.map(t => t.id === taskId ? { ...t, ...fields } : t);
    syncTasks(updated);

    // Skip API for temp IDs, attachment-only updates, and comment-only updates
    if (String(taskId).startsWith("T-")) return;
    const hasAttachments = "attachments" in fields;
    const hasComments = "comments" in fields;
    if (hasAttachments || hasComments) return; // local-only

    // Build the API payload from supported fields only
    const payload: Record<string, any> = {};
    for (const key of Object.keys(fields)) {
      if (API_TASK_FIELDS.has(key)) {
        payload[key] = fields[key];
      }
    }
    if (Object.keys(payload).length === 0) return;

    api.patch(`/works/${work.id}/tasks/${taskId}`, payload)
      .catch(() => {
        syncTasks(previous);
        showError("Failed to update task. Please try again.");
      });
  };

  const saveDescription = () => {
    if (!selectedTaskId) return;
    updateTaskDetails(selectedTaskId, { description: descDraft });
    setShowDescSaved(true);
    setTimeout(() => setShowDescSaved(false), 2000);
  };

  const saveTitle = () => {
    if (!selectedTaskId || !titleDraft.trim()) return;
    updateTaskDetails(selectedTaskId, { title: titleDraft.trim() });
  };

  const saveDuration = (val: number) => {
    if (!selectedTaskId) return;
    const cleanVal = isNaN(val) ? 1 : Math.max(1, val);
    setDurationDraft(cleanVal);
    updateTaskDetails(selectedTaskId, { durationDays: cleanVal });
  };

  const postComment = () => {
    if (!commentText.trim() || !selectedTaskId || !activeTask) return;
    const newComment = {
      author: "Sami Chane (You)",
      text: commentText.trim(),
      timestamp: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    const currentComments = activeTask.comments || [];
    const optimisticComments = [...currentComments, newComment];
    // Optimistic update — update comments locally (skips API patch via updateTaskDetails)
    const updated = tasks.map(t => t.id === selectedTaskId ? { ...t, comments: optimisticComments } : t);
    syncTasks(updated);
    setCommentText("");

    if (!String(selectedTaskId).startsWith("T-")) {
      api.post(`/works/${work.id}/tasks/${selectedTaskId}/comments`, { text: newComment.text })
        .catch(() => {
          // Revert the optimistic comment
          const reverted = tasks.map(t => t.id === selectedTaskId ? { ...t, comments: currentComments } : t);
          syncTasks(reverted);
          setCommentText(newComment.text);
          showError("Failed to post comment. Please try again.");
        });
    }
  };

  const columns = [
    { id: "todo", title: "To Do", bg: "bg-slate-50", border: "border-slate-200" },
    { id: "in-progress", title: "In Progress", bg: "bg-blue-50/50", border: "border-blue-100" },
    { id: "completed", title: "Completed", bg: "bg-green-50/50", border: "border-green-110" }
  ];

  // Calculate task statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === "completed").length;
  const inProgressTasksCount = tasks.filter(t => t.status === "in-progress").length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} className="max-w-[1400px] mx-auto pb-10">
      <button onClick={onBack} className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
      </button>

      {/* Error Banner */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl mb-4 shadow-xs"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg(null)} className="ml-4 p-1 hover:bg-red-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading tasks…</span>
        </div>
      )}

      {!isLoading && (<>

      {/* Work Scope Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
         <div className="p-8 border-b border-slate-200 bg-[#F8FAFC]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                 <div className="flex items-center space-x-3 mb-3">
                    <span className={clsx(
                       "px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider",
                       work.type === 'service' ? "bg-indigo-100 text-indigo-800" : "bg-orange-100 text-orange-800"
                    )}>
                       {work.type === 'service' ? 'Service Execution' : 'Material Handling'}
                    </span>
                    <span className={clsx(
                       "px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wider",
                       work.status === 'Completed' ? "bg-green-100 text-green-700" :
                       work.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                       "bg-slate-200 text-slate-700"
                    )}>
                       {work.status}
                    </span>
                    <span className="text-sm font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{work.id}</span>
                 </div>
                 <h1 className="text-3xl font-black text-slate-900 mb-2">{work.title}</h1>
                 <p className="text-slate-600 max-w-4xl">{work.description || "Active engineering tasks and delivery tracks linked to established requirements."}</p>
                 
                 <div className="flex flex-wrap items-center mt-6 gap-6 text-sm text-slate-600">
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                       <Users className="w-4 h-4 mr-2 text-indigo-500" /> 
                       <span className="font-semibold text-slate-700 mr-1">Owner:</span> {work.assignedTeam}
                    </div>
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                       <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" /> 
                       <span className="font-semibold text-slate-700 mr-1">Contract:</span> {contract?.id} - {contract?.title}
                    </div>
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                       <CalendarIcon className="w-4 h-4 mr-2 text-amber-500" /> 
                       <span className="font-semibold text-slate-700 mr-1">Timeline:</span> {contract?.startDate || "Pending"} to {contract?.deliveryDate || "TBD"}
                    </div>
                 </div>
              </div>

              {/* Progress Summary stats */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4 min-w-[240px]">
                 <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                       <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                       <path className="text-blue-600 transition-all duration-500" strokeWidth="3.2" strokeDasharray={`${progressPercent}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="absolute text-sm font-black text-slate-800">{progressPercent}%</span>
                 </div>
                 <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Execution stats</h4>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{completedTasksCount} Completed</p>
                    <p className="text-xs text-slate-500">{inProgressTasksCount} In Progress • {totalTasksCount} Total</p>
                 </div>
              </div>
            </div>
         </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
         {columns.map(col => (
            <div 
               key={col.id} 
               onDragOver={handleDragOver}
               onDragEnter={(e) => handleDragEnter(e, col.id)}
               onDragLeave={(e) => handleDragLeave(e, col.id)}
               onDrop={(e) => handleDrop(e, col.id)}
               className={clsx(
                  "rounded-2xl p-5 min-h-[600px] transition-all duration-300 border-2 relative",
                  col.bg,
                  activeDropCol === col.id 
                     ? "border-blue-500 border-dashed bg-blue-50/80 shadow-inner scale-[1.01]" 
                     : clsx("border-transparent", col.border)
               )}
            >
               <div className="flex justify-between items-center mb-5 px-1 bg-white p-2 rounded-xl border border-slate-200/60 shadow-xs">
                  <h3 className="font-bold text-slate-800 flex items-center text-sm pl-1">
                     {col.id === 'completed' && <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />}
                     {col.id === 'in-progress' && <Clock className="w-4 h-4 mr-2 text-blue-600" />}
                     {col.id === 'todo' && <Circle className="w-4 h-4 mr-2 text-slate-400" />}
                     {col.title} 
                     <span className="ml-2 font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                        {tasks.filter(t => t.status === col.id).length}
                     </span>
                  </h3>
                  <button onClick={() => setAddingTask(col.id)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500" title="Add a task to this column">
                     <Plus className="w-4 h-4" />
                  </button>
               </div>

               <div className="space-y-4">
                  {tasks.filter(t => t.status === col.id).map(task => (
                     <div 
                        key={task.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openTaskDetails(task)}
                        className={clsx(
                           "bg-white p-5 rounded-xl shadow-xs border hover:shadow-md transition-all group relative cursor-pointer hover:border-indigo-200 hover:bg-slate-50/30",
                           isDraggingTaskId === task.id 
                              ? "opacity-30 border-dashed border-blue-400 bg-slate-50 scale-95 shadow-inner animate-pulse" 
                              : "border-slate-200"
                        )}
                     >
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-start space-x-2">
                              <span 
                                 className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" 
                                 title="Drag to move task"
                                 onClick={e => e.stopPropagation()}
                              >
                                 <GripVertical className="w-4 h-4" />
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm leading-snug pr-8 group-hover:text-indigo-900 transition-colors">{task.title}</h4>
                           </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mb-4 bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">{task.id}</p>
                        
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                           {/* Assignee Selection with Google-style Avatar */}
                           <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 flex items-center"><Users className="w-3 h-3 mr-1" /> Assignee:</span>
                              <div className="flex items-center space-x-1.5">
                                 <UserAvatar name={task.assignee} size="xs" />
                                 <select 
                                    value={task.assignee} 
                                    onChange={e => changeAssignee(task.id, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    className="text-xs bg-slate-50 border-none rounded-lg py-1 px-1 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none max-w-[125px] cursor-pointer"
                                 >
                                    {assignees.map(m => (
                                       <option key={m} value={m}>{m}</option>
                                    ))}
                                 </select>
                              </div>
                           </div>

                           {/* Due Date picker */}
                           <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 flex items-center"><CalendarIcon className="w-3 h-3 mr-1" /> Due Date:</span>
                              <input 
                                 type="date" 
                                 value={task.date === "TBD" ? "" : task.date} 
                                 onChange={e => changeDate(task.id, e.target.value)}
                                 onClick={e => e.stopPropagation()}
                                 className="text-xs bg-slate-50 border-none rounded-lg py-1 px-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 w-28 text-right cursor-pointer"
                              />
                           </div>

                           {/* Task sub-attributes indicators */}
                           {(task.comments?.length > 0 || task.durationDays > 1 || task.description) && (
                              <div className="flex items-center space-x-3 pt-2 text-[10px] text-slate-400 font-semibold border-t border-dashed border-slate-100">
                                 {task.description && (
                                    <span className="flex items-center text-slate-500" title="Has detailed description">
                                       <AlignLeft className="w-3 h-3 mr-0.5 text-slate-400" /> Desc
                                    </span>
                                 )}
                                 {task.comments?.length > 0 && (
                                    <span className="flex items-center text-blue-600 font-bold" title={`${task.comments.length} comments posted`}>
                                       <MessageSquare className="w-3 h-3 mr-0.5 text-blue-500" /> {task.comments.length}
                                    </span>
                                 )}
                                 {Number(task.durationDays) > 0 && (
                                    <span className="flex items-center text-indigo-600 font-bold" title={`Takes ${task.durationDays} calendar days`}>
                                       <Clock className="w-3 h-3 mr-0.5 text-indigo-500" /> {task.durationDays} {Number(task.durationDays) === 1 ? 'day' : 'days'}
                                    </span>
                                 )}
                              </div>
                           )}
                        </div>

                        {/* Hover triggers for shortcuts and deletions */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-white pl-2">
                           <button 
                              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors mr-1"
                              title="Delete task"
                           >
                              <Trash2 className="w-3.5 h-3.5" />
                           </button>

                           {columns.filter(c => c.id !== task.status).map(c => (
                              <button 
                                 key={c.id} 
                                 onClick={(e) => { e.stopPropagation(); moveTask(task.id, c.id); }}
                                 className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors uppercase tracking-wider"
                                 title={`Move to ${c.title}`}
                              >
                                 {c.id === 'todo' ? 'To Do' : c.id === 'in-progress' ? 'Dev' : 'Done'}
                              </button>
                           ))}
                        </div>
                     </div>
                  ))}

                  {addingTask === col.id && (
                     <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
                        <input 
                           type="text" 
                           autoFocus
                           className="w-full text-sm font-medium border-none focus:ring-0 p-0 text-slate-900 placeholder:text-slate-400 mb-3"
                           placeholder="Describe task..."
                           value={newTaskTitle}
                           onChange={e => setNewTaskTitle(e.target.value)}
                           onKeyDown={e => {
                              if(e.key === 'Enter') addTask(col.id);
                              if(e.key === 'Escape') setAddingTask(null);
                           }}
                        />
                        <div className="flex justify-end space-x-2 mt-2 pt-2 border-t border-slate-100">
                           <button onClick={() => setAddingTask(null)} className="px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button>
                           <button onClick={() => addTask(col.id)} className="px-3 py-1 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-sm">Save Task</button>
                        </div>
                     </div>
                  )}

                  {tasks.filter(t => t.status === col.id).length === 0 && !addingTask && (
                     <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                        No tasks in this stage
                     </div>
                  )}
               </div>
            </div>
         ))}
      </div>

      {/* Task Details Dialog Modal */}
      <AnimatePresence>
         {selectedTaskId && activeTask && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
               {/* Backdrop */}
               <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedTaskId(null)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" 
               />

               {/* Modal Container */}
               <div className="flex min-h-full items-center justify-center p-4">
                  <motion.div 
                     initial={{ scale: 0.95, opacity: 0, y: 15 }} 
                     animate={{ scale: 1, opacity: 1, y: 0 }} 
                     exit={{ scale: 0.95, opacity: 0, y: 15 }}
                     transition={{ duration: 0.2, ease: "easeOut" }}
                     className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                  >
                     {/* Left Panel (2/3) - Title, Description, and Comments */}
                     <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar border-r border-slate-150">
                        {/* Header ID/Close for Mobile */}
                        <div className="flex justify-between items-center mb-4 md:hidden">
                           <span className="text-xs font-mono text-slate-400 bg-slate-100 py-1 px-2.5 rounded">{activeTask.id}</span>
                           <button onClick={() => setSelectedTaskId(null)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Title Renaming Input */}
                        <div className="mb-6">
                           <input 
                              type="text"
                              value={titleDraft}
                              onChange={e => setTitleDraft(e.target.value)}
                              onBlur={saveTitle}
                              className="w-full text-2xl font-black text-slate-900 border-none focus:ring-2 focus:ring-blue-100 focus:bg-slate-50 rounded-lg p-1.5 -ml-1.5 font-sans leading-tight transition-colors outline-none"
                              placeholder="Task Title"
                              title="Click to rename task"
                           />
                           <p className="text-[10px] text-slate-400 mt-1 pl-0.5">Renames automatically on click away</p>
                        </div>

                        {/* Description Editor Box */}
                        <div className="mb-8">
                           <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold tracking-wider uppercase text-slate-500 pl-0.5 flex items-center">
                                 <AlignLeft className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Task Description
                              </h4>
                              {showDescSaved && (
                                 <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-600 font-bold">Successfully Saved!</motion.span>
                              )}
                           </div>
                           <textarea 
                              rows={5}
                              value={descDraft}
                              onChange={e => setDescDraft(e.target.value)}
                              onBlur={saveDescription}
                              placeholder="Write a comprehensive description about this task's deliverables, dependencies, and requirements..."
                              className="w-full text-sm text-slate-705 p-3.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none leading-relaxed resize-none transition-all placeholder:text-slate-400"
                           />
                           <div className="flex justify-between items-center mt-2.5">
                              <span className="text-[10px] text-slate-400 pl-0.5">Saves automatically on blur</span>
                              <button 
                                 onClick={saveDescription}
                                 className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                              >
                                 Save Now
                              </button>
                           </div>
                        </div>

                        {/* Attachments & Reference Documents Section */}
                        <div className="mb-8 pt-6 border-t border-slate-100">
                           <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold tracking-wider uppercase text-slate-500 pl-0.5 flex items-center">
                                 <Paperclip className="w-4 h-4 mr-2 text-indigo-500" /> Supporting Documents & Links
                              </h4>
                              <span className="text-xs text-slate-400 font-medium">
                                 {(activeTask.attachments || []).length} attached
                              </span>
                           </div>

                           {/* Existing Attachments list */}
                           <div className="mb-4 space-y-2">
                              {(activeTask.attachments || []).map((att: any) => (
                                 <div 
                                    key={att.id} 
                                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/70 hover:bg-slate-100/50 hover:border-slate-300 rounded-xl transition-all"
                                 >
                                    <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                                       <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                                          {getFileIcon(att.type, att.name)}
                                       </div>
                                       <div className="min-w-0 text-left">
                                          <a 
                                             href={att.url} 
                                             target="_blank" 
                                             rel="noreferrer" 
                                             className="block font-bold text-xs text-slate-800 hover:text-indigo-650 hover:underline truncate"
                                             title={`Open ${att.name}`}
                                          >
                                             {att.name}
                                          </a>
                                          <p className="text-[10px] text-slate-400 flex items-center mt-0.5 gap-1.5">
                                             <span className="font-semibold">{att.size}</span>
                                             <span>•</span>
                                             <span>Added {att.createdAt || "Recently"}</span>
                                          </p>
                                       </div>
                                    </div>

                                    <div className="flex items-center space-x-1.5 shrink-0 pl-3">
                                       <a 
                                          href={att.url} 
                                          target="_blank"
                                          rel="noreferrer"
                                          download={att.source === "upload" ? att.name : undefined}
                                          className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-indigo-600 border border-transparent hover:border-slate-200 transition-colors flex items-center justify-center"
                                          title={att.source === "upload" ? "Download File" : "Open Link"}
                                       >
                                          {att.source === "upload" ? (
                                             <Download className="w-3.5 h-3.5" />
                                          ) : (
                                             <ExternalLink className="w-3.5 h-3.5" />
                                          )}
                                       </a>
                                       <button 
                                          onClick={() => deleteAttachment(att.id)}
                                          className="p-1.5 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-500 border border-transparent transition-colors flex items-center justify-center"
                                          title="Remove attachment"
                                       >
                                          <Trash2 className="w-3.5 h-3.5" />
                                       </button>
                                    </div>
                                 </div>
                              ))}

                              {(!activeTask.attachments || activeTask.attachments.length === 0) && (
                                 <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/40 text-slate-400 text-xs italic">
                                    No documents attached yet. Drop local files below or share references.
                                 </div>
                              )}
                           </div>

                           {/* Interactive Upload/Link Workspace */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Drag & Drop Upload Container */}
                              <div 
                                 onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDraggingFile(true);
                                 }}
                                 onDragLeave={() => setIsDraggingFile(false)}
                                 onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDraggingFile(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                       addUploadedFiles(e.dataTransfer.files);
                                    }
                                 }}
                                 onClick={() => fileInputRef.current?.click()}
                                 className={clsx(
                                    "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
                                    isDraggingFile 
                                       ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]" 
                                       : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50"
                                 )}
                              >
                                 <input 
                                    type="file" 
                                    multiple 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                 />
                                 <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full mb-2">
                                    <Upload className="w-4 h-4" />
                                 </div>
                                 <p className="text-xs font-bold text-slate-700">Drag & Drop Documents</p>
                                 <p className="text-[10px] text-slate-400 mt-1">or <span className="text-indigo-600 underline font-semibold">browse files</span> via click</p>
                              </div>

                              {/* Form to attach external link */}
                              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 flex flex-col justify-between">
                                 <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attach External Link</label>
                                    <input 
                                       type="text" 
                                       placeholder="Document Name (e.g. Spec Sheet)" 
                                       value={linkTitle}
                                       onChange={e => setLinkTitle(e.target.value)}
                                       className="w-full text-xs p-2 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg outline-none"
                                    />
                                    <input 
                                       type="text" 
                                       placeholder="URL Address (https://...)" 
                                       value={linkUrl}
                                       onChange={e => setLinkUrl(e.target.value)}
                                       onKeyDown={e => {
                                          if (e.key === "Enter") addWebLink();
                                        }}
                                        className="w-full text-xs p-2 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg outline-none"
                                     />
                                  </div>
                                  <button 
                                     onClick={addWebLink}
                                     disabled={!linkUrl.trim()}
                                     className={clsx(
                                        "w-full py-1.5 mt-3 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition-colors",
                                        linkUrl.trim() 
                                           ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer" 
                                           : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                     )}
                                  >
                                     <Plus className="w-3.5 h-3.5" />
                                     <span>Attach Web Link</span>
                                  </button>
                               </div>
                            </div>
                         </div>

                        {/* Comments Stream */}
                        <div className="pt-6 border-t border-slate-100">
                           <h4 className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-4 flex items-center pl-0.5">
                              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Discussion Stream ({activeTask.comments?.length || 0})
                           </h4>

                           {/* List Comments */}
                           <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar mb-4">
                              {(activeTask.comments || []).map((c: any, index: number) => (
                                 <div key={index} className="flex space-x-3 bg-[#F8FAFC]/60 border border-slate-100 p-3.5 rounded-xl text-sm leading-relaxed shadow-xs">
                                    <UserAvatar name={c.author} size="sm" />
                                    <div className="flex-1">
                                       <div className="flex justify-between items-center mb-1 text-[11px] text-slate-400">
                                          <span className="font-bold text-slate-700">{c.author}</span>
                                          <span>{c.timestamp}</span>
                                       </div>
                                       <p className="text-slate-600 leading-normal">{c.text}</p>
                                    </div>
                                 </div>
                              ))}

                              {(!activeTask.comments || activeTask.comments.length === 0) && (
                                 <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs italic">
                                    No dialogue posted. Type a message below to coordinate.
                                 </div>
                              )}
                           </div>

                           {/* Comment Composition Box */}
                           <div className="flex space-x-2.5 mt-2">
                              <div className="shrink-0 mt-1">
                                 <UserAvatar name="Sami Chane" size="sm" />
                              </div>
                              <input 
                                 type="text"
                                 value={commentText}
                                 onChange={e => setCommentText(e.target.value)}
                                 onKeyDown={e => {
                                    if(e.key === 'Enter') postComment();
                                 }}
                                 placeholder="Add a comment or operational note..."
                                 className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-slate-800"
                              />
                              <button 
                                 onClick={postComment}
                                 className="w-9 h-9 shrink-0 flex items-center justify-center bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl shadow-sm transition-colors"
                                 title="Post comment"
                              >
                                 <Send className="w-4 h-4" />
                              </button>
                           </div>
                           <p className="text-[9px] text-slate-400 mt-1 pl-10">Press Enter or click Send to submit</p>
                        </div>
                     </div>

                     {/* Right Panel (1/3) - Operational Attributes & Actions */}
                     <div className="w-full md:w-[260px] p-6 bg-slate-50 flex flex-col justify-between shrink-0">
                        {/* Task Parameters Box */}
                        <div className="space-y-6">
                           <div className="hidden md:flex justify-between items-center">
                              <span className="text-xs font-mono font-bold text-slate-400 bg-white py-0.5 px-2 rounded border border-slate-200">{activeTask.id}</span>
                              <button onClick={() => setSelectedTaskId(null)} className="p-1 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
                           </div>

                           <div className="space-y-4 pt-1">
                              {/* STATUS */}
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Board Position</label>
                                 <select 
                                    value={activeTask.status}
                                    onChange={e => changeStatusInModal(e.target.value)}
                                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                 >
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                 </select>
                              </div>

                              {/* ASSIGNEE */}
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assigned Officer</label>
                                 <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-2">
                                    <UserAvatar name={activeTask.assignee} size="xs" />
                                    <select 
                                       value={activeTask.assignee}
                                       onChange={e => changeAssigneeInModal(e.target.value)}
                                       className="flex-1 text-xs bg-transparent border-none p-0 text-slate-800 font-semibold outline-none focus:ring-0 cursor-pointer"
                                    >
                                       {assignees.map(emp => (
                                          <option key={emp} value={emp}>{emp}</option>
                                       ))}
                                    </select>
                                 </div>
                              </div>

                              {/* ESTIMATED DURATION */}
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estimated Time Required</label>
                                 <div className="flex items-center space-x-1.5">
                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden flex-1">
                                       <button 
                                          onClick={() => saveDuration(durationDraft - 1)}
                                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                                          title="Decrease duration by 1 day"
                                       >
                                          -
                                       </button>
                                       <input 
                                          type="number"
                                          min={1}
                                          value={durationDraft}
                                          onChange={e => setDurationDraft(parseInt(e.target.value))}
                                          onBlur={e => saveDuration(parseInt(e.target.value))}
                                          className="w-full text-center text-xs font-black border-none p-0 outline-none focus:ring-0 text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                       />
                                       <button 
                                          onClick={() => saveDuration(durationDraft + 1)}
                                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                                          title="Increase duration by 1 day"
                                       >
                                          +
                                       </button>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 py-1.5 px-2 rounded">
                                       {durationDraft === 1 ? 'day' : 'days'}
                                    </span>
                                 </div>
                                 <p className="text-[9px] text-slate-400 mt-1 pl-0.5 leading-snug">Calculates active duration blocks stretching on calendar schedules.</p>
                              </div>

                              {/* DUE DATE */}
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Calendar Deadline</label>
                                 <input 
                                    type="date"
                                    value={activeTask.date === "TBD" ? "" : activeTask.date}
                                    onChange={e => changeDateInModal(e.target.value)}
                                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer font-medium"
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Modal Action Controls footer */}
                        <div className="pt-6 border-t border-slate-200/60 mt-6 md:mt-0">
                           <button 
                              onClick={() => {
                                 if (window.confirm("Are you certain you want to remove this operational milestone?")) {
                                    deleteTask(activeTask.id);
                                 }
                              }}
                              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl border border-red-200/40 flex items-center justify-center space-x-1 transition-colors"
                           >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Milestone Task</span>
                           </button>
                        </div>
                     </div>
                  </motion.div>
               </div>
            </div>
         )}
      </AnimatePresence>
      </>)}
    </motion.div>
  );

  function changeStatusInModal(newStatus: string) {
     if (!selectedTaskId) return;
     moveTask(selectedTaskId, newStatus);
  }

  function changeAssigneeInModal(newAssignee: string) {
     if (!selectedTaskId) return;
     changeAssignee(selectedTaskId, newAssignee);
  }

  function changeDateInModal(newDate: string) {
     if (!selectedTaskId) return;
     changeDate(selectedTaskId, newDate);
  }
}
