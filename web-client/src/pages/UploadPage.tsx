import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import type { BodyDocumentsUploadPostApiV1DocumentsUploadPost } from '@/api/upload'
import { documentsUploadPostApiV1DocumentsUploadPost } from '@/api/upload'
import type { ApiV1GenaiGenerateFlashcardsPostApiV1GenaiGenerateFlashcardsPostParams, Flashcard } from '@/api/genaiStream'
import { apiV1GenaiGenerateFlashcardsPostApiV1GenaiGenerateFlashcardsPost } from '@/api/genaiStream'
import type { Deck } from '@/api/study';
import { listDecks, createDeckFlashcardRecord } from '@/api/study';
import type { FlashcardCreateRequest } from '@/api/flashcard'
import { createFlashcard } from '@/api/flashcard'

export function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [decksLoading, setDecksLoading] = useState<boolean>(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  //const testDeck: Deck = {"id": "123", "name": "Deck 1", "tags": []};

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await listDecks();
        setDecks(res.data);
        if (res.data.length > 0) setSelectedDeckId(res.data[0].id);
      } catch (error) {
        console.error("Failed to load decks:", error);
      } finally {
        setDecksLoading(false);
      }
    };
    fetchDecks();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadAndGenerate = async () => {
    setIsGenerating(true);
    const body: BodyDocumentsUploadPostApiV1DocumentsUploadPost = {
      file: selectedFile!,
    };

    let uploadId: string = "";
    try {
      const res = await documentsUploadPostApiV1DocumentsUploadPost(body);
      uploadId = res.data.upload_id;
      console.log("Upload successful:", uploadId);
    } catch (error) {
      console.error("Upload failed:", error);
      // Handle error (e.g., show a toast notification)
    }

    const params: ApiV1GenaiGenerateFlashcardsPostApiV1GenaiGenerateFlashcardsPostParams = {
      upload_id: uploadId!,
    };

    try {
      const res = await apiV1GenaiGenerateFlashcardsPostApiV1GenaiGenerateFlashcardsPost(params, { credentials: 'include' });
      if (res.status === 200) {
        const stream = res.stream

        if (!stream.body) {
          throw new Error("No body in response");
        }
        await readFlashcardsStream(stream.body);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Generate failed:", error);
    }
  };

  const readFlashcardsStream = async (readableStream: ReadableStream<Uint8Array>) => {
    const reader = readableStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const flashcard = JSON.parse(line.trim()) as Flashcard;
            console.log("Parsed flashcard:", flashcard);
            setFlashcards((prev) => [...prev, flashcard]);
          } catch (error) {
            console.error("Failed to parse flashcard:", error);
          }
        }
      }
    }
  }

  const removeFlashcard = (idx: number) => {
    setFlashcards((prev) => prev.filter((_, i) => i !== idx));
  }

  const saveFlashcard = async (flashcard: Flashcard, idx: number) => {
    if (!selectedDeckId) return;
    const body: FlashcardCreateRequest = {
      question: flashcard.question,
      answer: flashcard.answer,
      source_ref: flashcard.source_ref,
    };
    try {
      const created = await createFlashcard(body);
      await createDeckFlashcardRecord(selectedDeckId, { flashcard_id: created.data.id });
      removeFlashcard(idx);
    } catch (error) {
      console.error(error);
    }
  }




  const formatFileSize = (size: number) => `${(size / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Upload Slides</h1>
        <p className="mt-2 text-muted-foreground">
          Upload your course slides and let AI transform them into smart flashcards.
        </p>
      </div>

      {flashcards.length === 0 ? (
        <div className="mx-auto max-w-xl">
          {!decksLoading && decks.length === 0 ? (
            <div className="card-shadow mb-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                You need a deck before you can generate flashcards.
              </p>
              <Button onClick={() => navigate("/decks")}>Create a deck</Button>
            </div>
          ) : (
            <div className="card-shadow mb-6 space-y-1.5 rounded-2xl border border-border bg-card p-4">
              <Label htmlFor="deck">Save flashcards to deck</Label>
              <div className="flex items-center gap-2">
                <select
                  id="deck"
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  disabled={decksLoading}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>{deck.name}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={() => navigate("/decks")}>
                  + New Deck
                </Button>
              </div>
            </div>
          )}

          <div
            className={`card-shadow flex flex-col items-center rounded-3xl border-2 border-dashed bg-card p-12 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Upload className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">Drag & drop your file here</h2>
            <p className="mt-1 text-sm text-muted-foreground">PDF or PPTX · max 50 MB</p>
            <Button variant="outline" className="mt-6" onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {selectedFile && (
            <div className="card-shadow mt-4 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                className="text-muted-foreground transition-colors hover:text-foreground"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Button
            className="mt-6 w-full"
            disabled={!selectedFile || !selectedDeckId || isGenerating}
            onClick={handleUploadAndGenerate}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate Flashcards"
            )}
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Your files are processed securely and used only for flashcard generation.
          </p>
        </div>
      ) : (
        <div className="card-shadow overflow-hidden rounded-3xl border border-border bg-card">
          {flashcards.map((card, idx) => (
            <article
              key={card.id}
              className={`flex items-start gap-4 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${idx < flashcards.length - 1 ? "border-b border-border" : ""}`}
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

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => await saveFlashcard(card, idx)}
                    >Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeFlashcard(idx)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {isGenerating && (
        <div className="mt-6 flex w-full items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>Generating Flashcards...</p>
        </div>
      )}
      {flashcards.length > 0 && !isGenerating && (
        <div className="mt-6 flex w-full items-center justify-center">
          <p>Finished Generating Flashcards!</p>
        </div>
      )}
    </main>
  );
}
