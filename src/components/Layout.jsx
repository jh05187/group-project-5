import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Layout() {
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const navItems = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: "/cases", label: "Case Feed" },
      { to: "/leaderboard", label: "Leaderboard" },
      ...(user ? [{ to: "/messages", label: "Messages" }] : []),
      { to: user ? "/profile" : "/auth", label: user ? "Profile" : "Login" },
      ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
    ],
    [user],
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <Link to="/" className="brand">
            <span className="brand-mark">SH</span>
            <span>
              ScamShield Hub
              <small>Phishing practice and peer learning</small>
            </span>
          </Link>
          <button
            className="nav-toggle"
            type="button"
            onClick={() => setNavOpen((value) => !value)}
            aria-expanded={navOpen}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <nav className={`nav ${navOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          {user ? (
            <>
              <div className="topbar-identity">
                <span className="chip">{user.username}</span>
                <small>{user.role === "admin" ? "Administrator" : "Learner"}</small>
              </div>
              <button className="link-button" type="button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="chip chip-action">
              Register
            </Link>
          )}
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} ScamShield Hub</p>
      </footer>
    </div>
  );
}

export default Layout;
