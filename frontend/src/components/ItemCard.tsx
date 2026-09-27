import { Link } from "react-router-dom";
import { MapPin, Calendar, Tag } from "lucide-react";
import type { Item } from "../types";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-found",
  MATCHED: "badge-matched",
  CLAIMED: "badge-claimed",
  RECOVERED: "badge-recovered",
  ARCHIVED: "bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium",
};

export default function ItemCard({ item }: { item: Item }) {
  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-video bg-gray-100 overflow-hidden relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={item.type === "LOST" ? "badge-lost" : "badge-found"}>
            {item.type === "LOST" ? "🔍 Lost" : "📦 Found"}
          </span>
          {item.status !== "ACTIVE" && (
            <span className={STATUS_BADGE[item.status] || ""}>{item.status}</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{format(new Date(item.dateLostFound), "MMM d, yyyy")}</span>
          </div>
        </div>
        <Link to={`/items/${item.id}`} className="mt-4 block w-full text-center btn-primary text-sm">
          View Details
        </Link>
      </div>
    </div>
  );
}
