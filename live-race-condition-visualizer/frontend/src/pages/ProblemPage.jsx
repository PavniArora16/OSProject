import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "../styles/problem-pages.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || API_BASE;

const PROBLEMS = {
  shared_counter: {
    title: "Shared Counter",
    subtitle: "Observe how unsynchronized access differs from mutex-protected access.",
    modes: [
      { value: "race", label: "Race condition" },
      { value: "mutex", label: "Mutex protected" },
    ],
    description: "Four threads each perform 100,000 increments. In mutex mode, the critical section is protected. In race mode, concurrent unsynchronized updates can be lost; the exact result can vary between runs.",
  },
  producer_consumer: {
    title: "Producer–Consumer",
    subtitle: "Explore coordination between producers, consumers, and a bounded buffer.",
    modes: [],
    description: "Producers add items and consumers remove them. Correct synchronization prevents the buffer from overflowing or consumers from taking items from an empty buffer.",
  },
  dining_philosophers: {
    title: "Dining Philosophers",
    subtitle: "Explore competing threads and resource acquisition.",
    modes: [
      { value: "deadlock", label: "Deadlock demonstration" },
      { value: "prevention", label: "Deadlock prevention" },
    ],
    description: "Philosophers compete for shared forks. The prevention mode should be interpreted according to the strategy implemented by your C engine.",
  },
  readers_writers: {
    title: "Readers–Writers",
    subtitle: "Explore shared reads and exclusive writes.",
    modes: [],
    description: "Readers may share access while a writer typically needs exclusive access. Fairness and starvation behavior depend on the policy implemented by your C engine.",
  },
};

function getSimulationId(payload) {
  return payload?.simulation?.simulationId ||
    payload?.simulation?.id ||
    payload?.simulationId ||
    payload?.id ||
    null;
}

function getEvents(payload) {
  const list = payload?.simulation?.events || payload?.events;
  return Array.isArray(list) ? list : [];
}

function prettyEvent(event) {
  if (typeof event === "string") return event;
  const name = event?.event || event?.type || "event";
  const details = Object.entries(event || {})
    .filter(([key, value]) => key !== "event" && key !== "type" && key !== "simulationId" && value !== null && value !== undefined)
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
    .join(" · ");
  return details ? `${name.replaceAll("_", " ")} — ${details}` : name.replaceAll("_", " ");
}

export default function ProblemPage({ problem }) {
  const config = PROBLEMS[problem];
  const [mode, setMode] = useState(config?.modes?.[0]?.value || "");
  const [status, setStatus] = useState("idle");
  const [simulationId, setSimulationId] = useState(null);
  const [events, setEvents] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("connecting");
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const seenEventsRef = useRef(new Set());

  const addEvent = useCallback((event) => {
    if (!event) return;
    const key = JSON.stringify(event);
    if (seenEventsRef.current.has(key)) return;
    seenEventsRef.current.add(key);
    setEvents((current) => [...current, event].slice(-500));
  }, []);

  const refreshSimulation = useCallback(async (id) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE}/api/simulations/${encodeURIComponent(id)}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.message || `Could not retrieve simulation (${response.status})`);
      const simulation = body?.simulation || body;
      for (const event of getEvents(body)) addEvent(event);
      if (simulation?.result) setResult(simulation.result);
      if (simulation?.status) {
        setStatus(simulation.status);
        if (["completed", "failed", "stopped", "cancelled"].includes(simulation.status)) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      }
    } catch (err) {
      setError(err.message || "Could not refresh simulation details.");
    }
  }, [addEvent]);

  useEffect(() => {
    const socket = io(SOCKET_BASE, { transports: ["websocket", "polling"], reconnection: true });
    socketRef.current = socket;
    socket.on("connect", () => setConnection("connected"));
    socket.on("disconnect", () => setConnection("disconnected"));
    socket.on("connect_error", () => setConnection("disconnected"));

    const onSimulationEvent = (event) => {
      if (!event || !simulationId || event.simulationId !== simulationId) return;
      addEvent(event);
    };
    const onFinished = (payload) => {
      const finishedId = payload?.simulationId || payload?.simulation?.simulationId;
      if (finishedId && finishedId === simulationId) {
        setResult(payload?.result || payload?.simulation?.result || payload);
        setStatus(payload?.status || payload?.simulation?.status || "completed");
        refreshSimulation(finishedId);
      }
    };
    socket.on("simulation:event", onSimulationEvent);
    socket.on("simulation:finished", onFinished);

    return () => {
      socket.off("simulation:event", onSimulationEvent);
      socket.off("simulation:finished", onFinished);
      socket.disconnect();
      socketRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [addEvent, refreshSimulation, simulationId]);

  async function startSimulation() {
    setError("");
    setEvents([]);
    setResult(null);
    setSimulationId(null);
    seenEventsRef.current.clear();
    setStatus("starting");
    try {
      const body = { problem };
      if (config.modes.length) body.mode = mode;
      const response = await fetch(`${API_BASE}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || `Start failed (${response.status})`);
      const id = getSimulationId(payload);
      if (!id) throw new Error("The API accepted the request but did not return a simulation ID.");
      setSimulationId(id);
      setStatus(payload?.simulation?.status || "running");
      await refreshSimulation(id);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => refreshSimulation(id), 900);
    } catch (err) {
      setStatus("failed");
      setError(err.message || "Unable to start simulation.");
    }
  }

  async function stopSimulation() {
    if (!simulationId) return;
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/simulations/${encodeURIComponent(simulationId)}/stop`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || `Stop failed (${response.status})`);
      setStatus(payload?.simulation?.status || "stopped");
      await refreshSimulation(simulationId);
    } catch (err) {
      setError(err.message || "Unable to stop simulation.");
    }
  }

  if (!config) return <main className="page-shell"><h1>Unknown visualizer</h1></main>;

  const finalCounterEvent = [...events].reverse().find((event) => event?.event === "simulation_completed" && event?.final_counter !== undefined);
  const finalCounter = result?.final_counter ?? result?.finalCounter ?? finalCounterEvent?.final_counter;
  const expectedCounter = result?.expected_counter ?? result?.expectedCounter ?? finalCounterEvent?.expected_counter;
  const lostUpdates = Number.isFinite(Number(finalCounter)) && Number.isFinite(Number(expectedCounter))
    ? Math.max(0, Number(expectedCounter) - Number(finalCounter))
    : null;

  return (
    <main className="page-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OS SYNCHRONIZATION LAB</p>
          <h1>{config.title}</h1>
          <p className="page-subtitle">{config.subtitle}</p>
        </div>
        <div className={`connection-pill ${connection}`}>
          <span className="connection-dot" />
          Socket.IO: {connection}
        </div>
      </div>

      <section className="info-card">
        <h2>What you are observing</h2>
        <p>{config.description}</p>
      </section>

      <section className="control-card">
        <div className="control-copy">
          <h2>Simulation controls</h2>
          <p>Start a real C-engine run and inspect the returned events.</p>
        </div>
        {config.modes.length > 0 && (
          <label className="field-label">
            Execution mode
            <select value={mode} onChange={(event) => setMode(event.target.value)} disabled={status === "running" || status === "starting"}>
              {config.modes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        )}
        <div className="button-row">
          <button className="primary-button" onClick={startSimulation} disabled={status === "starting" || status === "running"}>
            {status === "starting" ? "Starting…" : "Run simulation"}
          </button>
          <button className="secondary-button" onClick={stopSimulation} disabled={!simulationId || !["running", "starting"].includes(status)}>
            Stop
          </button>
        </div>
        <div className="status-line">
          <span className={`status-badge ${status}`}>{status}</span>
          {simulationId && <span className="simulation-id">ID: {simulationId}</span>}
        </div>
        {error && <div className="error-box" role="alert">{error}</div>}
      </section>

      {problem === "shared_counter" && (
        <section className="stats-grid">
          <article className="stat-card"><span>Final counter</span><strong>{finalCounter ?? "—"}</strong></article>
          <article className="stat-card"><span>Expected counter</span><strong>{expectedCounter ?? "—"}</strong></article>
          <article className="stat-card"><span>Lost increments</span><strong>{lostUpdates ?? "—"}</strong></article>
          <article className="stat-card"><span>Events received</span><strong>{events.length}</strong></article>
        </section>
      )}

      <section className="event-card">
        <div className="section-heading">
          <div><h2>Execution timeline</h2><p>Events from the backend/C engine, newest at the bottom.</p></div>
          <span className="event-count">{events.length} events</span>
        </div>
        {events.length === 0 ? (
          <div className="empty-state"><strong>No events yet</strong><span>Run a simulation to see its event history.</span></div>
        ) : (
          <ol className="event-list">
            {events.map((event, index) => (
              <li key={`${index}-${event?.event || "event"}`}>
                <span className="event-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="event-content">
                  <strong>{String(event?.event || event?.type || "Event").replaceAll("_", " ")}</strong>
                  <p>{prettyEvent(event)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {result && (
        <section className="result-card">
          <h2>Simulation result</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
