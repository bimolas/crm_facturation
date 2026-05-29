"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, CheckCircle, X, Send, FileText, MessageSquare,
  Loader2, Download, AlertCircle, DollarSign, Clock, Shield,
  ChevronRight, Briefcase
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { generateBcPdf, downloadBlob } from "../../utils/pdfGenerator";

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Contract Established": "bg-green-100 text-green-700",
    "BC Pending Vendor":    "bg-blue-100 text-blue-700",
    "Rejected":             "bg-red-100 text-red-700",
    "Negotiating":          "bg-yellow-100 text-yellow-700",
    "Submitted":            "bg-slate-100 text-slate-700",
  };
  return (
    <span className={clsx("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider", map[status] ?? "bg-slate-100 text-slate-600")}>
      {status}
    </span>
  );
}

// ─── Reject-bid modal ─────────────────────────────────────────────────────────
function RejectBidModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50">
          <h3 className="font-bold text-slate-900">Reject This Bid</h3>
          <button onClick={onCancel}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-600">Provide a reason so the vendor understands why their bid was declined.</p>
          <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="e.g. Price exceeds budget ceiling, delivery timeline too long..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-100 outline-none resize-none bg-slate-50" />
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
          <button onClick={() => onConfirm(reason || "No reason provided")}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
            <X className="w-4 h-4 mr-1.5" /> Confirm Rejection
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Reject-BC modal (vendor) ─────────────────────────────────────────────────
function RejectBCModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-orange-50">
          <h3 className="font-bold text-slate-900">Reject Purchase Order (BC)</h3>
          <button onClick={onCancel}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
            Rejecting the BC will send it back to negotiation. The buyer will be notified and can revise the terms.
          </div>
          <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="e.g. Payment terms not acceptable, delivery date needs adjustment..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-100 outline-none resize-none bg-slate-50" />
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
          <button onClick={() => onConfirm(reason || "No reason provided")}
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1.5" /> Reject BC
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── BC Document Panel ────────────────────────────────────────────────────────
function BCDocumentPanel({
  rfp, bid, onVendorAcceptBC, onVendorRejectBC,
}: {
  rfp: any; bid: any;
  onVendorAcceptBC: () => void;
  onVendorRejectBC: (reason: string) => void;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { company: authCompany } = useAuth();

  const workflowId = rfp?.id ?? bid?.workflow?.id ?? bid?.workflowId;
  const bcRef = `BC-${new Date().getFullYear()}-${workflowId ?? 'UNKNOWN'}-1`;
  const amount = bid?.amount ?? bid?.totalTTC ?? 0;

  const handleDownloadBC = async () => {
    setDownloading(true);
    try {
      const blob = generateBcPdf({
        refNumber: bcRef,
        date: new Date().toLocaleDateString("fr-FR"),
        buyerName: rfp?.postedBy || rfp?.buyerCompany?.name || "Buyer Company",
        buyerIce: rfp?.buyerCompany?.ice || bid?.buyerCompany?.ice,
        vendorName: bid?.company || bid?.biddingSeller?.name || authCompany?.name || "Vendor Company",
        vendorIce: bid?.biddingSeller?.ice || authCompany?.ice,
        rfpTitle: rfp?.title || "—",
        amount,
        currency: "MAD",
        deliveryLeadTime: bid?.deliveryLeadTime || bid?.deliveryTime,
        downPaymentPercentage: bid?.downPaymentPercentage,
        balanceDueDays: bid?.balanceDueDays,
        conditions: rfp?.conditions,
        status: "PENDING_VENDOR",
      });
      downloadBlob(blob, `${bcRef}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50">
        {/* BC Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Purchase Order</p>
              <h3 className="text-lg font-bold text-slate-900">{bcRef}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{rfp?.title}</p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-wider">
              Pending Your Signature
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Contract Value</p>
              <p className="font-bold text-slate-900">MAD {Number(amount).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Delivery</p>
              <p className="font-bold text-slate-900">{bid?.deliveryLeadTime || bid?.deliveryTime || "—"} days</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Down Payment</p>
              <p className="font-bold text-slate-900">{bid?.downPaymentPercentage ?? "—"}%</p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <Briefcase className="w-3 h-3 mr-1" /> Buyer (Client)
            </p>
            <p className="font-bold text-slate-900">{rfp?.postedBy || rfp?.buyerCompany?.name || "—"}</p>
            <p className="text-xs text-slate-500 mt-1">ICE: {rfp?.buyerCompany?.ice || "—"}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <Shield className="w-3 h-3 mr-1" /> Vendor (You)
            </p>
            <p className="font-bold text-slate-900">{bid?.company || bid?.biddingSeller?.name || authCompany?.name || "—"}</p>
            <p className="text-xs text-slate-500 mt-1">ICE: {bid?.biddingSeller?.ice || authCompany?.ice || "—"}</p>
            {bid?.biddingSeller?.rc && (
              <p className="text-xs text-slate-500 mt-1">RC: {bid.biddingSeller.rc}</p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Order Terms</p>
          {[
            ["Contract Value",    `MAD ${Number(amount).toLocaleString()}`],
            ["Delivery Lead Time", `${bid?.deliveryLeadTime || bid?.deliveryTime || "—"} days`],
            ["Down Payment",      `${bid?.downPaymentPercentage ?? "—"}%`],
            ["Balance Due",       `${bid?.balanceDueDays ?? "—"} days after delivery`],
            ["Warranty / SLA",    bid?.warranty || "—"],
            ["Payment Conditions", rfp?.conditions || "Standard Net 30"],
          ].map(([label, value], i) => (
            <div key={i} className={clsx("flex justify-between items-center text-sm py-2", i < 5 && "border-b border-slate-100")}>
              <span className="text-slate-500">{label}</span>
              <span className="font-semibold text-slate-900 text-right max-w-[55%]">{value}</span>
            </div>
          ))}
        </div>

        {/* Legal notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-1 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Legal Notice
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            By accepting this Purchase Order, you enter into a legally binding contract with the buyer.
            You have 5 business days to accept or reject. Rejection returns the bid to negotiation — the buyer will be notified and may revise the terms.
          </p>
        </div>

        {/* Download */}
        <button onClick={handleDownloadBC} disabled={downloading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Download BC / Purchase Order PDF</span>
        </button>
      </div>

      {/* Action footer */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2">
        <button onClick={onVendorAcceptBC}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center shadow-sm">
          <CheckCircle className="w-4 h-4 mr-2" /> Sign & Accept — Establish Contract
        </button>
        <button onClick={() => setShowRejectModal(true)}
          className="w-full px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center">
          <X className="w-4 h-4 mr-2" /> Reject BC — Return to Negotiation
        </button>
      </div>

      {showRejectModal && (
        <RejectBCModal
          onConfirm={(reason) => { setShowRejectModal(false); onVendorRejectBC(reason); }}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}

// ─── Main BidNegotiation component ───────────────────────────────────────────
export function BidNegotiation({
  rfp, bid,
  onAccept, onReject,
  onVendorAcceptBC, onVendorRejectBC,
  onBack,
}: {
  rfp: any; bid: any;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onVendorAcceptBC: () => void;
  onVendorRejectBC: (reason: string) => void;
  onBack: () => void;
}) {
  const { company: authCompany } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // "chat" = negotiation thread, "bc" = purchase order document
  const [activeTab, setActiveTab] = useState<"chat" | "bc">(
    bid.status === "BC Pending Vendor" ? "bc" : "chat"
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showRejectBidModal, setShowRejectBidModal] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load negotiation thread from API
  useEffect(() => {
    const fetchMessages = async () => {
      setMessagesLoading(true);
      const workflowId = rfp?.id ?? bid.workflow?.id ?? bid.workflowId;
      if (!workflowId || !bid?.id) {
        setMessages([]);
        setMessagesLoading(false);
        return;
      }
      try {
        const data = await api.get(`/workflows/${workflowId}/bids/${bid.id}/messages`);
        if (data && data.length > 0) {
          const mapped = data.map((msg: any) => {
            const isMe =
              (msg.messageType === "BUYER_MESSAGE" && !bid.isMine) ||
              (msg.messageType === "VENDOR_MESSAGE" && bid.isMine);
            return {
              id: msg.id,
              sender: isMe ? "me" : msg.messageType === "BUYER_MESSAGE" ? "buyer" : "vendor",
              name: msg.senderCompany?.name || (isMe ? "You" : bid.company),
              text: msg.content,
              time: msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "—",
              isSystem: msg.messageType === "SYSTEM_NOTE",
            };
          });
          setMessages(mapped);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [rfp?.id, bid.id, bid.isMine, bid.company, bid.amount, bid.deliveryLeadTime, bid.deliveryTime, bid.warranty, bid.date]);

  const handleSend = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    const text = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);
    const optimistic = {
      id: `opt-${Date.now()}`,
      sender: "me",
      name: "You",
      text,
      time: "Just now",
      isSystem: false,
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      if (rfp?.id) {
        await api.post(`/workflows/${rfp.id}/bids/${bid.id}/messages`, { content: text });
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const isClosed = bid.status === "Contract Established" || bid.status === "Rejected";
  const isBCPending = bid.status === "BC Pending Vendor";
  const amount = bid.amount ?? bid.totalTTC ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="max-w-[1400px] mx-auto pb-10"
    >
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to {bid.isMine ? "My Bids" : "Bids"}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Bid & RFP summary ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Bid card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Bid Details</h3>
              <StatusBadge status={bid.status} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Vendor</p>
                <p className="font-semibold text-slate-900">{bid.company}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Proposed Amount</p>
                <p className="font-bold text-blue-600 text-xl">MAD {Number(amount).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Delivery</p>
                  <p className="font-semibold text-slate-900 text-sm">{bid.deliveryLeadTime || bid.deliveryTime || "—"} days</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Down Payment</p>
                  <p className="font-semibold text-slate-900 text-sm">{bid.downPaymentPercentage ?? "—"}%</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Balance Due</p>
                  <p className="font-semibold text-slate-900 text-sm">{bid.balanceDueDays ?? "—"} days</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Warranty</p>
                  <p className="font-semibold text-slate-900 text-sm">{bid.warranty || "—"}</p>
                </div>
              </div>
              {bid.technicalApproach && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Technical Approach</p>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-4">{bid.technicalApproach}</p>
                </div>
              )}
              {bid.notes && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Vendor Notes</p>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">&ldquo;{bid.notes}&rdquo;</p>
                </div>
              )}
              {bid.attachedFiles && bid.attachedFiles.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Documents</p>
                  <div className="space-y-1">
                    {bid.attachedFiles.map((f: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RFP summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-3">Original RFP</h3>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Title</p>
                <p className="font-semibold text-slate-900 text-sm">{rfp?.title || bid.rfpTitle || '—'}</p>
              </div>
              {rfp && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Budget Ceiling</p>
                  <p className="font-semibold text-slate-900 text-sm">MAD {Number(rfp.budget ?? rfp.budgetCeiling ?? 0).toLocaleString()}</p>
                </div>
              )}
              {rfp?.evalCriteria && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Evaluation Criteria</p>
                  <p className="text-xs text-slate-700">{rfp.evalCriteria}</p>
                </div>
              )}
              {rfp?.requirements && rfp.requirements.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Requirements</p>
                  <ul className="space-y-0.5">
                    {(Array.isArray(rfp.requirements) ? rfp.requirements : [rfp.requirements]).slice(0, 4).map((r: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 mr-2 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!rfp && bid.rfpPostedBy && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Posted By</p>
                  <p className="text-sm text-slate-700">{bid.rfpPostedBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* Buyer actions (non-mine bids) */}
          {!bid.isMine && !isClosed && !isBCPending && (
            <div className="space-y-2">
              <button onClick={onAccept}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center shadow-sm">
                <CheckCircle className="w-4 h-4 mr-2" /> Accept Bid & Generate BC
              </button>
              <button onClick={() => setShowRejectBidModal(true)}
                className="w-full px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center">
                <X className="w-4 h-4 mr-2" /> Reject Bid
              </button>
            </div>
          )}

          {/* Closed state notice */}
          {isClosed && (
            <div className={clsx("rounded-xl p-4 text-sm font-medium text-center",
              bid.status === "Contract Established" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
            )}>
              {bid.status === "Contract Established"
                ? "✓ Contract established. Work can begin."
                : `✗ Bid rejected.${bid.rejectionReason ? ` Reason: ${bid.rejectionReason}` : ""}`}
            </div>
          )}
        </div>

        {/* ── Right: Tabs (Chat | BC) ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "720px" }}>

            {/* Tab bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
              <button
                onClick={() => setActiveTab("chat")}
                className={clsx("flex-1 py-3.5 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors border-b-2",
                  activeTab === "chat" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Negotiation Chat</span>
                {messages.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">{messages.length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("bc")}
                className={clsx("flex-1 py-3.5 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors border-b-2",
                  activeTab === "bc" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700",
                  isBCPending && activeTab !== "bc" && "animate-pulse"
                )}
              >
                <FileText className="w-4 h-4" />
                <span>Purchase Order (BC)</span>
                {isBCPending && (
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold">Action needed</span>
                )}
              </button>
            </div>

            {/* ── Chat tab ── */}
            {activeTab === "chat" && (
              <>
                {/* How-it-works banner */}
                {!isClosed && !isBCPending && (
                  <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 shrink-0">
                    <p className="text-xs text-blue-700">
                      {bid.isMine
                        ? "You are the vendor. Send messages to negotiate terms. Once the buyer accepts your bid, a Purchase Order (BC) will appear in the BC tab for your review."
                        : "You are the buyer. Discuss terms with the vendor. When satisfied, click 'Accept Bid & Generate BC' to issue a Purchase Order."}
                    </p>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <span className="text-[10px] text-slate-400 font-medium bg-white border border-slate-200 px-3 py-1 rounded-full">
                          Negotiation thread — {rfp?.title || bid.rfpTitle || 'RFP'}
                        </span>
                      </div>
                      {messages.length === 0 ? (
                        <div className="text-center py-10 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
                          No negotiation messages yet.
                        </div>
                      ) : messages.map((m) => (
                        <div key={m.id}>
                          {m.isSystem ? (
                            <div className="flex justify-center">
                              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2 rounded-full max-w-md text-center">
                                {m.text}
                              </div>
                            </div>
                          ) : (
                            <div className={clsx("flex", m.sender === "me" ? "justify-end" : "justify-start")}>
                              <div className={clsx(
                                "max-w-sm rounded-2xl px-4 py-3 shadow-sm",
                                m.sender === "me"
                                  ? "bg-blue-600 text-white rounded-br-sm"
                                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                              )}>
                                {m.sender !== "me" && (
                                  <p className="text-[10px] font-bold mb-1 text-slate-500">{m.name}</p>
                                )}
                                <p className="text-sm leading-relaxed">{m.text}</p>
                                <p className={clsx("text-[10px] mt-1.5 text-right",
                                  m.sender === "me" ? "text-blue-200" : "text-slate-400"
                                )}>{m.time}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                {!isClosed && !isBCPending ? (
                  <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <textarea
                          rows={2}
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                          placeholder={bid.isMine
                            ? "Reply to the buyer's request, propose revised terms, or ask a question..."
                            : "Request changes, ask for clarification, or propose counter-terms..."}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white resize-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Press Enter to send · Shift+Enter for new line</p>
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-4 py-3 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors shadow-sm flex items-center disabled:opacity-50 shrink-0"
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={clsx("p-4 border-t border-slate-200 shrink-0 text-center text-sm font-medium",
                    isBCPending ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {isBCPending
                      ? "A Purchase Order has been issued. Switch to the BC tab to review and sign."
                      : `Negotiation closed — ${bid.status}`}
                    {isBCPending && (
                      <button onClick={() => setActiveTab("bc")}
                        className="ml-3 underline font-bold hover:no-underline">
                        View BC →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── BC tab ── */}
            {activeTab === "bc" && (
              <>
                {isBCPending && bid.isMine ? (
                  <BCDocumentPanel
                    rfp={rfp}
                    bid={bid}
                    onVendorAcceptBC={onVendorAcceptBC}
                    onVendorRejectBC={onVendorRejectBC}
                  />
                ) : bid.status === "Contract Established" ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Contract Established</h3>
                    <p className="text-sm text-slate-500 text-center max-w-sm">
                      The Purchase Order was signed by both parties. The contract is now active and work can begin.
                    </p>
                    <button
                      onClick={() => {
                        const blob = generateBcPdf({
                          refNumber: `BC-${new Date().getFullYear()}-${rfp?.id}-1`,
                          date: new Date().toLocaleDateString("fr-FR"),
                          buyerName: rfp?.postedBy || "Buyer",
                          vendorName: bid?.company || "Vendor",
                          rfpTitle: rfp?.title || "—",
                          amount: bid?.amount,
                          currency: "MAD",
                          deliveryLeadTime: bid?.deliveryLeadTime || bid?.deliveryTime,
                          downPaymentPercentage: bid?.downPaymentPercentage,
                          balanceDueDays: bid?.balanceDueDays,
                          conditions: rfp?.conditions,
                          status: "SIGNED",
                        });
                        downloadBlob(blob, `BC-${rfp?.id}-SIGNED.pdf`);
                      }}
                      className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Signed BC PDF</span>
                    </button>
                  </div>
                ) : !bid.isMine && isBCPending ? (
                  // Buyer view of BC pending
                  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Awaiting Vendor Signature</h3>
                    <p className="text-sm text-slate-500 text-center max-w-sm">
                      The Purchase Order has been sent to the vendor. They have 5 business days to accept or reject it.
                    </p>
                    <button
                      onClick={() => {
                        const blob = generateBcPdf({
                          refNumber: `BC-${new Date().getFullYear()}-${rfp?.id}-1`,
                          date: new Date().toLocaleDateString("fr-FR"),
                          buyerName: rfp?.postedBy || "Buyer",
                          vendorName: bid?.company || "Vendor",
                          rfpTitle: rfp?.title || "—",
                          amount: bid?.amount,
                          currency: "MAD",
                          deliveryLeadTime: bid?.deliveryLeadTime || bid?.deliveryTime,
                          downPaymentPercentage: bid?.downPaymentPercentage,
                          balanceDueDays: bid?.balanceDueDays,
                          conditions: rfp?.conditions,
                          status: "PENDING_VENDOR",
                        });
                        downloadBlob(blob, `BC-${rfp?.id}-PENDING.pdf`);
                      }}
                      className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download BC PDF</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 space-y-3">
                    <FileText className="w-10 h-10 text-slate-300" />
                    <p className="text-sm text-slate-500 text-center">
                      A Purchase Order will appear here once the buyer accepts the bid.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reject bid modal */}
      {showRejectBidModal && (
        <RejectBidModal
          onConfirm={(reason) => { setShowRejectBidModal(false); onReject(reason); }}
          onCancel={() => setShowRejectBidModal(false)}
        />
      )}
    </motion.div>
  );
}
