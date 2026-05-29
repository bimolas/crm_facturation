"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Receipt,
  ClipboardList,
  ShieldCheck,
  Briefcase,
  CheckCircle,
  FileText,
  Star,
  Zap,
  Package,
  Activity,
  Lock,
  Bell,
  Building2,
  Settings,
  Award,
  Database,
  LayoutDashboard,
  Truck,
  Search,
  ArrowUpRight,
  DollarSign,
  Check,
  X,
  Plus,
  Send,
  FileCheck,
  Eye,
  Layers,
  Globe,
  Cpu,
  RefreshCw,
  Mail,
  CreditCard,
  Users,
  TrendingUp,
  MessageCircle,
  ChevronRight,
  Menu,
} from "lucide-react";

// ─── useScrollReveal hook ─────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── AnimatedNumber ───────────────────────────────────────────────────────────
function AnimatedNumber({
  target,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(parseFloat(start.toFixed(decimals)));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, decimals]);
  return (
    <span ref={ref}>
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({
  data,
  color = "#3b82f6",
  height = 40,
  width = 100,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;
  const areaD = `M ${points[0]} L ${points.join(" L ")} L ${width},${height} L 0,${height} Z`;
  const gradId = `sg-${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
function BarChart({
  data,
  visible,
}: {
  data: { label: string; value: number; color: string }[];
  visible?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5 h-full w-full">
      {data.map((bar, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-md transition-all duration-700 ease-out"
            style={{
              height: visible !== false ? `${(bar.value / max) * 100}%` : "0%",
              backgroundColor: bar.color,
              transitionDelay: `${i * 60}ms`,
            }}
          />
          <span className="text-[9px] text-slate-400 font-medium">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
function DonutChart({
  percentage,
  color,
  size = 80,
  visible,
}: {
  percentage: number;
  color: string;
  size?: number;
  visible?: boolean;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((visible !== false ? percentage : 0) / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1.2s ease" }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
        {percentage}%
      </text>
    </svg>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({
  label,
  value,
  color,
  visible,
}: {
  label: string;
  value: number;
  color: string;
  visible: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-800">{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: visible ? `${value}%` : "0%", backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Reveal ───────────────────────────────────────────────────────────────────
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── SCENARIO_STEPS ───────────────────────────────────────────────────────────
const SCENARIO_STEPS = [
  {
    step: "01", tag: "Create Devis", icon: FileText, color: "#3b82f6", route: "devis/new",
    notif: "Devis DEV-2025-0089 created",
    title: "Draft a Quote in Seconds",
    desc: "Select products from your catalog, set quantities and pricing, and generate a professional devis ready to send to your client — all in under 2 minutes.",
    bullets: ["Pick items from your product catalog", "Auto-calculate taxes & totals", "Preview before sending"],
    card: {
      type: "devis", ref: "DEV-2025-0089", client: "TechnoMart SARL", amount: "$12,450.00", status: "Draft",
      items: [
        { name: "Server Rack Unit", qty: 2, price: "$3,200.00" },
        { name: "Network Switch 48P", qty: 1, price: "$4,850.00" },
        { name: "UPS Battery 10kVA", qty: 2, price: "$2,200.00" },
      ],
    },
  },
  {
    step: "02", tag: "Send & Track", icon: Send, color: "#0d9488", route: "devis/DEV-2025-0089",
    notif: "Client opened your devis",
    title: "Send & Get Instant Visibility",
    desc: "Send the devis with one click. Track when the client opens it, views it, and responds. No more chasing emails — you see everything in real time.",
    bullets: ["One-click email delivery", "Real-time open & view tracking", "Instant client response alerts"],
    card: {
      type: "tracking", opened: "2 min ago", viewed: "3 times", status: "Opened", client: "Amine K.",
      timeline: [
        { time: "14:32", event: "Email delivered" },
        { time: "14:34", event: "Opened by Amine K." },
        { time: "14:41", event: "Viewed page 2" },
        { time: "14:55", event: "Viewed again" },
      ],
    },
  },
  {
    step: "03", tag: "Sign Contract", icon: FileCheck, color: "#6366f1", route: "contracts/new",
    notif: "Contract signed by both parties",
    title: "Convert to a Signed Contract",
    desc: "Once the client approves, convert the devis to a legally binding contract with e-signature support. Both parties sign digitally — no printing, no scanning.",
    bullets: ["One-click devis → contract conversion", "Digital e-signature for both parties", "Legally binding PDF generated"],
    card: { type: "contract", ref: "CTR-2025-0089", signed: "Both parties", date: "14 Jul 2025", status: "Signed" },
  },
  {
    step: "04", tag: "Auto Invoice", icon: Receipt, color: "#f59e0b", route: "invoices/INV-2025-0312",
    notif: "Invoice INV-2025-0312 auto-generated",
    title: "Automatic Invoice Generation",
    desc: "When milestones are reached or work is delivered, Effix auto-generates a compliant facture and sends it to the client — zero manual work.",
    bullets: ["Milestone-triggered auto-generation", "Tax-compliant facture format", "Sent automatically to client"],
    card: { type: "invoice", ref: "INV-2025-0312", amount: "$12,450.00", due: "28 Jul 2025", status: "Sent" },
  },
  {
    step: "05", tag: "Get Paid", icon: DollarSign, color: "#10b981", route: "payments",
    notif: "Payment of $12,450 received!",
    title: "Track Payments & Get Paid",
    desc: "Monitor payment status in real time. Send automated reminders for overdue invoices. Reconcile payments instantly when they arrive.",
    bullets: ["Real-time payment status tracking", "Auto-reminders for overdue invoices", "Instant reconciliation on receipt"],
    card: { type: "payment", amount: "$12,450.00", method: "Bank Transfer", date: "22 Jul 2025", status: "Paid" },
  },
];

// ─── WorkspaceContent — animated app screen per step ─────────────────────────
function WorkspaceContent({ step }: { step: number }) {
  const s = SCENARIO_STEPS[step];
  const card = s.card;

  if (card.type === "devis") {
    const c = card as { type: string; ref: string; client: string; amount: string; status: string; items: { name: string; qty: number; price: string }[] };
    return (
      <div className="p-5 h-full overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-slate-800">New Devis</p>
            <p className="text-xs text-slate-400">{c.ref} · {c.client}</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500">Save Draft</button>
            <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><Send className="w-3 h-3" />Send</button>
          </div>
        </div>
        {/* Client info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">TM</div>
          <div><p className="text-xs font-bold text-slate-800">{c.client}</p><p className="text-[10px] text-slate-400">contact@technomart.ma</p></div>
          <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{c.status}</span>
        </div>
        {/* Line items */}
        <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
          <div className="bg-slate-50 grid grid-cols-12 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <span className="col-span-6">Item</span><span className="col-span-2 text-center">Qty</span><span className="col-span-4 text-right">Price</span>
          </div>
          {c.items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 px-3 py-2.5 border-t border-slate-100 items-center">
              <span className="col-span-6 text-xs text-slate-700">{item.name}</span>
              <span className="col-span-2 text-center text-xs text-slate-500">{item.qty}</span>
              <span className="col-span-4 text-right text-xs font-semibold text-slate-800">{item.price}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center bg-blue-900 text-white rounded-xl px-4 py-3">
          <span className="text-xs font-semibold">Total Amount</span>
          <span className="text-lg font-bold">{c.amount}</span>
        </div>
      </div>
    );
  }

  if (card.type === "tracking") {
    const c = card as { type: string; opened: string; viewed: string; status: string; client: string; timeline: { time: string; event: string }[] };
    return (
      <div className="p-5 h-full overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-slate-800">Devis Tracking</p>
          <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />{c.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
            <p className="text-[10px] text-teal-600 font-semibold mb-1">Last Opened</p>
            <p className="text-sm font-bold text-teal-800">{c.opened}</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <p className="text-[10px] text-indigo-600 font-semibold mb-1">Total Views</p>
            <p className="text-sm font-bold text-indigo-800">{c.viewed}</p>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Activity Timeline</p>
        <div className="relative pl-4">
          <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-slate-100" />
          {c.timeline.map((item, i) => (
            <div key={i} className="relative flex items-center gap-3 mb-3">
              <div className="absolute -left-3 w-3 h-3 rounded-full bg-teal-400 border-2 border-white" />
              <span className="text-[10px] text-slate-400 font-mono w-10 shrink-0">{item.time}</span>
              <span className="text-xs text-slate-600">{item.event}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-slate-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Awaiting client response</span>
          <button className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg">Send Reminder</button>
        </div>
      </div>
    );
  }

  if (card.type === "contract") {
    const c = card as { type: string; ref: string; signed: string; date: string; status: string };
    return (
      <div className="p-5 h-full overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-sm font-bold text-slate-800">Contract</p><p className="text-xs text-slate-400">{c.ref}</p></div>
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold"><Check className="w-3 h-3" />{c.status}</span>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-4 text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <FileCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-sm font-bold text-indigo-800">Contract Fully Signed</p>
          <p className="text-xs text-indigo-500 mt-1">Signed on {c.date}</p>
        </div>
        <div className="space-y-2 mb-4">
          {["Effix Platform (Vendor)", "TechnoMart SARL (Client)"].map((party, i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700">{i === 0 ? "EP" : "TM"}</div>
                <span className="text-xs text-slate-600">{party}</span>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600"><Check className="w-3.5 h-3.5" />Signed</span>
            </div>
          ))}
        </div>
        <button className="w-full text-xs bg-indigo-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2">
          <FileText className="w-3.5 h-3.5" />Download Signed PDF
        </button>
      </div>
    );
  }

  if (card.type === "invoice") {
    const c = card as { type: string; ref: string; amount: string; due: string; status: string };
    return (
      <div className="p-5 h-full overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-sm font-bold text-slate-800">Invoice</p><p className="text-xs text-slate-400">{c.ref}</p></div>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">{c.status}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
          <p className="text-[10px] text-amber-600 font-semibold mb-1">Amount Due</p>
          <p className="text-2xl font-bold text-amber-800">{c.amount}</p>
          <p className="text-xs text-amber-500 mt-1">Due {c.due}</p>
        </div>
        <div className="space-y-2 mb-4">
          {[
            { label: "Invoice Number", value: c.ref },
            { label: "Client", value: "TechnoMart SARL" },
            { label: "Contract", value: "CTR-2025-0089" },
            { label: "Payment Terms", value: "Net 14 days" },
          ].map((row, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-[11px] text-slate-400">{row.label}</span>
              <span className="text-[11px] font-semibold text-slate-700">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flex-1 text-xs bg-amber-500 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1"><Send className="w-3 h-3" />Resend</button>
          <button className="flex-1 text-xs border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold">Download PDF</button>
        </div>
      </div>
    );
  }

  // payment
  const c = card as { type: string; amount: string; method: string; date: string; status: string };
  return (
    <div className="p-5 h-full overflow-auto">
      <div className="text-center mb-5">
        <div className="relative w-16 h-16 mx-auto mb-3">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
        </div>
        <p className="text-base font-bold text-slate-900">Payment Received!</p>
        <p className="text-2xl font-bold text-green-600 mt-1">{c.amount}</p>
      </div>
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4 space-y-2">
        {[
          { label: "Method", value: c.method },
          { label: "Date", value: c.date },
          { label: "Invoice", value: "INV-2025-0312" },
          { label: "Status", value: c.status },
        ].map((row, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-xs text-slate-500">{row.label}</span>
            <span className={`text-xs font-bold ${row.label === "Status" ? "text-green-600" : "text-slate-700"}`}>{row.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="flex-1 text-xs bg-green-600 text-white py-2.5 rounded-xl font-semibold">Download Receipt</button>
        <button className="flex-1 text-xs border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold">View Invoice</button>
      </div>
    </div>
  );
}

// ─── ScenarioCard ─────────────────────────────────────────────────────────────
function ScenarioCard({ step }: { step: (typeof SCENARIO_STEPS)[number] }) {
  const card = step.card;

  if (card.type === "devis") {
    const devisCard = card as {
      type: "devis";
      ref: string;
      client: string;
      amount: string;
      status: string;
      items: { name: string; qty: number; price: string }[];
    };
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 font-medium">Devis</p>
            <p className="text-sm font-bold text-slate-800">{devisCard.ref}</p>
          </div>
          <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
            {devisCard.status}
          </span>
        </div>
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-1">Client</p>
          <p className="text-sm font-semibold text-slate-700">{devisCard.client}</p>
        </div>
        <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 text-slate-500 font-medium">Item</th>
                <th className="text-center px-3 py-2 text-slate-500 font-medium">Qty</th>
                <th className="text-right px-3 py-2 text-slate-500 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {devisCard.items.map((item, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{item.name}</td>
                  <td className="px-3 py-2 text-center text-slate-500">{item.qty}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800">{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-lg font-bold text-slate-900">{devisCard.amount}</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            <Send className="w-3.5 h-3.5" />
            Send to Client
          </button>
        </div>
      </div>
    );
  }

  if (card.type === "tracking") {
    const trackCard = card as {
      type: "tracking";
      opened: string;
      viewed: string;
      status: string;
      client: string;
      timeline: { time: string; event: string; icon: string }[];
    };
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-slate-800">Email Tracking</p>
          <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            {trackCard.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-teal-50 rounded-xl p-3">
            <p className="text-xs text-teal-600 font-medium mb-1">Last Opened</p>
            <p className="text-sm font-bold text-teal-800">{trackCard.opened}</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3">
            <p className="text-xs text-indigo-600 font-medium mb-1">Total Views</p>
            <p className="text-sm font-bold text-indigo-800">{trackCard.viewed}</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Activity Timeline</p>
        <div className="space-y-3">
          {trackCard.timeline.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono w-10 shrink-0">{item.time}</span>
              <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <Eye className="w-3 h-3 text-teal-600" />
              </div>
              <span className="text-xs text-slate-600">{item.event}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.type === "contract") {
    const contractCard = card as {
      type: "contract";
      ref: string;
      signed: string;
      date: string;
      status: string;
    };
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 font-medium">Contract</p>
            <p className="text-sm font-bold text-slate-800">{contractCard.ref}</p>
          </div>
          <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" />
            {contractCard.status}
          </span>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 mb-4 text-center">
          <FileCheck className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-indigo-800">Contract Signed</p>
          <p className="text-xs text-indigo-500 mt-1">Signed on {contractCard.date}</p>
        </div>
        <div className="space-y-3">
          {["Effix Platform (Vendor)", "TechnoMart SARL (Client)"].map((party, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-600">{party}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <Check className="w-3.5 h-3.5" />
                Signed
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.type === "invoice") {
    const invoiceCard = card as {
      type: "invoice";
      ref: string;
      amount: string;
      due: string;
      status: string;
    };
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 font-medium">Invoice</p>
            <p className="text-sm font-bold text-slate-800">{invoiceCard.ref}</p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
            {invoiceCard.status}
          </span>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-amber-600 font-medium mb-1">Amount Due</p>
          <p className="text-2xl font-bold text-amber-800">{invoiceCard.amount}</p>
          <p className="text-xs text-amber-500 mt-1">Due {invoiceCard.due}</p>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Payment Progress</span>
            <span className="font-semibold text-slate-700">0%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-amber-400 rounded-full" />
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Send className="w-3.5 h-3.5" />
          Send Reminder
        </button>
      </div>
    );
  }

  // payment
  const paymentCard = card as {
    type: "payment";
    amount: string;
    method: string;
    date: string;
    status: string;
  };
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-md">
      <div className="text-center mb-5">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 relative">
          <Check className="w-8 h-8 text-green-600" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-ping opacity-30" />
        </div>
        <p className="text-lg font-bold text-slate-900">Payment Received!</p>
        <p className="text-2xl font-bold text-green-600 mt-1">{paymentCard.amount}</p>
      </div>
      <div className="space-y-3">
        {[
          { label: "Payment Method", value: paymentCard.method },
          { label: "Date", value: paymentCard.date },
          { label: "Status", value: paymentCard.status },
          { label: "Invoice", value: "INV-2025-0312" },
        ].map((row, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span className="text-xs text-slate-400">{row.label}</span>
            <span className={`text-xs font-semibold ${row.label === "Status" ? "text-green-600" : "text-slate-700"}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {["Download Receipt", "View Invoice"].map((label, i) => (
          <button
            key={i}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
              i === 0
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── StepSection — one full section per workflow step ────────────────────────
function StepSection({
  step,
  index,
  isEven,
}: {
  step: (typeof SCENARIO_STEPS)[number];
  index: number;
  isEven: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const bgColors = ["bg-white", "bg-slate-50", "bg-white", "bg-slate-50", "bg-white"];

  return (
    <div
      ref={ref}
      data-step={index}
      className={`relative py-20 px-6 overflow-hidden ${bgColors[index]}`}
    >
      {/* Subtle step number watermark */}
      <div
        className="absolute right-8 top-1/2 -translate-y-1/2 text-[160px] font-black leading-none select-none pointer-events-none hidden lg:block"
        style={{ color: `${step.color}06` }}
      >
        {step.step}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Step badge */}
        <div
          className="flex items-center gap-2 mb-8 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: step.color }}
          >
            {step.step}
          </div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: `${step.color}12`,
              color: step.color,
              border: `1.5px solid ${step.color}30`,
            }}
          >
            {React.createElement(step.icon, { className: "w-3.5 h-3.5" })}
            {step.tag}
          </div>
          {index < SCENARIO_STEPS.length - 1 && (
            <div className="hidden md:flex items-center gap-1 ml-2 text-xs text-slate-400">
              <div className="w-8 h-0.5 bg-slate-200 rounded" />
              <span>Next: {SCENARIO_STEPS[index + 1].tag}</span>
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${isEven ? "" : "lg:grid-flow-dense"}`}>
          {/* Text side */}
          <div
            className={`transition-all duration-700 delay-100 ${isEven ? "" : "lg:col-start-2"}`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : isEven ? "translateX(-30px)" : "translateX(30px)",
            }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              {step.title}
            </h3>
            <p className="text-slate-500 leading-relaxed mb-8 text-base">
              {step.desc}
            </p>
            <div className="space-y-3 mb-8">
              {step.bullets.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 transition-all duration-500"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(-16px)",
                    transitionDelay: `${200 + i * 100}ms`,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: step.color }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{b}</span>
                </div>
              ))}
            </div>
            {index < SCENARIO_STEPS.length - 1 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-5 h-8 border-2 border-slate-200 rounded-full flex items-start justify-center pt-1.5">
                  <div className="w-1 h-2 rounded-full animate-bounce" style={{ backgroundColor: step.color }} />
                </div>
                <span>Scroll down for the next step</span>
              </div>
            )}
          </div>

          {/* Workspace mockup side */}
          <div
            className={`transition-all duration-700 delay-200 ${isEven ? "" : "lg:col-start-1 lg:row-start-1"}`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
            }}
          >
            <div className="relative">
              {/* Browser chrome */}
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white border border-slate-200 rounded-md px-10 py-1 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                      <Lock className="w-2.5 h-2.5 text-green-500" />
                      app.effix.io/{step.route}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center">
                      <Bell className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-blue-700">AK</span>
                    </div>
                  </div>
                </div>

                {/* App body */}
                <div className="flex" style={{ height: "420px" }}>
                  {/* Sidebar */}
                  <div className="w-40 border-r border-slate-100 bg-slate-50 p-3 flex flex-col gap-0.5 shrink-0">
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <div className="w-5 h-5 bg-blue-900 rounded flex items-center justify-center">
                        <Briefcase className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Effix</span>
                    </div>
                    {[
                      { icon: LayoutDashboard, label: "Dashboard", stepId: -1 },
                      { icon: FileText, label: "Devis", stepId: 0 },
                      { icon: Send, label: "Tracking", stepId: 1 },
                      { icon: FileCheck, label: "Contracts", stepId: 2 },
                      { icon: Receipt, label: "Invoices", stepId: 3 },
                      { icon: DollarSign, label: "Payments", stepId: 4 },
                      { icon: BarChart3, label: "Analytics", stepId: -1 },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium"
                        style={{
                          backgroundColor: item.stepId === index ? `${step.color}15` : "transparent",
                          color: item.stepId === index ? step.color : "#94a3b8",
                          fontWeight: item.stepId === index ? "700" : "500",
                        }}
                      >
                        <item.icon className="w-3 h-3 shrink-0" />
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* Workspace content */}
                  <div className="flex-1 overflow-auto bg-white">
                    <WorkspaceContent step={index} />
                  </div>
                </div>
              </div>

              {/* Floating notification badge */}
              <div
                className="absolute -bottom-4 -right-4 bg-white rounded-xl border border-slate-200 shadow-xl px-3.5 py-2.5 flex items-center gap-2.5 z-20"
                style={{ animation: "floatRight 4s ease-in-out infinite" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  {React.createElement(step.icon, {
                    className: "w-3.5 h-3.5",
                    style: { color: step.color },
                  })}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{step.notif}</p>
                  <p className="text-[10px] text-slate-400">just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main LandingPage component ───────────────────────────────────────────────
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chartVisible, setChartVisible] = useState(false);
  const [heroProgressVisible, setHeroProgressVisible] = useState(false);

  const heroProgressRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const scenarioRef = useRef<HTMLDivElement>(null);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hero entrance
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Chart + progress visibility
  useEffect(() => {
    const pairs: [React.RefObject<HTMLDivElement | null>, (v: boolean) => void][] = [
      [heroProgressRef, setHeroProgressVisible],
      [chartRef, setChartVisible],
    ];
    const observers = pairs.map(([ref, setter]) => {
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setter(true);
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      if (ref.current) obs.observe(ref.current);
      return obs;
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const sparklineData = [28, 35, 30, 45, 38, 52, 48, 60, 55, 70, 65, 80];
  const barChartData = [
    { label: "Jan", value: 42, color: "#3b82f6" },
    { label: "Feb", value: 68, color: "#3b82f6" },
    { label: "Mar", value: 55, color: "#3b82f6" },
    { label: "Apr", value: 82, color: "#0d9488" },
    { label: "May", value: 61, color: "#3b82f6" },
    { label: "Jun", value: 75, color: "#0d9488" },
    { label: "Jul", value: 90, color: "#6366f1" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 overflow-x-hidden font-sans">

      {/* ═══════════════════════════════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrollY > 20 ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: scrollY > 20 ? "1px solid #e2e8f0" : "1px solid transparent",
          boxShadow: scrollY > 20 ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Effix</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it Works", "Security", "Integrations", "Pricing"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              Get Started →
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-6 py-4 flex flex-col gap-3">
            {["Features", "How it Works", "Security", "Integrations", "Pricing"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-slate-600 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link}
              </a>
            ))}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Link href="/login" className="flex-1 text-center text-sm font-medium border border-slate-200 rounded-lg py-2.5">
                Sign In
              </Link>
              <Link href="/register" className="flex-1 text-center text-sm font-semibold bg-blue-900 text-white rounded-lg py-2.5">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-0 lg:pt-36 px-6 overflow-visible">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-50 opacity-60 blur-3xl" />
          <div className="absolute top-20 -left-40 w-[400px] h-[400px] rounded-full bg-teal-50 opacity-50 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-indigo-50 opacity-40 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Hero text */}
          <div
            className="max-w-3xl mx-auto text-center transition-all duration-700"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(24px)",
            }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-blue-700 tracking-widest uppercase">
                The B2B Procurement Platform
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.75rem] font-bold tracking-tight mb-6 leading-[1.12] text-slate-900">
              Manage Your B2B Operations{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-blue-700">More Efficiently</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-100 rounded-sm -z-0 opacity-60" />
              </span>
            </h1>

            <p
              className="max-w-2xl mx-auto text-base md:text-lg text-slate-500 mb-8 leading-relaxed transition-all duration-700 delay-100"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(16px)",
              }}
            >
              From RFPs and vendor bids to purchase orders and automated invoicing — Effix unifies your entire
              procurement lifecycle in one intelligent workspace.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 transition-all duration-700 delay-200"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(16px)",
              }}
            >
              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg group"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-7 py-3.5 rounded-xl border border-slate-200 transition-all shadow-sm hover:shadow-md"
              >
                Watch Demo
                <Activity className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            <div
              className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400 transition-all duration-700 delay-300"
              style={{ opacity: heroVisible ? 1 : 0 }}
            >
              {[
                "No credit card required",
                "14-day free trial",
                "SOC 2 certified",
                "Cancel anytime",
              ].map((badge) => (
                <span key={badge} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div
            ref={heroProgressRef}
            className="relative mt-16 mx-auto"
            style={{ maxWidth: "1100px" }}
          >
            {/* LEFT floating panel */}
            <div
              className="absolute z-20 hidden lg:block"
              style={{ left: "-120px", top: "60px", width: "200px", animation: "floatLeft 4s ease-in-out infinite" }}
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500">Revenue</span>
                  <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <ArrowUpRight className="w-2.5 h-2.5" />+12.4%
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900 mb-2">$35,893</p>
                <Sparkline data={sparklineData} color="#3b82f6" height={40} width={160} />
                <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
              </div>
            </div>

            {/* RIGHT floating panel */}
            <div
              className="absolute z-20 hidden lg:block"
              style={{ right: "-130px", top: "50px", width: "210px", animation: "floatRight 4.5s ease-in-out infinite" }}
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Active Projects</span>
                </div>
                <ProgressBar label="Website Redesign" value={75} color="#6366f1" visible={heroProgressVisible} />
                <ProgressBar label="Mobile App" value={45} color="#0d9488" visible={heroProgressVisible} />
                <ProgressBar label="API Integration" value={90} color="#3b82f6" visible={heroProgressVisible} />
                <p className="text-[10px] text-slate-400 mt-2">3 of 5 projects on track</p>
              </div>
            </div>

            {/* CENTER browser mockup */}
            <div
              className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden transition-all duration-700 delay-400"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
              }}
            >
              {/* Browser chrome */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white px-20 py-1 rounded-md text-xs text-slate-400 font-mono border border-slate-200 flex items-center gap-2">
                    <Lock className="w-2.5 h-2.5 text-green-500" />
                    app.effix.io/dashboard
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                    <Bell className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-blue-700">AK</span>
                  </div>
                </div>
              </div>

              {/* Dashboard body */}
              <div className="flex h-[460px] lg:h-[520px]">
                {/* Sidebar */}
                <div className="w-52 border-r border-slate-100 bg-slate-50 p-4 hidden md:flex flex-col gap-1 shrink-0">
                  <div className="flex items-center gap-2 mb-5 px-2">
                    <div className="w-6 h-6 bg-blue-900 rounded-md flex items-center justify-center">
                      <Briefcase className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Effix</span>
                  </div>
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: ClipboardList, label: "Procurement", active: false },
                    { icon: Receipt, label: "Invoices", active: false },
                    { icon: Truck, label: "Vendors", active: false },
                    { icon: Package, label: "Inventory", active: false },
                    { icon: BarChart3, label: "Analytics", active: false },
                    { icon: Settings, label: "Settings", active: false },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        item.active ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                  ))}
                  <div className="mt-auto pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-teal-700">TM</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-700">TechnoMart</p>
                        <p className="text-[9px] text-slate-400">Pro Plan</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-5 overflow-hidden flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Good morning, Amine 👋</h2>
                      <p className="text-[11px] text-slate-400">Monday, 14 July 2025 · 3 tasks due today</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5">
                        <Search className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">Search...</span>
                      </div>
                      <div className="bg-blue-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Plus className="w-3 h-3" />New RFP
                      </div>
                    </div>
                  </div>

                  {/* KPI cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Total Revenue", value: "$128.4K", change: "+8.2%", up: true, icon: DollarSign },
                      { label: "Active Orders", value: "47", change: "+3", up: true, icon: ClipboardList },
                      { label: "Pending Invoices", value: "12", change: "-2", up: false, icon: Receipt },
                      { label: "Vendors", value: "89", change: "+5", up: true, icon: Building2 },
                    ].map((card, i) => (
                      <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-slate-400 font-medium">{card.label}</span>
                          <card.icon className="w-3 h-3 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">{card.value}</p>
                        <span className={`text-[10px] font-semibold ${card.up ? "text-green-600" : "text-rose-500"}`}>
                          {card.change} this month
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div ref={chartRef} className="grid grid-cols-3 gap-3 flex-1 min-h-0">
                    <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Revenue Overview</p>
                          <p className="text-[10px] text-slate-400">Jan – Jul 2025</p>
                        </div>
                        <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                          +18.4%
                        </span>
                      </div>
                      <div className="flex-1 min-h-0">
                        <BarChart data={barChartData} visible={chartVisible} />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col items-center justify-center">
                      <p className="text-xs font-bold text-slate-800 mb-1">Order Status</p>
                      <p className="text-[10px] text-slate-400 mb-3">Completion rate</p>
                      <DonutChart percentage={72} color="#3b82f6" size={80} visible={chartVisible} />
                      <p className="text-[10px] text-slate-400 mt-2">72% completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM toast */}
            <div
              className="absolute bottom-5 left-1/2 z-30"
              style={{ animation: "floatUp 3s ease-in-out infinite" }}
            >
              <div className="bg-white rounded-xl border border-slate-200 shadow-xl px-4 py-3 flex items-center gap-3 whitespace-nowrap">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Purchase Order Created</p>
                  <p className="text-[10px] text-slate-400">PO-2025-0147 · $8,320.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRUST LOGOS BAND
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-24 border-y border-slate-200 bg-white py-10">
        <Reveal>
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
              Trusted by leading companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { abbr: "TM", name: "TechnoMart", color: "bg-blue-50 text-blue-700 border-blue-100" },
                { abbr: "SC", name: "SupplyChain Pro", color: "bg-teal-50 text-teal-700 border-teal-100" },
                { abbr: "BC", name: "BuildCore", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
                { abbr: "NG", name: "NexaGroup", color: "bg-amber-50 text-amber-700 border-amber-100" },
                { abbr: "MB", name: "Meridian B2B", color: "bg-rose-50 text-rose-700 border-rose-100" },
              ].map((company) => (
                <div
                  key={company.name}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border font-semibold text-sm ${company.color}`}
                >
                  <span className="font-bold text-xs">{company.abbr}</span>
                  {company.name}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          STATS COUNTER BAND
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-[#F8FAFC]">
        <Reveal>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Building2, label: "Active Companies", target: 2500, suffix: "+", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Receipt, label: "Invoices Processed", target: 15000, suffix: "+", color: "text-teal-600", bg: "bg-teal-50" },
              { icon: ShieldCheck, label: "Uptime SLA", target: 98, suffix: "%", color: "text-indigo-600", bg: "bg-indigo-50" },
              { icon: Star, label: "User Rating", target: 4.9, suffix: "/5", color: "text-amber-600", bg: "bg-amber-50", decimals: 1 },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className={`text-3xl font-bold ${stat.color} mb-1`}>
                  <AnimatedNumber target={stat.target} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
                </p>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — SCROLL STEPS
          Each step is a full-viewport section. IntersectionObserver fires when
          the step enters the viewport and updates activeScenario.
      ═══════════════════════════════════════════════════════════════════════ */}
      <div id="how-it-works" ref={scenarioRef}>
        {/* Section header — always visible at top */}
        <div
          className="relative py-16 text-center overflow-hidden"
          style={{
            backgroundImage: "url(/images/group-people-working-out-business-plan-office.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-white/92" />
          <div className="relative z-10">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">
              Your Complete B2B Workflow
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              From creating a quote to getting paid — every step automated and tracked in one place.
            </p>
            {/* Step pills overview */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {SCENARIO_STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const el = scenarioRef.current;
                    if (!el) return;
                    const steps = el.querySelectorAll("[data-step]");
                    if (steps[i]) steps[i].scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border-2 text-xs font-bold transition-all hover:scale-105"
                  style={{
                    borderColor: s.color,
                    backgroundColor: `${s.color}10`,
                    color: s.color,
                  }}
                >
                  {React.createElement(s.icon, { className: "w-3.5 h-3.5" })}
                  {s.step}. {s.tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Individual step sections */}
        {SCENARIO_STEPS.map((s, i) => (
          <StepSection key={i} step={s} index={i} isEven={i % 2 === 0} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECURITY SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="security" className="relative py-24 px-6 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/images/aerial-view-business-team.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-blue-950/92" />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <Reveal className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Left col */}
            <div>
              <span className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3 block">
                Enterprise Grade
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Enterprise Security
              </h2>
              <p className="text-blue-200 text-sm leading-relaxed mb-6">
                Built from the ground up with security-first architecture. Your data is protected by
                industry-leading encryption and compliance standards.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "End-to-End Encryption",
                  "Role-Based Access",
                  "Audit Logs",
                  "SSO / SAML",
                  "Data Residency",
                  "Zero Trust Network",
                ].map((feat) => (
                  <span
                    key={feat}
                    className="text-xs font-medium text-blue-100 border border-blue-700/50 bg-blue-800/40 px-3 py-1.5 rounded-full"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Center col — certification badges */}
            <div className="flex flex-col items-center gap-4">
              {[
                { label: "ISO 27001", sub: "Certified" },
                { label: "SOC 2", sub: "Type II" },
              ].map((cert, i) => (
                <React.Fragment key={cert.label}>
                  <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-2xl">
                    <Award className="w-8 h-8 text-blue-900 mb-1" />
                    <p className="text-xs font-bold text-blue-900">{cert.label}</p>
                    <p className="text-[10px] text-slate-500">{cert.sub}</p>
                  </div>
                  {i === 0 && <div className="w-0.5 h-8 bg-blue-700/50" />}
                </React.Fragment>
              ))}
            </div>

            {/* Right col — stat cards */}
            <div className="flex flex-col gap-4">
              {[
                { icon: Activity, label: "Uptime SLA", value: "99.9%", sub: "Guaranteed availability" },
                { icon: ShieldCheck, label: "Security Breaches", value: "0", sub: "Zero incidents since launch" },
                { icon: Lock, label: "Encryption", value: "256-bit", sub: "AES encryption at rest" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <stat.icon className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURE DEEP DIVE
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-24 px-6 overflow-hidden">
        {/* Subtle tools background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(/images/Tools__templates-03.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-white/96" />
        </div>
        <div className="relative z-10">
        <Reveal>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 block">
                Features
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                Everything You Need to Run B2B Operations
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Effix replaces a stack of disconnected tools with one unified platform built specifically for
                B2B procurement and invoicing workflows.
              </p>
              <ul className="space-y-4">
                {[
                  { title: "Smart RFP Management", desc: "Create, send, and compare vendor bids in one place" },
                  { title: "Automated Invoice Generation", desc: "Trigger invoices from milestones or delivery events" },
                  { title: "Vendor Portal", desc: "Give vendors a dedicated space to submit bids and track orders" },
                  { title: "Real-time Analytics", desc: "Spending dashboards, vendor performance, and cash flow forecasts" },
                  { title: "Compliance & Audit Trail", desc: "Every action logged with timestamps for full traceability" },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — vendor comparison table + floating cards */}
            <div className="relative">
              {/* Vendor comparison table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Vendor Comparison</p>
                  <span className="text-xs text-slate-400">RFP-2025-0044</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Vendor</th>
                      <th className="text-right px-5 py-3 text-slate-500 font-medium">Bid</th>
                      <th className="text-right px-5 py-3 text-slate-500 font-medium">Delivery</th>
                      <th className="text-right px-5 py-3 text-slate-500 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { vendor: "SupplyChain Pro", bid: "$11,200", delivery: "7 days", score: 94, best: true },
                      { vendor: "BuildCore Ltd", bid: "$12,800", delivery: "5 days", score: 88, best: false },
                      { vendor: "NexaGroup", bid: "$10,950", delivery: "10 days", score: 81, best: false },
                      { vendor: "Meridian B2B", bid: "$13,400", delivery: "4 days", score: 79, best: false },
                    ].map((row, i) => (
                      <tr key={i} className={`border-b border-slate-100 last:border-0 ${row.best ? "bg-blue-50/50" : ""}`}>
                        <td className="px-5 py-3 font-medium text-slate-700 flex items-center gap-2">
                          {row.best && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          {row.vendor}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">{row.bid}</td>
                        <td className="px-5 py-3 text-right text-slate-600">{row.delivery}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-bold ${row.best ? "text-blue-700" : "text-slate-600"}`}>
                            {row.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Floating invoice card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl border border-slate-200 shadow-xl p-4 w-44">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Invoice</span>
                </div>
                <p className="text-lg font-bold text-slate-900">$11,200</p>
                <p className="text-[10px] text-slate-400">Auto-generated</p>
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                  Sent ✓
                </span>
              </div>

              {/* Floating vendor profile card */}
              <div className="absolute -top-6 -right-6 bg-white rounded-xl border border-slate-200 shadow-xl p-4 w-48">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-700">SC</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">SupplyChain Pro</p>
                    <p className="text-[10px] text-slate-400">Preferred Vendor</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-[10px] text-slate-500 ml-1">4.9</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          INVENTORY / MANAGE SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(/images/group-business-talking-meeting.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-white/95" />
        </div>

        <Reveal className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — feature cards */}
            <div className="space-y-4">
              {[
                {
                  icon: ClipboardList,
                  color: "bg-blue-50 text-blue-700",
                  title: "Procurement Automation",
                  desc: "Automate purchase orders, approvals, and vendor communications with smart workflows.",
                },
                {
                  icon: Receipt,
                  color: "bg-teal-50 text-teal-700",
                  title: "Invoicing & Payments",
                  desc: "Generate compliant invoices, track payment status, and reconcile accounts automatically.",
                },
                {
                  icon: BarChart3,
                  color: "bg-indigo-50 text-indigo-700",
                  title: "Analytics & Reporting",
                  desc: "Real-time dashboards for spend analysis, vendor performance, and cash flow forecasting.",
                },
              ].map((card) => (
                <div key={card.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-1">{card.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}

              {/* Integration logos */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-400 mb-3">Integrates with</p>
                <div className="flex flex-wrap gap-2">
                  {["SAP", "QuickBooks", "Xero", "Salesforce", "Slack", "NetSuite"].map((tool) => (
                    <span key={tool} className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — text + stat boxes */}
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 block">
                Manage Everything
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                One Platform for Your Entire Supply Chain
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Stop juggling spreadsheets, email threads, and disconnected tools. Effix gives you a single
                source of truth for procurement, invoicing, and vendor management.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "60%", label: "Faster procurement cycles", color: "text-blue-700" },
                  { value: "3x", label: "More vendor bids received", color: "text-teal-700" },
                  { value: "40%", label: "Reduction in invoice errors", color: "text-indigo-700" },
                  { value: "2hrs", label: "Saved per invoice processed", color: "text-amber-700" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                    <p className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          INTEGRATIONS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="integrations" className="py-24 px-6 bg-white">
        <Reveal>
          <div className="max-w-5xl mx-auto text-center mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 block">
              Integrations
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Connects to Your Existing Stack
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Effix integrates with the tools your team already uses — no rip-and-replace required.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Integration icons */}
            <div className="flex flex-wrap justify-center gap-6 mb-16">
              {[
                { label: "SAP", color: "bg-blue-100 text-blue-700", icon: Database },
                { label: "Salesforce", color: "bg-sky-100 text-sky-700", icon: Globe },
                { label: "QuickBooks", color: "bg-green-100 text-green-700", icon: Receipt },
                { label: "Slack", color: "bg-purple-100 text-purple-700", icon: MessageCircle },
                { label: "Xero", color: "bg-teal-100 text-teal-700", icon: TrendingUp },
                { label: "NetSuite", color: "bg-amber-100 text-amber-700", icon: Cpu },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-white ${item.color}`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>

            {/* How it works cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  icon: Zap,
                  title: "Connect in Minutes",
                  desc: "OAuth-based integrations with one-click setup. No developer required.",
                  color: "bg-blue-600",
                },
                {
                  step: "2",
                  icon: RefreshCw,
                  title: "Sync Automatically",
                  desc: "Data flows bidirectionally in real time. Always in sync, always accurate.",
                  color: "bg-teal-600",
                },
                {
                  step: "3",
                  icon: CheckCircle,
                  title: "Work Seamlessly",
                  desc: "Your team works in Effix while data syncs to your existing systems automatically.",
                  color: "bg-indigo-600",
                },
              ].map((card) => (
                <div key={card.step} className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
                  <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-2">{card.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TESTIMONIAL + SIGNUP
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <Reveal>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left — testimonials */}
            <div>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-6">
                &ldquo;Effix cut our procurement cycle from 3 weeks to 4 days. The automated invoicing alone
                saves us 20 hours a month.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-700">SK</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Sarah Khoury</p>
                  <p className="text-xs text-slate-500">Head of Procurement, TechnoMart SARL</p>
                </div>
              </div>

              {/* Mini testimonials */}
              <div className="space-y-4">
                {[
                  {
                    initials: "MR",
                    name: "Mohamed Rachid",
                    role: "CFO, BuildCore Ltd",
                    quote: "The vendor comparison feature is a game-changer for our sourcing team.",
                    color: "bg-teal-100 text-teal-700",
                  },
                  {
                    initials: "LB",
                    name: "Laura Benali",
                    role: "Operations Director, NexaGroup",
                    quote: "Finally, one platform that handles everything from RFP to payment.",
                    color: "bg-indigo-100 text-indigo-700",
                  },
                ].map((t) => (
                  <div key={t.name} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.color}`}>
                      <span className="text-xs font-bold">{t.initials}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 italic mb-1">&ldquo;{t.quote}&rdquo;</p>
                      <p className="text-xs font-semibold text-slate-700">{t.name}</p>
                      <p className="text-[10px] text-slate-400">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — signup card */}
            <div className="bg-blue-950 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-2">Get Started Free</h3>
              <p className="text-blue-300 text-sm mb-8">
                14-day free trial. No credit card required. Cancel anytime.
              </p>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1.5">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      className="w-full bg-blue-900/50 border border-blue-700/50 text-white placeholder-blue-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1.5">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <input
                      type="text"
                      placeholder="Your company"
                      className="w-full bg-blue-900/50 border border-blue-700/50 text-white placeholder-blue-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1.5">Team Size</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <select className="w-full bg-blue-900/50 border border-blue-700/50 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors appearance-none">
                      <option value="" className="bg-blue-950">Select team size</option>
                      <option value="1-10" className="bg-blue-950">1–10 employees</option>
                      <option value="11-50" className="bg-blue-950">11–50 employees</option>
                      <option value="51-200" className="bg-blue-950">51–200 employees</option>
                      <option value="200+" className="bg-blue-950">200+ employees</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-slate-100 text-blue-900 font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group mt-2"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
              <p className="text-center text-xs text-blue-400 mt-4">
                By signing up, you agree to our{" "}
                <a href="#" className="underline hover:text-blue-200">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="underline hover:text-blue-200">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Effix</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                The B2B procurement platform that unifies your entire operations lifecycle.
              </p>
              <div className="flex gap-3">
                {[Globe, Mail, MessageCircle].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {[
              {
                title: "Resources",
                links: ["Documentation", "API Reference", "Changelog", "Status Page", "Blog"],
              },
              {
                title: "Features",
                links: ["Procurement", "Invoicing", "Vendor Portal", "Analytics", "Integrations"],
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Security"],
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Press Kit", "Contact", "Partners"],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs font-bold text-white uppercase tracking-widest mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Effix Technologies. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-500">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════════
          KEYFRAME ANIMATIONS
      ═══════════════════════════════════════════════════════════════════════ */}
      <style jsx>{`
        @keyframes floatLeft {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes floatRight {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
