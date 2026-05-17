import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { saveRecipe, subscribeToRecipes } from "@/lib/recipes";
import { RECIPE_TAGS, type Recipe } from "@/types/recipe";

// ── RecipeCard ────────────────────────────────────────────────────────────────

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 space-y-2 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{recipe.title}</h3>
        {recipe.rating > 0 && (
          <span className="text-yellow-400 text-sm shrink-0">{"★".repeat(recipe.rating)}{"☆".repeat(5 - recipe.rating)}</span>
        )}
      </div>
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {recipe.tags.map((t) => (
            <span key={t} className="bg-gray-800 text-gray-500 text-xs px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}
      {recipe.calories > 0 && (
        <p className="text-xs text-gray-600">{recipe.calories} kcal{recipe.portions > 0 ? ` · ${recipe.portions} Portionen` : ""}</p>
      )}
    </Link>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Recipes() {
  const { user } = useAuth();
  const uid = user!.uid;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [portions, setPortions] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => subscribeToRecipes(uid, setRecipes), [uid]);

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function resetForm() {
    setTitle(""); setIngredients(""); setInstructions("");
    setCalories(""); setProtein(""); setCarbs(""); setFat(""); setPortions("");
    setSelectedTags([]); setSaveError(""); setShowForm(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError("");
    try {
      await saveRecipe(uid, {
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        portions: parseInt(portions) || 0,
        tags: selectedTags,
      });
      resetForm();
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rezepte</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? "Abbrechen" : "+ Rezept"}
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Rezepte suchen…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
      />

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Titel (z.B. Overnight Oats)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />

          <textarea
            placeholder="Zutaten (eine pro Zeile)"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            required
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />

          <textarea
            placeholder="Zubereitung (Schritt für Schritt)"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { p: "Kalorien (kcal)", v: calories, s: setCalories },
              { p: "Portionen", v: portions, s: setPortions },
              { p: "Protein (g)", v: protein, s: setProtein },
              { p: "Kohlenhydrate (g)", v: carbs, s: setCarbs },
              { p: "Fett (g)", v: fat, s: setFat },
            ].map(({ p, v, s }) => (
              <input
                key={p}
                type="number"
                min={0}
                step={0.1}
                placeholder={p}
                value={v}
                onChange={(e) => s(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-xs"
              />
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {RECIPE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? "Wird gespeichert…" : "Rezept speichern"}
          </button>
        </form>
      )}

      {/* List */}
      {recipes.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">
          Noch keine Rezepte. Erstelle dein erstes! 🍳
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">Keine Rezepte gefunden.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  );
}
