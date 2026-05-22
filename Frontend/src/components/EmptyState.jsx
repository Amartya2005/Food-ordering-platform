export default function EmptyState({ title, message, action }) {
  return (
    <section className="empty-state">
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action}
    </section>
  );
}
