import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [decks, setDecks] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const d = await api("/decks");
      setDecks(d.decks || []);
      const s = await api("/stats");
      setStats(s);
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function createDeck(e) {
    e.preventDefault();
    await api("/decks", { method: "POST", body: { name, description } });
    setName(""); setDescription("");
    load();
  }

  return (
    <div>
      <h2>Dashboard</h2>
      {stats && (
        <div className="row">
          <div className="card">Due today: <b>{stats.dueToday}</b></div>
          <div className="card">Next 7 days: <b>{stats.next7Days}</b></div>
          <div className="card">Reviewed today: <b>{stats.reviewedToday}</b></div>
          <div className="card">Success rate: <b>{stats.successRate}%</b></div>
          <div className="card">Total cards: <b>{stats.totalCards}</b></div>
        </div>
      )}
      <div className="space"/>
      <div className="card">
        <h3>Create deck</h3>
        <form onSubmit={createDeck}>
          <input placeholder="Deck name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} />
          <button>Create</button>
        </form>
      </div>
      <div className="space"/>
      <h3>Your decks</h3>
      {decks.map(d => (
        <div className="card" key={d.id}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div><b>{d.name}</b></div>
              <div className="muted">{d.description}</div>
            </div>
            <div>
              <Link to={`/deck/${d.id}`} style={{marginRight:12}}>Manage</Link>
              <Link to={`/study/${d.id}`}>Study</Link>
            </div>
          </div>
        </div>
      ))}
      {err && <p className="muted">{err}</p>}
    </div>
  );
}