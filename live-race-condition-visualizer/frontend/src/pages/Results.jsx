import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/problem-pages.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Results() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/simulations`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.message || `Request failed (${response.status})`);
        return Array.isArray(body) ? body : (body.simulations || body.data || []);
      })
      .then((data) => { if (active) setItems(data); })
      .catch((err) => { if (active) setError(err.message || "Unable to load simulation history."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="page-shell">
      <div className="page-heading"><div><p className="eyebrow">RUN HISTORY</p><h1>Simulation Results</h1><p className="page-subtitle">Past simulations returned by the backend API.</p></div><Link className="secondary-link" to="/">Dashboard</Link></div>
      {loading && <div className="empty-state">Loading simulation history…</div>}
      {error && <div className="error-box" role="alert">{error}<p>Check the backend response shape for GET /api/simulations.</p></div>}
      {!loading && !error && items.length === 0 && <div className="empty-state"><strong>No history returned</strong><span>Run a simulation first, then revisit this page.</span></div>}
      {items.length > 0 && <section className="history-list">{items.map((item, index) => {
        const id = item.simulationId || item.id || `run-${index}`;
        return <article className="history-item" key={id}><div><strong>{item.problem || "Simulation"}</strong><p>{item.mode || "default mode"} · {item.status || "unknown status"}</p></div><code>{id}</code></article>;
      })}</section>}
    </main>
  );
}
