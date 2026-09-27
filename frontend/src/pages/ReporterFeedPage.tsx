import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Search, FileText, MapPin, Calendar } from "lucide-react";
import type { Item, Claim } from "../types";
import api from "../api/client";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  MATCHED: "bg-yellow-100 text-yellow-700",
  CLAIMED: "bg-purple-100 text-purple-700",
  RECOVERED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function ReporterFeedPage() {
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"items" | "claims">("items");

  useEffect(() => {
    api.get("/items/my").then(r => {
      setMyItems(r.data.myItems);
      setMyClaims(r.data.myClaims);
    }).finally(() => setLoading(false));
  }, []);

  const lostItems = myItems.filter(i => i.type === "LOST");
  const foundItems = myItems.filter(i => i.type === "FOUND");

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-1">Track your reports and claims</p>
        </div>
        <Link to="/report" className="btn-primary text-sm">+ Report Item</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Lost Reports", value: lostItems.length, icon: Search, color: "text-red-500 bg-red-50" },
          { label: "Found Reports", value: foundItems.length, icon: Package, color: "text-green-500 bg-green-50" },
          { label: "My Claims", value: myClaims.length, icon: FileText, color: "text-indigo-500 bg-indigo-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["items", "claims"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "items" ? `My Reports (${myItems.length})` : `My Claims (${myClaims.length})`}
          </button>
        ))}
      </div>

      {tab === "items" && (
        <div className="space-y-3">
          {myItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No reports yet. <Link to="/report" className="text-indigo-600 hover:underline">Report an item</Link></p>
            </div>
          ) : myItems.map(item => (
            <Link key={item.id} to={`/items/${item.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === "LOST" ? "bg-red-50" : "bg-green-50"}`}>
                {item.type === "LOST" ? <Search className="w-5 h-5 text-red-500" /> : <Package className="w-5 h-5 text-green-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 truncate">{item.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                  {item.lostMatches && item.lostMatches.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                      {item.lostMatches.length} match{item.lostMatches.length > 1 ? "es" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{item.location}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="w-3 h-3" />{format(new Date(item.dateLostFound), "MMM d")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "claims" && (
        <div className="space-y-3">
          {myClaims.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No claims submitted yet</p>
            </div>
          ) : myClaims.map(claim => (
            <Link key={claim.id} to={`/claims/${claim.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 truncate">{claim.item.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[claim.status]}`}>{claim.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{claim.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{format(new Date(claim.createdAt), "MMM d, yyyy")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
