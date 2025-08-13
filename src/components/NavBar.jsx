import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./NavBar.css";

export default function NavBar({ user, onLogout }) {
  // If you still mount NavBar when logged out, bail out here
  if (!user) return null;
  return <LoggedInBar user={user} onLogout={onLogout} />;
}

function LoggedInBar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const navigate = useNavigate();

  const displayName =
    user?.username || user?.name || user?.email?.split("@")[0] || "Adventurer";
  const initial = (displayName?.[0] || "U").toUpperCase();

  useEffect(() => {
    const closeOnOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await onLogout?.();
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sq-navbar" role="banner">
      <div className="sq-nav-inner">
        {/* Brand replaces "Capstone II" */}
        <Link to="/" className="sq-brand" aria-label="SideQuest Home">
          <img src="/whitelogo2.png" alt="" className="sq-brand-logo" />
          <span className="sq-brand-name">SIDEQUEST</span>
        </Link>

        {/* Center links */}
        <nav className="sq-links" aria-label="Primary">
          <NavItem to="/dashboard">Dashboards</NavItem>
          <NavItem to="/leaderboard">Leaderboard</NavItem>
          <NavItem to="/profile">Profile</NavItem>
          <NavItem to="/news">News</NavItem>
          <NavItem to="/community">Community</NavItem>
        </nav>

        {/* Right side: desktop welcome + logout, mobile avatar menu */}
        <div className="sq-user">
          <div className="sq-welcome-and-logout">
            <span className="sq-welcome">Welcome, {displayName}!</span>
            <button className="sq-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <button
            ref={btnRef}
            className="sq-avatar"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            {initial}
          </button>

          {open && (
            <div ref={menuRef} className="sq-menu" role="menu">
              <MenuLink to="/dashboard" onClick={() => setOpen(false)}>
                Dashboards
              </MenuLink>
              <MenuLink to="/leaderboard" onClick={() => setOpen(false)}>
                Leaderboard
              </MenuLink>
              <MenuLink to="/profile" onClick={() => setOpen(false)}>
                Profile
              </MenuLink>
              <MenuLink to="/news" onClick={() => setOpen(false)}>
                News
              </MenuLink>
              <MenuLink to="/community" onClick={() => setOpen(false)}>
                Community
              </MenuLink>
              <div className="sq-menu-divider" role="separator" />
              <button className="sq-menu-logout" onClick={handleLogout} role="menuitem">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => "sq-link" + (isActive ? " sq-link-active" : "")}
    >
      {children}
    </NavLink>
  );
}

function MenuLink({ to, children, onClick }) {
  return (
    <Link to={to} className="sq-menu-link" role="menuitem" onClick={onClick}>
      {children}
    </Link>
  );
}
