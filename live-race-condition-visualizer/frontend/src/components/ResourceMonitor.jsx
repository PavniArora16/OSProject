export default function ResourceMonitor({
  resources = {},
}) {
  const items = [
    {
      label: "Active Threads",
      value: resources.activeThreads ?? 0,
    },
    {
      label: "Waiting Threads",
      value: resources.waitingThreads ?? 0,
    },
    {
      label: "Buffer Items",
      value: resources.bufferItems ?? "—",
    },
    {
      label: "Locks Held",
      value: resources.locksHeld ?? "—",
    },
  ];

  return (
    <section className="os-card">
      <h2>Resource Monitor</h2>

      <div className="resource-grid">
        {items.map((item) => (
          <div className="resource-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <p className="muted-text">
        Values reflect the data supplied by the simulation.
      </p>
    </section>
  );
}
