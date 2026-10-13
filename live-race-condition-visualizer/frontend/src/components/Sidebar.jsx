
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "⌂", end: true },
  { to: "/race-condition", label: "Shared Counter", icon: "↔" },
  { to: "/producer-consumer", label: "Producer–Consumer", icon: "⇄" },
  { to: "/dining-philosophers", label: "Dining Philosophers", icon: "◉" },
  { to: "/readers-writers", label: "Readers–Writers", icon: "▤" },
  { to: "/results", label: "Results History", icon: "◷" },
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-heading">WORKSPACE</div>

      <nav className="sidebar-nav">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-dot" />
        C Engine · POSIX Threads
      </div>
    </aside>
  );
}
