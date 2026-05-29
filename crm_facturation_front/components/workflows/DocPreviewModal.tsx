"use client";

import { motion, AnimatePresence } from "motion/react";
import { FileText, X, Download, ExternalLink } from "lucide-react";
import { normalizeAssetUrl } from "../../utils/api";

export function DocPreviewModal({
  file,
  context,
  onClose,
}: {
  file: any;
  context?: any;
  onClose: () => void;
}) {
  const fileName = typeof file === "string" ? file : file?.name || file?.id || "Document";
  const rawFileUrl = typeof file === "string" ? file : file?.previewUrl || file?.url || null;
  const fileUrl = normalizeAssetUrl(rawFileUrl);
  const isPdf = fileName.toLowerCase().endsWith(".pdf") || file?.type === "application/pdf";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        style={{ pointerEvents: "auto" }}
      >
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "calc(100vh - 48px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{fileName}</h3>
                <p className="text-xs text-slate-500">Document Reader View</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — fixed cropping: proper overflow handling and min-height */}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-6 sm:p-8 flex justify-center">
            <div className="w-full max-w-[900px] bg-white shadow-lg border border-slate-200 rounded-lg my-2 shrink-0 overflow-hidden">
              {/* Inner content with proper padding that won't get cropped */}
              <div className="p-8 sm:p-10">
                {fileUrl && isPdf && (
                  <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                      <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                        <span>Embedded Document Preview</span>
                      </div>
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                        Open in new tab
                      </a>
                    </div>
                    <iframe
                      src={fileUrl}
                      title={fileName}
                      className="w-full h-[420px] bg-slate-50"
                    />
                  </div>
                )}

                {/* Document header */}
                <div className="border-b-4 border-blue-900 pb-5 mb-7 flex justify-between items-start">
                  <div className="min-w-0 flex-1 mr-4">
                    <h1 className="text-xl font-bold text-blue-900 mb-1 break-words">
                      {context?.title || file.replace(/\.[^.]+$/, "")}
                    </h1>
                    <p className="text-slate-500 text-xs">
                      {context?.postedBy || context?.company || context?.client || ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 text-xs">
                      Ref: {context?.id || "—"}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {new Date().toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-5 text-slate-800 text-sm leading-relaxed">
                  {context?.description && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1.5 text-xs uppercase tracking-wider">
                        Scope of Work
                      </h4>
                      <p>{context.description}</p>
                    </div>
                  )}

                  {(context?.budget || context?.budgetCeiling) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                          Budget Ceiling
                        </p>
                        <p className="font-bold text-slate-900">
                          MAD{" "}
                          {Number(
                            context.budget || context.budgetCeiling || 0
                          ).toLocaleString()}
                        </p>
                      </div>
                      {context.deadline && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Submission Deadline
                          </p>
                          <p className="font-bold text-slate-900">
                            {context.deadline}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {context?.amount && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">
                          Proposed Amount
                        </p>
                        <p className="font-bold text-blue-900">
                          MAD {Number(context.amount).toLocaleString()}
                        </p>
                      </div>
                      {context.deliveryLeadTime && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Delivery Lead Time
                          </p>
                          <p className="font-bold text-slate-900">
                            {context.deliveryLeadTime} days
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category & Region */}
                  {(context?.category || context?.region) && (
                    <div className="grid grid-cols-2 gap-3">
                      {context.category && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Technical Category
                          </p>
                          <p className="font-bold text-slate-900">{context.category}</p>
                        </div>
                      )}
                      {context.region && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Region
                          </p>
                          <p className="font-bold text-slate-900">{context.region}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evaluation Criteria */}
                  {context?.evalCriteria && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                        Evaluation Criteria
                      </h4>
                      <p className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {context.evalCriteria}
                      </p>
                    </div>
                  )}

                  {context?.requirements && context.requirements.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                        Vendor Requirements
                      </h4>
                      <ul className="space-y-1 pl-4">
                        {context.requirements.map((r: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {context?.constraints && context.constraints.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                        Constraints
                      </h4>
                      <ul className="space-y-1 pl-4">
                        {context.constraints.map((c: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 mr-2 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {context?.conditions && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                        Payment Conditions
                      </h4>
                      <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                        {context.conditions}
                      </p>
                    </div>
                  )}

                  {context?.notes && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                        Vendor Notes
                      </h4>
                      <p className="bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                        {context.notes}
                      </p>
                    </div>
                  )}

                  {/* Contact info */}
                  {context?.contactEmail && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                        Contact Information
                      </h4>
                      <p className="text-slate-700">{context.contactEmail}</p>
                    </div>
                  )}

                  {!fileUrl && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                      This file is attached as metadata only. A browser preview is available once a PDF/blob URL exists.
                    </div>
                  )}

                  {/* Signature block */}
                  <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-10">
                    <div>
                      <div className="border-b-2 border-slate-300 w-full mb-2 h-8" />
                      <p className="font-bold text-slate-900 text-sm">
                        {context?.postedBy || context?.client || "Buyer"}
                      </p>
                      <p className="text-slate-500 text-xs uppercase tracking-wider">
                        Authorized Signatory
                      </p>
                    </div>
                    <div>
                      <div className="border-b-2 border-slate-300 w-full mb-2 h-8" />
                      <p className="font-bold text-slate-900 text-sm">
                        {context?.company || context?.vendor || "Vendor"}
                      </p>
                      <p className="text-slate-500 text-xs uppercase tracking-wider">
                        Authorized Signatory
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
