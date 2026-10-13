const problems = [
  { value: "shared_counter", label: "Race Condition / Shared Counter" },
  { value: "producer_consumer", label: "Producer–Consumer" },
  { value: "dining_philosophers", label: "Dining Philosophers" },
  { value: "readers_writers", label: "Readers–Writers" },
];

export default function ControlPanel({
  problem = "shared_counter",
  onProblemChange = () => {},
  onRun = () => {},
  onStop = () => {},
  running = false,
  disabled = false,
}) {
  return (
    <section className="os-card">
      <h2>Simulation Controls</h2>
      <p>Choose an operating-system synchronization problem.</p>

      <label htmlFor="simulation-problem">Problem</label>
      <select
        id="simulation-problem"
        value={problem}
        onChange={(event) => onProblemChange(event.target.value)}
        disabled={running || disabled}
      >
        {problems.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <div className="control-actions">
        <button
          type="button"
          onClick={onRun}
          disabled={running || disabled}
        >
          {running ? "Simulation Running..." : "Run Simulation"}
        </button>

        <button
          type="button"
          onClick={onStop}
          disabled={!running}
        >
          Stop Simulation
        </button>
      </div>
    </section>
  );
}
