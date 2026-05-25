import { NavLink } from "react-router-dom";

export function Navbar() {
    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand">
                AI-based Anki
            </NavLink>

            <div className="navbar-links">
                <NavLink to="/upload">Upload</NavLink>
                <NavLink to="/library">Library</NavLink>
                <NavLink to="/cards">Card Studio</NavLink>
                <NavLink to="/study">Study</NavLink>
                <NavLink to="/timeline">Memory Timeline</NavLink>
            </div>

            <div className="navbar-actions">
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register" className="navbar-register">
                    Register
                </NavLink>
            </div>
        </nav>
    );
}