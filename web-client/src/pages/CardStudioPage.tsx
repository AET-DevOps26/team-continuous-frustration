import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trash2, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type CardStatus = "ready" | "edited" | "deleted";

type Flashcard = {
  id: number;
  question: string;
  answer: string;
  status: CardStatus;
};

const initialFlashcards: Flashcard[] = [
  { id: 1, question: "What is overfitting?", answer: "Overfitting occurs when a model learns the training data too well, including its noise and outliers, which reduces its ability to generalize to unseen data.", status: "ready" },
  { id: 2, question: "What is the bias-variance trade-off?", answer: "The bias-variance trade-off describes the balance between underfitting and overfitting in machine learning models.", status: "ready" },
  { id: 3, question: "What is cross-validation?", answer: "Cross-validation is a technique used to evaluate a model by splitting data into training and validation subsets.", status: "edited" },
  { id: 4, question: "What is the difference between training and test data?", answer: "Training data is used to train the model, while test data is used to evaluate how well the model generalizes.", status: "ready" },
  { id: 5, question: "What is regularization?", answer: "Regularization is a technique used to reduce overfitting by adding a penalty term to the model's loss function.", status: "edited" },
  { id: 6, question: "What is the purpose of a loss function?", answer: "A loss function measures how far a model's prediction is from the correct answer.", status: "deleted" },
];

const statusStyles: Record<CardStatus, string> = {
  ready:   "bg-green-50 text-green-700",
  edited:  "bg-blue-50 text-blue-700",
  deleted: "bg-red-50 text-red-500 line-through opacity-60",
};

const statusDot: Record<CardStatus, string> = {
  ready:   "bg-green-500",
  edited:  "bg-blue-500",
  deleted: "bg-red-400",
};

export function CardStudioPage() {
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
  const [selectedCardId, setSelectedCardId] = useState<number>(1);
  const [selectedDeck, setSelectedDeck] = useState("machine-learning");
  const [isSaved, setIsSaved] = useState(false);

  const selectedCard = flashcards.find((c) => c.id === selectedCardId) ?? flashcards[0];
  const activeCards = useMemo(() => flashcards.filter((c) => c.status !== "deleted"), [flashcards]);

  const updateSelectedCard = (field: "question" | "answer", value: string) => {
    setFlashcards((cards) =>
      cards.map((c) =>
        c.id === selectedCardId
          ? { ...c, [field]: value, status: c.status === "deleted" ? "deleted" : "edited" }
          : c
      )
    );
    setIsSaved(false);
  };

  const handleSaveCard = () => {
    setFlashcards((cards) =>
      cards.map((c) =>
        c.id === selectedCardId && c.status !== "deleted" ? { ...c, status: "ready" } : c
      )
    );
  };

  const handleDeleteCard = () => {
    setFlashcards((cards) =>
      cards.map((c) => (c.id === selectedCardId ? { ...c, status: "deleted" } : c))
    );
    const next = flashcards.find((c) => c.id !== selectedCardId && c.status !== "deleted");
    if (next) setSelectedCardId(next.id);
    setIsSaved(false);
  };

  const handleRestoreCard = (cardId: number) => {
    setFlashcards((cards) =>
      cards.map((c) => (c.id === cardId ? { ...c, status: "ready" } : c))
    );
    setSelectedCardId(cardId);
    setIsSaved(false);
  };

  const handleImproveWithAI = () => {
    updateSelectedCard(
      "answer",
      `${selectedCard.answer}\n\nAI improved: This concept is important because it helps students understand how models behave on unseen data.`
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Card Studio</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          Generated from <span className="font-medium text-foreground">machine-learning-week3.pdf</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card-shadow flex flex-col rounded-3xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm font-medium">Generated Cards</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {flashcards.length}
            </span>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto">
            {flashcards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setSelectedCardId(card.id);
                }}
                className={`w-full rounded-2xl p-3 text-left transition-colors ${
                  selectedCardId === card.id
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "hover:bg-muted"
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusDot[card.status]}`} />
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${statusStyles[card.status]}`}>
                    {card.status}
                  </span>
                </div>
                <p className={`line-clamp-2 text-xs ${card.status === "deleted" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {card.question}
                </p>
                {card.status === "deleted" && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-primary hover:underline"
                    onClick={(e) => { e.stopPropagation(); handleRestoreCard(card.id); }}
                  >
                    Restore
                  </button>
                )}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="card-shadow rounded-3xl border border-border bg-card p-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="question">Question</Label>
                <textarea
                  id="question"
                  rows={3}
                  disabled={selectedCard.status === "deleted"}
                  value={selectedCard.question}
                  onChange={(e) => updateSelectedCard("question", e.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <p className="text-right text-xs text-muted-foreground">{selectedCard.question.length} / 500</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="answer">Answer</Label>
                <textarea
                  id="answer"
                  rows={5}
                  disabled={selectedCard.status === "deleted"}
                  value={selectedCard.answer}
                  onChange={(e) => updateSelectedCard("answer", e.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <p className="text-right text-xs text-muted-foreground">{selectedCard.answer.length} / 1500</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                size="sm"
                disabled={selectedCard.status === "deleted"}
                onClick={handleSaveCard}
              >
                <Check className="mr-1.5 h-4 w-4" /> Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedCard.status === "deleted"}
                onClick={handleImproveWithAI}
              >
                <Sparkles className="mr-1.5 h-4 w-4" /> Improve with AI
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={selectedCard.status === "deleted"}
                className="ml-auto text-destructive hover:text-destructive"
                onClick={handleDeleteCard}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          <div className="card-shadow rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="deck">Save to deck</Label>
                <div className="flex items-center gap-2">
                  <select
                    id="deck"
                    value={selectedDeck}
                    onChange={(e) => { setSelectedDeck(e.target.value); setIsSaved(false); }}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="machine-learning">Machine Learning</option>
                    <option value="database-systems">Database Systems</option>
                    <option value="software-engineering">Software Engineering</option>
                  </select>
                  <Button variant="outline" size="sm">+ New Deck</Button>
                </div>
              </div>

              <div className="flex gap-2">
                {!isSaved ? (
                  <Button onClick={() => setIsSaved(true)}>Save All to Deck</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => navigate(`/decks/${selectedDeck}`)}>
                      View Deck
                    </Button>
                    <Button onClick={() => navigate(`/study/${selectedDeck}`)}>
                      <Sparkles className="mr-1.5 h-4 w-4" /> Start Studying
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{flashcards.length} flashcards generated</span>
              <span>·</span>
              <span>{activeCards.length} ready to save</span>
              {isSaved && (
                <>
                  <span>·</span>
                  <span className="font-medium text-green-600">Saved successfully</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
