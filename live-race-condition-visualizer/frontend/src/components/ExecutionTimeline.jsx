export default function ExecutionTimeline({ events = [] }) {
  return (
    <section className="os-card">
      <h2>Execution Timeline</h2>

      {events.length === 0 ? (
        <p className="empty-state">
          The timeline will appear when events are received.
        </p>
      ) : (
        <ol className="execution-timeline">
          {events.map((event, index) => {
            const message =
              typeof event === "string"
                ? event
                : event.message ??
                  event.description ??
                  event.type ??
                  JSON.stringify(event);

            return (
              <li key={event.id ?? index}>
                <span className="timeline-marker" />
                <div>
                  <strong>Step {index + 1}</strong>
                  <p>{message}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
