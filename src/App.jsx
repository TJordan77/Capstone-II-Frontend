import React, { useState, useEffect, useRef } from "react"; // add useRef
import { createRoot } from "react-dom/client";
import { api, initCsrf } from "./ApiClient";
import "./AppStyles.css";
import NavBar from "./components/NavBar";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import CreateHunt from "./components/CreateHunt";
import PlayCheckpoint from "./components/PlayCheckpoint";
import HuntPage from "./components/HuntPage";
import Leaderboard from "./components/Leaderboard";
import JoinHunt from "./components/JoinHunt";
import NotFound from "./components/NotFound";

import { API_URL, SOCKETS_URL, NODE_ENV } from "./shared";
import { io } from "socket.io-client";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { auth0Config } from "./auth0-config";

import { GoogleOAuthProvider } from "@react-oauth/google";
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Only create socket in development to avoid connecting in prod where server is disabled
// Disable sockets entirely until the backend socket server is enabled
const ENABLE_SOCKETS = false; // flip to true when backend is ready
const socket = ENABLE_SOCKETS
  ? io(SOCKETS_URL, {
      withCredentials: false, // not needed in dev for local sockets
    })
  : null;

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const {
    isAuthenticated,
    user: auth0User,
    loginWithRedirect,
    logout: auth0Logout,
    isLoading: auth0Loading,
    getIdTokenClaims,              // will fetch Auth0 id_token for backend verification
  } = useAuth0();

  const postedAuth0Ref = useRef(false); // prevent duplicate backend posts

  useEffect(() => {
    if (!socket) return;           // guard when sockets are disabled in prod
    socket.on("connect", () => {
      console.log("🔗 Connected to socket");
    });
    return () => {
      socket.off("connect");       // cleanup
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    (async () => {
      await initCsrf(); // get CSRF token first
      await checkAuth(); // then check session
    })();
  }, []);

  // Handle Auth0 authentication
  useEffect(() => {
    if (isAuthenticated && auth0User && !postedAuth0Ref.current) { // guard to avoid double-post
      postedAuth0Ref.current = true;
      handleAuth0Login();
    }
  }, [isAuthenticated, auth0User]);

  const handleAuth0Login = async () => {
    try {
      // ensure CSRF cookie exists before posting token
      await initCsrf();

      // send a verified id_token to backend instead of raw profile fields
      const claims = await getIdTokenClaims();
      const id_token = claims?.__raw;                   // (Auth0 SDK exposes the raw JWT here)
      if (!id_token) throw new Error("No Auth0 id_token available");

      // use shared api client so withCredentials and baseURL are consistent
      const { data } = await api.post("/auth/auth0", { id_token });
      setUser(data.user);
    } catch (error) {
      console.error("Auth0 login error:", error);
      postedAuth0Ref.current = false; // allow retry if something failed
    }
  };

  const handleLogout = async () => {
    try {
      // use shared api client
      await api.post("/auth/logout", {});
      setUser(null);
      postedAuth0Ref.current = false; // ADDED: reset so next Auth0 login can post again
      // Logout from Auth0
      auth0Logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAuth0LoginClick = () => {
    loginWithRedirect();
  };

  // Show NavBar only when logged in (backend user OR Auth0)
  const showNav = !!user || isAuthenticated;

  if (loading) {
    return <div className="app">Loading...</div>;
  }

  return (
    <div>
      {showNav && (
        <NavBar
          user={user}
          onLogout={handleLogout}
          onAuth0Login={handleAuth0LoginClick}
          isAuth0Authenticated={isAuthenticated}
        />
      )}
      <div className="app">
        <Routes>
          <Route
            path="/login"
            element={
              <Login setUser={setUser} onAuth0Login={handleAuth0LoginClick} />
            }
          />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="/" element={<Home isLoggedIn={showNav} />} />
          <Route
            path="/create"
            element={
              !!user || isAuthenticated ? (
                <CreateHunt />
              ) : (
                <Navigate to="/login" replace state={{ from: "/create" }} />
              )
            }
          />
          <Route path="/hunts/:id/" element={<HuntPage />} />
          <Route path="/play/:huntId/checkpoints/:checkpointId" element={<PlayCheckpoint />} />
          <Route path="/leaderboard/:huntId" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const Root = () => {
  return (
    // wrapped the app with GoogleOAuthProvider so GoogleLogin can issue id_tokens
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Auth0Provider {...auth0Config}>
        <Router>
          <App />
        </Router>
      </Auth0Provider>
    </GoogleOAuthProvider>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<Root />);
