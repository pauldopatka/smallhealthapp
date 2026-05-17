import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToRecipe, updateRating, deleteRecipe } from "@/lib/recipes";
import type { Recipe } from "@/types/recipe";

function Stars({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onRate(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-colors leading-none"
        >
          <span className={(hover || rating) >= n ? "text-yellow-400" : "text-gray-700"}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const uid = user!.uid;
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    return subscribeToRecipe(uid, id, setRecipe);
  }, [uid, id]);

  async function handleRate(n: number) {
    if (!id) return;
    await updateRating(uid, id, n);
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteRecipe(uid, id);
      navigate("/recipes");
    } finally {
      setDeleting(false);
    }
  }

  if (recipe === undefined) {
    return (
      <div className="flex justify-center pt-16">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (recipe === null) {
    return (
      <div className="text-center pt-16 space-y-3">
        <p className="text-gray-400">Rezept nicht gefunden.</p>
        <Link to="/recipes" className="text-emerald-400 text-sm hover:underline">← Zurück zur Liste</Link>
      </div>
    );
  }

  const hasMacros = recipe.calories > 0 || recipe.protein > 0 || recipe.carbs > 0 || recipe.fat > 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Back */}
      <Link to="/recipes" className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1">
        ← Rezepte
      </Link>

      {/* Title + rating */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">{recipe.title}</h1>
        <Stars rating={recipe.rating} onRate={handleRate} />
        {recipe.rating > 0 && (
          <p className="text-gray-600 text-xs">{recipe.rating} / 5 Sterne</p>
        )}
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((t) => (
            <span key={t} className="bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>
      )}

      {/* Macros */}
      {hasMacros && (
        <div className="grid grid-cols-2 gap-2 bg-gray-900 border border-gray-800 rounded-xl p-3">
          {recipe.portions > 0 && (
            <div className="col-span-2 text-xs text-gray-500 mb-1">{recipe.portions} Portion{recipe.portions !== 1 ? "en" : ""}</div>
          )}
          {[
            { label: "Kalorien", value: recipe.calories, unit: "kcal", color: "text-emerald-400" },
            { label: "Protein", value: recipe.protein, unit: "g", color: "text-blue-400" },
            { label: "Kohlenhydrate", value: recipe.carbs, unit: "g", color: "text-yellow-400" },
            { label: "Fett", value: recipe.fat, unit: "g", color: "text-orange-400" },
          ].filter(m => m.value > 0).map((m) => (
            <div key={m.label} className="text-center">
              <p className={`text-lg font-bold ${m.color}`}>{m.value}<span className="text-xs font-normal text-gray-500 ml-0.5">{m.unit}</span></p>
              <p className="text-gray-600 text-xs">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ingredients */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Zutaten</h2>
        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed bg-gray-900 border border-gray-800 rounded-xl p-4">
          {recipe.ingredients}
        </p>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Zubereitung</h2>
        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed bg-gray-900 border border-gray-800 rounded-xl p-4">
          {recipe.instructions}
        </p>
      </div>

      {/* Delete */}
      <div className="pt-2 border-t border-gray-800">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-red-500 hover:text-red-400 text-sm transition-colors"
          >
            Rezept löschen
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">Wirklich löschen?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              {deleting ? "…" : "Ja, löschen"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
