import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../api.js";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { token } = await api("/auth/register", { method: "POST", body: { email, password }, auth: false });
      setToken(token);
      nav("/");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <div><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><input placeholder="Password (6+ chars)" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button>Create account</button>
      </form>
      {err && <p className="muted">{err}</p>}
      <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}