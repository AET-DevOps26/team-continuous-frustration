import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/StudySessionPage.css";

type ReviewRating = "again" | "hard" | "good" | "easy";

type StudyCard = {
    id: number;
    question: string;
    answer: string;
    keyIdea: string;
};

const studyCards: StudyCard[] = [
    {
        id: 1,
        question: "What is overfitting?",
        answer:
            "Overfitting occurs when a model learns the training data too well, including its noise and outliers, which reduces its ability to generalize to unseen data.",
        keyIdea: "The model performs very well on training data but poorly on new, unseen data.",
    },
    {
        id: 2,
        question: "What is the bias-variance trade-off?",
        answer:
            "The bias-variance trade-off describes the balance between a model that is too simple and a model that is too complex.",
        keyIdea: "Good models balance underfitting and overfitting.",
    },
    {
        id: 3,
        question: "What is cross-validation?",
        answer:
            "Cross-validation is a method for evaluating a model by splitting data into training and validation subsets.",
        keyIdea: "It helps estimate how well a model generalizes to unseen data.",
    },
];

function getDeckName(deckId: string | undefined) {
    if (deckId === "database-systems") return "Database Systems";
    if (deckId === "software-engineering") return "Software Engineering";
    if (deckId === "operating-systems") return "Operating Systems";
    if (deckId === "mathematics") return "Mathematics";
    if (deckId === "german-vocabulary") return "German Vocabulary";
    return "Machine Learning";
}

export function StudySessionPage() {
    const navigate = useNavigate();
    const { deckId } = useParams();

    const deckName = getDeckName(deckId);
    const currentDeckId = deckId ?? "machine-learning";

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(true);
    const [selectedRating, setSelectedRating] = useState<ReviewRating | null>(null);
    const [showExplanation, setShowExplanation] = useState(true);
    const [savedExplanation, setSavedExplanation] = useState(false);

    const currentCard = studyCards[currentIndex];

    const progressPercent = useMemo(() => {
        return Math.round(((currentIndex + 1) / studyCards.length) * 100);
    }, [currentIndex]);

    const handlePrevious = () => {
        setCurrentIndex((current) => Math.max(current - 1, 0));
        setSelectedRating(null);
        setShowAnswer(true);
    };

    const handleNext = () => {
        setCurrentIndex((current) => {
            if (current >= studyCards.length - 1) {
                return current;
            }

            return current + 1;
        });

        setSelectedRating(null);
        setShowAnswer(true);
        setSavedExplanation(false);
    };

    const handleEndSession = () => {
        navigate(`/decks/${currentDeckId}`);
    };

    const handleRating = (rating: ReviewRating) => {
        setSelectedRating(rating);
    };

    const handleSaveExplanation = () => {
        setSavedExplanation(true);
    };

    return (
        <main className="study-session-page">
            <header className="study-topbar">
                <Link to="/" className="study-brand">
                    <span className="study-brand-icon">▱</span>
                    <span>AI Anki</span>
                </Link>

                <nav className="study-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/decks">Review</Link>
                    <span>/</span>
                    <Link to={`/study/${currentDeckId}`} className="active">
                        {deckName} Session
                    </Link>
                </nav>
            </header>

            <aside className="study-sidebar">
                <Link to="/" className="study-sidebar-item">
                    <span>⌂</span>
                    Home
                </Link>

                <Link to="/upload" className="study-sidebar-item">
                    <span>☁</span>
                    Upload
                </Link>

                <Link to="/decks" className="study-sidebar-item">
                    <span>▤</span>
                    My Decks
                </Link>

                <Link to={`/study/${currentDeckId}`} className="study-sidebar-item active">
                    <span>▣</span>
                    Review
                </Link>
            </aside>

            <section className="study-content">
                <div className="study-main">
                    <section className="study-left">
                        <div className="study-header">
                            <h1>Study Session</h1>
                            <p>Focus on one flashcard at a time.</p>
                        </div>

                        <div className="session-progress-card">
                            <div className="session-title">
                                <strong>{deckName}</strong>
                                <span>Session</span>
                            </div>

                            <div className="progress-area">
                                <span>
                                    Card {currentIndex + 1} of {studyCards.length}
                                </span>

                                <div className="progress-track">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>

                                <span>{progressPercent}%</span>
                            </div>
                        </div>

                        <article className="study-card-panel">
                            <div className="question-row">
                                <div className="section-icon question-icon">?</div>

                                <div>
                                    <p className="section-label">Question</p>
                                    <h2>{currentCard.question}</h2>
                                </div>

                                <div className="card-tools">
                                    <button type="button">🔊</button>
                                    <button type="button">♡</button>
                                </div>
                            </div>

                            <div className="answer-toggle-line">
                                <div />
                                <button
                                    type="button"
                                    className="show-answer-button"
                                    onClick={() => setShowAnswer((current) => !current)}
                                >
                                    {showAnswer ? "Hide Answer" : "Show Answer"}
                                    <span>⌄</span>
                                </button>
                                <div />
                            </div>

                            {showAnswer && (
                                <div className="answer-section">
                                    <div className="answer-heading">
                                        <div className="section-icon answer-icon">✓</div>
                                        <p className="section-label answer-label">Answer</p>
                                    </div>

                                    <p className="answer-text">{currentCard.answer}</p>

                                    <div className="key-idea-box">
                                        <span>💡</span>
                                        <p>
                                            <strong>Key idea:</strong> {currentCard.keyIdea}
                                        </p>
                                    </div>

                                    <div className="review-buttons">
                                        <button
                                            type="button"
                                            className={
                                                selectedRating === "again"
                                                    ? "review-button again active"
                                                    : "review-button again"
                                            }
                                            onClick={() => handleRating("again")}
                                        >
                                            <span>☹</span>
                                            Again
                                            <small>&lt; 1 min</small>
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                selectedRating === "hard"
                                                    ? "review-button hard active"
                                                    : "review-button hard"
                                            }
                                            onClick={() => handleRating("hard")}
                                        >
                                            <span>😐</span>
                                            Hard
                                            <small>5 min</small>
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                selectedRating === "good"
                                                    ? "review-button good active"
                                                    : "review-button good"
                                            }
                                            onClick={() => handleRating("good")}
                                        >
                                            <span>☺</span>
                                            Good
                                            <small>15 min</small>
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                selectedRating === "easy"
                                                    ? "review-button easy active"
                                                    : "review-button easy"
                                            }
                                            onClick={() => handleRating("easy")}
                                        >
                                            <span>😄</span>
                                            Easy
                                            <small>4 days</small>
                                        </button>
                                    </div>

                                    <div className="ai-explanation-row">
                                        <div />
                                        <span>or</span>
                                        <div />
                                    </div>

                                    <button
                                        type="button"
                                        className="ask-ai-button"
                                        onClick={() => setShowExplanation(true)}
                                    >
                                        ✨ Ask AI Explanation
                                    </button>
                                </div>
                            )}
                        </article>

                        <div className="session-controls">
                            <button
                                type="button"
                                className="session-secondary-button"
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                            >
                                ← Previous
                            </button>

                            <button
                                type="button"
                                className="session-secondary-button"
                                onClick={handleEndSession}
                            >
                                □ End Session
                            </button>

                            <button
                                type="button"
                                className="next-button"
                                onClick={handleNext}
                                disabled={currentIndex === studyCards.length - 1}
                            >
                                Next →
                            </button>
                        </div>
                    </section>

                    {showExplanation && (
                        <aside className="ai-panel">
                            <div className="ai-panel-header">
                                <h2>✨ AI Explanation</h2>
                                <button type="button" onClick={() => setShowExplanation(false)}>
                                    ×
                                </button>
                            </div>

                            <div className="ai-intro-box">
                                <div className="ai-icon">✿</div>
                                <p>Here's an AI explanation to help you understand better.</p>
                            </div>

                            <section className="ai-section">
                                <h3>Explanation</h3>
                                <p>
                                    Overfitting happens when a machine learning model captures not
                                    only the underlying patterns in the training data but also the
                                    random noise.
                                </p>
                                <p>
                                    As a result, it performs very well on the training set but fails
                                    to generalize to new, unseen data.
                                </p>
                            </section>

                            <section className="ai-section">
                                <h3>Real-world analogy</h3>
                                <p>
                                    It is like memorizing the answers to practice test questions
                                    instead of understanding the concepts. You might ace the
                                    practice test but struggle on the real exam.
                                </p>
                            </section>

                            <section className="ai-section">
                                <h3>How to prevent it</h3>
                                <ul>
                                    <li>Use more training data</li>
                                    <li>Apply regularization L1/L2</li>
                                    <li>Use simpler models</li>
                                    <li>Apply dropout or early stopping</li>
                                </ul>
                            </section>

                            <button
                                type="button"
                                className="save-explanation-button"
                                onClick={handleSaveExplanation}
                            >
                                ＋ {savedExplanation ? "Saved as New Flashcard" : "Save as New Flashcard"}
                            </button>

                            <div className="helpful-row">
                                <span>Was this explanation helpful?</span>

                                <div>
                                    <button type="button">👍</button>
                                    <button type="button">👎</button>
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </section>
        </main>
    );
}