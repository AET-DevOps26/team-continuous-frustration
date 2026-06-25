import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Play, Plus, Pencil, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Flashcard = {
  id: number;
  question: string;
  answer: string;
  source: "AI Generated" | "Manual";
};

const flashcards: Flashcard[] = [
  { id: 1, question: "What is overfitting?", answer: "Overfitting occurs when a model learns the training data too well.", source: "AI Generated" },
  { id: 2, question: "What is the bias-variance trade-off?", answer: "The bias-variance trade-off refers to the balance between underfitting and overfitting.", source: "AI Generated" },
  { id: 3, question: "What is cross-validation?", answer: "Cross-validation is a resampling technique used to evaluate model performance.", source: "AI Generated" },
  { id: 4, question: "What is regularization?", answer: "Regularization is a technique used to prevent overfitting by adding a penalty term.", source: "Manual" },
  { id: 5, question: "What is gradient descent?", answer: "Gradient descent is an optimization algorithm used to minimize a loss function.", source: "AI Generated" },
];

const deckNames: Record<string, string> = {
  "database-systems": "Database Systems",
  "software-engineering": "Software Engineering",
  "operating-systems": "Operating Systems",
  "mathematics": "Mathematics",
  "german-vocabulary": "German Vocabulary",
};

export function DeckDetailPage() {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const deckName = deckNames[deckId ?? ""] ?? "Machine Learning";
  const currentDeckId = deckId ?? "machine-learning";

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        to="/decks"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> My Decks
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{deckName}</h1>
          <p className="mt-1 text-muted-foreground">
            Review, organize, and study the flashcards in this deck.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Card
          </Button>
          <Button variant="outline" size="sm">
            <Pencil className="mr-1.5 h-4 w-4" /> Edit Deck
          </Button>
          <Button size="sm" onClick={() => navigate(`/study/${currentDeckId}`)}>
            <Play className="mr-1.5 h-4 w-4" /> Study Due Cards
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search cards..." className="pl-9" />
        </div>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          defaultValue="all"
        >
          <option value="all">All</option>
          <option value="ai">AI Generated</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div className="card-shadow overflow-hidden rounded-3xl border border-border bg-card">
        {flashcards.map((card, idx) => (
          <article
            key={card.id}
            className={`flex items-start gap-4 p-5 ${idx < flashcards.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  Q
                </span>
                <p className="font-medium">{card.question}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  A
                </span>
                <p className="text-sm text-muted-foreground">{card.answer}</p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-3">
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  card.source === "AI Generated"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {card.source === "AI Generated" && <Sparkles className="h-3 w-3" />}
                {card.source === "AI Generated" ? "AI" : "Manual"}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">Showing 1–5 of 42 cards</p>
    </main>
  );
}
