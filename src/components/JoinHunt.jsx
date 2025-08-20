import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";

export default function JoinHunt() {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function handleJoin(e) {
    e.preventDefault();
    setErr("");

    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setErr("Please enter a join code.");
      return;
    }

    try {
      setLoading(true);
      await initCsrf();

      // Join by code
      const { data } = await api.post("/hunts/join", { joinCode: code });
      const { huntId, slug } = data || {};
      if (!huntId) throw new Error("Missing huntId");

      // Navigate once: prefer slug, fall back to numeric id
      navigate(`/hunts/${slug ?? huntId}`);
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        (e?.response?.status === 404
          ? "Invalid join code."
          : "Failed to join hunt.");
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "60vh",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleJoin}
        style={{ width: 360, maxWidth: "90%", display: "grid", gap: 12 }}
      >
        <h2>Join a Hunt</h2>
        <label htmlFor="joinCode">Enter Join Code</label>
        <input
          id="joinCode"
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="ABC123 (e.g., TUTORIAL)"
          maxLength={16}
          style={{ padding: "10px 12px" }}
          autoFocus
        />

        {err && (
          <div
            style={{
              color: "#b00020",
              background: "#fde7ea",
              padding: "8px 10px",
              borderRadius: 8,
            }}
          >
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !joinCode.trim()}
          style={{ padding: "10px 12px", fontWeight: 600 }}
        >
          {loading ? "Joining..." : "Join Hunt"}
        </button>
      </form>
    </div>
  );
}
