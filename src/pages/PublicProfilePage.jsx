import { useCallback, useEffect, useState } from "react";
import {
  AnsweredCasesList,
  DifficultyBars,
  MetricCard,
  PerformanceDots,
  ProgressChart,
  RecentCommentsList,
  RecentPerformanceList,
} from "../components/ProfileBlocks";
import { api } from "../lib/api";
import { useParams } from "react-router-dom";

function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [viewerRole, setViewerRole] = useState("public");
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const loadProfile = useCallback(async () => {
    const result = await api(`/users/${id}`);
    setProfile(result.user);
    setViewerRole(result.viewerRole || "public");
  }, [id]);

  useEffect(() => {
    loadProfile().catch((err) => setError(err.message));
  }, [loadProfile]);

  async function deleteComment(commentId) {
    try {
      await api(`/admin/comments/${commentId}`, { method: "DELETE" });
      await loadProfile();
      setConfirmAction(null);
    } catch (err) {
      setError(err.message);
      setConfirmAction(null);
    }
  }

  async function deleteUser() {
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      window.history.back();
    } catch (err) {
      setError(err.message);
      setConfirmAction(null);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!profile) return <p>Loading profile...</p>;

  return (
    <section className="profile-shell">
      <div className="panel profile-hero">
        <div>
          <p className="eyebrow">{viewerRole === "admin" ? "Admin User View" : "Public Learner Profile"}</p>
          <h2>{profile.username}</h2>
          <p className="supporting-copy">
            Joined {new Date(profile.joinedAt).toLocaleDateString("en-US")}
          </p>
          <div className="badge-row">
            <span className="badge-pill role-pill">{profile.role}</span>
            {profile.badges?.length
              ? profile.badges.map((badge) => <span key={badge}>{badge.replaceAll("_", " ")}</span>)
              : <span>No badges yet</span>}
          </div>
          {viewerRole === "admin" && profile.adminView ? (
            <div className="admin-private-block">
              <p className="muted-text">Admin-only details</p>
              <p className="supporting-copy">
                {profile.adminView.email} | Email verified: {profile.adminView.isEmailVerified ? "Yes" : "No"}
              </p>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Delete User Account",
                    message: `Delete ${profile.username}'s account? This removes their votes, comments, group memberships, and pending signups.`,
                    confirmLabel: "Delete User",
                    onConfirm: deleteUser,
                  })
                }
              >
                Delete Account
              </button>
            </div>
          ) : null}
        </div>
        <div className="profile-focus-card">
          <span className="metric-label">Training completion</span>
          <strong>{profile.progressPercent}%</strong>
          <ProgressChart value={profile.progressPercent} />
          <span className="metric-hint">
            {profile.completedCasesCount} completed, {profile.remainingCasesCount} left in the current bank
          </span>
        </div>
      </div>

      <div className="metrics-grid profile-metrics-grid">
        <MetricCard label="Score" value={profile.reputationScore} hint="Public learning score" />
        <MetricCard label="Level" value={profile.level} hint="Current progression level" />
        <MetricCard label="Accuracy" value={`${profile.accuracyRate}%`} hint={`${profile.correctVotes} correct answers`} />
        <MetricCard label="Comments" value={profile.commentsCount} hint="Visible discussion contributions" />
        <MetricCard label="Confidence" value={`${profile.confidenceScore}%`} hint="Blends accuracy and repetition" />
        <MetricCard label="Cases Done" value={profile.completedCasesCount} hint={`${profile.totalVotes} total submissions`} />
      </div>

      <div className="profile-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <h3>Recent Activity</h3>
              <p className="supporting-copy">A public view of recent training performance.</p>
            </div>
          </div>
          <PerformanceDots items={profile.recentPerformance} />
          <RecentPerformanceList items={profile.recentPerformance} />
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h3>Difficulty Breakdown</h3>
              <p className="supporting-copy">How this learner performs across different case difficulty levels.</p>
            </div>
          </div>
          <DifficultyBars items={profile.difficultyBreakdown || []} />
        </section>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3>Answered Cases</h3>
            <p className="supporting-copy">Cases this learner has already worked through.</p>
          </div>
        </div>
        <AnsweredCasesList items={profile.answeredCases} />
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3>Recent Comments</h3>
            <p className="supporting-copy">Latest public comments from this learner.</p>
          </div>
        </div>
        <RecentCommentsList items={profile.recentComments} />
        {viewerRole === "admin" ? (
          <div className="admin-inline-tools">
            {profile.recentComments.map((comment) => (
              <button
                key={comment.id}
                className="btn btn-danger btn-small"
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Delete Comment",
                    message: `Delete this comment?\n\n"${comment.body}"`,
                    confirmLabel: "Delete Comment",
                    onConfirm: () => deleteComment(comment.id),
                  })
                }
              >
                Delete: {comment.caseTitle}
              </button>
            ))}
          </div>
        ) : null}
      </section>

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
              <button className="btn btn-danger" type="button" onClick={confirmAction.onConfirm}>
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default PublicProfilePage;
