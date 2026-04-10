import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

function formatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getUserId(user) {
  return user?.id || user?._id || "";
}

function ThreadList({ threads, selectedUserId, onSelect }) {
  return (
    <div className="panel dm-thread-list">
      <h3>Conversations</h3>
      {!threads.length ? (
        <p className="supporting-copy">No friends yet. Search for a learner and send a friend request to start chatting.</p>
      ) : (
        <div className="dm-thread-items">
          {threads.map((thread) => {
            const participantId = getUserId(thread.participant);
            const isActive = participantId === selectedUserId;
            return (
              <button
                key={participantId}
                type="button"
                className={`dm-thread-item ${isActive ? "active" : ""}`}
                onClick={() => onSelect(participantId)}
              >
                <div className="dm-thread-head">
                  <strong>{thread.participant?.username || "Unknown user"}</strong>
                  {thread.unreadCount ? <span className="pill">{thread.unreadCount} new</span> : null}
                </div>
                <p>{thread.lastMessage?.body || "No messages yet"}</p>
                <small>{thread.lastMessage?.createdAt ? formatTime(thread.lastMessage.createdAt) : "Ready to chat"}</small>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserSearch({ query, setQuery, results, onAdd, onAccept, onMessage, searching }) {
  return (
    <div className="panel dm-search-panel">
      <div className="section-head">
        <div>
          <h3>Find People</h3>
          <p className="supporting-copy">Search by username or email, send a friend request, then start a private message.</p>
        </div>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search users..."
      />

      {query.trim().length === 1 ? <p className="muted-text">Type at least 2 characters.</p> : null}
      {searching ? <p className="muted-text">Searching...</p> : null}

      <div className="dm-user-results">
        {results.map((result) => (
          <article key={getUserId(result)} className="dm-user-result">
            <div>
              <strong>{result.username}</strong>
              <p className="muted-text">
                {result.email} | Level {result.level}
              </p>
            </div>
            <div className="dm-user-actions">
              <Link className="btn btn-ghost btn-small" to={`/users/${getUserId(result)}`}>
                Profile
              </Link>
              {result.friendshipStatus === "friends" ? (
                <button className="btn btn-primary btn-small" type="button" onClick={() => onMessage(getUserId(result))}>
                  Message
                </button>
              ) : null}
              {result.friendshipStatus === "none" ? (
                <button className="btn btn-primary btn-small" type="button" onClick={() => onAdd(getUserId(result))}>
                  Add Friend
                </button>
              ) : null}
              {result.friendshipStatus === "incoming_request" ? (
                <button className="btn btn-success btn-small" type="button" onClick={() => onAccept(getUserId(result))}>
                  Accept
                </button>
              ) : null}
              {result.friendshipStatus === "outgoing_request" ? (
                <span className="status-chip">Pending</span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function FriendRequests({ requests, onAccept }) {
  if (!requests.length) return null;

  return (
    <div className="panel dm-requests-panel">
      <h3>Friend Requests</h3>
      <div className="dm-user-results">
        {requests.map((request) => (
          <article key={getUserId(request)} className="dm-user-result">
            <div>
              <strong>{request.username}</strong>
              <p className="muted-text">{request.email}</p>
            </div>
            <button className="btn btn-success btn-small" type="button" onClick={() => onAccept(getUserId(request))}>
              Accept
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function Conversation({ participant, messages, myUserId }) {
  return (
    <div className="dm-messages">
      {messages.length === 0 ? (
        <p className="supporting-copy">No messages yet with {participant?.username}. Say hello.</p>
      ) : (
        messages.map((message) => {
          const mine = message.senderId?.toString() === myUserId;
          return (
            <article key={message.id} className={`dm-bubble ${mine ? "mine" : "theirs"}`}>
              <p>{message.body}</p>
              <small>{formatTime(message.createdAt)}</small>
            </article>
          );
        })
      )}
    </div>
  );
}

function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get("userId") || "";

  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [participant, setParticipant] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [me, setMe] = useState(null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeThread = useMemo(
    () => threads.find((thread) => getUserId(thread.participant) === selectedUserId) || null,
    [threads, selectedUserId],
  );

  const loadInbox = useCallback(async () => {
    const [inboxResult, meResult, friendsResult] = await Promise.all([
      api("/messages/inbox"),
      api("/auth/me"),
      api("/users/friends/list"),
    ]);
    setThreads(inboxResult.threads || []);
    setMe(meResult.user || null);
    setFriendRequests(friendsResult.friendRequests || []);
  }, []);

  const loadConversation = useCallback(async (userId) => {
    if (!userId) {
      setMessages([]);
      setParticipant(null);
      return;
    }

    const result = await api(`/messages/conversation/${userId}`);
    setMessages(result.messages || []);
    setParticipant(result.participant || null);
  }, []);

  const searchUsers = useCallback(async (value) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError("");
    try {
      const result = await api(`/users/search?q=${encodeURIComponent(trimmed)}`);
      setSearchResults(result.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadInbox()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadInbox]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      searchUsers(query);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query, searchUsers]);

  useEffect(() => {
    if (!selectedUserId && threads.length > 0) {
      setSearchParams({ userId: getUserId(threads[0].participant) });
      return;
    }

    loadConversation(selectedUserId).catch((err) => {
      setMessages([]);
      setParticipant(null);
      setError(err.message);
    });
  }, [selectedUserId, threads, loadConversation, setSearchParams]);

  async function refreshAfterSocialAction() {
    await Promise.all([loadInbox(), searchUsers(query)]);
  }

  async function sendFriendRequest(userId) {
    setError("");
    setNotice("");
    try {
      await api(`/users/friends/request/${userId}`, { method: "POST" });
      setNotice("Friend request sent.");
      await refreshAfterSocialAction();
    } catch (err) {
      setError(err.message);
    }
  }

  async function acceptFriendRequest(userId) {
    setError("");
    setNotice("");
    try {
      await api(`/users/friends/accept/${userId}`, { method: "POST" });
      setNotice("Friend request accepted. You can message this user now.");
      await refreshAfterSocialAction();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    if (!selectedUserId || !draft.trim()) return;

    setSending(true);
    setError("");
    setNotice("");

    try {
      await api(`/messages/${selectedUserId}`, {
        method: "POST",
        body: JSON.stringify({ body: draft.trim() }),
      });
      setDraft("");
      await Promise.all([loadConversation(selectedUserId), loadInbox()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleSelect(userId) {
    setSearchParams({ userId });
    setError("");
    setNotice("");
  }

  if (loading) {
    return <p>Loading messages...</p>;
  }

  return (
    <section className="dm-shell">
      <header className="page-title-row">
        <div>
          <h2>Direct Messages</h2>
          <p className="supporting-copy">Search users, connect as friends, and keep private study conversations in one place.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}

      <div className="dm-grid">
        <aside className="dm-sidebar">
          <UserSearch
            query={query}
            setQuery={setQuery}
            results={searchResults}
            onAdd={sendFriendRequest}
            onAccept={acceptFriendRequest}
            onMessage={handleSelect}
            searching={searching}
          />
          <FriendRequests requests={friendRequests} onAccept={acceptFriendRequest} />
          <ThreadList threads={threads} selectedUserId={selectedUserId} onSelect={handleSelect} />
        </aside>

        <div className="panel dm-chat-panel">
          <div className="dm-chat-head">
            <div>
              <h3>{participant?.username || activeThread?.participant?.username || "Select a friend"}</h3>
              {participant ? (
                <Link className="inline-link" to={`/users/${getUserId(participant)}`}>
                  View profile
                </Link>
              ) : null}
            </div>
          </div>

          {selectedUserId && (participant || activeThread) ? (
            <>
              <Conversation participant={participant || activeThread?.participant} messages={messages} myUserId={me?.id} />
              <form className="dm-compose" onSubmit={handleSend}>
                <textarea
                  placeholder="Write a message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={1000}
                />
                <button className="btn btn-primary" type="submit" disabled={sending || !draft.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="dm-empty-state">
              <h3>No conversation selected</h3>
              <p className="supporting-copy">
                Choose a friend from the conversation list, or search for someone and send a friend request first.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MessagesPage;
