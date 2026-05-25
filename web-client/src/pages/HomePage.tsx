import { Link } from "react-router-dom";
import "../styles/HomePage.css";

type FeatureItem = {
    id: string;
    title: string;
    description: string;
    path: string;
};

const features: FeatureItem[] = [
    {
        id: "I",
        title: "Upload Course Slides",
        description: "Upload PDFs, lecture slides, notes, and generate AI flashcards.",
        path: "/upload",
    },
    {
        id: "II",
        title: "My Decks",
        description: "Organize, edit, and manage your generated flashcard decks.",
        path: "/decks",
    },
    {
        id: "III",
        title: "Start Review",
        description: "Review due flashcards with active recall and spaced repetition.",
        path: "/study",
    },
];

export function HomePage() {
    return (
        <main className="home-page">
            <header className="top-nav">
                <div className="nav-left">
                    <Link to="/" className="brand-name">
                        Anki
                    </Link>

                    <button className="nav-link" type="button">
                        Search
                    </button>
                </div>

                <div className="nav-right">
                    <Link to="/login" className="login-button">
                        Login
                    </Link>
                    <Link to="/register" className="register-button">
                        Register
                    </Link>
                </div>
            </header>

            <section className="hero">
                <div className="floating-title">
                    <p></p>
                    <h1></h1>
                </div>

                <div className="feature-panel">
                    <div className="panel-header">
                        <p className="panel-kicker">You can learn everything</p>

                        <h2>
                            <br />
                        </h2>

                        <p className="panel-subtitle"></p>
                    </div>

                    <div className="feature-list">
                        {features.map((feature) => (
                            <Link to={feature.path} className="feature-row" key={feature.id}>
                                <div className="feature-text">
                                    <span>{feature.title}</span>
                                    <p>{feature.description}</p>
                                </div>

                                <div className="feature-number">{feature.id}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}