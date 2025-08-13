import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios"; // (unused after change—ok to remove later)
import { API_URL } from "../shared"; // (unused after change—ok to remove later)
import "./AuthStyles.css";
// CHANGED: use shared api client so baseURL '/api' is applied
import { api } from "../ApiClient";
// ADDED: Google login button component (App is already wrapped in GoogleOAuthProvider)
import { GoogleLogin } from "@react-oauth/google";

const Login = ({ setUser, onAuth0Login}) => {
  const [formData, setFormData] = useState({
    // CHANGED: use email instead of username (the UI collects email)
    email: "",     
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    // CHANGED: validate email instead of username
    if (!formData.email) {
      newErrors.email = "Email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // CHANGED: send through shared api (adds /api, credentials, CSRF header)
      // Test: if backend supports identifier OR email, use identifier; otherwise switch "identifier" to "email"
      const { data } = await api.post("/auth/login", {
        identifier: formData.email, // CHANGED (use "email" if identifier support was removed server-side)
        password: formData.password,
      });

      setUser(data.user);
      navigate("/");
    } catch (error) {
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: "An error occurred during login" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login</h2>

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          onClick={onAuth0Login}
          className="auth0-login-btn"
        >
          Auth
        </button>
        
        <GoogleLogin
          onSuccess={async (credResponse) => {
            try {
              const id_token = credResponse.credential; // Google ID token
              // CHANGED: use shared api so credentials/CSRF are handled
              const { data } = await api.post("/auth/google", { id_token }); 
              setUser?.(data.user);
              navigate("/");
            } catch (err) {
              console.error("Google login failed", err);
            }
          }}
          onError={() => {
            console.error("Google Login error");
          }}
        />

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
