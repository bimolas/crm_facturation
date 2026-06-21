"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, ArrowLeft, Send, CheckCircle, Search, Filter, Plus, Briefcase, ChevronRight, DollarSign, Clock, MessageSquare, User, Users, X, Check, Shield, Upload, Paperclip, Download, Loader2
} from "lucide-react";
import { clsx } from "clsx";
import { WorkBoard } from "./WorkBoard";
import { api } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { generateRfpPdf, generateBidPdf } from "../../utils/pdfGenerator";
import { BidNegotiation } from "./BidNegotiation";
import { RfpDetail } from "./RfpDetail";
import { MyRfpDetail } from "./MyRfpDetail";
import { DocPreviewModal } from "./DocPreviewModal";

export function WorkflowsView({ 
  initialTab = "marketplace",
  contracts: passedContracts,
  setContracts: passedSetContracts,
  companies = [],
  setCompanies = () => {},
  companyFilter = null,
  setCompanyFilter = () => {},
  activeWorkspaceId,
  workspaces = []
}: { 
  initialTab?: "marketplace" | "my-rfps" | "my-bids" | "my-contracts" | "works",
  contracts?: any[],
  setContracts?: React.Dispatch<React.SetStateAction<any[]>>,
  companies?: any[],
  setCompanies?: React.Dispatch<React.SetStateAction<any[]>>,
  companyFilter?: string | null,
  setCompanyFilter?: (filter: string | null) => void,
  activeWorkspaceId?: number,
  workspaces?: any[]
}) {
  const [viewState, setViewState] = useState<"list" | "detail" | "create" | "create-work" | "negotiate" | "contract-detail" | "work-board">("list");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedDetailVariant, setSelectedDetailVariant] = useState<"marketplace" | "my-rfps">("marketplace");
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedWork, setSelectedWork] = useState<any>(null);
  const [previewDocument, setPreviewDocument] = useState<{ file: any; context?: any } | null>(null);
  const [selectedItemBids, setSelectedItemBids] = useState<any[]>([]);

  const { user, company: authCompany } = useAuth();

  const [rfps, setRfps] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [localContracts, setLocalContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contracts = passedContracts || localContracts;
  const setContracts = passedSetContracts || setLocalContracts;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const requests = await Promise.allSettled([
          api.get('/workflows/active'),
          api.get('/workflows?mine=true'),
          api.get('/bids/mine'),
          api.get('/workflows/contracts'),
        ]);

        const [marketplaceRes, myRfpsRes, myBidsRes, myContractsRes] = requests;
        const marketplace = marketplaceRes.status === 'fulfilled' ? marketplaceRes.value : [];
        const myRfps = myRfpsRes.status === 'fulfilled' ? myRfpsRes.value : [];
        const myBids = myBidsRes.status === 'fulfilled' ? myBidsRes.value : [];
        const myContracts = myContractsRes.status === 'fulfilled' ? myContractsRes.value : [];

        if (marketplaceRes.status === 'rejected' || myRfpsRes.status === 'rejected' || myBidsRes.status === 'rejected' || myContractsRes.status === 'rejected') {
          const firstError = [marketplaceRes, myRfpsRes, myBidsRes, myContractsRes].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
          setError(firstError?.reason?.message || 'Unable to load some workflow data.');
        }

        // Normalize a workflow from the API into the shape the UI expects
        const normalize = (w: any, isMine: boolean) => ({
          ...w,
          isMine,
          // Map stateCode → status label used by the UI
          status: (() => {
            switch (w.stateCode) {
              case 'PUBLISHED':    return 'Active';
              case 'EVALUATION':  return 'Evaluation';
              case 'IN_PROGRESS': return 'Active Contract';
              case 'UNDER_TEST':  return 'Testing Phase';
              case 'FULLY_INVOICED': return 'Completed';
              default:            return w.stateCode ?? 'Draft';
            }
          })(),
          // Map API field names → UI field names
          category: w.technicalCategory ?? w.category,
          budget:   w.budgetCeiling    ?? w.budget,
          deadline: w.submissionDeadline ?? w.deadline,
          postedBy: w.buyerCompany?.name ?? w.postedBy,
        });

        const normalizedMine = (myRfps || []).map((w: any) => normalize(w, true));
        const myOffers = normalizedMine;

        // Marketplace: exclude workflows already in "mine" to avoid duplicates
        const mineIds = new Set(myOffers.map((w: any) => w.id));
        const normalizedMarket = (marketplace || [])
          .filter((w: any) => !mineIds.has(w.id))
          .map((w: any) => normalize(w, false));

        const publicOffers = normalizedMarket;

        // Associate static RFPs with the active workspace (or let them be dynamic based on workspace)
        const currentWsId = activeWorkspaceId;
          const mappedMyOffers = myOffers.map((o: any) => ({
           ...o, 
           workspaceId: o.workspaceId || currentWsId,
           postedBy: currentWsId ? (workspaces.find(w => w.id === currentWsId)?.name || o.postedBy) : o.postedBy
        }));

        setRfps([...mappedMyOffers, ...publicOffers]);

        // Normalize bids: map bidStatus → status label used by the UI
        const normalizeBid = (b: any) => ({
          ...b,
          isMine: true,
          rfpId: b.workflow?.id ?? b.rfpId,
          rfpTitle: b.workflow?.title ?? b.rfpTitle,
          rfpPostedBy: b.workflow?.buyerCompany?.name ?? b.rfpPostedBy,
          company: b.biddingSeller?.name ?? b.company ?? 'My Company',
          sellerCompanyId: b.biddingSeller?.id ?? b.sellerCompanyId ?? b.sellerId ?? null,
          biddingSeller: b.biddingSeller ?? null,
          buyerCompanyId: b.buyerCompanyId ?? b.workflow?.buyerCompany?.id ?? null,
          amount: b.totalTTC ?? b.amount,
          deliveryLeadTime: b.deliveryLeadTime,
          downPaymentPercentage: b.downPaymentPercentage,
          balanceDueDays: b.balanceDueDays,
          warranty: b.vendorNotes ? undefined : b.warranty, // vendorNotes is the notes field
          notes: b.vendorNotes ?? b.notes,
          date: b.issueDate ? new Date(b.issueDate).toLocaleDateString('fr-FR') : b.date,
          status: (() => {
            switch (b.bidStatus) {
              case 'SUBMITTED':           return 'Submitted';
              case 'NEGOTIATING':         return 'Negotiating';
              case 'BC_PENDING_VENDOR':   return 'BC Pending Vendor';
              case 'CONTRACT_ESTABLISHED': return 'Contract Established';
              case 'REJECTED':            return 'Rejected';
              default:                    return b.bidStatus ?? b.status ?? 'Submitted';
            }
          })(),
        });
        const normalizedMyBids = (myBids || []).map(normalizeBid);
        
        setBids(normalizedMyBids);
        setLocalContracts(myContracts || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);  

  // Filter RFPs and Bids based on activeWorkspaceId
  // ==========================================
  // PARENT LEVEL WORKSPACE SEPARATION (Put this in WorkflowsView)
  // ==========================================
  const activeWsRfps = useMemo(() => {
    console.log("Filtering RFPs for workspace", activeWorkspaceId, rfps.filter(r => {
      if (!r.isMine) return true;
      if (!activeWorkspaceId) return true;
      if (!r.workspaceId) return true;
      return String(r.workspaceId) === String(activeWorkspaceId);
    }));
    if (!rfps || rfps.length === 0) return [];
    return rfps.filter(r => {
      if (!r.isMine) return true;
      if (!activeWorkspaceId) return true;
      if (!r.workspaceId) return true;
      return String(r.workspaceId) === String(activeWorkspaceId);
    });
  }, [rfps, activeWorkspaceId]);

  const activeWsBids = useMemo(() => {
    if (!bids || bids.length === 0) return [];
    return bids.filter(b => b.isMine || true);
  }, [bids]);

  

  const addCompanyIfNeeded = (companyName: string) => {
    if (!companyName || companyName === "MyCompany (Us)" || companyName === "Internal") return;
    if (companies.some(c => c.name.toLowerCase() === companyName.toLowerCase())) return;
    const newCompany = {
      id: Date.now(),
      name: companyName,
      ice: `ICE-${Math.floor(1000000 + Math.random() * 9000000)}`,
      rc: `RC-${Math.floor(100000 + Math.random() * 900000)}`,
      taxId: `TAX-${Math.floor(100000 + Math.random() * 900000)}`,
      email: `contact@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "") || "company"}.com`,
      address: "Casablanca, Morocco",
      active: true,
      users: 5,
      workflows: 1
    };
    setCompanies((prev: any[]) => [newCompany, ...prev]);
  };

  const fetchWorkflowBids = async (workflowId: number) => {
    try {
      const bidsData = await api.get(`/workflows/${workflowId}/bids`);
      const normalizedBids = Array.isArray(bidsData) ? bidsData.map((b: any) => ({
        ...b,
        rfpId: b.workflow?.id ?? b.rfpId,
        rfpTitle: b.workflow?.title ?? b.rfpTitle,
        rfpPostedBy: b.workflow?.buyerCompany?.name ?? b.rfpPostedBy,
        company: b.biddingSeller?.name ?? b.company ?? 'Vendor Company',
        sellerCompanyId: b.biddingSeller?.id ?? b.sellerCompanyId ?? null,
        biddingSeller: b.biddingSeller ?? null,
        buyerCompanyId: b.workflow?.buyerCompany?.id ?? b.buyerCompanyId ?? null,
        amount: b.totalTTC ?? b.amount,
        deliveryLeadTime: b.deliveryLeadTime,
        downPaymentPercentage: b.downPaymentPercentage,
        balanceDueDays: b.balanceDueDays,
        notes: b.vendorNotes ?? b.notes,
        date: b.issueDate ? new Date(b.issueDate).toLocaleDateString('fr-FR') : b.date,
      })) : [];
      setSelectedItemBids(normalizedBids);
    } catch (err: any) {
      setSelectedItemBids([]);
      setError(err.message || 'Unable to load bids for this RFP');
    }
  };

  const handleSelectRfp = async (item: any, source: "marketplace" | "my-rfps" = "marketplace") => {
    setSelectedItem(item);
    setSelectedDetailVariant(source);
    setViewState("detail");
    if (source === "my-rfps" && item?.id) {
      await fetchWorkflowBids(item.id);
    } else {
      setSelectedItemBids([]);
    }
  };

  const handleSelectBid = async (bid: any) => {
    setSelectedBid(bid);

    let rfp = rfps.find((r) => r.id === bid.rfpId || String(r.id) === String(bid.rfpId));
    if (!rfp && bid.workflow) {
      rfp = bid.workflow;
    }
    if (!rfp && bid.workflowId) {
      try {
        const workflow = await api.get(`/workflows/${bid.workflowId}`);
        rfp = workflow;
      } catch {
        // fallback to basic RFP metadata if the API call fails
        rfp = {
          id: bid.workflowId,
          title: bid.workflowTitle || `RFP #${bid.workflowId}`,
          postedBy: bid.buyerCompanyName || bid.rfpPostedBy || 'Buyer Company',
          category: bid.category || 'Unknown',
          status: 'Active',
          stateCode: 'PUBLISHED',
        };
      }
    }

    setSelectedItem(rfp || null);
    setViewState('negotiate');
  };

  const handleSelectContract = (contract: any) => {
    setSelectedContract(contract);
    setViewState("contract-detail");
  };

  const handleSelectWork = (work: any) => {
    setSelectedWork(work);
    const relatedContract = contracts.find(c => c.id === work.contractId || c.works?.some((w: any) => w.id === work.id));
    setSelectedContract(relatedContract || null);
    setViewState("work-board");
  };

  const handleCreateWork = (contractId: string, newWork: any) => {
    setContracts((prev: any[]) => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          works: [...(c.works || []), newWork]
        };
      }
      return c;
    }));
    setViewState("list");
  };

  const handleUpdateWork = (contractId: string, workId: string, updatedFields: any) => {
    setContracts((prev: any[]) => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          works: (c.works || []).map((w: any) => {
            if (w.id === workId) {
              return { ...w, ...updatedFields };
            }
            return w;
            })
          };
        }
        return c;
      }));
    
    if (selectedContract && selectedContract.id === contractId) {
      setSelectedContract((prev: any) => {
        const updatedWorks = (prev.works || []).map((w: any) => {
          if (w.id === workId) {
            return { ...w, ...updatedFields };
          }
          return w;
        });
        return { ...prev, works: updatedWorks };
      });
    }

    if (selectedWork && selectedWork.id === workId) {
      setSelectedWork((prev: any) => ({ ...prev, ...updatedFields }));
    }
  };

  const acceptBid = async (bidId: string, rfpId: string) => {
    const selectedBidItem = bids.find(b => b.id === bidId);
    if (selectedBidItem) {
      addCompanyIfNeeded(selectedBidItem.company);
    }
    // Optimistic update
    const prevBids = bids;
    const prevRfps = rfps;
    setBids(bids.map(b => {
      if (b.rfpId === rfpId) {
        if (b.id === bidId) return { ...b, status: "BC Pending Vendor" };
        else return { ...b, status: "Rejected", rejectReason: "Automated: We've established a contract with another vendor for this bid." };
      }
      return b;
    }));
    setRfps(rfps.map(r => r.id === rfpId ? { ...r, status: "Generating Contract" } : r));
    try {
      const sellerCompanyId = selectedBidItem?.sellerCompanyId ?? selectedBidItem?.biddingSeller?.id;
      if (!String(rfpId).startsWith("RFP-")) {
        if (!sellerCompanyId) {
          throw new Error('Unable to resolve seller company ID for this bid.');
        }
        await api.post(`/workflows/${rfpId}/bids/accept`, { bidId, sellerCompanyId });
      }
    } catch (err: any) {
      // Revert on error
      setBids(prevBids);
      setRfps(prevRfps);
      setError(err.message || 'Failed to accept bid');
    }
    setViewState("detail");
  };

  const rejectBid = async (bidId: string, reason?: string) => {
    setBids(bids.map(b => b.id === bidId ? { ...b, status: "Rejected", rejectionReason: reason } : b));
    try {
      const bid = bids.find(b => b.id === bidId);
      if (bid && !String(bid.rfpId).startsWith("RFP-") && !String(bidId).startsWith("BID-")) {
        await api.post(`/workflows/${bid.rfpId}/bids/${bidId}/reject`, { rejectionReason: reason || '' });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject bid');
    }
    setViewState("detail");
  };

  const vendorAcceptBC = async (bidId: string, rfpId: string) => {
    const rfp = rfps.find(r => r.id === rfpId);
    const bid = bids.find(b => b.id === bidId);
    if (rfp && rfp.postedBy) {
      addCompanyIfNeeded(rfp.postedBy);
    }
    setBids(bids.map(b => b.id === bidId ? { ...b, status: "Contract Established", bidStatus: "CONTRACT_ESTABLISHED" } : b));
    setRfps(rfps.map(r => r.id === rfpId ? { ...r, status: "Active Contract" } : r));

    try {
      if (!String(rfpId).startsWith("RFP-")) {
        await api.post(`/workflows/${rfpId}/bc/confirm`, {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm BC');
    }

    // Generate BC PDF
    try {
      const { generateBcPdf } = await import('../../utils/pdfGenerator');
      const pdfBlob = generateBcPdf({
        refNumber: `BC-${new Date().getFullYear()}-${rfpId}-1`,
        date: new Date().toLocaleDateString("fr-FR"),
        buyerName: rfp?.postedBy || "Buyer Company",
        vendorName: bid?.company || "Vendor Company",
        rfpTitle: rfp?.title || "—",
        amount: bid?.amount,
        deliveryLeadTime: bid?.deliveryLeadTime,
        conditions: rfp?.conditions,
        status: "SIGNED",
      });
      const previewUrl = URL.createObjectURL(pdfBlob);
      setPreviewDocument({
        file: {
          name: `BC-${rfpId}-SIGNED.pdf`,
          type: "application/pdf",
          previewUrl,
        },
        context: {
          title: `BC-${rfpId}-SIGNED`,
          postedBy: rfp?.postedBy,
          company: bid?.company,
          amount: bid?.amount,
          deliveryLeadTime: bid?.deliveryLeadTime,
          conditions: rfp?.conditions,
          rfpTitle: rfp?.title,
          rfpRef: rfpId,
        },
      });
    } catch { /* non-blocking */ }

    if (rfp && bid && setContracts) {
      const contractType = rfp.workflowType || (rfp.category?.toLowerCase().includes("service") ? "service" : "material");
      const newContract = {
        id: `CON-${Math.floor(Math.random() * 10000)}`,
        rfpId: rfp.id,
        title: rfp.title,
        type: contractType,
        vendor: bid.company,
        client: rfp.postedBy || "MyCompany (Us)",
        value: bid.amount,
        startDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: contractType === "service" ? "Testing Phase" : "Ordered",
        conditions: rfp.conditions || "Standard conditions apply.",
        progress: 0,
        steps: contractType === "service"
          ? ["Kickoff", "Development", "Testing & QA", "Invoiced", "Payment", "Completed"]
          : contractType === "subscription"
          ? ["Activated", "First Billing", "Recurring", "Cancelled/Completed"]
          : ["Ordered", "Packaging", "Shipping", "Inspected", "Invoiced", "Payment", "Completed"],
        timeline: [{ date: new Date().toISOString().split('T')[0], label: "Contract Established" }],
        attachedFiles: [`BC-${rfpId}-SIGNED.pdf`],
        works: []
      };
      setContracts((prev: any[]) => [...prev, newContract]);
    }

    setViewState("list");
  };

  const vendorRejectBC = async (bidId: string, rfpId: string, reason: string) => {
    // Vendor rejects the BC — bid goes back to NEGOTIATING so buyer can revise
    setBids(bids.map(b => b.id === bidId
      ? { ...b, status: "Negotiating", bidStatus: "NEGOTIATING", bcRejectionReason: reason }
      : b
    ));
    try {
      // Post a system note in the negotiation thread explaining the rejection
      if (!String(rfpId).startsWith("RFP-") && !String(bidId).startsWith("BID-")) {
        await api.post(`/workflows/${rfpId}/bids/${bidId}/messages`, {
          content: `[BC REJECTED] The vendor has rejected the Purchase Order. Reason: ${reason}. Please review and re-negotiate.`,
        });
      }
    } catch { /* non-blocking */ }
    setError(null);
  };

  const submitBid = async (newBid: any) => {
    const rfpId = newBid.rfpId || selectedItem?.id;
    const rfp = rfps.find(r => String(r.id) === String(rfpId));
    try {
      const createdWorkflow = await api.post(`/workflows/${rfpId}/bids`, {
        referenceNumber: newBid.referenceNumber || `BID-${Date.now()}`,
        issueDate: new Date().toISOString(),
        validUntil: newBid.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sellerCompanyId: authCompany?.id,
        deliveryLeadTime: parseInt(newBid.deliveryLeadTime) || 30,
        downPaymentPercentage: parseFloat(newBid.downPaymentPercentage) || 0,
        balanceDueDays: parseInt(newBid.balanceDueDays) || 30,
        vendorNotes: newBid.notes,
        items: newBid.items ?? [],
        technicalProposalFileUrl: newBid.technicalProposalFileUrl ?? newBid.attachedFiles?.[0] ?? null,
        financialQuoteFileUrl: newBid.financialQuoteFileUrl ?? newBid.attachedFiles?.[1] ?? null,
      });

      const persistedBid = Array.isArray(createdWorkflow?.bids)
        ? createdWorkflow.bids.find((b: any) => b.referenceNumber === (newBid.referenceNumber || `BID-${Date.now()}`))
        : createdWorkflow?.id
          ? createdWorkflow
          : null;

      const createdBid = {
        ...newBid,
        id: persistedBid?.id ?? `BID-${Date.now()}`,
        rfpId,
        isMine: true,
        status: persistedBid ? (persistedBid.bidStatus === 'REJECTED' ? 'Rejected' : 'Submitted') : 'Submitted',
        bidStatus: persistedBid?.bidStatus ?? 'SUBMITTED',
        sellerCompanyId: persistedBid?.biddingSeller?.id ?? persistedBid?.sellerCompanyId ?? authCompany?.id,
        biddingSeller: persistedBid?.biddingSeller ?? { id: persistedBid?.sellerCompanyId ?? authCompany?.id, name: authCompany?.name },
        technicalProposalFileUrl: persistedBid?.technicalProposalFileUrl ?? newBid.technicalProposalFileUrl,
        financialQuoteFileUrl: persistedBid?.financialQuoteFileUrl ?? newBid.financialQuoteFileUrl,
        rfpTitle: rfp?.title,
        rfpPostedBy: rfp?.buyerCompany?.name || rfp?.postedBy || "Buyer Company",
        company: authCompany?.name || 'My Company',
        buyerCompany: rfp?.buyerCompany?.name || rfp?.postedBy || "Buyer Company",
        date: persistedBid?.issueDate ? new Date(persistedBid.issueDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      };

      setBids(prev => [...prev, createdBid]);
      if (selectedDetailVariant === 'my-rfps' && String(selectedItem?.id) === String(rfpId)) {
        setSelectedItemBids((prev) => [...prev, createdBid]);
      }
      setViewState('list');

      // Generate an in-app preview for the bid PDF instead of downloading it.
      try {
        const pdfBlob = generateBidPdf({
          refNumber: newBid.referenceNumber || `BID-${createdBid.id}`,
          date: new Date().toLocaleDateString('fr-FR'),
          vendorName: authCompany?.name || 'My Company',
          vendorIce: authCompany?.ice,
          vendorEmail: user?.email,
          rfpTitle: rfp?.title || '—',
          rfpRef: String(rfpId),
          buyerName: rfp?.postedBy,
          proposedAmount: newBid.amount,
          deliveryLeadTime: `${newBid.deliveryLeadTime || 30} days`,
          validUntil: newBid.validUntil,
          downPaymentPercentage: newBid.downPaymentPercentage,
          balanceDueDays: newBid.balanceDueDays,
          technicalApproach: newBid.technicalApproach,
          warranty: newBid.warranty,
          vendorNotes: newBid.notes,
          complianceItems: newBid.complianceItems,
        });
        const previewUrl = URL.createObjectURL(pdfBlob);
        setPreviewDocument({
          file: {
            name: `${createdBid.referenceNumber || `BID-${createdBid.id}`}.pdf`,
            type: 'application/pdf',
            previewUrl,
          },
          context: {
            title: createdBid.referenceNumber || createdBid.id,
            postedBy: createdBid.company,
            company: createdBid.company,
            amount: newBid.amount,
            deliveryLeadTime: newBid.deliveryLeadTime,
            validUntil: newBid.validUntil,
            notes: newBid.notes,
            complianceItems: newBid.complianceItems,
            rfpTitle: rfp?.title,
            rfpRef: String(rfpId),
          },
        });
      } catch {
        /* PDF generation is non-blocking */
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit bid');
    }
  };

  const handleCreateRfp = async (newRfp: any) => {
    let rfpFileUrl: string | null = null;
    let generatedDocument: any = null;

    try {
      const pdfBlob = generateRfpPdf({
        refNumber: `RFP-${Date.now()}`,
        date: new Date().toLocaleDateString('fr-FR'),
        companyName: authCompany?.name || 'My Company',
        companyIce: authCompany?.ice,
        companyEmail: user?.email,
        title: newRfp.title,
        description: newRfp.description,
        category: newRfp.category,
        workflowType: newRfp.workflowType,
        budget: newRfp.budget,
        submissionDeadline: newRfp.deadline,
        expectedDeliveryDate: newRfp.expectedDeliveryDate,
        region: newRfp.region,
        evaluationCriteria: newRfp.evalCriteria,
        conditions: newRfp.conditions,
        requirements: newRfp.requirements,
        constraints: newRfp.constraints,
        contactEmail: newRfp.contactEmail,
      });
      const pdfName = `RFP-${Date.now()}.pdf`;
      const uploadResult = await api.uploadFile(new File([pdfBlob], pdfName, { type: 'application/pdf' }));
      rfpFileUrl = uploadResult?.url ?? null;
      const previewUrl = uploadResult?.url ?? URL.createObjectURL(pdfBlob);
      generatedDocument = {
        id: pdfName,
        name: pdfName,
        type: 'application/pdf',
        url: previewUrl,
        previewUrl,
        source: 'generated',
      };
    } catch {
      generatedDocument = null;
    }

    try {
      const payload = {
        title: newRfp.title,
        description: newRfp.description,
        technicalCategory: newRfp.category,
        budgetCeiling: newRfp.budget,
        submissionDeadline: newRfp.deadline,
        expectedDeliveryDate: newRfp.expectedDeliveryDate,
        evaluationCriteria: newRfp.evalCriteria,
        contactEmail: newRfp.contactEmail,
        workflowType: newRfp.workflowType,
        region: newRfp.region,
        requirements: newRfp.requirements,
        constraints: newRfp.constraints,
        conditions: newRfp.conditions,
        rfpFileUrl,
      };
      const created = await api.post('/workflows', payload);
      const workflowId = created?.id;
      let finalWorkflow = created;

      // Auto-publish so it appears in the marketplace immediately
      if (workflowId) {
        try {
          const published = await api.post(`/workflows/${workflowId}/publish`, {});
          finalWorkflow = published ?? created;
        } catch (publishError: any) {
          if (publishError.status === 403) {
            setError('Workflow created, but could not be published. Please ask an admin to publish it.');
          }
        }
      }

      const finalWorkflowId = finalWorkflow?.id ?? `RFP-${Date.now()}`;
      const finalStateCode = finalWorkflow?.stateCode ?? 'DRAFT';
      const normalized = {
        ...newRfp,
        id: finalWorkflowId,
        isMine: true,
        status: finalStateCode === 'PUBLISHED' ? 'Active' : finalStateCode === 'DRAFT' ? 'Draft' : 'Active',
        stateCode: finalStateCode,
        category: newRfp.category,
        budget: newRfp.budget,
        deadline: newRfp.deadline,
        postedBy: authCompany?.name || 'My Company',
        attachedDocuments: generatedDocument ? [generatedDocument] : [],
        attachedFiles: generatedDocument ? [generatedDocument.name] : [],
        rfpFileUrl,
      };
      setRfps(prev => [normalized, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Failed to create RFP');
    } finally {
      setViewState('list');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>;

  return (
    <AnimatePresence mode="wait">
      {error && viewState === "list" && (
        <div className="max-w-[1200px] mx-auto mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex justify-between items-center">
          <span className="text-sm font-medium flex items-center"><Shield className="w-4 h-4 mr-2" /> {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {viewState === "list" && (
        <RfpList 
          key="list" 
          rfps={activeWsRfps}
          bids={activeWsBids}
          contracts={contracts}
          activeTab={initialTab}
          
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          onCreate={() => setViewState("create")} 
          onCreateWork={() => setViewState("create-work")}
          onSelect={handleSelectRfp} 
          onSelectBid={handleSelectBid}
          onSelectContract={handleSelectContract}
          onSelectWork={handleSelectWork}
        />
        
      )}
      {viewState === "detail" && selectedItem && selectedDetailVariant === "marketplace" && (
        <RfpDetail 
          key="detail" 
          rfp={selectedItem} 
          bids={bids.filter(b => String(b.rfpId) === String(selectedItem.id))}
          companies={companies}
          onAddCompany={addCompanyIfNeeded}
          onSelectBid={handleSelectBid}
          onSubmitBid={submitBid}
          onBack={() => setViewState("list")} 
        />
      )}
      {viewState === "detail" && selectedItem && selectedDetailVariant === "my-rfps" && (
        <MyRfpDetail
          key="detail-my-rfps"
          rfp={selectedItem}
          bids={selectedItemBids}
          companies={companies}
          onAddCompany={addCompanyIfNeeded}
          onSelectBid={handleSelectBid}
          onSubmitBid={submitBid}
          onBack={() => setViewState("list")}
        />
      )}
      {viewState === "negotiate" && (
        <BidNegotiation 
          key="negotiate"
          rfp={selectedItem}
          bid={selectedBid}
          onAccept={() => {
            if (!selectedBid || !selectedItem?.id) {
              setError('Unable to accept bid: missing workflow context.');
              return;
            }
            acceptBid(selectedBid.id, selectedItem.id);
          }}
          onReject={(reason: string) => selectedBid && rejectBid(selectedBid.id, reason)}
          onVendorAcceptBC={() => {
            if (!selectedBid || !selectedItem?.id) {
              setError('Unable to confirm BC: missing workflow context.');
              return;
            }
            vendorAcceptBC(selectedBid.id, selectedItem.id);
          }}
          onVendorRejectBC={(reason: string) => {
            if (!selectedBid || !selectedItem?.id) {
              setError('Unable to reject BC: missing workflow context.');
              return;
            }
            vendorRejectBC(selectedBid.id, selectedItem.id, reason);
          }}
          onBack={() => setViewState("detail")}
        />
      )}
      {viewState === "contract-detail" && (
        <ContractDetail
          key="contract-detail"
          contract={selectedContract}
          onBack={() => setViewState("list")}
          onSelectWork={handleSelectWork}
        />
      )}
      {viewState === "create-work" && (
        <WorkForm
          key="create-work"
          contracts={contracts}
          onBack={() => setViewState("list")}
          onSubmit={handleCreateWork}
        />
      )}
      {viewState === "work-board" && (
        <WorkBoard
          key="work-board"
          work={selectedWork}
          contract={selectedContract}
          onBack={() => {
             if (initialTab === "works") setViewState("list");
             else setViewState("contract-detail");
          }}
          onUpdateWork={handleUpdateWork}
        />
      )}
      {viewState === "create" && (
        <RfpForm 
          key="create" 
          onBack={() => setViewState("list")} 
          onSubmit={handleCreateRfp}
          company={authCompany}
        />
      )}
      {previewDocument && (
        <DocPreviewModal
          file={previewDocument.file}
          context={previewDocument.context}
          onClose={() => {
            if (previewDocument.file?.previewUrl) {
              URL.revokeObjectURL(previewDocument.file.previewUrl);
            }
            setPreviewDocument(null);
          }}
        />
      )}
    </AnimatePresence>
  );
}

function RfpList({ rfps, bids, contracts, activeTab, companyFilter, setCompanyFilter, onCreate, onSelect, onSelectBid, onSelectContract, onSelectWork, onCreateWork }: { rfps: any[], bids: any[], contracts: any[], activeTab: string, companyFilter?: string | null, setCompanyFilter?: (filter: string | null) => void, onCreate: () => void, onSelect: (item: any, source: "marketplace" | "my-rfps") => void, onSelectBid: (item: any) => void, onSelectContract: (item: any) => void, onSelectWork: (item: any) => void, onCreateWork: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMaxBudget, setFilterMaxBudget] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");

  // ==========================================
  // UNIFIED FILTERING LAYER (SAFE FROM SCOPE ERRORS)
  // ==========================================
  const filteredItems = useMemo(() => {
    // 1. Safe Workspace Resolution Context Lookup
    const currentWsId = typeof activeWorkspaceId !== 'undefined' ? activeWorkspaceId : null;
    
    const safeWsRfps = (rfps || []).filter(r => {
      // Rule A: Public marketplace items from other vendors always stay visible
      if (!r.isMine) return true; 
      
      // Rule B: If workspace contexts aren't loaded or defined yet, keep data visible
      if (!currentWsId) return true;
      if (r.workspaceId === undefined || r.workspaceId === null) return true;

      // Rule C: Robust type evaluation (converts numbers/strings seamlessly)
      return String(r.workspaceId) === String(currentWsId);
    });

    const safeWsBids = (bids || []).filter(b => b.isMine || true);

    // 2. Tab Segment Router Layout
    let items = [];
    
    if (activeTab === "marketplace") {
      // Displays Active/PUBLISHED RFPs from other companies
      items = safeWsRfps.filter(r => !r.isMine);
      console.log("Marketplace Items Before Company Filter:", safeWsRfps);
      if (companyFilter) {
        items = items.filter(r => r.postedBy?.toLowerCase() === companyFilter.toLowerCase());
      }
    }
    
    else if (activeTab === "my-rfps") {
      // Shows user-owned RFPs bound to the active workspace
      items = safeWsRfps.filter(r => r.isMine);
    }
    
    else if (activeTab === "my-contracts") {
       items = contracts || [];
       return items.filter(c => (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || String(c.id).toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    else if (activeTab === "works") {
       items = (contracts || []).flatMap((c: any) => {
          return (c.works || []).map((w: any) => ({
             ...w,
             contractId: c.id,
             contractTitle: c.title,
             client: c.client,
             startDate: c.startDate,
             deliveryDate: c.deliveryDate
          }));
       });
       return items.filter((w: any) => 
          (w.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
          String(w.id).toLowerCase().includes(searchQuery.toLowerCase()) || 
          (w.contractTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
       );
    }
    
    else if (activeTab === "my-bids") {
       items = safeWsBids.filter(b => b.isMine).map(b => {
          const relatedRfp = safeWsRfps.find(r => String(r.id) === String(b.rfpId));
          return {
            ...b,
            rfpTitle: b.rfpTitle || relatedRfp?.title || `RFP #${b.rfpId}`,
            rfpPostedBy: b.rfpPostedBy || relatedRfp?.postedBy,
            category: b.category || relatedRfp?.category,
          };
       });
       return items.filter(b =>
          (b.rfpTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.company || '').toLowerCase().includes(searchQuery.toLowerCase())
       );
    }

    // 3. Process General Input Filtering Search Controls (Marketplace & My RFPs tabs)
    return items.filter(r => {
       const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || String(r.id).toLowerCase().includes(searchQuery.toLowerCase());
       const matchesCategory = filterCategory ? r.category === filterCategory : true;
       
       // Handle normalization mapping between alternative budget labels (budget vs budgetCeiling)
       const rfpBudget = Number(r.budget || r.budgetCeiling || 0);
       const matchesBudget = filterMaxBudget ? rfpBudget <= parseInt(filterMaxBudget) : true;
       
       const matchesRegion = filterRegion ? r.region === filterRegion : true;
       const matchesDate = filterDateFrom ? new Date(r.createdAt || "2000-01-01") >= new Date(filterDateFrom) : true;
       
       return matchesSearch && matchesCategory && matchesBudget && matchesRegion && matchesDate;
    });

  }, [
    searchQuery, 
    rfps, 
    bids, 
    contracts, 
    activeTab, 
    filterCategory, 
    filterMaxBudget, 
    filterRegion, 
    filterDateFrom, 
    companyFilter, 
    typeof activeWorkspaceId !== 'undefined' ? activeWorkspaceId : null
  ]);
  console.log("Filtered Items:", filteredItems);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contracts & Bids</h1>
          <p className="text-sm text-slate-500 mt-1">Manage public tenders, active workflows, and negotiations.</p>
        </div>
        {activeTab === "works" ? (
          <button onClick={onCreateWork} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Initialize Work
          </button>
        ) : (
          <button onClick={onCreate} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Request (RFP)
          </button>
        )}
      </div>

      {companyFilter && setCompanyFilter && activeTab === "marketplace" && (
         <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-xl p-4 flex items-center justify-between mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
               <Filter className="w-5 h-5 text-blue-600 shrink-0" />
               <span className="text-sm">
                  Showing marketplace offers posted by <strong className="font-semibold text-slate-900">{companyFilter}</strong>
               </span>
            </div>
            <button 
               onClick={() => setCompanyFilter(null)} 
               className="px-3 py-1 bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-all shadow-sm"
            >
               Clear Filter
            </button>
         </div>
      )}

      <div className="bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm mb-6">
         <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-800 capitalize ml-2">{activeTab.replace("-", " ")}</h2>
            <div className="flex items-center space-x-3">
               <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-64 pl-9 pr-4 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
               </div>
               <button onClick={() => setShowFilters(!showFilters)} className={clsx("px-3 py-1.5 border border-slate-200 rounded text-sm font-medium flex items-center transition-colors", showFilters ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600 hover:bg-slate-50 bg-white")}>
                  <Filter className="w-4 h-4 mr-2" /> Advanced Search
               </button>
            </div>
         </div>
         {showFilters && activeTab !== "my-bids" && activeTab !== "works" && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-100 mt-2">
               <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100">
                     <option value="">All Categories</option>
                     <option value="Office Equipment">Office Equipment</option>
                     <option value="IT Services">IT Services</option>
                     <option value="Marketing">Marketing</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Budget ($)</label>
                  <input type="number" value={filterMaxBudget} onChange={(e) => setFilterMaxBudget(e.target.value)} placeholder="e.g. 100000" className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
                  <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100">
                     <option value="">All Regions</option>
                     <option value="North America">North America</option>
                     <option value="Europe">Europe</option>
                     <option value="Global">Global</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Posted After</label>
                  <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
               </div>
            </div>
         )}
      </div>

      {filteredItems.length === 0 ? (
         <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">No items found matching your criteria.</div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredItems.map((item) => (
             <div key={item.id} onClick={() => {
                if (activeTab === "my-bids") onSelectBid(item);
                else if (activeTab === "my-contracts") onSelectContract(item);
                else if (activeTab === "works") onSelectWork(item);
               else onSelect(item, activeTab === "my-rfps" ? "my-rfps" : "marketplace");
             }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group">
               {activeTab === "works" ? (
                  <>
                     <div className="flex justify-between items-start mb-4">
                        <span className={clsx(
                           "px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider",
                           item.type === 'service' ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"
                        )}>
                           {item.type === 'service' ? 'Service Task' : 'Material Handling'}
                        </span>
                        <span className={clsx(
                           "px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider",
                           item.status === 'Completed' ? "bg-green-100 text-green-700" :
                           item.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                           "bg-slate-100 text-slate-700"
                        )}>
                           {item.status}
                        </span>
                     </div>
                     <h2 className="text-base font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors leading-tight">{item.title}</h2>
                     <p className="text-[10px] text-slate-400 font-mono mb-4">{item.id}</p>

                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 mb-4 text-xs space-y-2">
                        <div className="flex items-center text-slate-600 truncate">
                           <Shield className="w-3.5 h-3.5 mr-2 text-indigo-400 shrink-0" />
                           <span className="font-semibold text-slate-700 mr-1 shrink-0">Contract:</span> 
                           <span className="truncate">{item.contractTitle} ({item.contractId})</span>
                        </div>
                        <div className="flex items-center text-slate-600 truncate">
                           <Briefcase className="w-3.5 h-3.5 mr-2 text-emerald-400 shrink-0" />
                           <span className="font-semibold text-slate-700 mr-1 shrink-0">Client:</span> 
                           <span className="truncate">{item.client}</span>
                        </div>
                        <div className="flex items-center text-slate-600 italic">
                           <Clock className="w-3.5 h-3.5 mr-2 text-amber-500 shrink-0" />
                           <span>{item.startDate} to {item.deliveryDate}</span>
                        </div>
                     </div>

                     <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-xs font-semibold text-slate-500">Board Progress</span>
                           <span className="text-xs font-black text-blue-600">
                              {(() => {
                                 const totalTs = item.tasks?.length || 0;
                                 const completedTs = item.tasks?.filter((t: any) => t.status === 'completed').length || 0;
                                 return totalTs > 0 ? `${Math.round((completedTs / totalTs) * 100)}%` : '0%';
                              })()}
                           </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                              style={{ 
                                 width: (() => {
                                    const totalTs = item.tasks?.length || 0;
                                    const completedTs = item.tasks?.filter((t: any) => t.status === 'completed').length || 0;
                                    return totalTs > 0 ? `${(completedTs / totalTs) * 100}%` : '0%';
                                 })() 
                              }} 
                           />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                           {item.tasks?.length || 0} tasks listed ({item.tasks?.filter((t: any) => t.status === 'completed').length || 0} completed)
                        </p>
                     </div>

                     <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-4 mt-2">
                        <div className="flex items-center text-slate-500 font-medium whitespace-nowrap overflow-hidden mr-2">
                           <Users className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
                           <span className="truncate">Team: <span className="text-slate-800 font-bold">{item.assignedTeam}</span></span>
                        </div>
                        <div className="text-blue-600 font-bold flex items-center group-hover:translate-x-1 transition-transform shrink-0">
                           Open Board <ChevronRight className="w-4 h-4 ml-0.5" />
                        </div>
                     </div>
                  </>
               ) : activeTab === "my-contracts" ? (
                  <>
                     <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Contract </span>
                        <span className={clsx("px-2 py-1 rounded text-xs font-semibold", item.status === 'Completed' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700')}>{item.status}</span>
                     </div>
                     <h2 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h2>
                     <div className="flex items-center text-sm font-medium text-slate-900 mb-4">
                        <Briefcase className="w-4 h-4 mr-1.5 text-slate-400" /> {item.client}
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <p className="text-[10px] font-semibold tracking-wider text-slate-500 mb-1 uppercase">Value</p>
                           <p className="font-semibold text-slate-900">${item.value.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <p className="text-[10px] font-semibold tracking-wider text-slate-500 mb-1 uppercase">Delivery</p>
                           <p className="font-semibold text-slate-900">{item.deliveryDate}</p>
                        </div>
                     </div>
                     
                     <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-xs font-medium text-slate-500">Progress</span>
                           <span className="text-xs font-medium text-blue-600">{item.steps[item.progress]}</span>
                        </div>
                        <div className="flex space-x-1 mb-2">
                           {item.steps.map((step: string, idx: number) => (
                              <div key={idx} className={clsx("h-1.5 flex-1 rounded-full", idx <= item.progress ? "bg-blue-600" : "bg-slate-100")}></div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                        <p className="text-[10px] font-semibold tracking-wider text-slate-500 mb-1 uppercase">Conditions & Requirements</p>
                        <p className="text-xs text-slate-700 italic border-l-2 border-blue-200 pl-2">&quot;{item.conditions}&quot;</p>
                     </div>
                  </>
               ) : activeTab === "my-bids" ? (
                  <>
                     <div className="flex justify-between items-start mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">My Bid</span>
                        <span className={clsx("px-2 py-1 rounded text-xs font-semibold",
                           item.status === 'Contract Established' ? 'bg-green-100 text-green-700' :
                           item.status === 'BC Pending Vendor' ? 'bg-blue-100 text-blue-700' :
                           item.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                           item.status === 'Negotiating' ? 'bg-yellow-100 text-yellow-700' :
                           'bg-slate-100 text-slate-700'
                        )}>{item.status}</span>
                     </div>
                     {/* RFP title */}
                     <h2 className="text-base font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.rfpTitle || `RFP #${item.rfpId}`}</h2>
                     {/* Buyer company */}
                     <p className="text-xs text-slate-500 mb-3 flex items-center">
                        <Briefcase className="w-3 h-3 mr-1 text-slate-400" />
                        {item.rfpPostedBy || item.buyerCompany || "Buyer Company"}
                     </p>
                     {/* Bid financials */}
                     <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500">Proposed Amount</span>
                           <span className="font-bold text-blue-700">MAD {Number(item.amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500">Delivery</span>
                           <span className="font-semibold text-slate-800">{item.deliveryLeadTime || item.deliveryTime || "—"} days</span>
                        </div>
                        {item.downPaymentPercentage != null && (
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Down Payment</span>
                              <span className="font-semibold text-slate-800">{item.downPaymentPercentage}%</span>
                           </div>
                        )}
                        {item.warranty && (
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Warranty</span>
                              <span className="font-semibold text-slate-800">{item.warranty}</span>
                           </div>
                        )}
                     </div>
                     {item.notes && (
                        <p className="text-xs text-slate-600 italic line-clamp-2 mb-2">&ldquo;{item.notes}&rdquo;</p>
                     )}
                     {item.status === 'Rejected' && item.rejectionReason && (
                        <div className="bg-red-50 text-red-600 text-[10px] p-2 rounded mb-2 border border-red-100">
                           Rejected: {item.rejectionReason}
                        </div>
                     )}
                     <p className="text-[10px] text-slate-400 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" /> Submitted {item.date}
                     </p>
                  </>
               ) : (
                  <>
                     <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                           <Briefcase className="w-5 h-5 text-blue-600" />
                         </div>
                         <div>
                           <h3 className="font-bold text-slate-900 leading-tight">{item.id}</h3>
                           <p className="text-xs text-slate-500">{item.category}</p>
                         </div>
                       </div>
                       <span className={clsx("px-2 py-1 rounded text-xs font-semibold", item.status === 'Active' ? 'bg-green-100 text-green-700' : item.status === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700')}>{item.status}</span>
                     </div>
                     <h2 className="text-lg font-semibold text-slate-800 mb-4 line-clamp-2">{item.title}</h2>
                     <div className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">{item.description}</div>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-1 uppercase flex items-center"><DollarSign className="w-3 h-3 mr-1" /> Budget</p>
                           <p className="font-medium text-slate-900">${item.budget.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-1 uppercase flex items-center"><Clock className="w-3 h-3 mr-1" /> Deadline</p>
                           <p className="font-medium text-slate-900">{item.deadline}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="text-xs text-slate-500 font-medium">Bids received: {bids.filter((b: any) => b.rfpId === item.id).length}</div>
                        <div className="text-blue-600 flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform">View Details <ChevronRight className="w-4 h-4 ml-1" /></div>
                     </div>
                  </>
               )}
             </div>
           ))}
         </div>
      )}
    </motion.div>
  );
}

// RfpDetail is now in ./RfpDetail.tsx
// SubmitBidModal is now in ./SubmitBidModal.tsx

const RFP_STEPS = ["Draft", "Published", "Bidding", "Negotiating", "Contract", "Invoicing", "Payment", "Completed"];

function RfpStepper({ rfp, bids }: { rfp: any, bids: any[] }) {
   const getStepIndex = () => {
      if (rfp.status === 'Completed') return 7;
      if (rfp.status === 'Active Contract') return 5;
      if (rfp.status === 'Generating Contract') return 4;
      if (rfp.status === 'Active') {
         if (bids.length > 0) {
            if (bids.some(b => b.status === "Negotiating")) return 3;
            if (bids.some(b => b.status === "Submitted")) return 2;
         }
         return 1; // Published
      }
      return 0; // Draft
   };

   const currentIndex = getStepIndex();

   return (
      <div className="border-t border-slate-100 p-8 pt-12 pb-12 bg-slate-50/50">
         <div className="relative flex items-center justify-between px-4 max-w-4xl mx-auto">
            {/* Background Track */}
            <div className="absolute left-[2%] right-[2%] top-1/2 -translate-y-1/2 h-[2px] bg-slate-200"></div>
            {/* Active Track */}
            <div className="absolute left-[2%] top-1/2 -translate-y-1/2 h-[2px] bg-blue-600 transition-all duration-500 ease-in-out" style={{ width: `${(currentIndex / (RFP_STEPS.length - 1)) * 96}%` }}></div>
            
            {RFP_STEPS.map((step, index) => {
               const isCompleted = index < currentIndex;
               const isCurrent = index === currentIndex;
               return (
                  <div key={step} className="relative z-10 flex flex-col items-center group w-8">
                     <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 bg-white", 
                        isCompleted ? "border-blue-600 text-blue-600" : 
                        isCurrent ? "border-blue-600 bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" : 
                        "border-slate-300 text-slate-400"
                     )}>
                        {isCompleted ? <Check className="w-4 h-4" /> : (index + 1)}
                     </div>
                     <span className={clsx("mt-3 text-[10px] font-bold uppercase tracking-wider absolute top-8 whitespace-nowrap transition-colors duration-300", 
                        isCurrent ? "text-blue-700" : 
                        isCompleted ? "text-slate-600" : 
                        "text-slate-400"
                     )}>
                        {step}
                     </span>
                  </div>
               );
            })}
         </div>
      </div>
   );
}

let globalWorkCounter = 800;
let globalTaskCounter = 1200;

function WorkForm({ contracts, onBack, onSubmit }: { contracts: any[], onBack: () => void, onSubmit: (contractId: string, newWork: any) => void }) {
  const [contractId, setContractId] = useState(contracts[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"service" | "material">("service");
  const [assignedTeam, setAssignedTeam] = useState("Cloud Infrastructure Setup Tier 1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contractId) return;

    const newWork = {
      id: `WRK-${globalWorkCounter++}`,
      title,
      description,
      type,
      status: "In Progress",
      assignedTeam,
      tasks: [
         { id: `T-${globalTaskCounter++}`, title: "Review Contract SLA", status: "todo", assignee: "Unassigned", date: "2026-06-05" },
         { id: `T-${globalTaskCounter++}`, title: "Define milestone stages", status: "todo", assignee: "Unassigned", date: "2026-06-12" }
      ]
    };

    onSubmit(contractId, newWork);
  };

  return (
     <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-sm p-8 rounded-2xl pb-10">
        <div className="flex justify-between items-center mb-6">
           <div>
              <h2 className="text-xl font-bold text-slate-900">Initialize Contract Work</h2>
              <p className="text-xs text-slate-500 mt-1">Bind new deliverables or physical material shipments to established contracts.</p>
           </div>
           <button onClick={onBack} type="button" className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <X className="w-4 h-4" />
           </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
           <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Target Contract *</label>
              <select 
                 value={contractId} 
                 onChange={e => setContractId(e.target.value)}
                 className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                 {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.id} - {c.title} ({c.client})</option>
                 ))}
              </select>
           </div>
           <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Work Title *</label>
              <input 
                 type="text" 
                 value={title} 
                 onChange={e => setTitle(e.target.value)} 
                 placeholder="e.g., Setup database endpoints"
                 required
                 className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
           </div>
           <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Scope Details / Description</label>
              <textarea 
                 value={description} 
                 onChange={e => setDescription(e.target.value)} 
                 placeholder="Short summary of work deliverables or requirements"
                 rows={3}
                 className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Work Classification</label>
                 <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                 >
                    <option value="service" className="bg-white">Service Execution</option>
                    <option value="material" className="bg-white">Material Shipment</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Responsible Team</label>
                 <select 
                    value={assignedTeam} 
                    onChange={e => setAssignedTeam(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                 >
                    <option value="Cloud Infrastructure Setup Tier 1">Cloud Infrastructure Setup Tier 1</option>
                    <option value="Marketing Execution">Marketing Execution</option>
                    <option value="Procurement & Legal">Procurement & Legal</option>
                    <option value="DevOps Squad">DevOps Squad</option>
                    <option value="Warehouse & Receiving">Warehouse & Receiving</option>
                    <option value="Facilities Management">Facilities Management</option>
                 </select>
              </div>
           </div>
           <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onBack} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-bold bg-blue-900 text-white hover:bg-blue-800 rounded-xl shadow-sm transition-colors">Create execution scope</button>
           </div>
        </form>
     </motion.div>
  );
}

function RfpForm({ onBack, onSubmit, company }: { onBack: () => void, onSubmit: (val: any) => void, company?: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [requirementInput, setRequirementInput] = useState("");
  const [constraintInput, setConstraintInput] = useState("");
  const [formData, setFormData] = useState({
    title: '',
    category: 'IT Services',
    budget: '',
    deadline: '',
    expectedDeliveryDate: '',
    description: '',
    evalCriteria: '',
    contactEmail: '',
    workflowType: 'service' as 'material' | 'service' | 'subscription',
    region: '',
    conditions: '',
    requirements: [] as string[],
    constraints: [] as string[],
  });

  const set = (k: string, v: any) => setFormData(f => ({ ...f, [k]: v }));

  const addRequirement = () => {
    if (!requirementInput.trim()) return;
    set("requirements", [...formData.requirements, requirementInput.trim()]);
    setRequirementInput("");
  };
  const addConstraint = () => {
    if (!constraintInput.trim()) return;
    set("constraints", [...formData.constraints, constraintInput.trim()]);
    setConstraintInput("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      budget: parseInt(formData.budget) || 0,
      attachedFiles: attachedFiles.map(f => f.name),
    });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-[860px] mx-auto pb-10">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 mr-4 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create & Publish RFP</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details below. The RFP will be published to the marketplace and a PDF will be generated automatically.</p>
        </div>
      </div>

      {/* Company banner */}
      {company && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{company.name}</p>
            <p className="text-xs text-slate-500">ICE: {company.ice || "—"} · RC: {company.rc || "—"}</p>
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* ── Section 1: Basic Info ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-blue-600" /> RFP Identification
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">RFP Title *</label>
              <input required type="text" placeholder="e.g. Procurement of Cloud Infrastructure Services"
                value={formData.title} onChange={e => set("title", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Category *</label>
              <select value={formData.category} onChange={e => set("category", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm">
                <option>IT Services</option>
                <option>Office Equipment</option>
                <option>Marketing & Communication</option>
                <option>Logistics & Supply Chain</option>
                <option>Construction & Engineering</option>
                <option>Legal & Consulting</option>
                <option>HR & Training</option>
                <option>Security & Surveillance</option>
                <option>Maintenance & Facilities</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Type *</label>
              <select required value={formData.workflowType} onChange={e => set("workflowType", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm">
                <option value="service">Professional Service (one-time)</option>
                <option value="material">Material / Goods Delivery</option>
                <option value="subscription">Recurring Subscription</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Region / Geographic Scope</label>
              <input type="text" placeholder="e.g. Casablanca, Morocco / Global"
                value={formData.region} onChange={e => set("region", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email *</label>
              <input required type="email" placeholder="procurement@company.com"
                value={formData.contactEmail} onChange={e => set("contactEmail", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
          </div>
        </div>

        {/* ── Section 2: Scope & Description ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-blue-600" /> Scope of Work
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description & Problem Statement *</label>
              <textarea required rows={4} placeholder="Describe the business need, current situation, expected outcomes, and scope of work in detail..."
                value={formData.description} onChange={e => set("description", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluation Criteria</label>
              <input type="text" placeholder="e.g. Price 40%, Technical Quality 40%, Delivery Speed 20%"
                value={formData.evalCriteria} onChange={e => set("evalCriteria", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Conditions</label>
              <input type="text" placeholder="e.g. Net 30 upon delivery, 30% upfront / 70% on completion"
                value={formData.conditions} onChange={e => set("conditions", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
          </div>
        </div>

        {/* ── Section 3: Budget & Dates ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-blue-600" /> Budget & Timeline
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Ceiling (MAD) *</label>
              <input required type="number" placeholder="e.g. 500000"
                value={formData.budget} onChange={e => set("budget", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bid Submission Deadline *</label>
              <input required type="date" value={formData.deadline} onChange={e => set("deadline", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
              <input type="date" value={formData.expectedDeliveryDate} onChange={e => set("expectedDeliveryDate", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
          </div>
        </div>

        {/* ── Section 4: Requirements & Constraints ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-blue-600" /> Vendor Requirements & Constraints
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Vendor Requirements</label>
              <div className="flex space-x-2 mb-2">
                <input type="text" value={requirementInput} onChange={e => setRequirementInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRequirement(); }}}
                  placeholder="e.g. ISO 9001 certified"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50" />
                <button type="button" onClick={addRequirement} className="px-3 py-2 bg-blue-900 text-white rounded-lg text-xs hover:bg-blue-800">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {formData.requirements.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-slate-700">{r}</span>
                    <button type="button" onClick={() => set("requirements", formData.requirements.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {formData.requirements.length === 0 && <p className="text-xs text-slate-400 italic">No requirements added yet.</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Constraints & Limitations</label>
              <div className="flex space-x-2 mb-2">
                <input type="text" value={constraintInput} onChange={e => setConstraintInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addConstraint(); }}}
                  placeholder="e.g. Delivery within 30 days"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50" />
                <button type="button" onClick={addConstraint} className="px-3 py-2 bg-blue-900 text-white rounded-lg text-xs hover:bg-blue-800">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {formData.constraints.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-slate-700">{c}</span>
                    <button type="button" onClick={() => set("constraints", formData.constraints.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {formData.constraints.length === 0 && <p className="text-xs text-slate-400 italic">No constraints added yet.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 5: File Attachments ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
            <Paperclip className="w-4 h-4 mr-2 text-blue-600" /> Supporting Documents
          </h2>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
          >
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">Click to attach files</p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX — Technical specs, drawings, existing contracts</p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
          </div>
          {attachedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-slate-700 font-medium">{f.name}</span>
                    <span className="text-xs text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button type="button" onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-3 flex items-center">
            <Download className="w-3 h-3 mr-1" />
            A complete RFP summary PDF will be auto-generated and previewed when you publish.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onBack} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancel</button>
          <button type="submit" className="px-6 py-2.5 rounded-lg font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-sm flex items-center text-sm">
            <CheckCircle className="w-4 h-4 mr-2" /> Publish RFP to Marketplace
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// DocPreviewModal is imported from ./DocPreviewModal.tsx

function ContractDetail({ contract, onBack, onSelectWork }: { contract: any, onBack: () => void, onSelectWork: (work: any) => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const handlePreview = (file: string) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  return (
    <>
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-[1200px] mx-auto pb-10">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contracts
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex justify-between items-start mb-4">
             <div>
                <div className="flex items-center space-x-3 mb-3">
                   <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">{contract.type} Contract</span>
                   <span className={clsx("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider", contract.status === 'Completed' ? 'bg-slate-200 text-slate-700' : 'bg-green-100 text-green-700')}>{contract.status}</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">{contract.title}</h1>
                <p className="text-sm text-slate-500 mt-2 font-medium flex items-center">
                   <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                   {contract.vendor} &harr; {contract.client}
                </p>
             </div>
             <div className="text-right">
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Contract Value</p>
                <p className="text-3xl font-bold text-slate-900">${contract.value.toLocaleString()}</p>
             </div>
          </div>
        </div>
        
        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                 <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase mb-3">Key Dates</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Start Date</p>
                          <p className="font-semibold text-slate-900">{contract.startDate}</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Delivery Target</p>
                          <p className="font-semibold text-slate-900">{contract.deliveryDate}</p>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase mb-3">Contract Terms & Conditions</h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                       <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Payment Terms</span>
                          <span className="font-semibold text-slate-900 text-right">{contract.conditions}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Cancellation Policy</span>
                          <span className="font-semibold text-slate-900">30 days written notice</span>
                       </div>
                       <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Liability Cap</span>
                          <span className="font-semibold text-slate-900">2x Contract Value</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Governing Law</span>
                          <span className="font-semibold text-slate-900">State of California</span>
                       </div>
                    </div>
                 </div>
                 
                 {contract.attachedFiles && contract.attachedFiles.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase mb-3">Attached Documents</h3>
                        <div className="space-y-2">
                           {contract.attachedFiles.map((file: string, idx: number) => (
                              <button key={idx} onClick={() => handlePreview(file)} className="w-full flex items-center justify-between text-left bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all group">
                                 <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                                       <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{file}</span>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                              </button>
                           ))}
                        </div>
                    </div>
                 )}

                 {contract.works && contract.works.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase mb-3">Related Works & Tasks</h3>
                        <div className="space-y-3">
                           {contract.works.map((work: any, idx: number) => (
                              <div key={idx} onClick={() => onSelectWork(work)} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{work.title}</h4>
                                    <p className="text-xs text-slate-500">{work.id} • {work.type === 'service' ? 'Service Task' : 'Material Handling'}</p>
                                  </div>
                                  <span className={clsx(
                                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                    work.status === 'Completed' ? "bg-green-100 text-green-700" :
                                    work.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                                    "bg-slate-100 text-slate-700"
                                  )}>
                                    {work.status}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-3 leading-relaxed">{work.description}</p>
                                <div className="flex items-center text-xs font-medium text-slate-500 border-t border-slate-100 pt-3 mt-3">
                                  <Users className="w-4 h-4 mr-1.5 text-slate-400" />
                                  Assigned to: <span className="ml-1 text-slate-900">{work.assignedTeam}</span>
                                </div>
                              </div>
                           ))}
                        </div>
                    </div>
                 )}
              </div>
              
              <div>
                 <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase mb-3">Progress Timeline</h3>
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="mb-6">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-slate-900">Overall Progress</span>
                          <span className="text-sm font-bold text-blue-600">{Math.round((contract.progress / (contract.steps.length - 1)) * 100)}%</span>
                       </div>
                       <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(contract.progress / (contract.steps.length - 1)) * 100}%` }}></div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       {contract.timeline.map((step: any, idx: number) => {
                          const isCompleted = idx < contract.progress;
                          const isCurrent = idx === contract.progress;
                          return (
                             <div key={idx} className="flex">
                                <div className="flex flex-col items-center mr-6 mt-0.5">
                                   <div className={clsx("w-8 h-8 shrink-0 rounded-full flex items-center justify-center z-10 border-2",
                                      isCompleted ? "bg-blue-600 border-blue-600" :
                                      isCurrent ? "bg-white border-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" :
                                      "bg-white border-slate-200 shadow-sm"
                                   )}>
                                      {isCompleted ? <Check className="w-4 h-4 text-white stroke-[2.5]" /> : 
                                       <div className={clsx("w-2.5 h-2.5 rounded-full", isCurrent ? "bg-blue-600" : "bg-slate-200")} />}
                                   </div>
                                   {idx < contract.timeline.length - 1 && (
                                      <div className={clsx("w-0.5 h-full my-1.5 rounded-full", isCompleted ? "bg-blue-600" : "bg-slate-200")} />
                                   )}
                                </div>
                                <div className="pb-6">
                                   <p className={clsx("text-sm font-bold", isCompleted ? "text-slate-900" : isCurrent ? "text-blue-900" : "text-slate-500")}>{step.label}</p>
                                   <p className="text-xs text-slate-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> {step.date}</p>
                                   {isCurrent && (
                                      <div className="mt-3 px-3 py-2 bg-white border border-blue-100 rounded-lg shadow-sm">
                                         <p className="text-xs text-blue-700 font-medium">Currently working on this phase.</p>
                                      </div>
                                   )}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </motion.div>

    <AnimatePresence>
       {showPreview && previewFile && (
          <DocPreviewModal file={previewFile} context={contract} onClose={() => setShowPreview(false)} />
       )}
    </AnimatePresence>
    </>
  );
}

