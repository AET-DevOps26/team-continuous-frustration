import { Link, useNavigate } from "react-router-dom";
import "../styles/DecksPage.css";

type Deck = {
    id: string;
    name: string;
    category: string;
    cards: number;
    dueToday: number;
    progress: number;
    updated: string;
    accent: "purple" | "blue" | "green" | "orange";
};

const decks: Deck[] = [
    {
        id: "machine-learning",
        name: "Machine Learning",
        category: "AI / Data Science",
        cards: 42,
        dueToday: 7,
        progress: 83,
        updated: "Updated 2 hours ago",
        accent: "purple",
    },
    {
        id: "database-systems",
        name: "Database Systems",
        category: "Computer Science",
        cards: 28,
        dueToday: 3,
        progress: 64,
        updated: "Updated 1 day ago",
        accent: "blue",
    },
    {
        id: "software-engineering",
        name: "Software Engineering",
        category: "Computer Science",
        cards: 36,
        dueToday: 0,
        progress: 100,
        updated: "Updated 3 hours ago",
        accent: "green",
    },
    {
        id: "operating-systems",
        name: "Operating Systems",
        category: "Computer Science",
        cards: 18,
        dueToday: 5,
        progress: 72,
        updated: "Updated 2 days ago",
        accent: "orange",
    },
    {
        id: "mathematics",
        name: "Mathematics",
        category: "Math",
        cards: 24,
        dueToday: 2,
        progress: 58,
        updated: "Updated 5 hours ago",
        accent: "purple",
    },
    {
        id: "german-vocabulary",
        name: "German Vocabulary",
        category: "Languages",
        cards: 65,
        dueToday: 11,
        progress: 36,
        updated: "Updated 1 day ago",
        accent: "orange",
    },
];

export function DecksPage() {
    const navigate = useNavigate();

    const handleOpenDeck = (deckId: string) => {
        navigate(`/decks/${deckId}`);
    };

    const handleStudyDeck = (deckId: string) => {
        navigate(`/study/${deckId}`);
    };

    return (
        <main className="decks-page">
            <header className="decks-topbar">
                <Link to="/" className="decks-brand">
                    <span className="decks-brand-icon">▱</span>
                    <span>AI Anki</span>
                </Link>

                <nav className="decks-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/decks" className="active">
                        My Decks
                    </Link>
                </nav>
            </header>

            <aside className="decks-sidebar">
                <Link to="/" className="decks-sidebar-item">
                    <span>⌂</span>
                    Home
                </Link>

                <Link to="/upload" className="decks-sidebar-item">
                    <span>☁</span>
                    Upload
                </Link>

                <Link to="/decks" className="decks-sidebar-item active">
                    <span>▤</span>
                    My Decks
                </Link>

                <Link to="/study" className="decks-sidebar-item">
                    <span>▣</span>
                    Review
                </Link>
            </aside>

            <section className="decks-content">
                <div className="decks-main">
                    <div className="decks-header">
                        <h1></h1>
                        <p>
                        </p>
                    </div>

                    <section className="decks-toolbar">
                        <div className="search-box">
                            <span>⌕</span>
                            <input type="text" placeholder="Search decks..." />
                        </div>

                        <select className="sort-select" defaultValue="recent">
                            <option value="recent">Recently updated</option>
                            <option value="cards">Most cards</option>
                            <option value="due">Due today</option>
                            <option value="name">Name</option>
                        </select>

                        <div className="view-toggle">
                            <button type="button" className="active">
                                ▦
                            </button>
                            <button type="button">☰</button>
                        </div>

                        <button type="button" className="new-deck-main-button">
                            ＋ New Deck
                        </button>
                    </section>

                    <section className="deck-grid">
                        {decks.map((deck) => (
                            <article className="deck-card" key={deck.id}>
                                <div className="deck-card-header">
                                    <div className={`deck-icon ${deck.accent}`}>
                                        {deck.accent === "purple" && "✿"}
                                        {deck.accent === "blue" && "▣"}
                                        {deck.accent === "green" && "</>"}
                                        {deck.accent === "orange" && "▦"}
                                    </div>

                                    <div className="deck-title-block">
                                        <h2>{deck.name}</h2>
                                        <span className={`deck-category ${deck.accent}`}>
                                            {deck.category}
                                        </span>
                                    </div>

                                    <button type="button" className="deck-menu-button">
                                        ⋮
                                    </button>
                                </div>

                                <div className="deck-numbers">
                                    <div>
                                        <strong>{deck.cards}</strong>
                                        <span>Cards</span>
                                    </div>

                                    <div className="divider" />

                                    <div>
                                        <strong className={deck.dueToday > 0 ? "due" : "none"}>
                                            {deck.dueToday}
                                        </strong>
                                        <span>Due today</span>
                                    </div>
                                </div>

                                <div className="deck-progress-row">
                                    <div className="progress-track">
                                        <div
                                            className={`progress-fill ${deck.accent}`}
                                            style={{ width: `${deck.progress}%` }}
                                        />
                                    </div>
                                    <span>{deck.progress}%</span>
                                </div>

                                <p className="deck-updated">{deck.updated}</p>

                                <div className="deck-actions">
                                    <button
                                        type="button"
                                        className="open-deck-button"
                                        onClick={() => handleOpenDeck(deck.id)}
                                    >
                                        Open Deck
                                    </button>

                                    <button
                                        type="button"
                                        className="study-now-button"
                                        onClick={() => handleStudyDeck(deck.id)}
                                    >
                                        Study Now
                                    </button>

                                    <button type="button" className="bookmark-button">
                                        ♡
                                    </button>
                                </div>
                            </article>
                        ))}
                    </section>

                    <footer className="decks-footer">
                        <span>Showing 1–6 of 6 decks</span>

                        <div className="pagination">
                            <button type="button">‹</button>
                            <button type="button" className="active">
                                1
                            </button>
                            <button type="button">›</button>
                        </div>
                    </footer>
                </div>
            </section>
        </main>
    );
}