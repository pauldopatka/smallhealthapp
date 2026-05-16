import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Weight from "./pages/Weight";
import Nutrition from "./pages/Nutrition";
import Recipes from "./pages/Recipes";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/workouts", label: "Workouts", icon: "💪" },
  { to: "/weight", label: "Gewicht", icon: "⚖️" },
  { to: "/nutrition", label: "Ernährung", icon: "🥗" },
  { to: "/recipes", label: "Rezepte", icon: "🍳" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-2">
          <span className="text-xl font-bold text-emerald-400">FitTrack</span>
        </header>

        <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/weight" element={<Weight />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/recipes" element={<Recipes />} />
          </Routes>
        </main>

        <nav className="bg-gray-900 border-t border-gray-800 flex justify-around py-2 sticky bottom-0">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors ${
                  isActive
                    ? "text-emerald-400"
                    : "text-gray-500 hover:text-gray-300"
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </BrowserRouter>
  );
}
