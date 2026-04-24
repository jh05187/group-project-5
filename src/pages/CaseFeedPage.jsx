import { useEffect, useState } from "react";
import CaseCard from "../components/CaseCard";
import { EmptyState, LoadingBlock, StatusBanner } from "../components/Feedback";
import { api } from "../lib/api";

function CaseFeedPage() {
  const [cases, setCases] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [contentType, setContentType] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
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

  const normalizedQuery = query.trim().toLowerCase();

  function sortCases(items) {
    return [...items].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "difficulty") {
        const order = { easy: 0, medium: 1, hard: 2 };
        return (order[a.difficulty] ?? 99) - (order[b.difficulty] ?? 99);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  const filteredCases = cases.filter((item) => {
    if (!normalizedQuery) return true;
    return (
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.content.toLowerCase().includes(normalizedQuery) ||
      item.contentType.toLowerCase().includes(normalizedQuery)
    );
  });

  const availableCases = sortCases(filteredCases.filter((item) => !item.attempted));
  const completedCases = sortCases(filteredCases.filter((item) => item.attempted));

  return (
    <section>
      <div className="page-title-row">
        <div>
          <h2>Case Feed</h2>
          <p className="supporting-copy">
            New cases stay at the top. Completed ones remain available below so users can review and learn from them again.
          </p>
        </div>
        <div className="filters filters-extended">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, content, or type"
          />
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
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="title">Title A-Z</option>
            <option value="difficulty">Easy to Hard</option>
          </select>
        </div>
      </div>

      <div className="metrics-grid case-feed-summary">
        <div className="metric">
          <span className="metric-label">Showing</span>
          <strong>{filteredCases.length}</strong>
          <span className="metric-hint">Cases in the current view</span>
        </div>
        <div className="metric">
          <span className="metric-label">Available</span>
          <strong>{availableCases.length}</strong>
          <span className="metric-hint">Not answered yet</span>
        </div>
        <div className="metric">
          <span className="metric-label">Completed</span>
          <strong>{completedCases.length}</strong>
          <span className="metric-hint">Ready for review</span>
        </div>
      </div>

      {loading ? <LoadingBlock label="Loading the current training bank..." /> : null}
      <StatusBanner type="error" message={error} />

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
        {!loading && !availableCases.length ? (
          <EmptyState
            title="No new cases in this view"
            description="Try widening your search or clearing one of the filters to reveal more training cases."
          />
        ) : null}
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
        {!loading && !completedCases.length ? (
          <EmptyState
            title="No completed cases yet"
            description="Finished cases appear here so you can revisit them, compare your choices, and study the explanations again."
          />
        ) : null}
      </section>
    </section>
  );
}

export default CaseFeedPage;
