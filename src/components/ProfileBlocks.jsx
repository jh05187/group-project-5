import { Link } from "react-router-dom";

export function MetricCard({ label, value, hint }) {
  return (
    <div className="metric metric-elevated">
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="metric-hint">{hint}</span>
    </div>
  );
}

export function ProgressChart({ value }) {
  return (
    <div className="progress-chart" aria-label={`Progress ${value}%`}>
      <div className="progress-chart-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export function PerformanceDots({ items }) {
  if (!items?.length) {
    return <p className="muted-text">No recent attempts yet.</p>;
  }

  return (
    <div className="streak-row">
      {items.map((item) => (
        <div
          key={item.id}
          className={`streak-dot ${item.isCorrect ? "success" : "danger"}`}
          title={`${item.caseTitle} | ${item.isCorrect ? "Correct" : "Incorrect"}`}
        />
      ))}
    </div>
  );
}

export function DifficultyBars({ items }) {
  return (
    <div className="difficulty-chart">
      {items.map((item) => (
        <div key={item.difficulty} className="difficulty-row">
          <div className="difficulty-row-head">
            <span>{item.difficulty}</span>
            <span>{item.accuracyRate}%</span>
          </div>
          <div className="progress-chart compact">
            <div className="progress-chart-fill" style={{ width: `${item.accuracyRate}%` }} />
          </div>
          <small className="muted-text">
            {item.correct} correct / {item.total} attempted
          </small>
        </div>
      ))}
    </div>
  );
}

export function RecentPerformanceList({ items }) {
  return (
    <div className="activity-feed">
      {items?.map((item) => (
        <article key={item.id} className="activity-item">
          <div>
            <strong>
              {item.caseId ? (
                <Link className="inline-link" to={`/cases/${item.caseId}`}>
                  {item.caseTitle}
                </Link>
              ) : (
                item.caseTitle
              )}
            </strong>
            <p className="muted-text">
              {item.contentType} | {item.difficulty} | {new Date(item.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
          <span className={`status-chip ${item.isCorrect ? "success" : "danger"}`}>
            {item.isCorrect ? `+${item.pointsAwarded}` : item.answer}
          </span>
        </article>
      ))}
    </div>
  );
}

export function AnsweredCasesList({ items }) {
  if (!items?.length) {
    return <p className="muted-text">No completed cases yet.</p>;
  }

  return (
    <div className="answered-cases-grid">
      {items.map((item) => (
        <Link key={item.id} className="answered-case-card" to={`/cases/${item.id}`}>
          <span className={`pill ${item.contentType}`}>{item.contentType}</span>
          <strong>{item.title}</strong>
          <small className="muted-text">
            {item.difficulty} | {item.isCorrect ? "Answered correctly" : `Answered: ${item.answer}`}
          </small>
        </Link>
      ))}
    </div>
  );
}

export function RecentCommentsList({ items }) {
  if (!items?.length) {
    return <p className="muted-text">No recent comments yet.</p>;
  }

  return (
    <div className="comments-list">
      {items.map((item) => (
        <article key={item.id} className="comment-item">
          <p>{item.body}</p>
          <small>
            On{" "}
            {item.caseId ? (
              <Link className="inline-link" to={`/cases/${item.caseId}`}>
                {item.caseTitle}
              </Link>
            ) : (
              item.caseTitle
            )}{" "}
            | {new Date(item.createdAt).toLocaleDateString("en-US")}
          </small>
        </article>
      ))}
    </div>
  );
}
