export default function ThreadCard({
  thread = {},
  name,
  state,
  action,
}) {
  const threadName =
    name ?? thread.name ?? thread.id ?? "Thread";

  const threadState =
    state ?? thread.state ?? thread.status ?? "Unknown";

  const threadAction =
    action ?? thread.action ?? thread.message ?? "No recent action";

  return (
    <article className="os-card thread-card">
      <div className="section-heading">
        <h3>{threadName}</h3>
        <span className="thread-state">{threadState}</span>
      </div>

      <p>{threadAction}</p>
    </article>
  );
}
