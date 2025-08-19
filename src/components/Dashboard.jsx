import { Link } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboards-landing">
      <div className="dashboards-shell">
        {/* Brand lockup */}
        <div className="brand-row">
          <img
            src="/SideQuestLogo.png" /* colored logo works on light bg */
            alt="SideQuest Logo"
            className="brand-logo"
            width="96"
            height="96"
          />
          <h1 className="brand-wordmark">SIDEQUEST</h1>
        </div>

        {/* 2-up cards */}
        <div className="cards-grid">
          <div className="dash-card">
            <h2 className="card-title">Creator Dashboard</h2>
            <p className="card-sub">Manage your treasure hunts</p>
            <Link to="/creator/hunts" className="btn cta-sun">Create Hunt</Link>
          </div>

          <div className="dash-card">
            <h2 className="card-title">Player Dashboard</h2>
            <p className="card-sub">Continue your adventure</p>
            <Link to="/player" className="btn cta-sea">View Hunts</Link>
          </div>
        </div>

        {/* Full-width card */}
        <div className="dash-card full">
          <h2 className="card-title">Badge Gallery</h2>
          <p className="card-sub">See the badges you have earned</p>
          <Link to="/badges" className="btn cta-sea">View Badges</Link>
        </div>
      </div>
    </div>
  );
}
