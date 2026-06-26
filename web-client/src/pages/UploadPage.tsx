import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

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

  const formatFileSize = (size: number) => `${(size / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Upload Slides</h1>
        <p className="mt-2 text-muted-foreground">
          Upload your course slides and let AI transform them into smart flashcards.
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div
          className={`card-shadow flex flex-col items-center rounded-3xl border-2 border-dashed bg-card p-12 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
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
          disabled={!selectedFile}
          onClick={() => navigate("/cards")}
        >
          ✨ Generate Flashcards
        </Button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Your files are processed securely and used only for flashcard generation.
        </p>
      </div>
    </main>
  );
}
