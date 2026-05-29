"use client";
import { CheckCircle, TrendingUp, Users, FileText } from "lucide-react";

export function DashboardWindow({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${className}`} style={style}>
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        </div>
        <div className="mx-auto bg-white px-8 py-1 rounded text-[10px] text-slate-400 border border-slate-200">effix.app/dashboard</div>
      </div>
      <div className="flex h-[320px]">
        <div className="w-44 border-r border-slate-100 bg-[#F8FAFC] p-3 hidden sm:block">
          <div className="flex items-center gap-2 mb-4"><div className="w-5 h-5 bg-blue-900 rounded-full" /><div className="h-2.5 bg-slate-300 rounded w-10" /></div>
          {[1,2,3,4,5].map(i=><div key={i} className={`h-2 rounded w-full mb-2 ${i===2?'bg-blue-100 border-l-2 border-blue-600':'bg-slate-200'}`}/>)}
        </div>
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              {icon:FileText,color:"blue",label:"Invoices",val:"11/15"},
              {icon:TrendingUp,color:"teal",label:"Leads",val:"08/50"},
              {icon:Users,color:"indigo",label:"Projects",val:"05"},
              {icon:CheckCircle,color:"rose",label:"Tasks",val:"48/64"},
            ].map((c,i)=>(
              <div key={i} className={`rounded-lg p-2.5 bg-${c.color}-50 border border-${c.color}-100 flex items-center gap-2`}>
                <c.icon className={`w-4 h-4 text-${c.color}-600`}/>
                <div><p className="text-[9px] text-slate-400">{c.label}</p><p className="text-xs font-bold text-slate-900">{c.val}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 h-36">
            <div className="h-2.5 bg-slate-200 rounded w-20 mb-3"/>
            <div className="flex items-end justify-around h-20 px-1">
              {[40,65,35,80,55,70,45].map((h,i)=>(
                <div key={i} className="flex gap-0.5">
                  <div className="w-3 rounded-t bg-blue-200" style={{height:`${h*0.6}px`}}/>
                  <div className="w-3 rounded-t bg-teal-400" style={{height:`${h*0.4}px`}}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, change, color = "blue" }: { label: string; value: string; change: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className={`text-xs text-${color}-600 mt-1 flex items-center gap-1`}>
        <TrendingUp className="w-3 h-3"/>{change}
      </p>
    </div>
  );
}

export function ChartCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div><p className="text-sm font-semibold text-slate-900">Revenue Overview</p><p className="text-xs text-slate-400">Monthly performance</p></div>
        <div className="text-lg font-bold text-slate-900">$35,893.00</div>
      </div>
      <div className="flex items-end justify-around h-28">
        {[30,55,40,70,50,85,60,45,75,55,65,80].map((h,i)=>(
          <div key={i} className="flex flex-col items-center">
            <div className="w-4 rounded-t bg-gradient-to-t from-blue-600 to-blue-400" style={{height:`${h}px`}}/>
            <span className="text-[8px] text-slate-400 mt-1">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-lg ${className}`}>
      <p className="text-sm font-semibold text-slate-900 mb-4">Active Projects</p>
      {[
        {name:"Website Redesign",pct:75,color:"bg-blue-600"},
        {name:"Mobile App",pct:45,color:"bg-teal-500"},
        {name:"API Integration",pct:90,color:"bg-indigo-600"},
      ].map((p,i)=>(
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex justify-between text-xs mb-1"><span className="text-slate-700 font-medium">{p.name}</span><span className="text-slate-400">{p.pct}%</span></div>
          <div className="h-1.5 bg-slate-100 rounded-full"><div className={`h-full rounded-full ${p.color}`} style={{width:`${p.pct}%`}}/></div>
        </div>
      ))}
    </div>
  );
}

export function NotifCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-lg w-60">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-green-600"/>
        </div>
        <div><div className="text-xs font-semibold text-slate-900">Purchase Order Created</div><div className="text-[10px] text-slate-400">VendorCorp accepted Bid #402</div></div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full w-full animate-pulse"/></div>
    </div>
  );
}
