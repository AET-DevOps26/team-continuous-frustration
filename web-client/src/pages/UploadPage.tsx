import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/UploadPage.css";

export function UploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleGenerateFlashcards = () => {

        navigate("/cards");
    };

    const formatFileSize = (size: number) => {
        const sizeInMB = size / (1024 * 1024);
        return `${sizeInMB.toFixed(2)} MB`;
    };

    return (
        <main className="upload-page">
            <header className="upload-topbar">
                <Link to="/" className="upload-brand">
                    <span className="brand-icon">▱</span>
                    <span>AI Anki</span>
                </Link>

                <nav className="upload-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/upload" className="active">
                        Upload
                    </Link>
                    <span>/</span>
                    <Link to="/cards">Generate Flashcards</Link>
                </nav>
            </header>

            <aside className="upload-sidebar">
                <Link to="/" className="sidebar-item">
                    <span>⌂</span>
                    Home
                </Link>

                <Link to="/upload" className="sidebar-item active">
                    <span>☁</span>
                    Upload
                </Link>

                <Link to="/decks" className="sidebar-item">
                    <span>▤</span>
                    Decks
                </Link>

                <Link to="/study" className="sidebar-item">
                    <span>▣</span>
                    Review
                </Link>
            </aside>

            <section className="upload-content">
                <div className="upload-main">
                    <h1></h1>

                    <p className="upload-subtitle">
                        Upload your course slides and let AI transform them into smart flashcards.
                    </p>

                    <div className="dropzone">
                        <div className="cloud-icon">☁</div>

                        <h2>Drag & drop your file here</h2>
                        <p>or</p>

                        <button
                            className="choose-file-button"
                            type="button"
                            onClick={handleChooseFile}
                        >
                            <span>▣</span>
                            Choose File
                        </button>

                        <input
                            ref={fileInputRef}
                            className="hidden-file-input"
                            type="file"
                            accept=".pdf,.ppt,.pptx"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="upload-info-row">
                        <span>Supported files: PDF, PPTX</span>
                        <span>Max file size: 50MB</span>
                    </div>

                    {selectedFile ? (
                        <div className="selected-file-card">
                            <div className="file-left">
                                <div className="pdf-icon">PDF</div>

                                <div>
                                    <h3>{selectedFile.name}</h3>
                                    <p>{formatFileSize(selectedFile.size)}</p>
                                </div>
                            </div>

                            <div className="file-actions">
                                <span className="file-check">✓</span>

                                <button
                                    className="remove-file-button"
                                    type="button"
                                    onClick={handleRemoveFile}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="selected-file-card empty-file-card">
                            <div className="file-left">
                                <div className="pdf-icon muted">PDF</div>

                                <div>
                                    <h3>No file selected</h3>
                                    <p>Please choose a PDF or PPTX file first.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        className="generate-button"
                        type="button"

                        onClick={handleGenerateFlashcards}
                    >
                        ✨ Generate Flashcards
                    </button>

                    <p className="security-note">
                        🔒 Your files are secure and will be processed only for flashcard generation.
                    </p>
                </div>
            </section>
        </main>
    );
}