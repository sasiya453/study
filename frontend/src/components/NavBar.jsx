import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../api.js";

export default function NavBar() {
  const nav = useNavigate();
  const authed = !!getToken();
  return (
    <nav>
      <div className="container">
        <div><Link to="/" style={{ color: "#fff" }}>SRS</Link></div>
        <div>
          {authed ? (
            <button className="secondary" onClick={() => { clearToken(); nav("/login"); }}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" style={{ color: "#fff", marginRight: 12 }}>Login</Link>
              <Link to="/register" style={{ color: "#fff" }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}