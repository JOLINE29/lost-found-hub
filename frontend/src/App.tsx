import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import CommunityFeedPage from "./pages/CommunityFeedPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReportItemPage from "./pages/ReportItemPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import ClaimDetailPage from "./pages/ClaimDetailPage";
import ReporterFeedPage from "./pages/ReporterFeedPage";
import RecoveredFeedPage from "./pages/RecoveredFeedPage";
import AdminDashboard from "./pages/admin/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<CommunityFeedPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/recovered" element={<RecoveredFeedPage />} />
              <Route path="/items/:id" element={<ItemDetailPage />} />
              <Route path="/report" element={<ProtectedRoute><ReportItemPage /></ProtectedRoute>} />
              <Route path="/my" element={<ProtectedRoute><ReporterFeedPage /></ProtectedRoute>} />
              <Route path="/claims/:id" element={<ProtectedRoute><ClaimDetailPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
