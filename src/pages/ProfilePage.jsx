import { useEffect, useState } from "react";
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

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/users/me")
      .then((result) => setProfile(result.user))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!profile) return <p>Loading profile...</p>;

  return (
    <section className="profile-shell">
      <div className="panel profile-hero">
        <div>
          <p className="eyebrow">Learning Profile</p>
          <h2>{profile.username}</h2>
          <p className="supporting-copy">{profile.email}</p>
          <div className="badge-row">
            <span className="badge-pill role-pill">{profile.role}</span>
            {profile.badges?.length
              ? profile.badges.map((badge) => <span key={badge}>{badge.replaceAll("_", " ")}</span>)
              : <span>No badges yet</span>}
          </div>
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
        <MetricCard label="Score" value={profile.reputationScore} hint="Total reputation from case work" />
        <MetricCard label="Level" value={profile.level} hint="Unlocked by sustained activity" />
        <MetricCard label="Accuracy" value={`${profile.accuracyRate}%`} hint={`${profile.correctVotes} correct answers`} />
        <MetricCard label="Comments" value={profile.commentsCount} hint="Community discussion contributions" />
        <MetricCard label="Confidence" value={`${profile.confidenceScore}%`} hint="Blends accuracy and repetition" />
        <MetricCard label="Cases Done" value={profile.completedCasesCount} hint={`${profile.totalVotes} total submissions`} />
      </div>

      <div className="profile-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <h3>Recent Streak</h3>
              <p className="supporting-copy">A quick read on how your last attempts went.</p>
            </div>
          </div>
          <PerformanceDots items={profile.recentPerformance} />
          <RecentPerformanceList items={profile.recentPerformance} />
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h3>Difficulty Breakdown</h3>
              <p className="supporting-copy">Useful for spotting where your judgment weakens.</p>
            </div>
          </div>
          <DifficultyBars items={profile.difficultyBreakdown || []} />
        </section>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3>Answered Cases</h3>
            <p className="supporting-copy">Jump back into any case you have already completed.</p>
          </div>
        </div>
        <AnsweredCasesList items={profile.answeredCases} />
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3>Recent Comments</h3>
            <p className="supporting-copy">Your latest discussion activity across cases.</p>
          </div>
        </div>
        <RecentCommentsList items={profile.recentComments} />
      </section>
    </section>
  );
}

export default ProfilePage;
