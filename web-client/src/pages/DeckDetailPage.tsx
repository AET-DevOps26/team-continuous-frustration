import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Play, Plus, Search, Sparkles, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";

import type { Flashcard, FlashcardCreateRequest, FlashcardUpdateRequest } from "@/api/flashcard";
import { createFlashcard, getFlashcardsByIds, updateFlashcard, deleteFlashcard } from "@/api/flashcard";
import { getDeckById, listDeckFlashcardIds, createDeckFlashcardRecord, deleteDeckFlashcardRecord } from "@/api/study";

import { isAiGenerated } from "@/lib/utils"

type SourceFilter = "all" | "ai" | "manual";

export function DeckDetailPage() {
  const navigate = useNavigate();
  const { deckId } = useParams();

  const [deckName, setDeckName] = useState<string>("");
  const [flashcardIds, setFlashcardIds] = useState<string[]>([]);
  const [flashcards, setFlashcards] = useState<Record<string, Flashcard>>({});
  const [loadingIds, setLoadingIds] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const [showAddCard, setShowAddCard] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [addingCard, setAddingCard] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) return;

    let active = true;

    setDeckName("");
    setFlashcardIds([]);
    setFlashcards({});
    setError(null);

    getDeckById(deckId)
      .then((res) => {
        if (!active) return;
        setDeckName(res.data.name);
      })
      .catch((err) => console.error("Failed to load deck:", err));

    setLoadingIds(true);
    listDeckFlashcardIds(deckId)
      .then(async (res) => {
        if (!active) return;
        setFlashcardIds(res.data);
        setError(null);
        if (res.data.length === 0) return;
        try {
          const cardsRes = await getFlashcardsByIds({ ids: res.data });
          if (!active) return;
          setFlashcards(Object.fromEntries(cardsRes.data.map((card) => [card.id, card])));
        } catch (err) {
          console.error("Failed to load flashcards:", err);
          if (active) setError("Failed to load flashcards.");
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load deck flashcard ids:", err);
        setError("Failed to load flashcards.");
      })
      .finally(() => {
        if (active) setLoadingIds(false);
      });

    return () => {
      active = false;
    };
  }, [deckId]);

  const visibleCards = useMemo(() => {
    return flashcardIds
      .map((id) => flashcards[id])
      .filter((card): card is Flashcard => Boolean(card))
      .filter((card) => {
        if (sourceFilter === "ai" && !isAiGenerated(card)) return false;
        if (sourceFilter === "manual" && isAiGenerated(card)) return false;
        if (search.trim() && !card.question.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      });
  }, [flashcardIds, flashcards, search, sourceFilter]);

  const handleAddCard = async () => {
    if (!deckId || !newQuestion.trim() || !newAnswer.trim()) return;
    setAddingCard(true);
    const body: FlashcardCreateRequest = {
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      source_ref: "",
    };
    try {
      const created = await createFlashcard(body);
      try {
        await createDeckFlashcardRecord(deckId, { flashcard_id: created.data.id });
      } catch (err) {
        await deleteFlashcard(created.data.id);
        throw err;
      }
      setFlashcards((prev) => ({ ...prev, [created.data.id]: created.data }));
      setFlashcardIds((prev) => [...prev, created.data.id]);
      setNewQuestion("");
      setNewAnswer("");
      setShowAddCard(false);
    } catch (err) {
      console.error("Failed to add flashcard:", err);
    } finally {
      setAddingCard(false);
    }
  };

  const startEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  const saveEdit = async (card: Flashcard) => {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    setSavingEditId(card.id);
    const body: FlashcardUpdateRequest = {
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
      source_ref: card.source_ref,
    };
    try {
      const res = await updateFlashcard(card.id, body);
      setFlashcards((prev) => ({ ...prev, [card.id]: res.data }));
      cancelEdit();
    } catch (err) {
      console.error("Failed to update flashcard:", err);
    } finally {
      setSavingEditId(null);
    }
  };

  const handleDeleteCard = async (card: Flashcard) => {
    if (!deckId) return;
    setDeletingId(card.id);
    try {
      const [recordResult, flashcardResult] = await Promise.allSettled([
        deleteDeckFlashcardRecord(deckId, card.id),
        deleteFlashcard(card.id),
      ]);

      if (recordResult.status === "fulfilled") {
        setFlashcardIds((prev) => prev.filter((id) => id !== card.id));
      } else {
        console.error("Failed to delete deck flashcard record:", recordResult.reason);
      }

      if (flashcardResult.status === "fulfilled") {
        setFlashcards((prev) => {
          const next = { ...prev };
          delete next[card.id];
          return next;
        });
      } else {
        console.error("Failed to delete flashcard:", flashcardResult.reason);
      }
    } finally {
      setDeletingId(null);
    }
  };

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
          <h1 className="font-display text-4xl font-semibold tracking-tight">{deckName || "Deck"}</h1>
          <p className="mt-1 text-muted-foreground">
            Review, organize, and study the flashcards in this deck.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddCard((prev) => !prev)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Card
          </Button>
          <Button size="sm" onClick={() => navigate(`/study/${deckId}`)}>
            <Play className="mr-1.5 h-4 w-4" /> Study Due Cards
          </Button>
        </div>
      </div>

      {showAddCard && (
        <div className="card-shadow mb-6 rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Add a flashcard</h2>
            <button
              type="button"
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowAddCard(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <Input
              placeholder="Answer"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddCard(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCard}
                disabled={!newQuestion.trim() || !newAnswer.trim() || addingCard}
              >
                {addingCard ? "Adding..." : "Add Card"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
        >
          <option value="all">All</option>
          <option value="ai">AI Generated</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {loadingIds && <p className="text-muted-foreground">Loading flashcards...</p>}
      {!loadingIds && error && <p className="text-destructive">{error}</p>}
      {!loadingIds && !error && flashcardIds.length === 0 && (
        <p className="text-muted-foreground">This deck has no flashcards yet.</p>
      )}
      {!loadingIds && !error && flashcardIds.length > 0 && visibleCards.length === 0 && (
        <p className="text-muted-foreground">No flashcards match your search or filter.</p>
      )}

      <div className="card-shadow overflow-hidden rounded-3xl border border-border bg-card">
        {visibleCards.map((card, idx) => {
          const isEditing = editingId === card.id;
          const aiGenerated = isAiGenerated(card);
          return (
            <article
              key={card.id}
              className={`flex items-start gap-4 p-5 ${idx < visibleCards.length - 1 ? "border-b border-border" : ""}`}
            >
              {isEditing ? (
                <div className="min-w-0 flex-1 space-y-2">
                  <Input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} />
                  <Input value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} />
                </div>
              ) : (
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      Q
                    </span>
                    <Markdown className="font-medium">{card.question}</Markdown>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      A
                    </span>
                    <Markdown className="text-sm text-muted-foreground">{card.answer}</Markdown>
                  </div>
                </div>
              )}

              <div className="flex flex-shrink-0 items-center gap-3">
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    aiGenerated ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {aiGenerated && <Sparkles className="h-3 w-3" />}
                  {aiGenerated ? "AI" : "Manual"}
                </span>
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveEdit(card)}
                        disabled={savingEditId === card.id || !editQuestion.trim() || !editAnswer.trim()}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        {savingEditId === card.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(card)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCard(card)}
                        disabled={deletingId === card.id}
                      >
                        {deletingId === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!loadingIds && flashcardIds.length > 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Showing {visibleCards.length} of {flashcardIds.length} cards
        </p>
      )}
    </main>
  );
}
