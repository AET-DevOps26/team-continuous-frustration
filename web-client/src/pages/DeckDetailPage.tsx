import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/DeckDetailPage.css";

type Flashcard = {
    id: number;
    question: string;
    answer: string;
    source: "AI Generated" | "Manual";
};

const flashcards: Flashcard[] = [
    {
        id: 1,
        question: "What is overfitting?",
        answer: "Overfitting occurs when a model learns the training data too well.",
        source: "AI Generated",
    },
    {
        id: 2,
        question: "What is the bias-variance trade-off?",
        answer: "The bias-variance trade-off refers to the balance between underfitting and overfitting.",
        source: "AI Generated",
    },
    {
        id: 3,
        question: "What is cross-validation?",
        answer: "Cross-validation is a resampling technique used to evaluate model performance.",
        source: "AI Generated",
    },
    {
        id: 4,
        question: "What is regularization?",
        answer: "Regularization is a technique used to prevent overfitting by adding a penalty term.",
        source: "Manual",
    },
    {
        id: 5,
        question: "What is gradient descent?",
        answer: "Gradient descent is an optimization algorithm used to minimize a loss function.",
        source: "AI Generated",
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

export function DeckDetailPage() {
    const navigate = useNavigate();
    const { deckId } = useParams();

    const deckName = getDeckName(deckId);
    const currentDeckId = deckId ?? "machine-learning";

    const handleStudyDueCards = () => {
        navigate(`/study/${currentDeckId}`);
    };

    return (
        <main className="deck-detail-page">
            <header className="deck-detail-topbar">
                <Link to="/" className="deck-detail-brand">
                    <span className="deck-detail-brand-icon">▱</span>
                    <span>AI Anki</span>
                </Link>

                <nav className="deck-detail-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/decks">My Decks</Link>
                    <span>/</span>
                    <Link to={`/decks/${currentDeckId}`} className="active">
                        {deckName}
                    </Link>
                </nav>
            </header>

            <aside className="deck-detail-sidebar">
                <Link to="/" className="deck-detail-sidebar-item">
                    <span>⌂</span>
                    Home
                </Link>

                <Link to="/upload" className="deck-detail-sidebar-item">
                    <span>☁</span>
                    Upload
                </Link>

                <Link to="/decks" className="deck-detail-sidebar-item active">
                    <span>▤</span>
                    My Decks
                </Link>

                <Link to="/study" className="deck-detail-sidebar-item">
                    <span>▣</span>
                    Review
                </Link>
            </aside>

            <section className="deck-detail-content">
                <div className="deck-detail-main">
                    <div className="deck-detail-header">
                        <div>
                            <h1>{deckName}</h1>
                            <p>Review, organize, and study the flashcards in this deck.</p>
                        </div>

                        <button type="button" className="deck-header-menu">
                            ⋮
                        </button>
                    </div>

                    <section className="deck-detail-actions">
                        <button
                            type="button"
                            className="study-due-button"
                            onClick={handleStudyDueCards}
                        >
                            ▷ Study Due Cards
                        </button>

                        <button type="button" className="secondary-deck-button">
                            ＋ Add Flashcard
                        </button>

                        <button type="button" className="secondary-deck-button">
                            ✎ Edit Deck
                        </button>

                        <button type="button" className="small-more-button">
                            …
                        </button>
                    </section>

                    <section className="deck-card-toolbar">
                        <div className="deck-search-box">
                            <span>⌕</span>
                            <input type="text" placeholder="Search cards..." />
                        </div>

                        <select className="deck-filter-select" defaultValue="all-tags">
                            <option value="all-tags">All Tags</option>
                            <option value="ai-generated">AI Generated</option>
                            <option value="manual">Manual</option>
                        </select>

                        <select className="deck-filter-select" defaultValue="all-statuses">
                            <option value="all-statuses">All Statuses</option>
                            <option value="due">Due Today</option>
                            <option value="mastered">Mastered</option>
                        </select>

                        <select className="deck-filter-select" defaultValue="newest">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>

                        <div className="deck-view-toggle">
                            <button type="button" className="active">
                                ☰
                            </button>
                            <button type="button">▦</button>
                        </div>
                    </section>

                    <section className="cards-table-panel">
                        <div className="cards-table-top">
                            <label>
                                <input type="checkbox" />
                                Select all
                            </label>

                            <span>Showing 1–5 of 42 cards</span>
                        </div>

                        <div className="cards-list">
                            {flashcards.map((card) => (
                                <article className="deck-flashcard-row" key={card.id}>
                                    <input type="checkbox" />

                                    <div className="deck-flashcard-content">
                                        <div className="qa-line">
                                            <span className="question-marker">Q</span>
                                            <strong>{card.question}</strong>
                                        </div>

                                        <div className="qa-line">
                                            <span className="answer-marker">A</span>
                                            <p>{card.answer}</p>
                                        </div>
                                    </div>

                                    <span
                                        className={
                                            card.source === "AI Generated"
                                                ? "deck-detail-source-pill ai"
                                                : "deck-detail-source-pill manual"
                                        }
                                    >
                                        {card.source}
                                    </span>

                                    <div className="row-actions">
                                        <button type="button">✎ Edit</button>
                                        <button type="button" className="delete-card-button">
                                            🗑 Delete
                                        </button>
                                        <button type="button">↧ Move</button>
                                        <button type="button">⋮</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <footer className="deck-detail-footer">
                        <span>Showing 1–5 of 42 cards</span>

                        <div className="deck-pagination">
                            <button type="button">‹</button>
                            <button type="button" className="active">
                                1
                            </button>
                            <button type="button">2</button>
                            <button type="button">3</button>
                            <span>…</span>
                            <button type="button">9</button>
                            <button type="button">›</button>
                        </div>
                    </footer>
                </div>
            </section>
        </main>
    );
}