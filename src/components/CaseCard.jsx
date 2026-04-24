import { Link } from "react-router-dom";

function CaseCard({ item }) {
  const shortContent = item.content.length > 135 ? `${item.content.slice(0, 135)}...` : item.content;

  return (
    <article className={`case-card ${item.attempted ? "attempted" : ""}`}>
      <div className="case-card-top">
        <span className={`pill ${item.contentType}`}>{item.contentType}</span>
        <span className={`pill ${item.difficulty}`}>{item.difficulty}</span>
        {item.attempted ? <span className="pill attempted-pill">Completed</span> : null}
      </div>
      <h3>{item.title}</h3>
      <p>{shortContent}</p>
      {item.senderInfo ? <p className="muted-text">Sender: {item.senderInfo}</p> : null}
      {item.attempted && item.attemptSummary ? (
        <div className="case-card-meta">
          <p className="muted-text">
            Last answer: <strong>{item.attemptSummary.answer}</strong>
          </p>
          <span className={`status-chip ${item.attemptSummary.isCorrect ? "success" : "danger"}`}>
            {item.attemptSummary.isCorrect ? "Correct" : "Incorrect"}
          </span>
        </div>
      ) : null}
      <Link to={`/cases/${item._id}`} className="btn btn-primary">
        {item.attempted ? "Review Case" : "Open Case"}
      </Link>
    </article>
  );
}

export default CaseCard;
