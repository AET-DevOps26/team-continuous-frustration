import { useState } from "react";

import type { BodyDocumentsUploadPostApiV1DocumentsUploadPost } from "@/api/upload";
import { documentsUploadPostApiV1DocumentsUploadPost } from "@/api/upload";
import type { Flashcard } from "@/api/genaiStream";
import { apiV1GenaiGenerateFlashcardsPostApiV1GenaiGenerateFlashcardsPost } from "@/api/genaiStream";
import type { FlashcardCreateRequest } from "@/api/flashcard";
import { createFlashcard, deleteFlashcard } from "@/api/flashcard";
import { createDeckFlashcardRecord } from "@/api/study";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Parse an NDJSON stream of Flashcard objects, invoking `onFlashcard` for each
 * complete line as it arrives.
 */
async function parseFlashcardStream(
  body: ReadableStream<Uint8Array>,
  onFlashcard: (card: Flashcard) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last, possibly-incomplete line in the buffer.
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      emitFlashcard(line, onFlashcard);
    }
  }

  // Flush any trailing content once the stream closes.
  emitFlashcard(buffer, onFlashcard);
}

function emitFlashcard(line: string, onFlashcard: (card: Flashcard) => void): void {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    onFlashcard(JSON.parse(trimmed) as Flashcard);
  } catch (error) {
    console.error("Failed to parse flashcard:", error);
  }
}

/**
 * Orchestrates the flashcard generation flow:
 *   upload a document -> generate flashcards (streamed) -> persist flashcards.
 *
 * Keeps all business logic and API interaction out of the presentation layer.
 */
export function useFlashcardGeneration() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [error, setError] = useState<string | null>(null);
  // Human-readable name of the source document, persisted with each saved card.
  const [sourceName, setSourceName] = useState<string | null>(null);

  const generateFromFile = async (file: File): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setFlashcards([]);
    setSaveStatus({});
    setSourceName(file.name);

    try {
      const uploadBody: BodyDocumentsUploadPostApiV1DocumentsUploadPost = { file };
      const uploadResponse = await documentsUploadPostApiV1DocumentsUploadPost(uploadBody);
      const uploadId = uploadResponse.data.upload_id;

      const generateResponse = await apiV1GenaiGenerateFlashcardsPostApiV1GenaiGenerateFlashcardsPost(
        { upload_id: uploadId },
        { credentials: "include" },
      );

      if (generateResponse.status !== 200 || !generateResponse.stream.body) {
        throw new Error("Flashcard generation failed");
      }

      await parseFlashcardStream(generateResponse.stream.body, (card) => {
        setFlashcards((prev) => [...prev, card]);
      });
    } catch (err) {
      console.error("Flashcard generation failed:", err);
      setError("Something went wrong while generating flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFlashcard = async (card: Flashcard, deckId: string): Promise<boolean> => {
    if (!deckId) return false;

    setSaveStatus((prev) => ({ ...prev, [card.id]: "saving" }));
    const request: FlashcardCreateRequest = {
      question: card.question,
      answer: card.answer,
      source_ref: card.source_ref,
      ...(sourceName ? { source_name: sourceName } : {}),
    };

    try {
      const created = await createFlashcard(request);
      try {
        await createDeckFlashcardRecord(deckId, { flashcard_id: created.data.id });
      } catch (err) {
        await deleteFlashcard(created.data.id);
        throw err;
      }
      setSaveStatus((prev) => ({ ...prev, [card.id]: "saved" }));
      return true;
    } catch (err) {
      console.error("Failed to save flashcard:", err);
      setSaveStatus((prev) => ({ ...prev, [card.id]: "error" }));
      return false;
    }
  };

  const saveAllFlashcards = async (deckId: string): Promise<void> => {
    setIsSavingAll(true);
    const unsaved = flashcards.filter((card) => saveStatus[card.id] !== "saved");
    for (const card of unsaved) {
      await saveFlashcard(card, deckId);
    }
    setIsSavingAll(false);
  };

  const removeFlashcard = (id: string): void => {
    setFlashcards((prev) => prev.filter((card) => card.id !== id));
    setSaveStatus((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const savedCount = flashcards.filter((card) => saveStatus[card.id] === "saved").length;

  return {
    flashcards,
    isGenerating,
    isSavingAll,
    saveStatus,
    savedCount,
    error,
    generateFromFile,
    saveFlashcard,
    saveAllFlashcards,
    removeFlashcard,
  };
}
