import { useState, useEffect } from "react";
import { MapPin, Calendar, PartyPopper } from "lucide-react";
import type { Item } from "../types";
import api from "../api/client";
import { format, formatDistanceStrict } from "date-fns";
import { getCategoryImage } from "../lib/categoryImages";

export default function RecoveredFeedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/items/recovered").then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PartyPopper className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Successfully Recovered</h1>
        <p className="text-gray-500 mt-2">Items that found their way back home</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium">
          🎉 {items.length} item{items.length !== 1 ? "s" : ""} recovered
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No recovered items yet. Be the first to help someone!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card overflow-hidden flex flex-col sm:flex-row border-l-4 border-green-400 hover:shadow-md transition-shadow">
              <div className="sm:w-36 h-32 sm:h-auto flex-shrink-0 overflow-hidden">
                <img
                  src={item.imageUrl ?? getCategoryImage(item.category)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">🎉</span>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <span className="badge-recovered">Recovered</span>
                  <span className="text-xs text-gray-400">{item.category}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" /> {item.location}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" /> Reported {format(new Date(item.createdAt), "MMM d")}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    Recovered in {formatDistanceStrict(new Date(item.updatedAt), new Date(item.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
