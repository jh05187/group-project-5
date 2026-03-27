import { useEffect, useState } from "react";
import CaseCard from "../components/CaseCard";
import { api } from "../lib/api";

function CaseFeedPage() {
  const [cases, setCases] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [contentType, setContentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", difficulty);
    if (contentType) params.set("contentType", contentType);

    setLoading(true);
    setError("");
    api(`/cases?${params.toString()}`)
      .then((result) => setCases(result.cases))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [difficulty, contentType]);

  const availableCases = cases.filter((item) => !item.attempted);
  const completedCases = cases.filter((item) => item.attempted);

  return (
    <section>
      <div className="page-title-row">
        <div>
          <h2>Case Feed</h2>
          <p className="supporting-copy">
            New cases stay at the top. Completed ones remain available below so users can review and learn from them again.
          </p>
        </div>
        <div className="filters">
          <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
            <option value="">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="website">Website</option>
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {loading ? <p>Loading cases...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section className="case-section">
        <div className="section-head">
          <div>
            <h3>Available Cases</h3>
            <p className="supporting-copy">Cases you have not answered yet.</p>
          </div>
        </div>
        <div className="case-grid">
          {availableCases.map((item) => (
            <CaseCard key={item._id} item={item} />
          ))}
        </div>
        {!loading && !availableCases.length ? <p className="muted-text">No new cases found for current filters.</p> : null}
      </section>

      <section className="case-section">
        <div className="section-head">
          <div>
            <h3>Completed Cases</h3>
            <p className="supporting-copy">Review cases you have already answered.</p>
          </div>
        </div>
        <div className="case-grid">
          {completedCases.map((item) => (
            <CaseCard key={item._id} item={item} />
          ))}
        </div>
        {!loading && !completedCases.length ? <p className="muted-text">You have not completed any cases in this filtered view yet.</p> : null}
      </section>
    </section>
  );
}

export default CaseFeedPage;
