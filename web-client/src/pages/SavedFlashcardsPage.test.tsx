import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

import { SavedFlashcardsPage } from "./SavedFlashcardsPage";
import * as savedHook from "@/hooks/useSavedFlashcards";
import type { Flashcard } from "@/api/flashcard";

vi.mock("@/hooks/useSavedFlashcards");

type HookReturn = ReturnType<typeof savedHook.useSavedFlashcards>;

function mockHook(overrides: Partial<HookReturn>) {
  vi.mocked(savedHook.useSavedFlashcards).mockReturnValue({
    flashcards: [],
    groups: [],
    total: 0,
    isLoading: false,
    error: null,
    deletingId: null,
    remove: vi.fn(),
    ...overrides,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SavedFlashcardsPage />
    </MemoryRouter>,
  );
}

const card: Flashcard = {
  id: "1",
  question: "What is a hypervisor?",
  answer: "Software that runs virtual machines.",
  source_ref: "upload-1",
  source_name: "lecture.pdf",
  last_updated: "2026-01-01T00:00:00Z",
};

describe("SavedFlashcardsPage", () => {
  it("shows an empty state with a link to upload when there are no flashcards", () => {
    mockHook({ total: 0, groups: [] });
    renderPage();

    expect(screen.getByText(/No flashcards yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /upload slides/i }).length).toBeGreaterThan(0);
  });

  it("renders saved flashcards grouped under their source document", () => {
    mockHook({
      total: 1,
      groups: [{ sourceName: "lecture.pdf", cards: [card] }],
    });
    renderPage();

    expect(screen.getByText("lecture.pdf")).toBeInTheDocument();
    expect(screen.getByText("What is a hypervisor?")).toBeInTheDocument();
    expect(screen.getByText("Software that runs virtual machines.")).toBeInTheDocument();
  });

  it("shows a loading state while flashcards are being fetched", () => {
    mockHook({ isLoading: true });
    renderPage();

    expect(screen.getByText(/Loading your saved flashcards/i)).toBeInTheDocument();
  });
});
