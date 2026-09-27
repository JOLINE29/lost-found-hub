import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, FileText, GitMerge, Clock, CheckCircle,
  Search, Package, AlertTriangle, Send, ChevronRight
} from "lucide-react";
import type { AdminStats, Item, Match, Claim } from "../../types";
import api from "../../api/client";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";

type Tab = "overview" | "items" | "matches" | "claims" | "unclaimed";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [unclaimed, setUnclaimed] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/items"),
      api.get("/admin/matches"),
      api.get("/admin/claims"),
      api.get("/admin/unclaimed"),
    ]).then(([s, i, m, c, u]) => {
      setStats(s.data);
      setItems(i.data);
      setMatches(m.data);
      setClaims(c.data);
      setUnclaimed(u.data);
    }).finally(() => setLoading(false));
  }, []);

  const updateItemStatus = async (id: string, status: string) => {
    await api.patch(`/items/${id}/status`, { status });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: status as Item["status"] } : i));
    toast.success("Status updated");
  };

  const updateClaimStatus = async (id: string, status: string) => {
    await api.patch(`/claims/${id}`, { status });
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status: status as Claim["status"] } : c));
    toast.success(`Claim ${status.toLowerCase()}`);
  };

  const dismissMatch = async (id: string) => {
    await api.patch(`/admin/matches/${id}`, { status: "DISMISSED" });
    setMatches(prev => prev.filter(m => m.id !== id));
    toast.success("Match dismissed");
  };

  const sendCommunityAlert = async (id: string) => {
    const { data } = await api.post(`/admin/unclaimed/${id}/alert`);
    toast.success(`Alert sent to ${data.recipients} users`);
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "items", label: "Reports", icon: FileText, badge: items.length },
    { key: "matches", label: "Matches", icon: GitMerge, badge: matches.length },
    { key: "claims", label: "Claims", icon: CheckCircle, badge: claims.filter(c => c.status === "PENDING").length },
    { key: "unclaimed", label: "30-Day", icon: Clock, badge: unclaimed.length },
  ];

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">Loading admin dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage reports, claims, and matches</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon className="w-4 h-4" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Reports", value: stats.totalReports, icon: FileText, color: "bg-indigo-50 text-indigo-600" },
              { label: "Pending Claims", value: stats.pendingClaims, icon: CheckCircle, color: "bg-yellow-50 text-yellow-600" },
              { label: "Potential Matches", value: stats.potentialMatches, icon: GitMerge, color: "bg-purple-50 text-purple-600" },
              { label: "Unclaimed >30d", value: stats.unclaimedOver30, icon: Clock, color: "bg-red-50 text-red-600" },
              { label: "Recovered", value: stats.recoveredItems, icon: CheckCircle, color: "bg-green-50 text-green-600" },
              { label: "Lost Items", value: stats.lostCount, icon: Search, color: "bg-red-50 text-red-500" },
              { label: "Found Items", value: stats.foundCount, icon: Package, color: "bg-green-50 text-green-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Recovery Rate</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.totalReports > 0 ? Math.round((stats.recoveredItems / stats.totalReports) * 100) : 0}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-700">
                {stats.totalReports > 0 ? Math.round((stats.recoveredItems / stats.totalReports) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      {tab === "items" && (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex items-center gap-4 flex-wrap">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === "LOST" ? "bg-red-50" : "bg-green-50"}`}>
                {item.type === "LOST" ? <Search className="w-4 h-4 text-red-500" /> : <Package className="w-4 h-4 text-green-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/items/${item.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{item.title}</Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === "LOST" ? "badge-lost" : "badge-found"}`}>{item.type}</span>
                  <span className="text-xs text-gray-400">{item.category} · {item.location}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{format(new Date(item.createdAt), "MMM d, yyyy")}</p>
              </div>
              <select value={item.status} onChange={e => updateItemStatus(item.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {["ACTIVE", "MATCHED", "CLAIMED", "RECOVERED", "ARCHIVED"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Matches */}
      {tab === "matches" && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><GitMerge className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No pending matches</p></div>
          ) : matches.map(match => (
            <div key={match.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full">
                  {Math.round(match.score * 100)}% Match
                </span>
                <button onClick={() => dismissMatch(match.id)} className="text-xs text-gray-400 hover:text-red-500">Dismiss</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs font-medium text-red-600 mb-1">🔍 LOST</p>
                  <Link to={`/items/${match.lostItemId}`} className="font-medium text-gray-900 hover:underline text-sm">{match.lostItem.title}</Link>
                  <p className="text-xs text-gray-500 mt-1">{match.lostItem.location}</p>
                  <p className="text-xs text-gray-400">{format(new Date(match.lostItem.dateLostFound), "MMM d")}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-medium text-green-600 mb-1">📦 FOUND</p>
                  <Link to={`/items/${match.foundItemId}`} className="font-medium text-gray-900 hover:underline text-sm">{match.foundItem.title}</Link>
                  <p className="text-xs text-gray-500 mt-1">{match.foundItem.location}</p>
                  <p className="text-xs text-gray-400">{format(new Date(match.foundItem.dateLostFound), "MMM d")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claims */}
      {tab === "claims" && (
        <div className="space-y-3">
          {claims.map(claim => (
            <div key={claim.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/claims/${claim.id}`} className="font-medium text-gray-900 hover:text-indigo-600 flex items-center gap-1">
                      {claim.item.title} <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      claim.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      claim.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{claim.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">By {claim.claimant.name} · {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{claim.message}</p>
                </div>
                {claim.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button onClick={() => updateClaimStatus(claim.id, "APPROVED")}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">Approve</button>
                    <button onClick={() => updateClaimStatus(claim.id, "REJECTED")}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors">Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 30-Day Unclaimed */}
      {tab === "unclaimed" && (
        <div className="space-y-3">
          {unclaimed.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Clock className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No unclaimed items over 30 days</p></div>
          ) : unclaimed.map(item => (
            <div key={item.id} className="card p-4 border-l-4 border-orange-400">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <Link to={`/items/${item.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{item.title}</Link>
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      {formatDistanceToNow(new Date(item.createdAt))} unclaimed
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.location} · Found {format(new Date(item.dateLostFound), "MMM d, yyyy")}</p>
                </div>
                <button onClick={() => sendCommunityAlert(item.id)}
                  className="flex items-center gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                  <Send className="w-3.5 h-3.5" /> Send Alert
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
