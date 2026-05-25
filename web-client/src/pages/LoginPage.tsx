import { Link } from "react-router-dom";
import "../styles/AuthPage.css";

export function LoginPage() {
    return (
        <main className="auth-page">
            <section className="auth-header">
                <h1>Start your free trial.</h1>
                <p></p>
            </section>

            <section className="auth-card">
                <form className="auth-form">
                    <input
                        className="auth-email-input"
                        type="email"
                        placeholder="Email address"
                    />

                    <input
                        className="auth-email-input"
                        type="password"
                        placeholder="Password"
                    />

                    <button className="auth-primary-button" type="submit">
                        Continue with email
                    </button>
                </form>

                <div className="auth-divider">
                    <span></span>
                    <p>or</p>
                    <span></span>
                </div>

                <div className="auth-provider-list">
                    <button className="auth-provider-button" type="button">
                        <span className="provider-icon google-icon">G</span>
                        <span>Continue with Google</span>
                    </button>

                    <button className="auth-provider-button" type="button">
                        <span className="provider-icon facebook-icon">f</span>
                        <span>Continue with Facebook</span>
                    </button>
                </div>

                <p className="auth-footer">
                    Don&apos;t have an account? <Link to="/register">Register</Link>
                </p>
            </section>
        </main>
    );
}