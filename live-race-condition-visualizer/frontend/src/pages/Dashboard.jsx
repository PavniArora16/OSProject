import { Link } from "react-router-dom";
import "../styles/problem-pages.css";

const cards = [
  { path: "/race-condition", number: "01", title: "Shared Counter", text: "Compare unsynchronized access with mutex protection.", tag: "Race condition · Mutex" },
  { path: "/producer-consumer", number: "02", title: "Producer–Consumer", text: "Explore bounded-buffer coordination.", tag: "Buffer · Coordination" },
  { path: "/dining-philosophers", number: "03", title: "Dining Philosophers", text: "Understand resource contention and deadlock prevention.", tag: "Deadlock · Prevention" },
  { path: "/readers-writers", number: "04", title: "Readers–Writers", text: "Explore shared reads and exclusive writes.", tag: "Readers · Writers" },
];

export default function Dashboard() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">OPERATING SYSTEMS · INTERACTIVE LAB</p>
        <h1>Live Race Condition Visualizer</h1>
        <p>Explore synchronization problems through real C programs, a Node.js backend, and a live event-driven interface.</p>
        <div className="hero-chips"><span>POSIX Threads</span><span>Mutexes & Semaphores</span><span>Socket.IO Events</span></div>
      </section>
      <div className="section-heading dashboard-heading"><div><h2>Synchronization labs</h2><p>Choose a problem to start exploring.</p></div><span className="event-count">4 labs</span></div>
      <section className="lab-grid">
        {cards.map((card) => (
          <Link className="lab-card" to={card.path} key={card.path}>
            <div className="lab-card-top"><span className="lab-number">{card.number}</span><span className="arrow-mark">↗</span></div>
            <h3>{card.title}</h3><p>{card.text}</p>
            <span className="lab-tag">{card.tag}</span>
            <span className="lab-link">Open visualizer <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </section>
    </main>
  );
}
