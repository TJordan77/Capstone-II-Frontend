import React, { useState, useEffect, useRef } from "react";
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
import JoinHunt from "./components/JoinHunt";
import NotFound from "./components/NotFound";
import Leaderboard from "./components/Leaderboard";
import Dashboard from "./components/Dashboard";

import { API_URL, SOCKETS_URL, NODE_ENV } from "./shared";
import { io } from "socket.io-client";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { auth0Config } from "./auth0-config";

import { GoogleOAuthProvider } from "@react-oauth/google";
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const ENABLE_SOCKETS = false;
const socket = ENABLE_SOCKETS
  ? io(SOCKETS_URL, {
      withCredentials: false,
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
    getIdTokenClaims,
  } = useAuth0();

  const postedAuth0Ref = useRef(false);

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => {
      console.log("🔗 Connected to socket");
    });
    return () => {
      socket.off("connect");
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

  useEffect(() => {
    (async () => {
      await initCsrf();
      await checkAuth();
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated && auth0User && !postedAuth0Ref.current) {
      postedAuth0Ref.current = true;
      handleAuth0Login();
    }
  }, [isAuthenticated, auth0User]);

  const handleAuth0Login = async () => {
    try {
      const claims = await getIdTokenClaims();
      const id_token = claims?.__raw;
      if (!id_token) throw new Error("No Auth0 id_token available");

      const { data } = await api.post("/auth/auth0", { id_token });
      setUser(data.user);
    } catch (error) {
      console.error("Auth0 login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {});
      setUser(null);
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
          <Route exact path="/" element={<Home isLoggedIn={showNav} />} />
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
          <Route
            path="/play/:huntId/checkpoints/:checkpointId"
            element={<PlayCheckpoint />}
          />
          <Route path="/join" element={<JoinHunt />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/leaderboard/:huntId" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const Root = () => {
  return (
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
