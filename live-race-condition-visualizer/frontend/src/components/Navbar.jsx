
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="app-navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-brand-icon">OS</span>
        <span>Synchronization Visualizer</span>
      </Link>

      <div className="navbar-right">
        <span className="navbar-status-dot" />
        <span>Interactive Lab</span>
      </div>
    </header>
  );
}
