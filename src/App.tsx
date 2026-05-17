import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Weight from "./pages/Weight";
import Nutrition from "./pages/Nutrition";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/workouts", label: "Workouts", icon: "💪" },
  { to: "/weight", label: "Gewicht", icon: "⚖️" },
  { to: "/nutrition", label: "Ernährung", icon: "🥗" },
  { to: "/recipes", label: "Rezepte", icon: "🍳" },
];

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = (user?.displayName?.[0] || user?.email?.[0] || "U").toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    try { await signOut(); } catch { /* already signed out or network issue */ }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-emerald-700 hover:bg-emerald-600 flex items-center justify-center text-white text-sm font-bold transition-colors"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 bg-gray-900 border border-gray-700 rounded-xl shadow-xl w-52 py-2">
          <p className="text-gray-500 text-xs px-4 py-1 truncate">{user?.email}</p>
          <div className="border-t border-gray-800 my-1" />
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
          >
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}

function AppLayout() {
  const { loading } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {!isLoginPage && (
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-emerald-400">FitTrack</span>
          <UserMenu />
        </header>
      )}

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
          <Route path="/weight" element={<ProtectedRoute><Weight /></ProtectedRoute>} />
          <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
          <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
        </Routes>
      </main>

      {!isLoginPage && (
        <nav className="bg-gray-900 border-t border-gray-800 flex justify-around py-2 sticky bottom-0">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors ${
                  isActive ? "text-emerald-400" : "text-gray-500 hover:text-gray-300"
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
