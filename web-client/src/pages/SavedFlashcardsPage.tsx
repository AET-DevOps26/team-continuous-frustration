import { Link } from "react-router-dom";
import { FileText, FileQuestion, Trash2, Loader2, Upload, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSavedFlashcards } from "@/hooks/useSavedFlashcards";
import type { FlashcardGroup } from "@/hooks/useSavedFlashcards";

export function SavedFlashcardsPage() {
  const { groups, total, isLoading, error, deletingId, remove } = useSavedFlashcards();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">My Flashcards</h1>
          <p className="mt-2 text-muted-foreground">
            {isLoading
              ? "Loading your saved flashcards…"
              : total === 0
                ? "Flashcards you save will appear here, grouped by source."
                : `${total} saved ${total === 1 ? "card" : "cards"} across ${groups.length} ${groups.length === 1 ? "resource" : "resources"}.`}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/upload">
            <Upload className="mr-1.5 h-4 w-4" /> Upload slides
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingState />
      ) : total === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <SourceGroup
              key={group.sourceName ?? "__unknown__"}
              group={group}
              deletingId={deletingId}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function SourceGroup({
  group,
  deletingId,
  onDelete,
}: {
  group: FlashcardGroup;
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  const named = group.sourceName !== null;
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5 px-1">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {named ? <FileText className="h-4 w-4" /> : <FileQuestion className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium" title={group.sourceName ?? undefined}>
            {group.sourceName ?? "Unknown source"}
          </p>
          <p className="text-xs text-muted-foreground">
            Generated from this resource
          </p>
        </div>
        <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {group.cards.length} {group.cards.length === 1 ? "card" : "cards"}
        </span>
      </div>

      <div className="card-shadow overflow-hidden rounded-3xl border border-border bg-card">
        {group.cards.map((card, idx) => (
          <article
            key={card.id}
            className={`flex items-start gap-4 p-5 ${idx < group.cards.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  Q
                </span>
                <p className="font-medium">{card.question}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  A
                </span>
                <p className="text-sm text-muted-foreground">{card.answer}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-destructive hover:text-destructive"
              disabled={deletingId === card.id}
              onClick={() => onDelete(card.id)}
              aria-label="Delete flashcard"
            >
              {deletingId === card.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      {[0, 1].map((section) => (
        <div key={section}>
          <div className="mb-3 h-9 w-56 animate-pulse rounded-xl bg-muted" />
          <div className="card-shadow overflow-hidden rounded-3xl border border-border bg-card">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className={`space-y-2 p-5 ${row < 2 ? "border-b border-border" : ""}`}
              >
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-shadow flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Layers className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold">No flashcards yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Upload your course slides to generate flashcards with AI, then save the ones you like — they'll show up here.
      </p>
      <Button asChild className="mt-6">
        <Link to="/upload">
          <Upload className="mr-1.5 h-4 w-4" /> Upload slides
        </Link>
      </Button>
    </div>
  );
}
