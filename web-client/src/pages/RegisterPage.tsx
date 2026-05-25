import { Link } from "react-router-dom";
import "../styles/AuthPage.css";

export function RegisterPage() {
    return (
        <main className="auth-page">
            <section className="auth-header">
                <h1>Create your account.</h1>
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
                        type="text"
                        placeholder="Username"
                    />

                    <input
                        className="auth-email-input"
                        type="password"
                        placeholder="Password"
                    />

                    <input
                        className="auth-email-input"
                        type="password"
                        placeholder="Confirm password"
                    />

                    <button className="auth-primary-button" type="submit">
                        Create account
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
                        Continue with Google
                    </button>

                    <button className="auth-provider-button" type="button">
                        <span className="provider-icon facebook-icon">f</span>
                        Continue with Facebook
                    </button>
                </div>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </p>
            </section>
        </main>
    );
}