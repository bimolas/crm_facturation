"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Filter, Package, AlertCircle, TrendingUp, TrendingDown, MoreHorizontal, ArrowUpRight, CheckCircle, ArrowLeft, Box, Tag, MapPin, Barcode, Save } from "lucide-react";
import { clsx } from "clsx";
import { api } from "../../utils/api";

export function InventoryView() {
  const [items, setItems] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewState, setViewState] = useState<"list" | "detail" | "add">("list");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.get("/inventory"), api.get("/articles")])
      .then(([inventoryData, articlesData]) => {
        if (cancelled) return;

        const mappedCatalog = Array.isArray(articlesData)
          ? articlesData.map((article: any) => ({
              id: String(article.id),
              name: article.name,
              ref: article.reference,
              price: Number(article.unitPriceHT ?? 0),
            }))
          : [];

        const mappedItems = Array.isArray(inventoryData)
          ? inventoryData.map((item: any) => {
              const stock = Number(item.availableStock ?? 0);
              return {
                id: item.id,
                name: item.description || item.stockKeepingUnit,
                sku: item.stockKeepingUnit,
                category: item.category?.name || item.vendorCompany?.name || "Inventory item",
                stock,
                minStock: 0,
                price: Number(item.baseUnitCost ?? 0),
                location: item.description || item.vendorCompany?.name || "Inventory item",
                status: stock <= 0 ? "Out of Stock" : "In Stock",
              };
            })
          : [];

        setCatalog(mappedCatalog);
        setItems(mappedItems);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog([]);
          setItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Stats
  const totalItems = items.length;
  const lowStock = items.filter(i => i.status === "Low Stock" || i.status === "Out of Stock").length;
  const totalValue = items.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (viewState === "add") {
    return (
      <InventoryAddForm
        onBack={() => setViewState("list")}
        productCatalog={catalog}
        onCreated={(created: any) => {
          setItems((prev) => [
            {
              id: created.id,
              name: created.description || created.stockKeepingUnit,
              sku: created.stockKeepingUnit,
              category: created.vendorCompany?.name || "Inventory item",
              stock: Number(created.availableStock ?? 0),
              minStock: 0,
              price: Number(created.baseUnitCost ?? 0),
              location: created.description || created.vendorCompany?.name || "Assigned vendor",
              status: Number(created.availableStock ?? 0) <= 0 ? "Out of Stock" : "In Stock",
            },
            ...prev,
          ]);
          setViewState("list");
        }}
      />
    );
  }

  if (viewState === "detail" && selectedItem) {
    return <InventoryDetailView item={selectedItem} onBack={() => { setViewState("list"); setSelectedItem(null); }} />;
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Track and manage your goods, materials, and equipment.</p>
        </div>
        <button 
          onClick={() => setViewState("add")}
          className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Items</p>
            <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Package className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Attention Required</p>
            <p className="text-3xl font-bold text-slate-900">{lowStock}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Value (Asset)</p>
            <p className="text-3xl font-bold text-slate-900">${totalValue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <button className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => (
                <tr 
                  key={item.id} 
                  onClick={() => { setSelectedItem(item); setViewState("detail"); }}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.location}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={clsx(
                      "font-semibold",
                      item.stock <= 0 ? "text-red-600" : "text-slate-900"
                    )}>{item.stock}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wider",
                      item.status === 'In Stock' ? "bg-green-100 text-green-700" : 
                      item.status === 'Low Stock' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">${item.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No inventory records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InventoryAddForm({ onBack, onCreated, productCatalog }: { onBack: () => void; onCreated: (created: any) => void; productCatalog: any[] }) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [stock, setStock] = useState("");
  const [baseUnitCost, setBaseUnitCost] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = productCatalog.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (selectedProduct) {
      setBaseUnitCost(String(selectedProduct.price ?? ""));
    }
  }, [selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (!selectedProduct) throw new Error("Please select a product from the catalog");
      if (stock === "" || Number.isNaN(Number(stock))) throw new Error("Initial stock is required");
      if (baseUnitCost === "" || Number.isNaN(Number(baseUnitCost))) throw new Error("Base unit cost is required");

      setIsSubmitting(true);
      const created = await api.post("/inventory", {
        stockKeepingUnit: selectedProduct.ref,
        description: description.trim() || selectedProduct.name,
        availableStock: Number(stock),
        baseUnitCost: Number(baseUnitCost),
      });

      onCreated(created);
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to save inventory item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-[700px] mx-auto pb-10"
    >
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-200 bg-[#F8FAFC]">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Initialize Inventory Item</h1>
          <p className="text-sm text-slate-500">Pick a product from your master catalog to track its stock.</p>
        </div>

        <form className="p-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
               <Box className="w-4 h-4 mr-2 text-slate-400"/>
               Select Product from Catalog
            </label>
            <select 
              value={selectedProductId} 
              onChange={(e) => setSelectedProductId(e.target.value)} 
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-white"
            >
              <option value="">-- Choose a Product --</option>
              {productCatalog.map(prod => (
                 <option key={prod.id} value={prod.id}>{prod.name} ({prod.ref})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                   <Package className="w-4 h-4 mr-2 text-slate-400"/>
                   Initial Stock Level
                </label>
                <input 
                  type="number" 
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="e.g. 50" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-white font-mono" 
                />
             </div>
             <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                   <AlertCircle className="w-4 h-4 mr-2 text-slate-400"/>
                 Base Unit Cost
                </label>
                <input 
                type="number"
                step="0.01"
                value={baseUnitCost}
                onChange={(e) => setBaseUnitCost(e.target.value)}
                placeholder={selectedProduct ? String(selectedProduct.price ?? "") : "e.g. 100.00"}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-white font-mono" 
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-400"/>
               Description (optional)
             </label>
             <input 
               type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Spare parts batch - shelf A3" 
               className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all text-slate-900 bg-white" 
             />
          </div>

          {selectedProduct && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Product Summary</h4>
              <div className="flex justify-between items-center">
                 <div>
                    <p className="font-semibold text-slate-900">{selectedProduct.name}</p>
                    <p className="text-sm text-slate-500 font-mono mt-0.5">{selectedProduct.ref}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-slate-500 mb-0.5">Unit Value</p>
                    <p className="font-bold text-slate-900">${baseUnitCost || selectedProduct.price}</p>
                 </div>
              </div>
            </div>
          )}

           <div className="pt-6 border-t border-slate-200 flex justify-end">
             <button type="submit" disabled={!selectedProductId || productCatalog.length === 0 || isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <Save className="w-4 h-4 mr-2" />
               {isSubmitting ? "Saving..." : "Initialize Item"}
             </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function InventoryDetailView({ item, onBack }: { item: any, onBack: () => void }) {
  const stockPercentage = Math.min(100, Math.max(0, (item.stock / (item.minStock * 3)) * 100)); // Just for a visual progress bar
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-[900px] mx-auto pb-10"
    >
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-8 pb-10 flex items-start justify-between border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex flex-col">
             <div className="flex items-center space-x-3 mb-3">
                <span className={clsx(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  item.status === 'In Stock' ? "bg-green-100 text-green-700" : 
                  item.status === 'Low Stock' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                )}>
                  {item.status}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold tracking-wider flex items-center">
                   <Tag className="w-3 h-3 mr-1" /> {item.category}
                </span>
             </div>
             <h1 className="text-3xl font-bold text-slate-900 mb-2">{item.name}</h1>
             <div className="flex items-center text-slate-500 font-mono text-sm bg-slate-100 px-3 py-1.5 rounded-lg w-max border border-slate-200">
                <Barcode className="w-4 h-4 mr-2 text-slate-400" />
                SKU: {item.sku}
             </div>
          </div>
          <div className="w-32 h-32 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
             <Package className="w-12 h-12 text-blue-100" />
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-200">
           <div className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                 <Package className="w-3 h-3 mr-1" /> Current Stock
              </p>
              <div className="flex items-end">
                <p className={clsx(
                   "text-4xl font-bold",
                   item.stock <= item.minStock ? "text-red-600" : "text-slate-900"
                )}>{item.stock}</p>
                <span className="text-slate-500 text-sm ml-2 mb-1 border-b border-slate-300 border-dashed">Units</span>
              </div>
           </div>
           <div className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                 <AlertCircle className="w-3 h-3 mr-1" /> Minimum Threshold
              </p>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-slate-700">{item.minStock}</p>
                <span className="text-slate-500 text-sm ml-2 mb-1">Units</span>
              </div>
           </div>
           <div className="p-6 bg-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                 <MapPin className="w-3 h-3 mr-1" /> Location
              </p>
              <p className="text-lg font-medium text-slate-900 mt-2">{item.location}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Stock Status</h3>
        
        <div className="mb-2 flex justify-between items-end">
           <p className="text-sm font-semibold text-slate-700 mb-2">Capacity Health</p>
           <p className="text-sm font-bold text-slate-900">{stockPercentage.toFixed(0)}% optimal level</p>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
           <div 
             className={clsx(
               "h-full rounded-full transition-all duration-1000",
               item.status === 'In Stock' ? "bg-green-500" : 
               item.status === 'Low Stock' ? "bg-amber-400" : "bg-red-500"
             )}
             style={{ width: `${stockPercentage}%` }}
           />
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-6 pb-2">
           <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
               <p className="text-sm font-medium text-slate-500 mb-1">Unit Asset Value</p>
               <p className="text-xl font-bold text-slate-900">${item.price.toLocaleString()}</p>
           </div>
           <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
               <p className="text-sm font-medium text-slate-500 mb-1">Total Inventory Value</p>
               <p className="text-xl font-bold text-slate-900">${(item.price * item.stock).toLocaleString()}</p>
           </div>
        </div>

      </div>
    </motion.div>
  );
}
