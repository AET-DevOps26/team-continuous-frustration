import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useSavedFlashcards } from "./useSavedFlashcards";
import * as flashcardApi from "@/api/flashcard";
import type { Flashcard } from "@/api/flashcard";

vi.mock("@/api/flashcard");

const card = (id: string, sourceName?: string): Flashcard => ({
  id,
  question: `Q${id}`,
  answer: `A${id}`,
  source_ref: "upload-1",
  source_name: sourceName,
  last_updated: "2026-01-01T00:00:00Z",
});

function mockList(cards: Flashcard[]) {
  vi.mocked(flashcardApi.listFlashcards).mockResolvedValue({ data: cards } as any);
}

describe("useSavedFlashcards", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("groups saved flashcards by their source resource", async () => {
    mockList([card("1", "a.pdf"), card("2", "b.pdf"), card("3", "a.pdf")]);

    const { result } = renderHook(() => useSavedFlashcards());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.total).toBe(3);
    expect(result.current.groups).toHaveLength(2);
    const aGroup = result.current.groups.find((g) => g.sourceName === "a.pdf");
    expect(aGroup?.cards).toHaveLength(2);
  });

  it("puts cards without a source name in an 'unknown' group, sorted last", async () => {
    mockList([card("1", undefined), card("2", "a.pdf")]);

    const { result } = renderHook(() => useSavedFlashcards());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0].sourceName).toBe("a.pdf");
    expect(result.current.groups[1].sourceName).toBeNull();
  });

  it("removes a flashcard optimistically on delete", async () => {
    mockList([card("1", "a.pdf")]);
    vi.mocked(flashcardApi.deleteFlashcard).mockResolvedValue({} as any);

    const { result } = renderHook(() => useSavedFlashcards());
    await waitFor(() => expect(result.current.total).toBe(1));

    await act(async () => {
      await result.current.remove("1");
    });

    expect(flashcardApi.deleteFlashcard).toHaveBeenCalledWith("1");
    expect(result.current.total).toBe(0);
  });

  it("surfaces an error message when loading fails", async () => {
    vi.mocked(flashcardApi.listFlashcards).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useSavedFlashcards());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
  });
});
