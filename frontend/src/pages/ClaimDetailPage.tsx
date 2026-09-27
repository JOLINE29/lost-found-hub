import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Lock, CheckCircle, XCircle } from "lucide-react";
import type { Claim, Message } from "../types";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { io, Socket } from "socket.io-client";

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/claims/${id}`).then(r => {
      setClaim(r.data);
      setMessages(r.data.room?.messages || []);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!claim?.room) return;
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
    socketRef.current = socket;
    socket.emit("join-room", claim.room.id);
    socket.on("new-message", (msg: Message) => setMessages(prev => [...prev, msg]));
    return () => { socket.emit("leave-room", claim.room!.id); socket.disconnect(); };
  }, [claim?.room]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !claim?.room) return;
    setSending(true);
    try {
      const { data } = await api.post("/messages", { roomId: claim.room.id, content: newMsg });
      socketRef.current?.emit("send-message", { roomId: claim.room.id, message: data });
      setNewMsg("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const updateClaimStatus = async (status: "APPROVED" | "REJECTED") => {
    try {
      await api.patch(`/claims/${id}`, { status });
      toast.success(`Claim ${status.toLowerCase()}`);
      navigate("/admin");
    } catch {
      toast.error("Failed to update claim");
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500">Loading...</div>;
  if (!claim) return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500">Claim not found</div>;

  const isAdmin = user?.role === "ADMIN";
  const isClaimant = user?.id === claim.claimantId;
  const isFinder = user?.id === claim.item.reporter.id;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Claim for: {claim.item.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Submitted by {claim.claimant.name} · {format(new Date(claim.createdAt), "MMM d, yyyy")}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            claim.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
            claim.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>{claim.status}</span>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Claim Message</p>
          <p className="text-sm text-gray-700">{claim.message}</p>
        </div>

        {isAdmin && claim.status === "PENDING" && (
          <div className="flex gap-3 mt-4">
            <button onClick={() => updateClaimStatus("APPROVED")} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <CheckCircle className="w-4 h-4" /> Approve Claim
            </button>
            <button onClick={() => updateClaimStatus("REJECTED")} className="flex items-center gap-2 btn-danger text-sm">
              <XCircle className="w-4 h-4" /> Reject Claim
            </button>
          </div>
        )}
      </div>

      {/* Private Verification Room */}
      {claim.room && (isClaimant || isFinder || isAdmin) && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-indigo-600 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-200" />
            <span className="text-sm font-medium text-white">Private Verification Room</span>
            <span className="text-xs text-indigo-200 ml-auto">Only visible to finder, claimant & admin</span>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Start the verification conversation
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.sender.id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <span className="text-xs text-gray-500">{msg.sender.name}</span>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"}`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-400">{format(new Date(msg.createdAt), "h:mm a")}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {claim.status === "PENDING" && (
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
                className="input flex-1 text-sm" placeholder="Type a message..." />
              <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="btn-primary px-3">
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
