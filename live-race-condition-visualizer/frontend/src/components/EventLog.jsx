export default function EventLog({ events = [] }) {
  return (
    <section className="os-card">
      <div className="section-heading">
        <h2>Live Event Log</h2>
        <span>{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <p className="empty-state">
          No events yet. Run a simulation to see execution events.
        </p>
      ) : (
        <div className="event-log">
          {[...events].reverse().map((event, index) => {
            const message =
              typeof event === "string"
                ? event
                : event.message ??
                  event.description ??
                  event.type ??
                  JSON.stringify(event);

            return (
              <div className="event-row" key={event.id ?? index}>
                <span className="event-number">
                  {events.length - index}
                </span>
                <span>{message}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
