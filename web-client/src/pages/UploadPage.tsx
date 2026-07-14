import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Upload, FileText, X, Lock, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useFlashcardGeneration } from "@/hooks/useFlashcardGeneration";
import type { SaveStatus } from "@/hooks/useFlashcardGeneration";

export function UploadPage() {
  const {
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
  } = useFlashcardGeneration();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleGenerate = () => {
    if (selectedFile) generateFromFile(selectedFile);
  };

  const formatFileSize = (size: number) => `${(size / (1024 * 1024)).toFixed(2)} MB`;

  const allSaved = flashcards.length > 0 && savedCount === flashcards.length;

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
            disabled={!selectedFile || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? "Generating..." : "Generate Flashcards"}
          </Button>

          {error && (
            <p className="mt-4 text-center text-sm text-destructive">{error}</p>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Your files are processed securely and used only for flashcard generation.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {flashcards.length} generated · {savedCount} saved
            </p>
            <Button
              onClick={saveAllFlashcards}
              disabled={isSavingAll || allSaved}
            >
              {isSavingAll ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...</>
              ) : allSaved ? (
                <><Check className="mr-1.5 h-4 w-4" /> All Saved</>
              ) : (
                "Save All"
              )}
            </Button>
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

                <div className="flex flex-shrink-0 items-center gap-1">
                  <FlashcardSaveButton
                    status={saveStatus[card.id] ?? "idle"}
                    onSave={() => saveFlashcard(card)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeFlashcard(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {isGenerating && (
            <div className="mt-6 flex w-full items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Generating more flashcards...</p>
            </div>
          )}
          {error && (
            <p className="mt-6 text-center text-sm text-destructive">{error}</p>
          )}
        </>
      )}
    </main>
  );
}

function FlashcardSaveButton({
  status,
  onSave,
}: {
  status: SaveStatus;
  onSave: () => void;
}) {
  if (status === "saved") {
    return (
      <Button variant="ghost" size="sm" disabled className="text-green-600">
        <Check className="mr-1.5 h-4 w-4" /> Saved
      </Button>
    );
  }

  if (status === "saving") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSave}
      className={status === "error" ? "text-destructive hover:text-destructive" : ""}
    >
      {status === "error" ? "Retry" : "Save"}
    </Button>
  );
}
