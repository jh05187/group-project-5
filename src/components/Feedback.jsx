function StatusBanner({ type = "info", message }) {
  if (!message) return null;

  return (
    <div className={`status-banner ${type}`} role={type === "error" ? "alert" : "status"}>
      <strong>{type === "error" ? "Something went wrong" : type === "success" ? "Success" : "Update"}</strong>
      <span>{message}</span>
    </div>
  );
}

function LoadingBlock({ label = "Loading..." }) {
  return (
    <div className="loading-block" aria-live="polite">
      <span className="loading-pulse" />
      <p>{label}</p>
    </div>
  );
}

function EmptyState({ title, description, action = null }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description ? <p className="supporting-copy">{description}</p> : null}
      {action}
    </div>
  );
}

export { EmptyState, LoadingBlock, StatusBanner };
