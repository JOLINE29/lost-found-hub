import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ItemCard from "../components/ItemCard";
import type { Item } from "../types";
import api from "../api/client";

const CATEGORIES = ["Electronics", "Bags", "Documents", "Clothing", "Accessories", "Keys", "Wallet", "Other"];
const LOCATIONS = ["Central Library", "Block 3", "Cafeteria", "Sports Complex", "Main Gate", "Hostel", "Lab Block", "Other"];

export default function CommunityFeedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (type) params.set("type", type);
      if (category) params.set("category", category);
      if (location) params.set("location", location);
      params.set("page", String(page));
      const { data } = await api.get(`/items?${params}`);
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, [search, type, category, location, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const clearFilters = () => { setType(""); setCategory(""); setLocation(""); setSearch(""); setPage(1); };
  const hasFilters = type || category || location || search;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
        <p className="text-gray-500 mt-1">Browse lost and found items in your community</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search items, locations..."
            className="input pl-9"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? "bg-indigo-50 border-indigo-300 text-indigo-700" : ""}`}>
          <SlidersHorizontal className="w-4 h-4" /> Filters
          {hasFilters && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="input text-sm">
              <option value="">All</option>
              <option value="LOST">Lost</option>
              <option value="FOUND">Found</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input text-sm">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <select value={location} onChange={e => { setLocation(e.target.value); setPage(1); }} className="input text-sm">
              <option value="">All Locations</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {hasFilters && (
            <div className="sm:col-span-3 flex justify-end">
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{total} item{total !== 1 ? "s" : ""} found</p>
        <div className="flex gap-2">
          {["", "LOST", "FOUND"].map(t => (
            <button key={t} onClick={() => { setType(t); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${type === t ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t === "" ? "All" : t === "LOST" ? "🔍 Lost" : "📦 Found"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No items found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-40">Previous</button>
          <span className="flex items-center text-sm text-gray-600">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
