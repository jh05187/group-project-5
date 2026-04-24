import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, LoadingBlock, StatusBanner } from "../components/Feedback";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function MemberPicker({ group, onClose, onMembersChanged }) {
  const [username, setUsername] = useState("");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const result = await api(`/leaderboard/groups/${group.id}/members`);
      setMembers(result.members ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, [group.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function addByUsername() {
    const trimmed = username.trim();
    if (!trimmed) return;

    setError("");
    setAdding(true);
    try {
      const { user } = await api(`/leaderboard/users/by-username/${encodeURIComponent(trimmed)}`);

      if (members.some((member) => member.id.toString() === user.id.toString())) {
        setError(`${user.username} is already in this group`);
        return;
      }

      await api(`/leaderboard/groups/${group.id}/join`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
      });

      setUsername("");
      await loadMembers();
      onMembersChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function removeUser(userId) {
    setError("");
    try {
      await api(`/leaderboard/groups/${group.id}/members/${userId}`, {
        method: "DELETE",
      });
      await loadMembers();
      onMembersChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Manage "{group.name}"</h3>
          <button className="icon-button" onClick={onClose} type="button">
            x
          </button>
        </div>

        <p className="supporting-copy">
          Add usernames here if you want a smaller leaderboard for classmates or friends.
        </p>

        <div className="input-row">
          <input
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addByUsername()}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={addByUsername}
            disabled={adding || !username.trim()}
            type="button"
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="modal-section">
          <h4>Current Members ({members.length})</h4>
          {members.length === 0 ? (
            <p className="muted-text">No members yet.</p>
          ) : (
            <ul className="member-list">
              {members.map((member) => (
                <li key={member.id} className="member-list-item">
                  <span>{member.username}</span>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => removeUser(member.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [pickerGroup, setPickerGroup] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user's friends for the Friends leaderboard
  useEffect(() => {
    async function fetchFriends() {
      if (!user) return;
      try {
        const res = await api("/users/friends/list");
        setFriends(res.friends || []);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchFriends();
  }, [user]);

  const loadLeaderboard = useCallback(async (groupId = null) => {
    if (groupId === "__friends__") {
      // Show leaderboard for friends
      if (!friends.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      try {
        const ids = [user.id, ...friends.map(f => f._id || f.id)];
        const result = await api("/leaderboard", {
          method: "POST",
          body: JSON.stringify({ userIds: ids }),
          headers: { "Content-Type": "application/json" },
        });
        setRows(result?.leaderboard ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    const url = groupId ? `/leaderboard?group=${groupId}` : "/leaderboard";
    try {
      const result = await api(url);
      setRows(result?.leaderboard ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [friends, user]);

  const loadGroups = useCallback(async () => {
    try {
      const result = await api("/leaderboard/groups");
      setGroups(result?.groups ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadLeaderboard();
    loadGroups();
  }, [loadGroups, loadLeaderboard]);

  async function createGroup() {
    const name = window.prompt("Enter group name");
    if (!name) return;

    setError("");
    try {
      const result = await api("/leaderboard/groups", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!result?.group) throw new Error("Invalid response from server");
      setGroups((prev) => [...prev, result.group]);
      setNotice(`Created "${result.group.name}". Use Manage to add members.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteGroup(group) {
    const confirmed = window.confirm(`Delete "${group.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setError("");
    try {
      await api(`/leaderboard/groups/${group.id}`, { method: "DELETE" });
      setGroups((prev) => prev.filter((item) => item.id !== group.id));
      setNotice(`Deleted "${group.name}".`);
      if (activeGroup === group.id) {
        setActiveGroup(null);
        loadLeaderboard();
      }
      if (pickerGroup?.id === group.id) {
        setPickerGroup(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function selectGroup(groupId) {
    setActiveGroup(groupId);
    setError("");
    setNotice("");
    setLoading(true);
    loadLeaderboard(groupId);
  }

  const activeModeLabel =
    activeGroup === "__friends__"
      ? "Friends"
      : activeGroup
        ? groups.find((group) => group.id === activeGroup)?.name || "Group"
        : "Global";

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Leaderboard</h2>
          <p className="supporting-copy">
            Global ranks everyone, Friends narrows the board to your accepted connections, and
            Groups let you build smaller comparison boards for classmates or project teammates.
          </p>
        </div>
        <button className="btn btn-primary" onClick={createGroup} type="button">
          Create Group
        </button>
      </div>

      <div className="metrics-grid leaderboard-summary">
        <div className="metric">
          <span className="metric-label">Current mode</span>
          <strong>{activeModeLabel}</strong>
          <span className="metric-hint">
            {activeGroup === "__friends__"
              ? "Only you and your friends"
              : activeGroup
                ? "Members inside the selected group"
                : "All users ranked together"}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Groups</span>
          <strong>{groups.length}</strong>
          <span className="metric-hint">Custom boards available</span>
        </div>
        <div className="metric">
          <span className="metric-label">Rows shown</span>
          <strong>{rows.length}</strong>
          <span className="metric-hint">Learners currently ranked</span>
        </div>
      </div>

      <div className="group-tabs">
        <button
          className={`group-tab ${activeGroup === null ? "active" : ""}`}
          onClick={() => selectGroup(null)}
          type="button"
        >
          Global
        </button>
        <button
          className={`group-tab ${activeGroup === "__friends__" ? "active" : ""}`}
          onClick={() => selectGroup("__friends__")}
          type="button"
        >
          Friends
        </button>
        {groups.map((group) => (
          <span key={group.id} className="group-tab-wrap">
            <button
              className={`group-tab ${activeGroup === group.id ? "active" : ""}`}
              onClick={() => selectGroup(group.id)}
              type="button"
            >
              {group.name}
            </button>
            <button
              className="group-manage-button"
              onClick={() => setPickerGroup(group)}
              title="Manage members"
              type="button"
            >
              Manage
            </button>
            {String(group.createdBy) === String(user?.id) ? (
              <button
                className="group-delete-button"
                onClick={() => deleteGroup(group)}
                title="Delete group"
                type="button"
              >
                Delete
              </button>
            ) : null}
          </span>
        ))}
      </div>

      <StatusBanner type="error" message={error} />
      <StatusBanner type="info" message={notice} />

      {loading ? <LoadingBlock label="Refreshing leaderboard..." /> : null}

      {!loading ? (
        rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Accuracy</th>
                  <th>Votes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={String(row.id) === String(user?.id) ? "leaderboard-row-self" : ""}>
                    <td>{row.rank}</td>
                    <td>
                      <div className="leaderboard-user-cell">
                        <Link className="inline-link" to={`/users/${row.id}`}>
                          {row.username}
                        </Link>
                        {String(row.id) === String(user?.id) ? <span className="status-chip">You</span> : null}
                      </div>
                    </td>
                    <td>{row.reputationScore}</td>
                    <td>{row.level}</td>
                    <td>{row.accuracyRate}%</td>
                    <td>{row.totalVotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No rankings to show yet"
            description={
              activeGroup
                ? "This board does not have enough members yet. Add a few people first and the ranking will appear here."
                : "Once learners start answering cases, this leaderboard will fill in automatically."
            }
          />
        )
      ) : null}

      {pickerGroup ? (
        <MemberPicker
          group={pickerGroup}
          onClose={() => setPickerGroup(null)}
          onMembersChanged={() => loadLeaderboard(activeGroup)}
        />
      ) : null}
    </section>
  );
}

export default LeaderboardPage;
