import React from "react";
import "./Home.css";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-page">
      <div
        className="home-bg"
        style={{ backgroundImage: 'url("/background.png")' }}
        aria-hidden="true"
      />

      <div className="home-container">
        <div className="home-navbar">
          <div className="brand">
            <img src="/whitelogo2.png" alt="SideQuest Logo" className="home-logo" />
            <span className="brand-name">SIDEQUEST</span>
          </div>
          <div className="home-nav-buttons">
            <Link to="/login" className="home-nav-btn">Log in</Link>
            <Link to="/signup" className="home-nav-btn">Sign Up</Link>
          </div>
        </div>

        <div className="home-hero">
          <div className="home-hero-text">
            <h1>Embark on real world treasure hunts</h1>
            <div className="cta-buttons">
              <Link to="/create" className="btn-green">Create a Hunt</Link>
              <Link to="/join" className="btn-yellow">Join a Hunt</Link>
            </div>
          </div>
          <div className="home-hero-image">
            <img src="/hero-map-illustration.png" alt="Hero Map" />
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <img src="/icon-mountain.png" alt="Create Icon" />
            <h3>Create Your Adventure</h3>
            <p>Design custom hunts with unique clues and checkpoints for players to discover.</p>
          </div>
          <div className="feature-card">
            <img src="/icon-progress.png" alt="Progress Icon" />
            <h3>Track Player Progress</h3>
            <p>Monitor players in real time as they solve riddles and advance through checkpoints.</p>
          </div>
          <div className="feature-card">
            <img src="/icon-badges.png" alt="Badge Icon" />
            <h3>Unlock Badges</h3>
            <p>Collect unique badges for completing hunts and mastering challenges.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
