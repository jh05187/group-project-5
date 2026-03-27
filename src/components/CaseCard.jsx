import { Link } from "react-router-dom";

function CaseCard({ item }) {
  return (
    <article className={`case-card ${item.attempted ? "attempted" : ""}`}>
      <div className="case-card-top">
        <span className={`pill ${item.contentType}`}>{item.contentType}</span>
        <span className={`pill ${item.difficulty}`}>{item.difficulty}</span>
        {item.attempted ? <span className="pill attempted-pill">Completed</span> : null}
      </div>
      <h3>{item.title}</h3>
      <p>{item.content.slice(0, 120)}...</p>
      {item.attempted && item.attemptSummary ? (
        <p className="muted-text">
          Last answer: {item.attemptSummary.answer} | {item.attemptSummary.isCorrect ? "Correct" : "Incorrect"}
        </p>
      ) : null}
      <Link to={`/cases/${item._id}`} className="btn btn-primary">
        {item.attempted ? "Review Case" : "Open Case"}
      </Link>
    </article>
  );
}

export default CaseCard;
