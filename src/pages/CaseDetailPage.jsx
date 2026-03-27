import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseItem, setCaseItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([api(`/cases/${id}`), api(`/cases/${id}/comments`)])
      .then(([caseResult, commentsResult]) => {
        setCaseItem(caseResult.case);
        setComments(commentsResult.comments);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function submitVote(answer) {
    try {
      const voteResult = await api(`/cases/${id}/votes`, {
        method: "POST",
        body: JSON.stringify({ answer }),
      });
      setResult(voteResult.result);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!commentText.trim()) return;
    try {
      const response = await api(`/cases/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentText }),
      });
      setComments((prev) => [response.comment, ...prev]);
      setCommentText("");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading case...</p>;
  if (error && !caseItem) return <p className="error">{error}</p>;
  if (!caseItem) return <p>Case not found.</p>;

  return (
    <section className="panel">
      <div className="detail-header">
        <button className="btn btn-ghost" type="button" onClick={() => navigate(-1)}>
          Back to cases
        </button>
        <div className="detail-meta-row">
          <span className={`pill ${caseItem.contentType}`}>{caseItem.contentType}</span>
          <span className={`pill ${caseItem.difficulty}`}>{caseItem.difficulty}</span>
        </div>
      </div>
      <h2>{caseItem.title}</h2>
      <p className="supporting-copy">
        Review the details below, decide whether this looks legitimate, then submit your answer.
      </p>
      <div className="case-body-card">
        <p className="case-content">{caseItem.content}</p>
      </div>
      {caseItem.links?.length ? (
        <p className="case-links">
          <strong>Links:</strong> {caseItem.links.join(", ")}
        </p>
      ) : null}

      {user ? (
        <div className="vote-row">
          <button className="btn btn-danger" type="button" onClick={() => submitVote("scam")}>
            Scam
          </button>
          <button className="btn btn-success" type="button" onClick={() => submitVote("safe")}>
            Safe
          </button>
          <button className="btn btn-muted" type="button" onClick={() => submitVote("unsure")}>
            Unsure
          </button>
        </div>
      ) : (
        <p>
          <Link to="/auth">Login</Link> to submit your answer.
        </p>
      )}

      {result ? (
        <div className="result-box">
          <p>
            <strong>{result.isCorrect ? "Correct" : "Not correct"}</strong> (+{result.pointsAwarded}{" "}
            points)
          </p>
          <p>
            <strong>Correct answer:</strong> {result.correctAnswer}
          </p>
          <p>{result.explanation}</p>
          <button className="btn btn-ghost" type="button" onClick={() => navigate("/cases")}>
            Return to feed
          </button>
        </div>
      ) : null}

      <h3>Comments</h3>
      {user ? (
        <form onSubmit={submitComment}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share why you voted this way..."
          />
          <button className="btn btn-primary" type="submit">
            Post Comment
          </button>
        </form>
      ) : null}

      <div className="comments-list">
        {comments.map((comment) => (
          <article key={comment.id} className="comment-item">
            <p>{comment.body}</p>
            <small>
              {comment.user ? (
                <Link className="inline-link" to={`/users/${comment.user.id}`}>
                  {comment.user.username}
                </Link>
              ) : (
                "Unknown"
              )}{" "}
              |{" "}
              {new Date(comment.createdAt).toLocaleString("en-US")}
            </small>
          </article>
        ))}
      </div>

      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}

export default CaseDetailPage;
