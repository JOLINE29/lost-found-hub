import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X } from "lucide-react";
import api from "../api/client";
import toast from "react-hot-toast";

const CATEGORIES = ["Electronics", "Bags", "Documents", "Clothing", "Accessories", "Keys", "Wallet", "Other"];
const LOCATIONS = ["Central Library", "Block 3", "Cafeteria", "Sports Complex", "Main Gate", "Hostel", "Lab Block", "Other"];

export default function ReportItemPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<"LOST" | "FOUND">("LOST");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateLostFound, setDateLostFound] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("title", title);
      fd.append("category", category);
      fd.append("description", description);
      fd.append("location", location);
      fd.append("dateLostFound", dateLostFound);
      if (image) fd.append("image", image);
      const { data } = await api.post("/items", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Item reported successfully!");
      navigate(`/items/${data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to report item";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Report an Item</h1>
      <p className="text-gray-500 mb-6">Fill in the details to help others find or return your item</p>

      <div className="card p-6">
        {/* Type Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          {(["LOST", "FOUND"] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${type === t ? (t === "LOST" ? "bg-red-500 text-white" : "bg-green-500 text-white") : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {t === "LOST" ? "🔍 I Lost Something" : "📦 I Found Something"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="e.g. iPhone 15, Black Wallet" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input" required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input resize-none" rows={3}
              placeholder="Describe the item in detail — color, brand, distinguishing features..." required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "LOST" ? "Location Lost *" : "Location Found *"}
              </label>
              <select value={location} onChange={e => setLocation(e.target.value)} className="input" required>
                <option value="">Select location</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "LOST" ? "Date Lost *" : "Date Found *"}
              </label>
              <input type="date" value={dateLostFound} onChange={e => setDateLostFound(e.target.value)} className="input"
                max={new Date().toISOString().split("T")[0]} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
            {preview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImage(null); setPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-sm text-gray-500">Click to upload image</span>
                <span className="text-xs text-gray-400">Max 5MB</span>
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Submitting..." : `Report ${type === "LOST" ? "Lost" : "Found"} Item`}
          </button>
        </form>
      </div>
    </div>
  );
}
