import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Calendar, Tag, User, ArrowLeft, AlertCircle, CheckCircle, Lock } from "lucide-react";
import type { Item } from "../types";
import { getCategoryImage } from "../lib/categoryImages";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import toast from "react-hot-toast";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  MATCHED: "bg-yellow-100 text-yellow-700",
  CLAIMED: "bg-purple-100 text-purple-700",
  RECOVERED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimMsg, setClaimMsg] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);

  useEffect(() => {
    api.get(`/items/${id}`).then(r => setItem(r.data)).finally(() => setLoading(false));
  }, [id]);

  const submitClaim = async () => {
    if (!claimMsg.trim()) { toast.error("Please describe why this item is yours"); return; }
    setClaiming(true);
    try {
      const { data } = await api.post("/claims", { itemId: id, message: claimMsg });
      toast.success("Claim submitted! A private verification room has been created.");
      navigate(`/claims/${data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to submit claim";
      toast.error(msg);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-xl mb-6" />
      <div className="space-y-3"><div className="h-6 bg-gray-200 rounded w-1/2" /><div className="h-4 bg-gray-200 rounded w-full" /></div>
    </div>
  );

  if (!item) return <div className="text-center py-16 text-gray-500">Item not found</div>;

  const isOwner = user?.id === item.reporterId;
  const canClaim = user && !isOwner && item.type === "FOUND" && ["ACTIVE", "MATCHED"].includes(item.status);
  const matches = item.type === "LOST" ? item.lostMatches : item.foundMatches;
  // pending claims on this item (visible to finder/owner)
  const pendingClaims = item.claims?.filter(c => c.status === "PENDING") ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="card overflow-hidden">
        <div className="relative w-full h-64 overflow-hidden">
          <img
            src={item.imageUrl ?? getCategoryImage(item.category)}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {!item.imageUrl && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
              <Tag className="w-3 h-3" /> {item.category}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={item.type === "LOST" ? "badge-lost" : "badge-found"}>
                  {item.type === "LOST" ? "🔍 Lost" : "📦 Found"}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
            </div>
          </div>

          <p className="text-gray-600 mt-3 leading-relaxed">{item.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Tag className="w-4 h-4 text-gray-400" />
              <span>{item.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{format(new Date(item.dateLostFound), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>Reported by {item.reporter.name}</span>
            </div>
          </div>

          {/* Potential Matches */}
          {matches && matches.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" /> Potential Matches
              </h2>
              <div className="space-y-2">
                {matches.map((m) => {
                  const matchedItem = item.type === "LOST" ? m.foundItem : m.lostItem;
                  return (
                    <Link key={m.id} to={`/items/${matchedItem?.id}`}
                      className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{matchedItem?.title}</p>
                        <p className="text-xs text-gray-500">{matchedItem?.location}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-yellow-700">{Math.round(m.score * 100)}%</span>
                        <p className="text-xs text-gray-500">match</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Claim Section */}
          {item.status === "RECOVERED" && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-700 font-medium">This item has been successfully recovered and returned to its owner.</p>
            </div>
          )}

          {/* Finder sees pending claims with link to verification room */}
          {isOwner && pendingClaims.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" /> Pending Claims
              </h2>
              <div className="space-y-2">
                {pendingClaims.map(claim => (
                  <Link key={claim.id} to={`/claims/${claim.id}`}
                    className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Claim by {claim.claimant?.name ?? "Someone"}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{claim.message}</p>
                    </div>
                    <span className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-medium whitespace-nowrap ml-3">🔐 Open Room</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {canClaim && !showClaimForm && (
            <button onClick={() => setShowClaimForm(true)} className="mt-6 btn-primary w-full text-base py-3">
              🙋 This is Mine — Submit a Claim
            </button>
          )}

          {canClaim && showClaimForm && (
            <div className="mt-6 p-4 border border-indigo-200 bg-indigo-50/50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">Submit Your Claim</h3>
              <p className="text-sm text-gray-500 mb-3">Describe identifying details that prove this item is yours (e.g. what's inside, unique marks, serial number).</p>
              <textarea value={claimMsg} onChange={e => setClaimMsg(e.target.value)} className="input resize-none" rows={3}
                placeholder="e.g. The phone has a black case with a small white sticker. The wallpaper is a mountain photo." />
              <div className="flex gap-2 mt-3">
                <button onClick={submitClaim} disabled={claiming} className="btn-primary flex-1">
                  {claiming ? "Submitting..." : "Submit Claim"}
                </button>
                <button onClick={() => setShowClaimForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {!user && item.type === "FOUND" && item.status === "ACTIVE" && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link> to claim this item
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
