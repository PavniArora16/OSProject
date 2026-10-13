export default function StatisticsCards({
  statistics = {},
}) {
  const cards = [
    {
      label: "Events",
      value: statistics.events ?? 0,
    },
    {
      label: "Threads",
      value: statistics.threads ?? "—",
    },
    {
      label: "Status",
      value: statistics.status ?? "Idle",
    },
    {
      label: "Execution Time",
      value:
        statistics.duration != null
          ? `${statistics.duration} ms`
          : "—",
    },
  ];

  return (
    <section className="statistics-grid" aria-label="Simulation statistics">
      {cards.map((card) => (
        <article className="os-card statistic-card" key={card.label}>
          <p>{card.label}</p>
          <h3>{card.value}</h3>
        </article>
      ))}
    </section>
  );
}
