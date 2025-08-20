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
    if (!code) return setErr("Please enter a join code.");

    try {
      setLoading(true);
      await initCsrf();

      // 1) Join by code
      const { data } = await api.post("/hunts/join", { joinCode: code });
      const { huntId, slug } = data || {};
      if (!huntId) throw new Error("Missing huntId");

      // 2) Prefer slug if we already got it; otherwise fetch it
      let targetSlug = slug;
      if (!targetSlug) {
        const { data: hunt } = await api.get(`/hunts/${huntId}`);
        targetSlug = hunt?.slug || null;
      }

      // 3) Navigate using slug when available (fallback to id)
      navigate(`/hunts/${targetSlug ?? huntId}`);
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
          placeholder="ABC123"
          maxLength={16}
          style={{ padding: "10px 12px" }}
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
          disabled={loading}
          style={{ padding: "10px 12px", fontWeight: 600 }}
        >
          {loading ? "Joining..." : "Join Hunt"}
        </button>
      </form>
    </div>
  );
}
