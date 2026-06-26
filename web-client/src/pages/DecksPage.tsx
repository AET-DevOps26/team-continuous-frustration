import { useNavigate } from "react-router-dom";
import { Search, Plus, Sparkles, Database, Code2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Deck = {
  id: string;
  name: string;
  category: string;
  cards: number;
  dueToday: number;
  progress: number;
  updated: string;
  accent: "purple" | "blue" | "green" | "orange";
};

const decks: Deck[] = [
  { id: "machine-learning", name: "Machine Learning", category: "AI / Data Science", cards: 42, dueToday: 7, progress: 83, updated: "2 hours ago", accent: "purple" },
  { id: "database-systems", name: "Database Systems", category: "Computer Science", cards: 28, dueToday: 3, progress: 64, updated: "1 day ago", accent: "blue" },
  { id: "software-engineering", name: "Software Engineering", category: "Computer Science", cards: 36, dueToday: 0, progress: 100, updated: "3 hours ago", accent: "green" },
  { id: "operating-systems", name: "Operating Systems", category: "Computer Science", cards: 18, dueToday: 5, progress: 72, updated: "2 days ago", accent: "orange" },
  { id: "mathematics", name: "Mathematics", category: "Math", cards: 24, dueToday: 2, progress: 58, updated: "5 hours ago", accent: "purple" },
  { id: "german-vocabulary", name: "German Vocabulary", category: "Languages", cards: 65, dueToday: 11, progress: 36, updated: "1 day ago", accent: "orange" },
];

const accentStyles = {
  purple: { icon: "bg-purple-100 text-purple-600", badge: "bg-purple-50 text-purple-600", bar: "bg-purple-500" },
  blue:   { icon: "bg-blue-100 text-blue-600",     badge: "bg-blue-50 text-blue-600",     bar: "bg-blue-500"   },
  green:  { icon: "bg-green-100 text-green-600",   badge: "bg-green-50 text-green-600",   bar: "bg-green-500"  },
  orange: { icon: "bg-orange-100 text-orange-600", badge: "bg-orange-50 text-orange-600", bar: "bg-orange-500" },
};

const accentIcons = {
  purple: Sparkles,
  blue:   Database,
  green:  Code2,
  orange: Cpu,
};

export function DecksPage() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">My Decks</h1>
          <p className="mt-1 text-muted-foreground">6 decks · 28 cards due today</p>
        </div>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> New Deck
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search decks..." className="pl-9" />
        </div>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          defaultValue="recent"
        >
          <option value="recent">Recently updated</option>
          <option value="cards">Most cards</option>
          <option value="due">Due today</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => {
          const styles = accentStyles[deck.accent];
          const Icon = accentIcons[deck.accent];
          return (
            <article
              key={deck.id}
              className="card-shadow flex flex-col rounded-3xl border border-border bg-card p-6"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${styles.icon}`}>
                <Icon className="h-5 w-5" />
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold">{deck.name}</h2>
              <span className={`mt-1 w-fit rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
                {deck.category}
              </span>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <div>
                  <span className="font-semibold">{deck.cards}</span>
                  <span className="ml-1 text-muted-foreground">cards</span>
                </div>
                <div>
                  <span className={`font-semibold ${deck.dueToday > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {deck.dueToday}
                  </span>
                  <span className="ml-1 text-muted-foreground">due today</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-border">
                  <div className={`h-1.5 rounded-full ${styles.bar}`} style={{ width: `${deck.progress}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{deck.progress}%</span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">Updated {deck.updated}</p>

              <div className="mt-5 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/decks/${deck.id}`)}>
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
