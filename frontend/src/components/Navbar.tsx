import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Menu, X, Plus, LogOut, User, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Notification } from "../types";
import api from "../api/client";
import { formatDistanceToNow } from "date-fns";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => n.status === "UNREAD").length;

  useEffect(() => {
    if (!user) return;
    api.get("/notifications").then(r => setNotifications(r.data));
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications(prev => prev.map(n => ({ ...n, status: "READ" as const })));
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Lost & Found Hub</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Community</Link>
            <Link to="/recovered" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Recovered</Link>
            {user && <Link to="/my" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">My Items</Link>}
            {isAdmin && <Link to="/admin" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors flex items-center gap-1"><Shield className="w-3.5 h-3.5" />Admin</Link>}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button onClick={() => navigate("/report")} className="hidden md:flex btn-primary items-center gap-1.5 text-sm">
                  <Plus className="w-4 h-4" /> Report Item
                </button>

                <div className="relative" ref={notifRef}>
                  <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unread}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 card shadow-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unread > 0 && <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-6">No notifications</p>
                        ) : notifications.map(n => (
                          <div key={n.id} onClick={() => { if (n.link) navigate(n.link); setNotifOpen(false); }}
                            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.status === "UNREAD" ? "bg-indigo-50/50" : ""}`}>
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700">{user.name}</span>
                  </button>
                  <div className="absolute right-0 mt-1 w-40 card shadow-lg py-1 hidden group-hover:block">
                    <button onClick={() => { logout(); navigate("/login"); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Sign up</Link>
              </div>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 py-2">Community Feed</Link>
          <Link to="/recovered" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 py-2">Recovered Items</Link>
          {user && <Link to="/my" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 py-2">My Items</Link>}
          {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm text-indigo-600 py-2">Admin Dashboard</Link>}
          {user && <Link to="/report" onClick={() => setMenuOpen(false)} className="block text-sm text-indigo-600 font-medium py-2">+ Report Item</Link>}
        </div>
      )}
    </nav>
  );
}
