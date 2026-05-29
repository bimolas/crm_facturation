"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FolderKanban, Plus, Search, Filter, ArrowLeft, Tag, Layers, 
  CheckCircle, Calculator, Box, Download, MoreVertical, Edit2, Archive
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "../../utils/api";

export function ArticlesView() {
  const [activeTab, setActiveTab] = useState<"articles" | "categories">("articles");
  const [viewState, setViewState] = useState<"list" | "detail" | "create">("list");
   const [articles, setArticles] = useState<any[]>([]);
   const [categories, setCategories] = useState<any[]>([]);
  
  // Handlers for Articles
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTva, setFilterTva] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");

   useEffect(() => {
      let cancelled = false;

      Promise.all([api.get("/articles"), api.get("/categories")])
         .then(([articlesData, categoriesData]) => {
            if (cancelled) return;

            const mappedCategories = Array.isArray(categoriesData)
               ? categoriesData.map((category: any) => ({
                     id: category.id,
                     name: category.name,
                     tva: Number(category.tvaRate ?? 0),
                     itemsCount: 0,
                  }))
               : [];
            const categoryById = new Map(mappedCategories.map((category) => [String(category.id), category]));

            const mappedArticles = Array.isArray(articlesData)
               ? articlesData.map((article: any) => {
                     const categoryId = article.category?.id ?? article.categoryId ?? null;
                     const category = categoryId != null ? categoryById.get(String(categoryId)) : null;

                     return {
                        id: article.id,
                        name: article.name,
                        ref: article.reference,
                        priceHT: Number(article.unitPriceHT ?? 0),
                        categoryId,
                        categoryName: article.category?.name ?? category?.name ?? "Uncategorized",
                        tva: Number(article.category?.tvaRate ?? category?.tva ?? 0),
                     };
                  })
               : [];

            const usageByCategory = new Map<string, number>();
            mappedArticles.forEach((article) => {
               if (article.categoryId == null) return;
               const key = String(article.categoryId);
               usageByCategory.set(key, (usageByCategory.get(key) ?? 0) + 1);
            });

            setCategories(mappedCategories.map((category) => ({
               ...category,
               itemsCount: usageByCategory.get(String(category.id)) ?? 0,
            })));
            setArticles(mappedArticles);
         })
         .catch(() => {
            if (!cancelled) {
               setCategories([]);
               setArticles([]);
            }
         });

      return () => {
         cancelled = true;
      };
   }, []);

  const filteredArticles = useMemo(() => {
       return articles.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              a.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              a.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory ? a.categoryId.toString() === filterCategory : true;
        const matchesTva = filterTva ? a.tva.toString() === filterTva : true;
        const matchesPrice = filterMaxPrice ? a.priceHT <= parseFloat(filterMaxPrice) : true;
        return matchesSearch && matchesCategory && matchesTva && matchesPrice;
     });
   }, [searchQuery, filterCategory, filterTva, filterMaxPrice, articles]);

  const filteredCategories = useMemo(() => {
       return categories.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTva = filterTva ? c.tva.toString() === filterTva : true;
        return matchesSearch && matchesTva;
     });
   }, [searchQuery, filterTva, categories]);

  // derive unique TVA values
   const uniqueTvas = useMemo(() => Array.from(new Set(categories.map(c => c.tva))), [categories]);

  if (viewState === "create") {
     return (
       <ArticleForm
         onBack={() => setViewState("list")}
             categories={categories}
         isCategoryMode={activeTab === "categories"}
         onCreated={(created: any) => {
            if (created?.kind === "category") {
               setCategories((prev) => [
                  {
                     id: created.id,
                     name: created.name,
                     tva: Number(created.tvaRate ?? created.tva ?? 0),
                     itemsCount: 0,
                  },
                  ...prev,
               ]);
            } else {
               const createdArticle = {
                  id: created.id,
                  name: created.name,
                  ref: created.reference,
                  priceHT: Number(created.unitPriceHT ?? 0),
                  categoryId: created.category?.id ?? created.categoryId ?? null,
                  categoryName: created.category?.name ?? "Uncategorized",
                  tva: Number(created.category?.tvaRate ?? 0),
               };

               setArticles((prev) => [createdArticle, ...prev]);
               setCategories((prev) => prev.map((category) => (
                  String(category.id) === String(createdArticle.categoryId)
                     ? { ...category, itemsCount: (category.itemsCount ?? 0) + 1 }
                     : category
               )));
            }
            setViewState("list");
         }}
       />
     );
  }
  
  if (viewState === "detail" && selectedArticle) {
     return <ArticleDetail article={selectedArticle} onBack={() => { setViewState("list"); setSelectedArticle(null); }} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-[1600px] mx-auto pb-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products & Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your centralized catalog of articles, items, and tax categories.</p>
        </div>
        <button 
          onClick={() => setViewState("create")}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === "articles" ? "New Product" : "New Category"}
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
           onClick={() => setActiveTab("articles")}
           className={clsx(
              "flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors",
              activeTab === "articles" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
           )}
        >
           <Box className="w-4 h-4 mr-2" /> Articles Directory
        </button>
        <button 
           onClick={() => setActiveTab("categories")}
           className={clsx(
              "flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors",
              activeTab === "categories" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
           )}
        >
           <Layers className="w-4 h-4 mr-2" /> Categories & Tax
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-600 font-medium flex items-center hover:bg-slate-50">
                 <Download className="w-4 h-4 mr-2" /> Export
              </button>
            </div>
            <div className="flex items-center space-x-3 w-full max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={clsx("px-3 py-1.5 border border-slate-200 rounded text-sm font-medium flex items-center transition-colors", showFilters ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600 hover:bg-slate-50 bg-white")}>
                 <Filter className="w-4 h-4 mr-2" /> Advanced filters
              </button>
            </div>
          </div>
          {showFilters && (
             <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                {activeTab === "articles" && (
                   <>
                      <div>
                         <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                         <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-slate-700 mb-1">Max Price (HT)</label>
                         <input type="number" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} placeholder="e.g. 500" className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                      </div>
                   </>
                )}
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1">TVA Rate (%)</label>
                   <select value={filterTva} onChange={(e) => setFilterTva(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                      <option value="">All Rates</option>
                      {uniqueTvas.map((tva: any) => <option key={tva} value={tva}>{tva}%</option>)}
                   </select>
                </div>
             </div>
          )}
        </div>

        {activeTab === "articles" ? (
           <table className="w-full text-sm text-left">
             <thead className="bg-[#f8fafc] text-slate-500 font-medium border-b border-slate-200">
               <tr>
                 <th className="px-6 py-3">Product Name & Ref</th>
                 <th className="px-6 py-3">Category</th>
                 <th className="px-6 py-3 text-right">Unit Price (HT)</th>
                 <th className="px-6 py-3 text-center">TVA</th>
                 <th className="px-6 py-3 text-right">Price (TTC)</th>
                 <th className="px-6 py-3 relative"><span className="sr-only">Actions</span></th>
               </tr>
             </thead>
             <tbody>
               {filteredArticles.map((article) => {
                  const ttc = article.priceHT * (1 + article.tva / 100);
                  return (
                    <tr 
                      key={article.id} 
                      onClick={() => { setSelectedArticle(article); setViewState("detail"); }}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 mr-3 flex items-center justify-center shrink-0">
                             <Box className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                             <span className="font-bold text-slate-900 block leading-tight">{article.name}</span>
                             <span className="text-xs text-slate-400 font-mono mt-0.5">{article.ref}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold">
                            <Tag className="w-3 h-3 mr-1" /> {article.categoryName}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                         ${article.priceHT.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-xs font-medium text-slate-500">{article.tva}%</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-900">
                         ${ttc.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  )
               })}
               {filteredArticles.length === 0 && (
                  <tr>
                     <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No articles found matching your search.</td>
                  </tr>
               )}
             </tbody>
           </table>
        ) : (
           <table className="w-full text-sm text-left">
             <thead className="bg-[#f8fafc] text-slate-500 font-medium border-b border-slate-200">
               <tr>
                 <th className="px-6 py-3">Category Name</th>
                 <th className="px-6 py-3 text-center">TVA Rate</th>
                 <th className="px-6 py-3 text-center">Linked Items</th>
                 <th className="px-6 py-3 relative"><span className="sr-only">Actions</span></th>
               </tr>
             </thead>
             <tbody>
               {filteredCategories.map((cat) => (
                 <tr key={cat.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                   <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-teal-600" />
                         </div>
                         <span className="font-bold text-slate-900">{cat.name}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-sm">
                         {cat.tva}%
                      </span>
                   </td>
                   <td className="px-6 py-4 text-center text-slate-500 font-medium">
                      {cat.itemsCount} Articles
                   </td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                         <button className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors">
                            <Archive className="w-4 h-4" />
                         </button>
                      </div>
                   </td>
                 </tr>
               ))}
               {filteredCategories.length === 0 && (
                  <tr>
                     <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No categories found matching your search.</td>
                  </tr>
               )}
             </tbody>
           </table>
        )}
      </div>
    </motion.div>
  );
}


function ArticleDetail({ article, onBack }: { article: any, onBack: () => void }) {
  const ttc = article.priceHT * (1 + article.tva / 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-[1000px] mx-auto pb-10"
    >
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-8 flex items-start justify-between bg-gradient-to-r from-[#F8FAFC] to-white">
          <div className="flex flex-col">
             <div className="flex items-center space-x-3 mb-3">
                <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold tracking-wider uppercase flex items-center">
                   <Tag className="w-3 h-3 mr-1" /> {article.categoryName}
                </span>
             </div>
             <h1 className="text-3xl font-bold text-slate-900 mb-2">{article.name}</h1>
             <div className="flex items-center text-slate-500 font-mono text-sm bg-slate-100 px-2 py-1 rounded w-max">
                REF: {article.ref}
             </div>
          </div>
          <div className="w-32 h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
             <Box className="w-12 h-12 text-slate-300" />
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-slate-200 divide-x divide-slate-200">
           <div className="p-6 text-center bg-[#f8fafc]/50">
              <p className="text-xs font-semibold text-slate-400 tracking-wider mb-1">UNIT PRICE (HT)</p>
              <p className="text-2xl font-bold text-slate-900">${article.priceHT.toFixed(2)}</p>
           </div>
           <div className="p-6 text-center bg-[#f8fafc]/50">
              <p className="text-xs font-semibold text-slate-400 tracking-wider mb-1">TVA (TAX)</p>
              <p className="text-2xl font-bold text-slate-900">{article.tva}%</p>
           </div>
           <div className="p-6 text-center bg-blue-50/30">
              <p className="text-xs font-semibold text-slate-400 tracking-wider mb-1 text-blue-600">FINAL PRICE (TTC)</p>
              <p className="text-3xl font-bold text-blue-900">${ttc.toFixed(2)}</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}


function ArticleForm({ onBack, onCreated, categories, isCategoryMode }: { onBack: () => void, onCreated: (created: any) => void, categories: any[], isCategoryMode: boolean }) {
   const [name, setName] = useState("");
   const [reference, setReference] = useState("");
   const [unitPriceHT, setUnitPriceHT] = useState("");
   const [categoryId, setCategoryId] = useState("");
   const [categoryName, setCategoryName] = useState("");
   const [tvaRate, setTvaRate] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState("");

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      try {
         setIsSubmitting(true);
         if (isCategoryMode) {
            if (!categoryName.trim()) throw new Error("Category name is required");
            const created = await api.post("/categories", {
               name: categoryName.trim(),
               tvaRate: Number(tvaRate || 0),
            });
            onCreated({ ...created, kind: "category" });
            return;
         }

         if (!name.trim()) throw new Error("Article name is required");
         if (!reference.trim()) throw new Error("Reference code is required");
         if (!categoryId) throw new Error("Category is required");
         if (unitPriceHT === "" || Number.isNaN(Number(unitPriceHT))) throw new Error("Unit price is required");

         const created = await api.post("/articles", {
            name: name.trim(),
            reference: reference.trim().toUpperCase(),
            unitPriceHT: Number(unitPriceHT),
            categoryId: Number(categoryId),
         });
         onCreated(created);
      } catch (submitError: any) {
         setError(submitError?.message || "Failed to save");
      } finally {
         setIsSubmitting(false);
      }
   };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end"
    >
      <motion.div 
         initial={{ x: '100%' }}
         animate={{ x: 0 }}
         exit={{ x: '100%' }}
         transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col"
      >
         <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div>
               <h2 className="text-xl font-bold text-slate-900">
                 {isCategoryMode ? "Add Category" : "Add Product Article"}
               </h2>
               <p className="text-sm text-slate-500">
                 {isCategoryMode ? "Define a new product grouping and its standard tax rate." : "Add a new item to your operational catalog."}
               </p>
            </div>
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
               <span className="sr-only">Close</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
         </div>

         <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
            <form className="space-y-6" onSubmit={handleSubmit}>
               {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                     {error}
                  </div>
               )}
               
               {isCategoryMode ? (
                 <section className="space-y-5">
                    <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category Name</label>
                       <input type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Graphic Design Services" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                          TVA Rate (%) <Calculator className="w-4 h-4 ml-2 text-slate-400" />
                       </label>
                       <div className="relative">
                          <input type="number" value={tvaRate} onChange={(e) => setTvaRate(e.target.value)} placeholder="20" className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white font-mono" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                       </div>
                    </div>
                 </section>
               ) : (
                 <section className="space-y-5">
                    <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1.5">Article Name / Title</label>
                       <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ergonomic Office Chair" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reference Code</label>
                          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="SKU-100" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white font-mono text-sm uppercase" />
                       </div>
                       <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Unit Price (HT)</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                             <input type="number" step="0.01" value={unitPriceHT} onChange={(e) => setUnitPriceHT(e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white font-mono" />
                          </div>
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned Category</label>
                       <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white">
                          <option value="">Select a category...</option>
                          {categories.map((category) => (
                             <option key={category.id} value={category.id}>{category.name} ({category.tva}% TVA)</option>
                          ))}
                       </select>
                    </div>
                 </section>
               )}
               
               <button type="submit" id="submit-article-form" className="hidden">Submit</button>
            </form>
         </div>

         <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
            <button onClick={onBack} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors">
               Cancel
            </button>
            <button 
               type="button"
               onClick={() => document.getElementById('submit-article-form')?.click()}
               disabled={isSubmitting}
               className="px-5 py-2.5 text-sm font-medium bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center disabled:opacity-60"
            >
               <CheckCircle className="w-4 h-4 mr-2" />
               {isSubmitting ? "Saving..." : `Save ${isCategoryMode ? "Category" : "Article"}`}
            </button>
         </div>
      </motion.div>
    </motion.div>
  );
}
