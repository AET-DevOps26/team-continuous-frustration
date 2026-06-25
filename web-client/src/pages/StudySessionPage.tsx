import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp, Sparkles, X, ThumbsUp, ThumbsDown, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReviewRating = "again" | "hard" | "good" | "easy";

type StudyCard = {
  id: number;
  question: string;
  answer: string;
  keyIdea: string;
};

const studyCards: StudyCard[] = [
  {
    id: 1,
    question: "What is overfitting?",
    answer: "Overfitting occurs when a model learns the training data too well, including its noise and outliers, which reduces its ability to generalize to unseen data.",
    keyIdea: "The model performs very well on training data but poorly on new, unseen data.",
  },
  {
    id: 2,
    question: "What is the bias-variance trade-off?",
    answer: "The bias-variance trade-off describes the balance between a model that is too simple and a model that is too complex.",
    keyIdea: "Good models balance underfitting and overfitting.",
  },
  {
    id: 3,
    question: "What is cross-validation?",
    answer: "Cross-validation is a method for evaluating a model by splitting data into training and validation subsets.",
    keyIdea: "It helps estimate how well a model generalizes to unseen data.",
  },
];

const deckNames: Record<string, string> = {
  "database-systems": "Database Systems",
  "software-engineering": "Software Engineering",
  "operating-systems": "Operating Systems",
  "mathematics": "Mathematics",
  "german-vocabulary": "German Vocabulary",
};

const ratings: { id: ReviewRating; label: string; time: string; color: string }[] = [
  { id: "again", label: "Again", time: "< 1 min", color: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 data-[active=true]:bg-red-100 data-[active=true]:border-red-400" },
  { id: "hard",  label: "Hard",  time: "5 min",   color: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 data-[active=true]:bg-orange-100 data-[active=true]:border-orange-400" },
  { id: "good",  label: "Good",  time: "15 min",  color: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 data-[active=true]:bg-blue-100 data-[active=true]:border-blue-400" },
  { id: "easy",  label: "Easy",  time: "4 days",  color: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 data-[active=true]:bg-green-100 data-[active=true]:border-green-400" },
];

export function StudySessionPage() {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const deckName = deckNames[deckId ?? ""] ?? "Machine Learning";
  const currentDeckId = deckId ?? "machine-learning";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedRating, setSelectedRating] = useState<ReviewRating | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [savedExplanation, setSavedExplanation] = useState(false);

  const currentCard = studyCards[currentIndex];
  const progressPercent = useMemo(
    () => Math.round(((currentIndex + 1) / studyCards.length) * 100),
    [currentIndex]
  );

  const handlePrevious = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    setSelectedRating(null);
    setShowAnswer(false);
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i < studyCards.length - 1 ? i + 1 : i));
    setSelectedRating(null);
    setShowAnswer(false);
    setSavedExplanation(false);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        to={`/decks/${currentDeckId}`}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {deckName}
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Study Session</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Card {currentIndex + 1} of {studyCards.length} · {deckName}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/decks/${currentDeckId}`)}>
          <Square className="mr-1.5 h-3.5 w-3.5" /> End Session
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-border">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{progressPercent}%</span>
      </div>

      <div className={`grid gap-6 ${showAI ? "lg:grid-cols-[1fr_360px]" : ""}`}>
        <div className="space-y-4">
          <div className="card-shadow rounded-3xl border border-border bg-card p-8">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Question</p>
            <h2 className="font-display text-2xl font-semibold leading-snug">{currentCard.question}</h2>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
              onClick={() => setShowAnswer((v) => !v)}
            >
              {showAnswer ? (
                <><ChevronUp className="h-4 w-4" /> Hide Answer</>
              ) : (
                <><ChevronDown className="h-4 w-4" /> Show Answer</>
              )}
            </button>

            {showAnswer && (
              <div className="mt-6 space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Answer</p>
                  <p className="text-base leading-relaxed">{currentCard.answer}</p>
                </div>

                <div className="rounded-2xl bg-primary/5 p-4 text-sm">
                  <p className="font-medium text-primary">Key idea</p>
                  <p className="mt-1 text-muted-foreground">{currentCard.keyIdea}</p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">How did it go?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ratings.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        data-active={selectedRating === r.id}
                        className={`flex flex-col items-center rounded-2xl border px-2 py-3 text-sm font-medium transition-colors ${r.color}`}
                        onClick={() => setSelectedRating(r.id)}
                      >
                        {r.label}
                        <span className="mt-0.5 text-xs font-normal opacity-70">{r.time}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                  onClick={() => setShowAI(true)}
                >
                  <Sparkles className="h-4 w-4" /> Ask AI to explain
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </Button>
            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={currentIndex === studyCards.length - 1}
            >
              Next →
            </Button>
          </div>
        </div>

        {showAI && (
          <aside className="card-shadow flex flex-col rounded-3xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">AI Explanation</h2>
              </div>
              <button
                type="button"
                className="text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowAI(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 text-sm">
              <div>
                <h3 className="font-semibold">Explanation</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  Overfitting happens when a machine learning model captures not only the underlying
                  patterns in the training data but also the random noise. As a result, it performs
                  very well on the training set but fails to generalize to new, unseen data.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Real-world analogy</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  It is like memorizing the answers to practice test questions instead of understanding
                  the concepts — you might ace the practice test but struggle on the real exam.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">How to prevent it</h3>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>· Use more training data</li>
                  <li>· Apply regularization (L1/L2)</li>
                  <li>· Use simpler models</li>
                  <li>· Apply dropout or early stopping</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSavedExplanation(true)}
                disabled={savedExplanation}
              >
                {savedExplanation ? "✓ Saved as Flashcard" : "+ Save as Flashcard"}
              </Button>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Was this helpful?</span>
                <div className="flex gap-2">
                  <button type="button" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
