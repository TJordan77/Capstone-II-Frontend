import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
// Optional: npm install react-qr-reader if for QR scan support
// import { QrReader } from "react-qr-reader";
//import "./JoinHunt.css";

export default function JoinHunt() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  async function handleJoin(e) {
    e.preventDefault();
    setError("");
    if (!joinCode.trim()) {
      return setError("Please enter a join code.");
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/hunts/join`,
        { joinCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Assuming backend returns { userHuntId, huntId }
      navigate(`/play/${res.data.huntId}`);
    } catch (err) {
      console.error("Join hunt failed", err);
      setError(
        err.response?.data?.error || "Failed to join hunt. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Optional QR scan handler
  // function handleScan(result) {
  //   if (result?.text) {
  //     setJoinCode(result.text);
  //   }
  // }

  return (
    <div className="join-hunt-page">
      <div className="join-hunt-card">
        <h1>Join a Hunt</h1>
        <form onSubmit={handleJoin} className="join-hunt-form">
          <label htmlFor="joinCode">Enter Join Code</label>
          <input
            id="joinCode"
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="ABC123"
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Joining..." : "Join Hunt"}
          </button>
        </form>

        {/* Optional QR Scanner */}
        {/* <div className="qr-section">
          <h3>Or Scan a QR Code</h3>
          <QrReader
            onResult={(result, error) => {
              if (!!result) {
                handleScan(result);
              }
            }}
            constraints={{ facingMode: "environment" }}
            style={{ width: "100%" }}
          />
        </div> */}
      </div>
    </div>
  );
}
