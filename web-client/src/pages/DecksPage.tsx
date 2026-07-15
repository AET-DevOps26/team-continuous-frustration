import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  X,
  Sparkles,
  Code2,
  Calculator,
  Languages,
  FlaskConical,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { Deck, DeckOverview, DeckCreateRequest } from "@/api/study";
import { listDeckOverviews, createDeck } from "@/api/study";

const TAG_OPTIONS: { tag: string; icon: LucideIcon }[] = [
  { tag: "AI / Data Science", icon: Sparkles },
  { tag: "Computer Science", icon: Code2 },
  { tag: "Mathematics", icon: Calculator },
  { tag: "Languages", icon: Languages },
  { tag: "Science", icon: FlaskConical },
];
const DEFAULT_TAG_ICON = BookOpen;

const getDeckIcon = (tags: string[]): LucideIcon =>
  TAG_OPTIONS.find((option) => tags.includes(option.tag))?.icon ?? DEFAULT_TAG_ICON;

const ACCENT_PATTERN = ["purple", "blue", "green", "orange"] as const;
type Accent = (typeof ACCENT_PATTERN)[number];

const accentStyles: Record<Accent, { icon: string; badge: string }> = {
  purple: { icon: "bg-purple-100 text-purple-600", badge: "bg-purple-50 text-purple-600" },
  blue: { icon: "bg-blue-100 text-blue-600", badge: "bg-blue-50 text-blue-600" },
  green: { icon: "bg-green-100 text-green-600", badge: "bg-green-50 text-green-600" },
  orange: { icon: "bg-orange-100 text-orange-600", badge: "bg-orange-50 text-orange-600" },
};

const getAccent = (index: number): Accent => ACCENT_PATTERN[index % ACCENT_PATTERN.length];

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "cards", label: "Most cards" },
  { value: "due", label: "Due today" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export function DecksPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<DeckOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("name");

  const [showCreate, setShowCreate] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckTags, setNewDeckTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  //const testDeck: DeckOverview = {"id": "123", "name": "Deck 1", "tags": ["Computer Science"], "cards": 5, "dueToday": 3};

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res =  await listDeckOverviews();
      setDecks(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to load decks:", err);
      setError("Failed to load decks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const toggleTag = (tag: string) => {
    setNewDeckTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetCreateForm = () => {
    setNewDeckName("");
    setNewDeckTags([]);
    setShowCreate(false);
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    setCreating(true);
    const body: DeckCreateRequest = { name: newDeckName.trim(), tags: newDeckTags };
    try {
      const res = await createDeck(body);
      const created: Deck = res.data;
      setDecks((prev) => [...prev, { ...created, cards: 0, dueToday: 0 }]);
      resetCreateForm();
    } catch (err) {
      console.error("Failed to create deck:", err);
    } finally {
      setCreating(false);
    }
  };

  const visibleDecks = useMemo(() => {
    const filtered = decks.filter((deck) =>
      deck.name.toLowerCase().includes(search.trim().toLowerCase())
    );
    const sorted = [...filtered];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "cards") sorted.sort((a, b) => b.cards - a.cards);
    if (sort === "due") sorted.sort((a, b) => b.dueToday - a.dueToday);
    return sorted;
  }, [decks, search, sort]);

  const totalCards = decks.reduce((sum, deck) => sum + deck.cards, 0);
  const totalDueToday = decks.reduce((sum, deck) => sum + deck.dueToday, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">My Decks</h1>
          <p className="mt-1 text-muted-foreground">
            {decks.length} decks · {totalCards} cards · {totalDueToday} due today
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate((prev) => !prev)}>
          <Plus className="mr-1.5 h-4 w-4" /> New Deck
        </Button>
      </div>

      {showCreate && (
        <div className="card-shadow mb-6 rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Create a new deck</h2>
            <button
              type="button"
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={resetCreateForm}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="deck-name" className="mb-1.5 block text-sm font-medium">
                Name
              </label>
              <Input
                id="deck-name"
                placeholder="e.g. Machine Learning"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
              />
            </div>

            <div>
              <p className="mb-1.5 block text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map(({ tag, icon: Icon }) => {
                  const selected = newDeckTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetCreateForm}>
                Cancel
              </Button>
              <Button onClick={handleCreateDeck} disabled={!newDeckName.trim() || creating}>
                {creating ? "Creating..." : "Create Deck"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search decks..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-muted-foreground">Loading decks...</p>}
      {!loading && error && <p className="text-destructive">{error}</p>}
      {!loading && !error && visibleDecks.length === 0 && (
        <p className="text-muted-foreground">No decks found.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleDecks.map((deck, index) => {
          const accent = getAccent(index);
          const styles = accentStyles[accent];
          const Icon = getDeckIcon(deck.tags);
          return (
            <article
              key={deck.id}
              className="card-shadow flex flex-col rounded-3xl border border-border bg-card p-6"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${styles.icon}`}>
                <Icon className="h-5 w-5" />
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold">{deck.name}</h2>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {deck.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <div>
                  <span className="font-semibold">{deck.cards}</span>
                  <span className="ml-1 text-muted-foreground">cards</span>
                </div>
                <div>
                  <span
                    className={`font-semibold ${deck.dueToday > 0 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {deck.dueToday}
                  </span>
                  <span className="ml-1 text-muted-foreground">due today</span>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/decks/${deck.id}`)}
                >
                  Open
                </Button>
                <Button size="sm" className="flex-1" onClick={() => navigate(`/study/${deck.id}`)}>
                  Study
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
