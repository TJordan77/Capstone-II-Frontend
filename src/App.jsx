import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
//import axios from "axios";
import { api } from "./ApiClient";
import "./AppStyles.css";
import NavBar from "./components/NavBar";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import CreateHunt from "./components/CreateHunt";
import NotFound from "./components/NotFound";
import { API_URL, SOCKETS_URL, NODE_ENV } from "./shared";
import { io } from "socket.io-client";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { auth0Config } from "./auth0-config";

const socket = io(SOCKETS_URL, {
  withCredentials: NODE_ENV === "production",
});

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
    const {
    isAuthenticated,
    user: auth0User,
    loginWithRedirect,
    logout: auth0Logout,
    isLoading: auth0Loading,
  } = useAuth0();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔗 Connected to socket");
    });
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
    checkAuth();
  }, []);

  // Handle Auth0 authentication
  useEffect(() => {
    if (isAuthenticated && auth0User) {
      handleAuth0Login();
    }
  }, [isAuthenticated, auth0User]);

  const handleAuth0Login = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/auth0`,
        {
          auth0Id: auth0User.sub,
          firstName: auth0User.name.split(" ")[0],
          lastName: auth0User.name.split(" ")[1],
          email: auth0User.email,
          username: auth0User.nickname || auth0User.email?.split("@")[0],
        },
        {
          withCredentials: true,
        }
      );
      setUser(response.data.user);
    } catch (error) {
      console.error("Auth0 login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Logout from our backend
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      setUser(null);
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
          <Route path="/login" element={<Login setUser={setUser} onAuth0Login={handleAuth0LoginClick}  />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route exact path="/" element={<Home />} />
          <Route path="/create" element={<CreateHunt />} />
          <Route path="/create" element={(!!user || isAuthenticated) ? <CreateHunt /> : <Navigate to="/login" replace state={{ from: "/create" }} />}/>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const Root = () => {
  return (
    <Auth0Provider {...auth0Config}>
      <Router>
        <App />
      </Router>
    </Auth0Provider> 
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<Root />);
