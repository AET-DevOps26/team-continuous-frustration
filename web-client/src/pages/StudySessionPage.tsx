import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp, Sparkles, X, Square, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";

import type { StudyDueDateRecord, StudyStatus, DeckOverview } from "@/api/study";
import { getDeckById, listDeckOverviews, getDueFlashcardsForDeck, updateFlashcardStudyStatus } from "@/api/study";
import type { Flashcard } from "@/api/flashcard";
import { getFlashcardsByIds } from "@/api/flashcard";
import { apiV1GenaiExplainPostApiV1GenaiExplainPost } from "@/api/genai";

import { isAiGenerated } from "@/lib/utils"
import { previewNextDueLabel } from "@/lib/spacedRepetition";

interface DueCard {
  flashcard: Flashcard;
  record: StudyDueDateRecord;
}

const ratings: { id: StudyStatus; label: string; color: string }[] = [
  { id: "again", label: "Again", color: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 data-[active=true]:bg-red-100 data-[active=true]:border-red-400" },
  { id: "hard",  label: "Hard",  color: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 data-[active=true]:bg-orange-100 data-[active=true]:border-orange-400" },
  { id: "good",  label: "Good",  color: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 data-[active=true]:bg-blue-100 data-[active=true]:border-blue-400" },
  { id: "easy",  label: "Easy",  color: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 data-[active=true]:bg-green-100 data-[active=true]:border-green-400" },
];

export function StudySessionPage() {
  const navigate = useNavigate();
  const { deckId } = useParams();

  const [deckName, setDeckName] = useState("");
  const [studyCards, setStudyCards] = useState<DueCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedRating, setSelectedRating] = useState<StudyStatus | null>(null);
  const [savingRating, setSavingRating] = useState(false);

  const [showAI, setShowAI] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const [fetchingMore, setFetchingMore] = useState(false);

  const [deckOptions, setDeckOptions] = useState<DeckOverview[]>([]);
  const [deckOptionsLoading, setDeckOptionsLoading] = useState(true);
  const [deckOptionsError, setDeckOptionsError] = useState<string | null>(null);

  useEffect(() => {
    if (deckId) return;

    let active = true;
    setDeckOptionsLoading(true);
    listDeckOverviews()
      .then((res) => {
        if (!active) return;
        setDeckOptions(res.data);
        setDeckOptionsError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load decks:", err);
        setDeckOptionsError("Failed to load decks.");
      })
      .finally(() => {
        if (active) setDeckOptionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [deckId]);

  const loadDueCards = async (deckIdParam: string): Promise<DueCard[]> => {
    const res = await getDueFlashcardsForDeck(deckIdParam);
    const ids = res.data.map((record) => record.flashcard_id);
    if (ids.length === 0) return [];
    const cardsRes = await getFlashcardsByIds({ ids });
    const cardsById = new Map(cardsRes.data.map((card) => [card.id, card]));
    return res.data
      .map((record) => ({flashcard: cardsById.get(record.flashcard_id), record}))
      .filter((card): card is DueCard => card !== null);
  };

  useEffect(() => {
    if (!deckId) return;

    let active = true;

    setStudyCards([]);
    setCurrentIndex(0);
    setShowAnswer(false);
    setShowAI(false);
    setExplanation(null);
    setSelectedRating(null);

    getDeckById(deckId)
      .then((res) => {
        if (!active) return;
        setDeckName(res.data.name);
      })
      .catch((err) => console.error("Failed to load deck:", err));

    setLoadingCards(true);
    loadDueCards(deckId)
      .then((cards) => {
        if (!active) return;
        setStudyCards(cards);
        setCurrentIndex(0);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load due flashcards:", err);
        setError("Failed to load due flashcards.");
      })
      .finally(() => {
        if (active) setLoadingCards(false);
      });

    return () => {
      active = false;
    };
  }, [deckId]);

  const currentEntry = studyCards[currentIndex];
  const currentCard = currentEntry?.flashcard;
  const currentRecord = currentEntry?.record;

  const resetCardState = () => {
    setSelectedRating(null);
    setShowAnswer(false);
    setShowAI(false);
    setExplanation(null);
    setExplanationError(null);
  };

  const handlePrevious = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    resetCardState();
  };

  const advanceToNextCard = async () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetCardState();
      return;
    }

    if (!deckId) return;
    setFetchingMore(true);
    try {
      const cards = await loadDueCards(deckId);
      setStudyCards(cards);
      setCurrentIndex(0);
      resetCardState();
    } catch (err) {
      console.error("Failed to load more due flashcards:", err);
      setError("Failed to load more due flashcards.");
    } finally {
      setFetchingMore(false);
    }
  };

  const handleRate = async (rating: StudyStatus) => {
    if (!deckId || !currentCard) return;
    setSelectedRating(rating);
    setSavingRating(true);
    try {
      await updateFlashcardStudyStatus(deckId, currentCard.id, { study_status: rating });
      await advanceToNextCard();
    } catch (err) {
      setSelectedRating(null);
      console.error("Failed to update study status:", err);
    } finally {
      setSavingRating(false);
    }
  };

  const handleAskAI = async () => {
    if (!currentCard) return;
    setShowAI(true);
    setExplanation(null);
    setExplanationError(null);
    setExplanationLoading(true);
    try {
      const res = await apiV1GenaiExplainPostApiV1GenaiExplainPost(currentCard);
      setExplanation(res.data.explanation);
    } catch (err) {
      console.error("Failed to get AI explanation:", err);
      setExplanationError("Failed to generate an explanation.");
    } finally {
      setExplanationLoading(false);
    }
  };

  if (!deckId) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Study</h1>
          <p className="mt-2 text-muted-foreground">Choose a deck to start studying.</p>
        </div>

        {deckOptionsLoading && <p className="text-muted-foreground">Loading decks...</p>}
        {!deckOptionsLoading && deckOptionsError && (
          <p className="text-destructive">{deckOptionsError}</p>
        )}
        {!deckOptionsLoading && !deckOptionsError && deckOptions.length === 0 && (
          <div className="card-shadow flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">You don't have any decks yet.</p>
            <Button onClick={() => navigate("/decks")}>Create a deck</Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deckOptions.map((deck) => (
            <button
              key={deck.id}
              type="button"
              onClick={() => navigate(`/study/${deck.id}`)}
              className="card-shadow flex flex-col items-start rounded-3xl border border-border bg-card p-6 text-left transition-colors hover:border-primary/50"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold">{deck.name}</h2>
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
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (loadingCards) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-muted-foreground">Loading study session...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-destructive">{error}</p>
      </main>
    );
  }

  if (!currentCard) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link
          to={`/decks/${deckId}`}
          className="mb-6 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> {deckName || "Deck"}
        </Link>
        <p className="text-muted-foreground">No cards are due for this deck right now.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        to={`/decks/${deckId}`}
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
        <Button variant="outline" size="sm" onClick={() => navigate(`/decks/${deckId}`)}>
          <Square className="mr-1.5 h-3.5 w-3.5" /> End Session
        </Button>
      </div>

      <div className={`grid gap-6 ${showAI ? "lg:grid-cols-[1fr_360px]" : ""}`}>
        <div className="space-y-4">
          <div className="card-shadow rounded-3xl border border-border bg-card p-8">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Question</p>
            <h2 className="font-display text-2xl font-semibold leading-snug">
              <Markdown as="span">{currentCard.question}</Markdown>
            </h2>

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
                  <Markdown className="text-base leading-relaxed">{currentCard.answer}</Markdown>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">How did it go?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ratings.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        data-active={selectedRating === r.id}
                        disabled={savingRating}
                        className={`flex flex-col items-center rounded-2xl border px-2 py-3 text-sm font-medium transition-colors disabled:opacity-60 ${r.color}`}
                        onClick={() => handleRate(r.id)}
                      >
                        {r.label}
                        <span className="mt-0.5 text-xs font-normal opacity-70">
                          {currentRecord ? previewNextDueLabel(currentRecord, r.id) : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {isAiGenerated(currentCard) && (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    onClick={handleAskAI}
                  >
                    <Sparkles className="h-4 w-4" /> Ask AI to explain
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || savingRating || fetchingMore}
            >
              ← Previous
            </Button>
            {(savingRating || fetchingMore) && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading next card...
              </span>
            )}
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
              {explanationLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating explanation...
                </div>
              )}
              {!explanationLoading && explanationError && (
                <p className="text-destructive">{explanationError}</p>
              )}
              {!explanationLoading && explanation && (
                <Markdown className="text-muted-foreground leading-relaxed">{explanation}</Markdown>
              )}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
