import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import ControlPanel from "../components/ControlPanel";
import EventLog from "../components/EventLog";
import ExecutionTimeline from "../components/ExecutionTimeline";
import ResourceMonitor from "../components/ResourceMonitor";
import StatisticsCards from "../components/StatisticsCards";
import ThreadCard from "../components/ThreadCard";
import "../styles/problem-pages.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || API_BASE;

export default function ProblemPage({
  problem = "shared_counter",
  title = "Synchronization Simulator",
  description = "Explore thread execution and synchronization.",
}) {
  const [mode, setMode] = useState("race");
  const [simulation, setSimulation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [threads, setThreads] = useState([]);
  const [resources, setResources] = useState({});
  const startTime = useRef(null);
  const socketRef = useRef(null);
  const simulationIdRef = useRef(null);

  const simulationId = simulation?.simulationId;

  const updateFromPayload = useCallback((payload) => {
    const data = payload?.simulation ?? payload;

    if (data?.simulationId) {
      setSimulation((previous) => ({
        ...previous,
        ...data,
      }));
    }

    if (Array.isArray(data?.events)) {
      setEvents(data.events);
    }

    if (data?.threads && Array.isArray(data.threads)) {
      setThreads(data.threads);
    }

    if (data?.resources && typeof data.resources === "object") {
      setResources(data.resources);
    }

    if (data?.result) {
      setSimulation((previous) => ({
        ...previous,
        ...data,
        status: data.status ?? "completed",
      }));
    }
  }, []);

  // Fetch the latest simulation snapshot.
  const refreshSimulation = useCallback(async (id) => {
    if (!id) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/simulations/${encodeURIComponent(id)}`
      );

      if (!response.ok) {
        throw new Error(`Unable to load simulation (${response.status})`);
      }

      const payload = await response.json();
      updateFromPayload(payload);
    } catch (err) {
      setError(err.message || "Could not refresh the simulation.");
    }
  }, [updateFromPayload]);

  // Subscribe to live simulation events.
  useEffect(() => {
    if (!simulationId) return;

    simulationIdRef.current = simulationId;

    const socket = io(SOCKET_BASE, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const handleEvent = (payload) => {
      const eventSimulationId =
        payload?.simulationId ?? payload?.simulation?.simulationId;

      if (
        eventSimulationId &&
        eventSimulationId !== simulationIdRef.current
      ) {
        return;
      }

      const event = payload?.event ?? payload;

      setEvents((previous) => {
        // Avoid adding the same event twice when polling and sockets overlap.
        if (
          event?.id &&
          previous.some((item) => item?.id === event.id)
        ) {
          return previous;
        }

        return [...previous, event].slice(-500);
      });
    };

    const handleFinished = (payload) => {
      const eventSimulationId =
        payload?.simulationId ?? payload?.simulation?.simulationId;

      if (
        eventSimulationId &&
        eventSimulationId !== simulationIdRef.current
      ) {
        return;
      }

      updateFromPayload(payload);
      refreshSimulation(simulationId);
    };

    socket.on("simulation:event", handleEvent);
    socket.on("simulation:finished", handleFinished);

    return () => {
      socket.off("simulation:event", handleEvent);
      socket.off("simulation:finished", handleFinished);
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [simulationId, refreshSimulation, updateFromPayload]);

  // Polling is a fallback if some live events are missed.
  useEffect(() => {
    if (!simulationId) return;

    const status = simulation?.status;
    if (["completed", "failed", "stopped"].includes(status)) return;

    const timer = setInterval(() => {
      refreshSimulation(simulationId);
    }, 1200);

    return () => clearInterval(timer);
  }, [simulationId, simulation?.status, refreshSimulation]);

  const runSimulation = async () => {
    setLoading(true);
    setError("");
    setEvents([]);
    setThreads([]);
    setResources({});
    setSimulation(null);
    startTime.current = Date.now();

    try {
      const response = await fetch(`${API_BASE}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, mode }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Could not start simulation."
        );
      }

      const data = payload?.simulation ?? payload;
      setSimulation(data);

      if (data?.simulationId) {
        await refreshSimulation(data.simulationId);
      }
    } catch (err) {
      setError(err.message || "Could not start simulation.");
    } finally {
      setLoading(false);
    }
  };

  const stopSimulation = async () => {
    if (!simulationId) return;

    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/simulations/${encodeURIComponent(simulationId)}/stop`,
        { method: "POST" }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Could not stop simulation."
        );
      }

      await refreshSimulation(simulationId);
    } catch (err) {
      setError(err.message || "Could not stop simulation.");
    }
  };

  const result = simulation?.result ?? {};
  const duration =
    startTime.current && simulation?.status === "completed"
      ? Date.now() - startTime.current
      : null;

  const statistics = {
    events: events.length,
    threads: threads.length || "—",
    status: simulation?.status ?? "Idle",
    duration,
  };

  return (
    <main className="problem-page">
      <header className="problem-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <ControlPanel
        problem={problem}
        onProblemChange={() => {}}
        onRun={runSimulation}
        onStop={stopSimulation}
        running={
          loading ||
          ["queued", "running", "pending"].includes(simulation?.status)
        }
        disabled={loading}
      />

      {error && (
        <div className="simulation-error" role="alert">
          <strong>Simulation error:</strong> {error}
        </div>
      )}

      <StatisticsCards statistics={statistics} />

      <section className="simulation-layout">
        <div className="simulation-main">
          <EventLog events={events} />
          <ExecutionTimeline events={events} />
        </div>

        <aside className="simulation-side">
          <ResourceMonitor resources={resources} />

          <section className="os-card">
            <h2>Thread Activity</h2>
            {threads.length ? (
              threads.map((thread, index) => (
                <ThreadCard
                  key={thread.id ?? thread.name ?? index}
                  thread={thread}
                />
              ))
            ) : (
              <p className="empty-state">
                Thread details will appear when the engine provides them.
              </p>
            )}
          </section>

          {simulation && (
            <section className="os-card">
              <h2>Simulation Result</h2>
              <p>
                <strong>Status:</strong>{" "}
                {simulation.status ?? "Unknown"}
              </p>
              {result.exitCode !== undefined && (
                <p>
                  <strong>Exit code:</strong> {result.exitCode}
                </p>
              )}
              {result.stderr?.length > 0 && (
                <pre className="simulation-stderr">
                  {result.stderr.join("\n")}
                </pre>
              )}
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
