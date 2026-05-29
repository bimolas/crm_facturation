"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Loader2,
  Briefcase,
  Mail,
  Lock,
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Handshake,
  CheckCircle,
} from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    ice: "",
    rc: "",
    taxIdentifier: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await register({
        company: {
          name: formData.companyName,
          ice: formData.ice,
          rc: formData.rc,
          taxIdentifier: formData.taxIdentifier,
          email: formData.email,
        },
        user: {
          email: formData.email,
          password: formData.password,
        },
      });
      // Redirect handled by AuthContext
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-white border-r border-slate-200 relative overflow-hidden flex-col justify-between p-10 lg:p-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-slate-900 tracking-tight">Effix</span>
        </div>

        <div className="max-w-md mt-auto">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 leading-tight mb-4">
            The Ultimate B2B Procurement Engine.
          </h1>
          <p className="text-base text-slate-500 mb-10">
            Join companies streamlining their sourcing, bidding, and invoicing workflows in one unified platform.
          </p>

          <div className="space-y-5">
            {[
              { icon: ClipboardList, title: "Smart RFPs & Bidding", desc: "Launch tenders and receive structured bids instantly." },
              { icon: ShieldCheck, title: "Automated Workflows", desc: "Convert winning bids directly into Purchase Orders." },
              { icon: Handshake, title: "B2B Network", desc: "Connect with verified suppliers and clients securely." },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
                  <feature.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          <span>Trusted by 2,500+ companies worldwide</span>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        {/* Back link (mobile) */}
        <Link
          href="/"
          className="absolute top-6 right-6 md:left-auto flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Home
        </Link>

        <div className="w-full max-w-md">
          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-5">
              <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-blue-600" : "bg-slate-200"}`}></div>
              <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-blue-600" : "bg-slate-200"}`}></div>
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-1">
              {step === 1 ? "Company Details" : "Admin Account"}
            </h2>
            <p className="text-sm text-slate-500">
              {step === 1 ? "Tell us about your organization" : "Create the master administrator account"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNext} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Company Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                      placeholder="Acme Corporation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">ICE Number</label>
                    <input
                      type="text"
                      required
                      value={formData.ice}
                      onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                      placeholder="ICE-000000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">RC Number</label>
                    <input
                      type="text"
                      required
                      value={formData.rc}
                      onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                      placeholder="RC-0000"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tax Identifier (IF)</label>
                  <input
                    type="text"
                    required
                    value={formData.taxIdentifier}
                    onChange={(e) => setFormData({ ...formData, taxIdentifier: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                    placeholder="IF-000000"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all text-sm flex items-center justify-center group shadow-sm"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Admin Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Must be at least 8 characters</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-all text-sm shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create Workspace"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
