import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/CardStudioPage.css";

type CardStatus = "ready" | "edited" | "deleted";

type Flashcard = {
    id: number;
    question: string;
    answer: string;
    status: CardStatus;
};

const initialFlashcards: Flashcard[] = [
    {
        id: 1,
        question: "What is overfitting?",
        answer:
            "Overfitting occurs when a model learns the training data too well, including its noise and outliers, which reduces its ability to generalize to unseen data.",
        status: "ready",
    },
    {
        id: 2,
        question: "What is the bias-variance trade-off?",
        answer:
            "The bias-variance trade-off describes the balance between underfitting and overfitting in machine learning models.",
        status: "ready",
    },
    {
        id: 3,
        question: "What is cross-validation?",
        answer:
            "Cross-validation is a technique used to evaluate a model by splitting data into training and validation subsets.",
        status: "edited",
    },
    {
        id: 4,
        question: "What is the difference between training and test data?",
        answer:
            "Training data is used to train the model, while test data is used to evaluate how well the model generalizes.",
        status: "ready",
    },
    {
        id: 5,
        question: "What is regularization?",
        answer:
            "Regularization is a technique used to reduce overfitting by adding a penalty term to the model's loss function.",
        status: "edited",
    },
    {
        id: 6,
        question: "What is the purpose of a loss function?",
        answer:
            "A loss function measures how far a model's prediction is from the correct answer.",
        status: "deleted",
    },
];

export function CardStudioPage() {
    const navigate = useNavigate();

    const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
    const [selectedCardId, setSelectedCardId] = useState<number>(1);
    const [selectedDeck, setSelectedDeck] = useState("machine-learning");
    const [isSaved, setIsSaved] = useState(false);

    const selectedCard = flashcards.find((card) => card.id === selectedCardId) ?? flashcards[0];

    const activeCards = useMemo(
        () => flashcards.filter((card) => card.status !== "deleted"),
        [flashcards]
    );

    const readyToSaveCount = activeCards.length;

    const updateSelectedCard = (field: "question" | "answer", value: string) => {
        setFlashcards((currentCards) =>
            currentCards.map((card) =>
                card.id === selectedCardId
                    ? {
                        ...card,
                        [field]: value,
                        status: card.status === "deleted" ? "deleted" : "edited",
                    }
                    : card
            )
        );

        setIsSaved(false);
    };

    const handleSaveChanges = () => {
        setFlashcards((currentCards) =>
            currentCards.map((card) =>
                card.id === selectedCardId && card.status !== "deleted"
                    ? { ...card, status: "ready" }
                    : card
            )
        );
    };

    const handleDeleteCard = () => {
        setFlashcards((currentCards) =>
            currentCards.map((card) =>
                card.id === selectedCardId ? { ...card, status: "deleted" } : card
            )
        );

        const nextCard = flashcards.find(
            (card) => card.id !== selectedCardId && card.status !== "deleted"
        );

        if (nextCard) {
            setSelectedCardId(nextCard.id);
        }

        setIsSaved(false);
    };

    const handleRestoreCard = (cardId: number) => {
        setFlashcards((currentCards) =>
            currentCards.map((card) =>
                card.id === cardId ? { ...card, status: "ready" } : card
            )
        );

        setSelectedCardId(cardId);
        setIsSaved(false);
    };

    const handleImproveWithAI = () => {
        updateSelectedCard(
            "answer",
            `${selectedCard.answer}\n\nAI improved explanation: This concept is important because it helps students understand how models behave on unseen data.`
        );
    };

    const handleSaveAllToDeck = () => {
        setIsSaved(true);
    };

    const handleViewDeck = () => {
        navigate(`/decks/${selectedDeck}`);
    };

    const handleStartStudying = () => {
        navigate(`/study/${selectedDeck}`);
    };

    return (
        <main className="card-studio-page">
            <header className="studio-topbar">
                <Link to="/" className="studio-brand">
                    <span className="studio-brand-icon">▱</span>
                    <span>AI Anki</span>
                </Link>

                <nav className="studio-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/upload">Upload</Link>
                    <span>/</span>
                    <Link to="/cards" className="active">
                        Card Studio
                    </Link>
                </nav>
            </header>

            <aside className="studio-sidebar">
                <Link to="/" className="studio-sidebar-item">
                    <span>⌂</span>
                    Home
                </Link>

                <Link to="/upload" className="studio-sidebar-item active">
                    <span>☁</span>
                    Upload
                </Link>

                <Link to="/decks" className="studio-sidebar-item">
                    <span>▤</span>
                    My Decks
                </Link>

                <Link to="/study" className="studio-sidebar-item">
                    <span>▣</span>
                    Review
                </Link>
            </aside>

            <section className="studio-content">
                <div className="studio-main">
                    <div className="studio-header">
                        <h1></h1>
                        <p></p>

                        <div className="source-pill">
                            <span>▧</span>
                            Generated from:
                            <strong>machine-learning-week3.pdf</strong>
                        </div>
                    </div>

                    <div className="studio-grid">
                        <section className="generated-panel">
                            <div className="generated-header">
                                <div>
                                    <h2>Generated Flashcards</h2>
                                    <span>{flashcards.length}</span>
                                </div>

                                <select className="filter-select" defaultValue="all">
                                    <option value="all">All</option>
                                    <option value="ready">Ready</option>
                                    <option value="edited">Edited</option>
                                    <option value="deleted">Deleted</option>
                                </select>
                            </div>

                            <div className="flashcard-list">
                                {flashcards.map((card) => (
                                    <button
                                        key={card.id}
                                        type="button"
                                        className={`flashcard-list-item ${selectedCardId === card.id ? "selected" : ""
                                            } ${card.status}`}
                                        onClick={() => setSelectedCardId(card.id)}
                                    >
                                        <div className="card-list-top">
                                            <span className={`status-dot ${card.status}`} />
                                            <span className={`status-label ${card.status}`}>
                                                {card.status}
                                            </span>
                                            <span className="card-number">{card.id}</span>
                                        </div>

                                        <p>{card.question}</p>

                                        {card.status === "deleted" && (
                                            <span
                                                className="restore-link"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleRestoreCard(card.id);
                                                }}
                                            >
                                                Restore
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="list-footer">
                                <span>
                                    Showing 1–{flashcards.length} of {flashcards.length}
                                </span>

                                <div className="list-footer-buttons">
                                    <button type="button">⌃</button>
                                    <button type="button">⌄</button>
                                </div>
                            </div>
                        </section>

                        <section className="editor-panel">
                            <label className="editor-label" htmlFor="question">
                                Question
                            </label>

                            <textarea
                                id="question"
                                className="editor-textarea question-box"
                                value={selectedCard.question}
                                disabled={selectedCard.status === "deleted"}
                                onChange={(event) =>
                                    updateSelectedCard("question", event.target.value)
                                }
                            />

                            <div className="character-count">
                                {selectedCard.question.length} / 500
                            </div>

                            <label className="editor-label" htmlFor="answer">
                                Answer
                            </label>

                            <textarea
                                id="answer"
                                className="editor-textarea answer-box"
                                value={selectedCard.answer}
                                disabled={selectedCard.status === "deleted"}
                                onChange={(event) =>
                                    updateSelectedCard("answer", event.target.value)
                                }
                            />

                            <div className="character-count">
                                {selectedCard.answer.length} / 1500
                            </div>

                            <div className="editor-actions">
                                <button
                                    type="button"
                                    className="primary-action"
                                    disabled={selectedCard.status === "deleted"}
                                    onClick={handleSaveChanges}
                                >
                                    ✓ Save Changes
                                </button>

                                <button
                                    type="button"
                                    className="danger-action"
                                    disabled={selectedCard.status === "deleted"}
                                    onClick={handleDeleteCard}
                                >
                                    🗑 Delete
                                </button>

                                <button
                                    type="button"
                                    className="ghost-action"
                                    disabled={selectedCard.status === "deleted"}
                                    onClick={handleImproveWithAI}
                                >
                                    ✨ Ask AI to improve
                                </button>
                            </div>
                        </section>
                    </div>

                    <section className="save-panel">
                        <div className="save-left">
                            <label htmlFor="deck">Save to deck</label>

                            <div className="deck-row">
                                <select
                                    id="deck"
                                    className="deck-select"
                                    value={selectedDeck}
                                    onChange={(event) => {
                                        setSelectedDeck(event.target.value);
                                        setIsSaved(false);
                                    }}
                                >
                                    <option value="machine-learning">Machine Learning</option>
                                    <option value="database-systems">Database Systems</option>
                                    <option value="software-engineering">Software Engineering</option>
                                </select>

                                <button type="button" className="new-deck-button">
                                    + New Deck
                                </button>
                            </div>
                        </div>

                        <div className="save-actions">
                            {!isSaved ? (
                                <button
                                    type="button"
                                    className="save-all-button"
                                    onClick={handleSaveAllToDeck}
                                >
                                    ⇩ Save All to Deck
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="view-deck-button"
                                        onClick={handleViewDeck}
                                    >
                                        View Deck
                                    </button>

                                    <button
                                        type="button"
                                        className="start-study-button"
                                        onClick={handleStartStudying}
                                    >
                                        ✨ Start Studying
                                    </button>
                                </>
                            )}
                        </div>
                    </section>

                    <div className="studio-status-bar">
                        <span>{flashcards.length} flashcards generated</span>
                        <span>•</span>
                        <span>{readyToSaveCount} ready to save</span>
                        {isSaved && (
                            <>
                                <span>•</span>
                                <strong>Saved successfully</strong>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
