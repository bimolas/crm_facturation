"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  X, Send, Briefcase, Upload, Paperclip, Download, Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../utils/api";

export function SubmitBidModal({
  isOpen,
  onClose,
  onSubmit,
  rfp,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bid: any) => void;
  rfp: any;
}) {
  const { company: authCompany, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialForm = {
    amount: "",
    deliveryLeadTime: "30",
    validUntil: "",
    downPaymentPercentage: "30",
    balanceDueDays: "30",
    warranty: "",
    technicalApproach: "",
    notes: "",
    complianceItems: "",
  };

  const [submitting, setSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!isOpen) return;

    setForm(initialForm);
    setAttachedFiles([]);
    setSelectedItems([]);
    setSelectedArticleId("");
    setSelectedQuantity("1");
    setCatalogError(null);
    setCatalogLoading(true);

    Promise.all([api.get("/articles"), api.get("/inventory")])
      .then(([articlesData, inventoryData]) => {
        setArticles(Array.isArray(articlesData) ? articlesData : []);
        setInventoryItems(Array.isArray(inventoryData) ? inventoryData : []);
      })
      .catch(() => {
        setCatalogError("Unable to load catalog items right now.");
      })
      .finally(() => {
        setCatalogLoading(false);
      });
  }, [isOpen]);

  const stockBySku = useMemo(() => {
    return new Map<string, number>(
      inventoryItems.map((item) => [item.stockKeepingUnit, Number(item.availableStock ?? 0)]),
    );
  }, [inventoryItems]);

  const selectedArticle = articles.find((article) => String(article.id) === selectedArticleId);
  const selectedArticleStock = selectedArticle ? stockBySku.get(selectedArticle.reference) ?? null : null;

  if (!isOpen) return null;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addItem = () => {
    if (!selectedArticle) return;

    const quantity = Number(selectedQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    const availableStock = selectedArticleStock;
    setSelectedItems((previous) => [
      ...previous,
      {
        articleId: selectedArticle.id,
        articleName: selectedArticle.name,
        articleReference: selectedArticle.reference,
        quantity,
        unitPriceHT: Number(selectedArticle.unitPriceHT ?? 0),
        appliedTvaRate: Number(selectedArticle.category?.tvaRate ?? 0),
        availableStock,
        stockConflict: availableStock !== null && quantity > availableStock ? quantity - availableStock : 0,
      },
    ]);

    setSelectedArticleId("");
    setSelectedQuantity("1");
  };

  const removeItem = (index: number) => {
    setSelectedItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files)
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const uploadAttachedFiles = async () => {
    if (attachedFiles.length === 0) return [];
    const uploads = await Promise.all(attachedFiles.map((file) => api.uploadFile(file)));
    return uploads.map((upload) => ({
      url: upload.url,
      filename: upload.filename ?? upload.url,
    }));
  };

  const handleSubmit = async () => {
    if (!form.amount) return;
    setSubmitting(true);
    try {
      const uploadedFiles = await uploadAttachedFiles();
      const technicalProposalFileUrl = uploadedFiles[0]?.url ?? null;
      const financialQuoteFileUrl = uploadedFiles[1]?.url ?? null;

      await onSubmit({
        rfpId: rfp?.id,
        referenceNumber: `BID-${Date.now()}`,
        company: authCompany?.name || "My Company",
        amount: Number(form.amount),
        status: "Submitted",
        bidStatus: "SUBMITTED",
        date: new Date().toISOString().split("T")[0],
        isMine: true,
        deliveryLeadTime: form.deliveryLeadTime,
        validUntil:
          form.validUntil ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        downPaymentPercentage: form.downPaymentPercentage,
        balanceDueDays: form.balanceDueDays,
        warranty: form.warranty,
        technicalApproach: form.technicalApproach,
        notes: form.notes,
        complianceItems: form.complianceItems
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        items: selectedItems.map((item) => ({
          articleId: item.articleId,
          quantity: item.quantity,
          discountAmount: 0,
        })),
        technicalProposalFileUrl,
        financialQuoteFileUrl,
        attachedFiles: uploadedFiles.map((file) => file.url),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Submit Bid Proposal</h2>
            <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">
              {rfp?.title || rfp?.id}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Vendor banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {authCompany?.name || "My Company"}
              </p>
              <p className="text-xs text-slate-500">
                {user?.email} · ICE: {authCompany?.ice || "—"}
              </p>
            </div>
          </div>

          {/* Financial */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Financial Proposal
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Amount (MAD) *
                </label>
                <input
                  required
                  type="number"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white"
                  placeholder="e.g. 150000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Down Payment (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.downPaymentPercentage}
                  onChange={(e) => set("downPaymentPercentage", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Balance Due (days)
                </label>
                <input
                  type="number"
                  value={form.balanceDueDays}
                  onChange={(e) => set("balanceDueDays", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white"
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Delivery &amp; Validity
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Lead Time (days) *
                </label>
                <input
                  type="number"
                  value={form.deliveryLeadTime}
                  onChange={(e) => set("deliveryLeadTime", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bid Valid Until
                </label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => set("validUntil", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warranty / SLA
                </label>
                <input
                  type="text"
                  value={form.warranty}
                  onChange={(e) => set("warranty", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white"
                  placeholder="e.g. 12 months on-site support"
                />
              </div>
            </div>
          </div>

          {/* Technical */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Technical Proposal
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technical Approach &amp; Methodology
                </label>
                <textarea
                  rows={3}
                  value={form.technicalApproach}
                  onChange={(e) => set("technicalApproach", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white resize-none"
                  placeholder="Describe your solution, methodology, and why you are the best fit..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Compliance &amp; Certifications (one per line)
                </label>
                <textarea
                  rows={2}
                  value={form.complianceItems}
                  onChange={(e) => set("complianceItems", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white resize-none"
                  placeholder={"ISO 9001 certified\nGDPR compliant"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 focus:bg-white resize-none"
                  placeholder="Any other relevant information..."
                />
              </div>
            </div>
          </div>

          {/* Bid items */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Bid Items
            </p>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_0.5fr_auto]">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Article
                  </label>
                  <select
                    value={selectedArticleId}
                    onChange={(e) => setSelectedArticleId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose an article</option>
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.name} · {article.reference}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!selectedArticleId || !selectedQuantity || catalogLoading}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {selectedArticle && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Available stock: {selectedArticleStock ?? "No inventory record"}. Quantities above stock are allowed and will be flagged as conflicts.
                </div>
              )}

              {catalogError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {catalogError}
                </div>
              )}

              <div className="space-y-2">
                {selectedItems.map((item, index) => (
                  <div
                    key={`${item.articleId}-${index}`}
                    className={`flex items-start justify-between rounded-lg border px-3 py-2 text-sm ${item.stockConflict > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.articleName}</p>
                      <p className="text-xs text-slate-500">{item.articleReference} · Qty {item.quantity}</p>
                      {item.stockConflict > 0 && (
                        <p className="text-xs font-medium text-amber-700">
                          Stock conflict: short by {item.stockConflict}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {selectedItems.length === 0 && (
                  <p className="text-xs italic text-slate-400">
                    No line items selected yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Files */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Supporting Documents
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">
                Click to attach files{" "}
                <span className="text-slate-400">(PDF, DOCX, XLSX)</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {attachedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-700 font-medium">{f.name}</span>
                    </div>
                    <button
                      onClick={() =>
                        setAttachedFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2 flex items-center">
              <Download className="w-3 h-3 mr-1" />
              A bid summary PDF will be auto-generated on submission.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.amount || submitting}
            className="px-5 py-2 bg-blue-700 text-white font-medium hover:bg-blue-800 rounded-lg transition-colors flex items-center text-sm disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Bid
          </button>
        </div>
      </motion.div>
    </div>
  );
}
