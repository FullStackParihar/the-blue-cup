import React, { useState } from "react";
import {
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useAdjustInventoryStock,
} from "../../hooks/useApi";
import type { InventoryItem } from "@the-blue-cup/types";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_CATEGORIES = [
  "Dairy",
  "Coffee & Beans",
  "Syrups & Sweeteners",
  "Bakery & Pastries",
  "Tea & Beverages",
  "Packaging & Disposables",
  "Savory Ingredients",
];

export default function InventoryPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Category selection state in form
  const [dropdownCategory, setDropdownCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");

  // Data fetching
  const { data: inventory = [], isLoading: isLoadingInv } = useInventoryItems();

  // Mutations
  const createItemMutation = useCreateInventoryItem();
  const updateItemMutation = useUpdateInventoryItem();
  const deleteItemMutation = useDeleteInventoryItem();
  const adjustStockMutation = useAdjustInventoryStock();

  // Categories list
  const categories = ["All", ...new Set(inventory.map((item) => item.category))];

  // Stock update handler
  const handleStockUpdate = (item: InventoryItem, newQty: number) => {
    if (!item._id || isNaN(newQty) || newQty < 0) return;
    const delta = newQty - item.currentStock;
    if (delta === 0) return;

    adjustStockMutation.mutate({
      id: item._id,
      payload: {
        type: delta > 0 ? "restock" : "consume",
        quantity: delta,
        note: `Manual stock level adjustment`,
      },
    });
  };

  const handleStepAdjust = (item: InventoryItem, step: number) => {
    if (!item._id) return;
    const newQty = Math.max(0, item.currentStock + step);
    handleStockUpdate(item, newQty);
  };

  // Filter items
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats calculation
  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStockAlert);
  const totalValue = inventory.reduce((acc, item) => acc + item.currentStock * (item.costPrice || 0), 0);

  // Form submission
  const handleItemSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const finalCategory = dropdownCategory === "custom" ? customCategory.trim() : dropdownCategory;
    if (!finalCategory) {
      alert("Please specify a category");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      category: finalCategory,
      currentStock: Number(formData.get("currentStock") || 0),
      minStockAlert: Number(formData.get("minStockAlert") || 10),
      unit: formData.get("unit") as string,
      costPrice: Number(formData.get("costPrice") || 0),
      supplier: formData.get("supplier") as string || undefined,
    };

    if (editingItem && editingItem._id) {
      updateItemMutation.mutate(
        { id: editingItem._id, payload },
        {
          onSuccess: () => {
            setIsItemModalOpen(false);
            setEditingItem(null);
          },
        }
      );
    } else {
      createItemMutation.mutate(payload, {
        onSuccess: () => {
          setIsItemModalOpen(false);
        },
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header with quick stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-border/40 shadow-sm">
        <div className="space-y-1">
          <h2 className="font-heading text-3xl text-primary-navy font-black uppercase tracking-tight">Inventory Stock</h2>
          <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-muted">
            <span>📦 {inventory.length} total items</span>
            {lowStockItems.length > 0 && (
              <span className="text-gold animate-pulse">⚠️ {lowStockItems.length} low stock warnings</span>
            )}
            <span className="text-leaf">💰 ₹{totalValue.toLocaleString("en-IN")} total value</span>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setDropdownCategory(DEFAULT_CATEGORIES[0]);
            setCustomCategory("");
            setIsItemModalOpen(true);
          }}
          className="btn-primary py-3 px-6 text-[10px] uppercase tracking-widest font-black self-start md:self-center"
        >
          Add Item ➕
        </button>
      </div>

      {/* Interactive Controls Bar */}
      <div className="space-y-4">
        {/* Search */}
        <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-border/40">
          <input
            type="text"
            placeholder="SEARCH BY INGREDIENT NAME..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-border/60 rounded-xl px-4 py-3 text-xs tracking-wider font-semibold placeholder:text-muted/65 outline-none focus:border-gold transition-all"
          />
        </div>

        {/* Dynamic Category Chips */}
        <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border ${
                selectedCategory === cat
                  ? "bg-primary-navy text-white border-primary-navy shadow-sm"
                  : "bg-antique-cream/35 text-primary-navy border-border/60 hover:bg-antique-cream/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Stock Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {isLoadingInv ? (
            <div className="col-span-full py-16 text-center text-xs font-black uppercase tracking-wider text-muted animate-pulse">
              Loading inventory stock...
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs font-black uppercase tracking-wider text-muted border-2 border-dashed border-border/40 rounded-3xl bg-[#FAF9F5]">
              No inventory items found. Add items to track stock levels.
            </div>
          ) : (
            filteredInventory.map((item) => {
              const isLowStock = item.currentStock <= item.minStockAlert;
              const isOutOfStock = item.currentStock <= 0;

              // Calculate stock level health ratio (percentage bar)
              const maxStockRef = Math.max(item.minStockAlert * 3, 20);
              const stockRatio = Math.min(100, (item.currentStock / maxStockRef) * 100);

              const barColor = isOutOfStock
                ? "bg-alert-red"
                : isLowStock
                ? "bg-gold"
                : "bg-leaf";

              return (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`card-premium p-6 flex flex-col justify-between gap-4 border transition-all duration-300 ${
                    isOutOfStock
                      ? "border-alert-red/20 shadow-alert-red/5"
                      : isLowStock
                      ? "border-gold/20 shadow-gold/5"
                      : "border-border/40 hover:border-gold/40"
                  }`}
                >
                  {/* Top: Info and value */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading text-lg text-primary-navy font-black uppercase tracking-tight truncate">
                          {item.name}
                        </span>
                        {isLowStock && (
                          <span className={`h-2.5 w-2.5 rounded-full ${isOutOfStock ? "bg-alert-red animate-ping" : "bg-gold animate-pulse"}`} />
                        )}
                      </div>
                      <span className="text-[9px] font-black text-muted uppercase tracking-widest block mt-0.5">
                        {item.category} • Supplier: {item.supplier || "—"}
                      </span>
                    </div>

                    {/* Stock Value Badge */}
                    {item.costPrice > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] font-black text-leaf bg-leaf/10 border border-leaf/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          ₹{(item.currentStock * item.costPrice).toLocaleString("en-IN", { maximumFractionDigits: 0 })} value
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Visual Gauge Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-black/[0.04] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${stockRatio}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-muted font-bold uppercase tracking-wider">
                      <span>Alert level: {item.minStockAlert} {item.unit}</span>
                      <span className={isOutOfStock ? "text-alert-red font-black" : isLowStock ? "text-gold font-black" : "text-leaf font-black"}>
                        {isOutOfStock ? "EMPTY" : isLowStock ? "LOW STOCK" : "SAFE"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Stepper controls & Actions */}
                  <div className="flex items-center justify-between border-t border-border/30 pt-4 mt-1">
                    {/* Compact pill-styled stepper */}
                    <div className="flex items-center bg-[#FAF9F5] border border-border/60 rounded-full px-2 py-1 shadow-sm">
                      <button
                        onClick={() => handleStepAdjust(item, -1)}
                        disabled={item.currentStock <= 0}
                        className="w-7 h-7 flex items-center justify-center font-black text-lg text-primary-navy hover:bg-black/5 rounded-full transition-colors disabled:opacity-30"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.currentStock}
                        onChange={(e) => handleStockUpdate(item, Number(e.target.value))}
                        className="w-12 text-center font-heading text-sm font-black text-primary-navy bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => handleStepAdjust(item, 1)}
                        className="w-7 h-7 flex items-center justify-center font-black text-lg text-primary-navy hover:bg-black/5 rounded-full transition-colors"
                      >
                        ＋
                      </button>
                      <span className="text-[9px] font-black text-muted uppercase tracking-wider ml-1 pr-2">
                        {item.unit}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          if (DEFAULT_CATEGORIES.includes(item.category)) {
                            setDropdownCategory(item.category);
                            setCustomCategory("");
                          } else {
                            setDropdownCategory("custom");
                            setCustomCategory(item.category);
                          }
                          setIsItemModalOpen(true);
                        }}
                        className="p-2 border border-border/80 text-primary-navy hover:bg-antique-cream rounded-xl transition-all text-xs"
                        title="Edit Details"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                            deleteItemMutation.mutate(item._id!);
                          }
                        }}
                        className="p-2 border border-alert-red/20 text-alert-red hover:bg-alert-red/5 rounded-xl transition-all text-xs"
                        title="Delete Item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Item creation / editing modal */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary-navy/40 backdrop-blur-md" onClick={() => setIsItemModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card-premium w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-5 mb-6">
                <h3 className="font-heading text-2xl text-primary-navy font-black tracking-tight uppercase">
                  {editingItem ? "Edit Item Details" : "Add Inventory Item"}
                </h3>
                <button onClick={() => setIsItemModalOpen(false)} className="text-muted hover:text-primary-navy text-xl font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleItemSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted uppercase tracking-widest block">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingItem?.name || ""}
                    className="w-full bg-[#FAF9F5] border border-border/60 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-gold transition-all"
                    placeholder="e.g. Milk, Espresso Beans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted uppercase tracking-widest block">Category *</label>
                    <select
                      value={dropdownCategory}
                      onChange={(e) => {
                        setDropdownCategory(e.target.value);
                        if (e.target.value !== "custom") {
                          setCustomCategory("");
                        }
                      }}
                      className="w-full bg-[#FAF9F5] border border-border/60 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-gold transition-all"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="custom">Custom Category...</option>
                    </select>

                    {dropdownCategory === "custom" && (
                      <input
                        type="text"
                        required
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter custom category..."
                        className="w-full mt-2 bg-[#FAF9F5] border border-border/60 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-gold transition-all"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted uppercase tracking-widest block">Stock Unit *</label>
                    <input
                      type="text"
                      name="unit"
                      required
                      defaultValue={editingItem?.unit || ""}
                      className="w-full bg-[#FAF9F5] border border-border/60 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-gold transition-all"
                      placeholder="e.g. Liters, kg, Units"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted uppercase tracking-widest block">Initial Quantity</label>
                    <input
                      type="number"
                      name="currentStock"
                      disabled={!!editingItem}
                      defaultValue={editingItem?.currentStock ?? 0}
                      className="w-full bg-[#FAF9F5] border border-border/60 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-gold transition-all disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted uppercase tracking-widest block">Alert Level *</label>
                    <input
                      type="number"
                      name="minStockAlert"
                      required
                      defaultValue={editingItem?.minStockAlert ?? 10}
                      className="w-full bg-[#FAF9F5] border border-border/60 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-gold transition-all"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted uppercase tracking-widest block">Cost Price (per unit)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="costPrice"
                      defaultValue={editingItem?.costPrice ?? 0}
                      className="w-full bg-[#FAF9F5] border border-border/60 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-gold transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted uppercase tracking-widest block">Supplier Name</label>
                    <input
                      type="text"
                      name="supplier"
                      defaultValue={editingItem?.supplier || ""}
                      className="w-full bg-[#FAF9F5] border border-border/60 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-gold transition-all"
                      placeholder="e.g. Amul Milk supplier"
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-5 mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="border border-border text-primary-navy text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-antique-cream transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createItemMutation.isPending || updateItemMutation.isPending}
                    className="btn-primary py-3 px-6 text-[10px] uppercase tracking-widest font-black"
                  >
                    {editingItem ? "Save Changes" : "Create Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
