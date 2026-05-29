"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, FileText, Briefcase, ChevronRight, Clock,
  Send, Plus, DollarSign, X, Check, Shield, AlertCircle,
  Calendar, MapPin, Mail, Tag, Award, Users
} from "lucide-react";
import { clsx } from "clsx";
import { DocPreviewModal } from "./DocPreviewModal";
import { SubmitBidModal } from "./SubmitBidModal";

const RFP_STEPS = ["DRAFT", "PUBLISHED", "BIDDING", "NEGOTIATING", "CONTRACT", "INVOICING", "PAYMENT", "COMPLETED"];

function RfpStepper({ rfp, bids }: { rfp: any; bids: any[] }) {
  const getStepIndex = () => {
    if (rfp.status === "Completed") return 7;
    if (rfp.status === "Active Contract") return 5;
    if (rfp.status === "Generating Contract") return 4;
    if (rfp.status === "Active") {
      if (bids.length > 0) {
        if (bids.some((b: any) => b.status === "Negotiating")) return 3;
        if (bids.some((b: any) => b.status === "Submitted")) return 2;
      }
      return 1;
    }
    return 0;
  };
  const currentIndex = getStepIndex();

  return (
    <div className="border-t border-slate-100 px-8 pt-10 pb-10 bg-slate-50/50">
      <div className="relative flex items-center justify-between px-4 max-w-4xl mx-auto">
        <div className="absolute left-[2%] right-[2%] top-1/2 -translate-y-1/2 h-[2px] bg-slate-200" />
        <div
          className="absolute left-[2%] top-1/2 -translate-y-1/2 h-[2px] bg-blue-600 transition-all duration-500 ease-in-out"
          style={{ width: `${(currentIndex / (RFP_STEPS.length - 1)) * 96}%` }}
        />
        {RFP_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} className="relative z-10 flex flex-col items-center group w-8">
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 bg-white",
                  isCompleted
                    ? "border-blue-600 text-blue-600"
                    : isCurrent
                    ? "border-blue-600 bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
                    : "border-slate-300 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={clsx(
                  "mt-3 text-[10px] font-bold uppercase tracking-wider absolute top-8 whitespace-nowrap transition-colors duration-300",
                  isCurrent ? "text-blue-700" : isCompleted ? "text-slate-600" : "text-slate-400"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RfpDetail({
  rfp,
  bids,
  companies = [],
  onAddCompany = () => {},
  onSelectBid,
  onSubmitBid,
  onBack,
  detailVariant = "marketplace",
}: {
  rfp: any;
  bids: any[];
  companies?: any[];
  onAddCompany?: (name: string) => void;
  onSelectBid: (bid: any) => void;
  onSubmitBid?: (bid: any) => void;
  onBack: () => void;
  detailVariant?: "marketplace" | "my-rfps";
}) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  if (!rfp) return null;

  const attachedDocuments = [
    ...(rfp.attachedDocuments || []),
    ...(rfp.attachedFiles || []).map((file: any) =>
      typeof file === "string"
        ? { id: file, name: file, type: file.toLowerCase().endsWith(".pdf") ? "application/pdf" : "file" }
        : file
    ),
  ].filter((doc, index, arr) => {
    const key = typeof doc === "string" ? doc : doc?.id || doc?.name || index;
    return arr.findIndex((entry) => (typeof entry === "string" ? entry : entry?.id || entry?.name) === key) === index;
  });

  const myBids = bids.filter((b) => b.isMine);
  const otherBids = bids.filter((b) => !b.isMine);
  const isMyRfpDetail = detailVariant === "my-rfps";
  const headerBadgeLabel = isMyRfpDetail
    ? "★ My RFP"
    : rfp.isMine
    ? "Your Published RFP"
    : "Marketplace Opportunity";
  const companyName = rfp.postedBy || "Unknown Company";
  const companyInitials = companyName
    .split(/\s+/)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isActive =
    rfp.status === "Active" ||
    rfp.stateCode === "PUBLISHED" ||
    rfp.stateCode === "EVALUATION";

  const bidStatusClass = (status: string) =>
    clsx(
      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
      status === "Contract Established"
        ? "bg-green-100 text-green-700"
        : status === "BC Pending Vendor"
        ? "bg-blue-100 text-blue-700"
        : status === "Rejected"
        ? "bg-red-100 text-red-700"
        : status === "Negotiating"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-slate-100 text-slate-600"
    );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-[1200px] mx-auto pb-10"
    >
      <button
        onClick={onBack}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workflows
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* ── Header ── */}
        <div className="p-8 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center space-x-3 mb-3">
            <span className={clsx(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
              isMyRfpDetail ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-orange-100 text-orange-700 border border-orange-200"
            )}>
              {headerBadgeLabel}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
              {rfp.category}
            </span>
            <span
              className={clsx(
                "px-2.5 py-1 rounded text-xs font-semibold",
                rfp.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-200 text-slate-800"
              )}
            >
              {rfp.status}
            </span>
            <span className="text-sm text-slate-400 font-mono">RFP-{rfp.id}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{rfp.title}</h1>
          <p className="text-slate-500 text-sm leading-relaxed">{rfp.description}</p>
        </div>

        {/* ── Body ── */}
        <div className="p-8 grid grid-cols-3 gap-8">
          {/* Left: main content */}
          <div className="col-span-2 space-y-8">
            {/* ════════════════════════════════════════════════════════ */}
            {/* BUYER VIEW: My RFP — show "Received Bids" */}
            {/* ════════════════════════════════════════════════════════ */}
            {isMyRfpDetail && (
              <>
                {/* Description section for buyer */}
                <section>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center text-base">
                    <FileText className="w-5 h-5 mr-2 text-slate-400" /> Description
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{rfp.description}</p>
                </section>

                {/* Received Bids */}
                <section>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center text-base">
                    <FileText className="w-5 h-5 mr-2 text-slate-400" /> Received Bids
                  </h3>
                  <div className="space-y-4">
                    {bids.length === 0 ? (
                      <div className="text-slate-500 text-center py-10 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                        No bids received yet. Your RFP is live on the marketplace.
                      </div>
                    ) : (
                      bids.map((bid) => (
                        <div
                          key={bid.id}
                          className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-bold text-slate-900">
                                  {bid.company || bid.biddingSeller?.name}
                                </h4>
                                <span className={bidStatusClass(bid.status)}>{bid.status}</span>
                              </div>
                              <p className="text-sm font-semibold text-slate-700">
                                Proposal:{" "}
                                <span className="text-blue-700">
                                  MAD {Number(bid.amount || bid.totalTTC || 0).toLocaleString()}
                                </span>
                              </p>
                            </div>
                            <button
                              onClick={() => onSelectBid(bid)}
                              className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold text-sm rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                            >
                              Review &amp; Negotiate{" "}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <span className="text-slate-500">Delivery: </span>
                              <span className="font-semibold text-slate-800">
                                {bid.deliveryLeadTime || bid.deliveryTime || "—"} days
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Warranty: </span>
                              <span className="font-semibold text-slate-800">
                                {bid.warranty || "—"}
                              </span>
                            </div>
                          </div>
                          {/* Bid files */}
                          <div className="mb-2">
                            <span className="text-xs text-slate-500 block mb-1.5">
                              Attached Files:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {[`BID-${bid.id}.pdf`, ...(bid.attachedFiles || [])].map(
                                (f: string, i: number) => (
                                  <button
                                    key={i}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewFile(f);
                                    }}
                                    className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2.5 py-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-red-400" />
                                    <span>{f}</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                          {bid.notes && (
                            <p className="text-xs text-slate-600 italic">
                              Notes: &ldquo;{bid.notes}&rdquo;
                            </p>
                          )}
                          {bid.status === "Rejected" && bid.rejectionReason && (
                            <div className="mt-2 bg-red-50 text-red-600 text-xs p-2 rounded border border-red-100">
                              {bid.rejectionReason}
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 mt-2 text-right">
                            Submitted on {bid.date || bid.issueDate}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}

            {/* ════════════════════════════════════════════════════════ */}
            {/* VENDOR/MARKETPLACE VIEW: Other company's RFP */}
            {/* ════════════════════════════════════════════════════════ */}
            {!isMyRfpDetail && (
              <section className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center text-base">
                    <FileText className="w-5 h-5 mr-2 text-slate-400" /> Description
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{rfp.description}</p>
                </div>

                {/* My Submitted Bids — shown only if I've already bid */}
                {myBids.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center text-base">
                      <Briefcase className="w-5 h-5 mr-2 text-slate-400" /> My Submitted Bids
                    </h3>
                    <div className="space-y-3">
                      {myBids.map((bid) => (
                        <div
                          key={bid.id}
                          className="p-5 bg-blue-50/70 border border-blue-100 rounded-xl"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-blue-900 text-lg">
                              MAD {Number(bid.amount || 0).toLocaleString()} Offer
                            </h4>
                            <span className={bidStatusClass(bid.status)}>{bid.status}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <p className="text-slate-600">
                              Delivery:{" "}
                              <span className="font-semibold text-slate-800">
                                {bid.deliveryLeadTime || bid.deliveryTime || "—"} days
                              </span>
                            </p>
                            <p className="text-slate-600">
                              Warranty:{" "}
                              <span className="font-semibold text-slate-800">
                                {bid.warranty || "Standard 1 year"}
                              </span>
                            </p>
                          </div>
                          {bid.notes && (
                            <p className="text-xs text-slate-700 italic mb-3">
                              &ldquo;{bid.notes}&rdquo;
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {[`BID-${bid.id}.pdf`, ...(bid.attachedFiles || [])].map(
                              (f: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => setPreviewFile(f)}
                                  className="flex items-center space-x-1.5 bg-white border border-blue-100 text-blue-700 text-xs px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5 text-red-400" />
                                  <span>{f}</span>
                                </button>
                              )
                            )}
                          </div>
                          <button
                            onClick={() => onSelectBid(bid)}
                            className="mt-1 px-4 py-2 bg-white border border-blue-200 text-blue-700 font-semibold text-xs rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Open Negotiation
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Terms & Conditions — both views ── */}
            <section className="border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-900 mb-5 text-base">
                Terms &amp; Conditions
              </h3>
              <div className="space-y-5">
                {rfp.requirements && rfp.requirements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">Requirements</h4>
                    <ul className="space-y-1.5">
                      {rfp.requirements.map((r: string, i: number) => (
                        <li key={i} className="flex items-start text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 mr-2.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {rfp.constraints && rfp.constraints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">Constraints</h4>
                    <ul className="space-y-1.5">
                      {rfp.constraints.map((c: string, i: number) => (
                        <li key={i} className="flex items-start text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 mr-2.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {rfp.conditions && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">
                      Payment Conditions
                    </h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {rfp.conditions}
                    </p>
                  </div>
                )}
                {rfp.evalCriteria && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">
                      Evaluation Criteria
                    </h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {rfp.evalCriteria}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ── Attached RFP Documents ── */}
            <section className="border-t border-slate-100 pt-6 mt-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center text-base">
                <FileText className="w-5 h-5 mr-2 text-slate-400" /> Attached RFP Documents
              </h3>
              {attachedDocuments.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {attachedDocuments.map((file: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 hover:border-slate-300 transition-all group text-left"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors truncate">
                          {file?.name || file?.id || file}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm bg-slate-50 border border-slate-100 rounded-xl p-5 text-center">
                  No documents attached to this RFP.
                </div>
              )}
            </section>

            {/* ── Submit Bid CTA — vendor view only ── */}
            {!isMyRfpDetail && !rfp.isMine && isActive && (
              <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
                <h3 className="font-bold text-slate-900 text-lg mb-1">
                  {myBids.length > 0 ? "Submit a Revised Bid" : "Submit Your Bid"}
                </h3>
                <p className="text-slate-600 text-sm mb-5">
                  {myBids.length > 0
                    ? "You already have a bid on this RFP. Submit a revised proposal to update your offer."
                    : "Interested in this opportunity? Submit your proposal to compete for this contract."}
                </p>
                <button
                  onClick={() => setShowBidModal(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors flex items-center shadow-sm w-fit"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {myBids.length > 0 ? "Submit Revised Bid" : "Submit a Bid"}
                </button>
              </section>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="col-span-1 border-l border-slate-100 pl-8">
            <div className="space-y-5">
              {/* Company Profile Card (Marketplace Only) */}
              {!isMyRfpDetail && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-500">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">{companyName}</h4>
                      <div className="flex items-center mt-1">
                        <Shield className="w-3.5 h-3.5 text-green-500 mr-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Verified Buyer</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2.5 mb-5 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400" /> {rfp.region || "Global Hub"}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-slate-400" /> {rfp.contactEmail || "contact@example.com"}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center">
                      <Briefcase className="w-4 h-4 mr-2 text-slate-400" /> Buyer workspace: {rfp.region || "General Procurement"}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Member since {new Date().getFullYear() - 1}
                    </p>
                  </div>
                  
                  {rfp.postedBy && rfp.postedBy !== "Internal" && (
                    rfp.isMine ? (
                      <div className="w-full text-center text-xs font-bold text-purple-700 bg-purple-100 px-3 py-2 rounded-lg border border-purple-200 flex justify-center items-center">
                        <Check className="w-4 h-4 mr-1.5" /> Your Company
                      </div>
                    ) : companies.some(
                        (c: any) =>
                          c.name?.toLowerCase() === rfp.postedBy?.toLowerCase()
                      ) ? (
                      <div className="w-full text-center text-xs font-bold text-green-700 bg-green-100 px-3 py-2 rounded-lg border border-green-200 flex justify-center items-center">
                        <Check className="w-4 h-4 mr-1.5" /> Connected Partner
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddCompany?.(rfp.postedBy)}
                        className="w-full text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 shadow-sm transition-all flex justify-center items-center"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Add to Customers
                      </button>
                    )
                  )}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Posted On</p>
                <p className="font-semibold text-slate-900 flex items-center text-sm">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  {rfp.createdAt || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Region</p>
                <p className="font-semibold text-slate-900 text-sm">{rfp.region || "—"}</p>
              </div>
              
              {rfp.isMine && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Total Bids Received</p>
                  <p className="font-bold text-blue-600 text-sm">{bids.length} Bids</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 mb-0.5">Budget Ceiling</p>
                <p className="font-semibold text-slate-900 text-sm">
                  MAD{" "}
                  {Number(rfp.budget || rfp.budgetCeiling || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Technical Category</p>
                <p className="font-semibold text-slate-900 text-sm">{rfp.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Submission Deadline</p>
                <p className="font-semibold text-slate-900 text-sm">
                  {rfp.deadline || rfp.submissionDeadline || "—"}
                </p>
              </div>
              {rfp.evalCriteria && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Evaluation Criteria</p>
                  <p className="font-semibold text-slate-900 text-sm">{rfp.evalCriteria}</p>
                </div>
              )}
              {rfp.contactEmail && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Contact Details</p>
                  <p className="font-semibold text-slate-900 text-sm">{rfp.contactEmail}</p>
                </div>
              )}

              {!isMyRfpDetail && !rfp.isMine && isActive && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowBidModal(true)}
                    className="w-full px-4 py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {myBids.length > 0 ? "Update Bid" : "Submit a Bid"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stepper at bottom ── */}
        <RfpStepper rfp={rfp} bids={bids} />
      </div>

      {showBidModal && (
        <SubmitBidModal
          isOpen={showBidModal}
          onClose={() => setShowBidModal(false)}
          onSubmit={(bid: any) => {
            onSubmitBid?.(bid);
            setShowBidModal(false);
          }}
          rfp={rfp}
        />
      )}
      {previewFile && (
        <DocPreviewModal
          file={previewFile}
          context={rfp}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </motion.div>
  );
}
