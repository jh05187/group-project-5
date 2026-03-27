import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const emptyForm = {
  title: "",
  contentType: "email",
  difficulty: "easy",
  content: "",
  senderInfo: "",
  correctAnswer: "scam",
  explanation: "",
  isPublished: true,
};

function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [cases, setCases] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingCaseId, setEditingCaseId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    const result = await api("/admin/overview");
    setOverview(result);
  }, []);

  const loadCases = useCallback(async () => {
    const result = await api("/admin/cases");
    setCases(result.cases);
  }, []);

  const loadComments = useCallback(async () => {
    const result = await api("/admin/comments");
    setComments(result.comments);
  }, []);

  const loadUsers = useCallback(async () => {
    const result = await api("/admin/users");
    setUsers(result.users);
  }, []);

  const refreshAll = useCallback(async () => {
    setError("");
    try {
      await Promise.all([loadOverview(), loadCases(), loadComments(), loadUsers()]);
    } catch (err) {
      setError(err.message);
    }
  }, [loadCases, loadComments, loadOverview, loadUsers]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  async function createOrUpdateCase(event) {
    event.preventDefault();
    setError("");

    try {
      if (editingCaseId) {
        await api(`/admin/cases/${editingCaseId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      } else {
        await api("/admin/cases", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }

      setForm(emptyForm);
      setEditingCaseId(null);
      await Promise.all([loadCases(), loadOverview()]);
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditCase(item) {
    setEditingCaseId(item._id);
    setForm({
      title: item.title,
      contentType: item.contentType,
      difficulty: item.difficulty,
      content: item.content,
      senderInfo: item.senderInfo || "",
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      isPublished: item.isPublished,
    });
  }

  function cancelEdit() {
    setEditingCaseId(null);
    setForm(emptyForm);
  }

  async function togglePublish(item) {
    try {
      await api(`/admin/cases/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      await Promise.all([loadCases(), loadOverview()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeCase(id) {
    try {
      await api(`/admin/cases/${id}`, { method: "DELETE" });
      if (editingCaseId === id) cancelEdit();
      await Promise.all([loadCases(), loadOverview(), loadComments()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeComment(id) {
    try {
      await api(`/admin/comments/${id}`, { method: "DELETE" });
      await Promise.all([loadComments(), loadOverview()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openUserDetail(id) {
    try {
      const result = await api(`/admin/users/${id}`);
      setSelectedUser(result.user);
    } catch (err) {
      setError(err.message);
    }
  }

  function openDeleteCaseConfirm(item) {
    setConfirmAction({
      title: "Delete Case",
      message: `Delete "${item.title}"? This will also remove all votes and comments tied to it.`,
      confirmLabel: "Delete Case",
      tone: "danger",
      onConfirm: async () => {
        await removeCase(item._id);
      },
    });
  }

  function openDeleteCommentConfirm(comment) {
    const preview = comment.body.length > 80 ? `${comment.body.slice(0, 80)}...` : comment.body;
    setConfirmAction({
      title: "Delete Comment",
      message: `Delete this comment?\n\n"${preview}"`,
      confirmLabel: "Delete Comment",
      tone: "danger",
      onConfirm: async () => {
        await removeComment(comment.id);
      },
    });
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } catch (err) {
      setError(err.message);
      setConfirmAction(null);
    }
  }

  const filteredCases = cases.filter((item) => {
    const query = caseSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.contentType.toLowerCase().includes(query) ||
      item.difficulty.toLowerCase().includes(query)
    );
  });

  const filteredUsers = users.filter((user) => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  return (
    <section className="admin-shell">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Control Center</p>
            <h2>Admin Dashboard</h2>
            <p className="supporting-copy">
              Manage training content, moderate community activity, and monitor user progress.
            </p>
          </div>
          <button className="btn btn-ghost" type="button" onClick={refreshAll}>
            Refresh Data
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="metrics-grid admin-metrics-grid">
          <div className="metric">
            <span className="metric-label">Users</span>
            <strong>{overview?.stats.totalUsers ?? "-"}</strong>
            <span className="metric-hint">Registered learners</span>
          </div>
          <div className="metric">
            <span className="metric-label">Cases</span>
            <strong>{overview?.stats.totalCases ?? "-"}</strong>
            <span className="metric-hint">
              {overview?.stats.publishedCases ?? "-"} published / {overview?.stats.unpublishedCases ?? "-"} drafts
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Comments</span>
            <strong>{overview?.stats.totalComments ?? "-"}</strong>
            <span className="metric-hint">Community moderation load</span>
          </div>
          <div className="metric">
            <span className="metric-label">Votes</span>
            <strong>{overview?.stats.totalVotes ?? "-"}</strong>
            <span className="metric-hint">Total case submissions</span>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <h3>{editingCaseId ? "Edit Case" : "Create Case"}</h3>
              <p className="supporting-copy">
                Admins can now edit published cases directly, not just publish or delete them.
              </p>
            </div>
            {editingCaseId ? (
              <button className="btn btn-ghost" type="button" onClick={cancelEdit}>
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form className="admin-form" onSubmit={createOrUpdateCase}>
            <label>
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>
            <label>
              Sender Info
              <input
                value={form.senderInfo}
                onChange={(e) => setForm((prev) => ({ ...prev, senderInfo: e.target.value }))}
              />
            </label>
            <div className="admin-form-row">
              <label>
                Type
                <select
                  value={form.contentType}
                  onChange={(e) => setForm((prev) => ({ ...prev, contentType: e.target.value }))}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="website">Website</option>
                </select>
              </label>
              <label>
                Difficulty
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label>
                Correct Answer
                <select
                  value={form.correctAnswer}
                  onChange={(e) => setForm((prev) => ({ ...prev, correctAnswer: e.target.value }))}
                >
                  <option value="scam">Scam</option>
                  <option value="safe">Safe</option>
                </select>
              </label>
            </div>
            <label>
              Case Content
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                required
              />
            </label>
            <label>
              Explanation
              <textarea
                value={form.explanation}
                onChange={(e) => setForm((prev) => ({ ...prev, explanation: e.target.value }))}
                required
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
              />
              Published
            </label>
            <button className="btn btn-primary" type="submit">
              {editingCaseId ? "Save Changes" : "Add Case"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h3>Recent Users</h3>
              <p className="supporting-copy">Browse learners and inspect their progress in more detail.</p>
            </div>
          </div>

          <label className="admin-search">
            Search Users
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by username, email, or role"
            />
          </label>

          <div className="admin-scroll-list">
            {filteredUsers.map((user) => (
              <article key={user.id} className="admin-item">
                <div>
                  <h4>{user.username}</h4>
                  <p className="muted-text">
                    {user.email} | {user.role} | Level {user.level}
                  </p>
                </div>
                <div className="admin-actions">
                  <span className="status-chip success">{user.accuracyRate}%</span>
                  <button className="btn btn-ghost" type="button" onClick={() => openUserDetail(user.id)}>
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>

          {selectedUser ? (
            <div className="admin-user-detail">
              <h4>{selectedUser.username}</h4>
              <p className="muted-text">{selectedUser.email}</p>
              <div className="metrics-grid">
                <div className="metric">
                  <span className="metric-label">Score</span>
                  <strong>{selectedUser.reputationScore}</strong>
                </div>
                <div className="metric">
                  <span className="metric-label">Accuracy</span>
                  <strong>{selectedUser.accuracyRate}%</strong>
                </div>
                <div className="metric">
                  <span className="metric-label">Comments</span>
                  <strong>{selectedUser.commentsCount}</strong>
                </div>
                <div className="metric">
                  <span className="metric-label">Cases</span>
                  <strong>{selectedUser.completedCasesCount}</strong>
                </div>
              </div>
              <div className="activity-feed">
                {selectedUser.recentVotes?.map((vote) => (
                  <article key={vote.id} className="activity-item">
                    <div>
                      <strong>{vote.caseTitle}</strong>
                      <p className="muted-text">
                        {vote.contentType} | {vote.difficulty} | {new Date(vote.createdAt).toLocaleDateString("en-US")}
                      </p>
                    </div>
                    <span className={`status-chip ${vote.isCorrect ? "success" : "danger"}`}>
                      {vote.isCorrect ? `+${vote.pointsAwarded}` : vote.answer}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="admin-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <h3>All Cases ({filteredCases.length})</h3>
              <p className="supporting-copy">Edit, publish, unpublish, or remove training content.</p>
            </div>
          </div>

          <label className="admin-search">
            Search Cases
            <input
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              placeholder="Search by title, type, or difficulty"
            />
          </label>

          <div className="admin-scroll-list">
            {filteredCases.map((item) => (
              <article key={item._id} className="admin-item">
                <div>
                  <h4>{item.title}</h4>
                  <p className="muted-text">
                    {item.contentType} | {item.difficulty} | {item.isPublished ? "Published" : "Draft"}
                  </p>
                  <p className="muted-text">
                    Votes: {item.totalVotes} | Correct: {item.correctVotes} | Accuracy:{" "}
                    {item.totalVotes ? Math.round((item.correctVotes / item.totalVotes) * 100) : 0}%
                  </p>
                </div>
                <div className="admin-actions">
                  <Link className="btn btn-primary" to={`/cases/${item._id}`}>
                    View Case
                  </Link>
                  <button className="btn btn-ghost" type="button" onClick={() => startEditCase(item)}>
                    Edit
                  </button>
                  <button className="btn btn-muted" type="button" onClick={() => togglePublish(item)}>
                    {item.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button className="btn btn-danger" type="button" onClick={() => openDeleteCaseConfirm(item)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h3>Recent Comments</h3>
              <p className="supporting-copy">Admins can now remove inappropriate or noisy comments anywhere on the platform.</p>
            </div>
          </div>

          <div className="admin-scroll-list">
            {comments.map((comment) => (
              <article key={comment.id} className="admin-item">
                <div>
                  <p>{comment.body}</p>
                  <p className="muted-text">
                    {comment.user?.username || "Unknown user"} on {comment.case?.title || "Unknown case"}
                  </p>
                  <p className="muted-text">{new Date(comment.createdAt).toLocaleString("en-US")}</p>
                </div>
                <div className="admin-actions">
                  <button className="btn btn-danger" type="button" onClick={() => openDeleteCommentConfirm(comment)}>
                    Delete Comment
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {confirmAction ? (
        <div className="overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{confirmAction.title}</h3>
              <button className="icon-button" type="button" onClick={() => setConfirmAction(null)}>
                x
              </button>
            </div>
            <p className="supporting-copy confirm-message">{confirmAction.message}</p>
            <div className="admin-actions">
              <button className="btn btn-ghost" type="button" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button
                className={confirmAction.tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
                type="button"
                onClick={handleConfirmAction}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminDashboardPage;
