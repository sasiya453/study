import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useNavigate, useParams } from "react-router-dom";

export default function Deck() {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function load() {
    try {
      const r = await api(`/decks/${id}/cards`);
      setDeck(r.deck);
      setCards(r.cards || []);
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(()=>{ load(); }, [id]);

  async function addCard(e) {
    e.preventDefault();
    await api(`/decks/${id}/cards`, { method: "POST", body: { question: q, answer: a } });
    setQ(""); setA("");
    load();
  }

  async function delCard(cid) {
    if (!confirm("Delete this card?")) return;
    await api(`/cards/${cid}`, { method: "DELETE" });
    load();
  }

  async function delDeck() {
    if (!confirm("Delete this deck (and its cards)?")) return;
    await api(`/decks/${id}`, { method: "DELETE" });
    nav("/");
  }

  return (
    <div>
      <h2>Deck</h2>
      {deck && (
        <div className="card">
          <b>{deck.name}</b><div className="muted">{deck.description}</div>
          <div className="space"/>
          <button className="secondary" onClick={delDeck}>Delete deck</button>
        </div>
      )}
      <div className="card">
        <h3>Add a card</h3>
        <form onSubmit={addCard}>
          <textarea placeholder="Question" value={q} onChange={e=>setQ(e.target.value)} />
          <textarea placeholder="Answer" value={a} onChange={e=>setA(e.target.value)} />
          <button>Add</button>
        </form>
      </div>
      <h3>Cards</h3>
      {cards.map(c=>(
        <div className="card" key={c.id}>
          <div><b>Q:</b> {c.question}</div>
          <div className="muted"><b>A:</b> {c.answer}</div>
          <div className="muted">Due: {new Date(c.due_at).toLocaleString()} • EF: {c.ef.toFixed(2)} • I: {c.interval}d • Reps: {c.repetitions}</div>
          <button className="secondary" onClick={()=>delCard(c.id)}>Delete</button>
        </div>
      ))}
      {err && <p className="muted">{err}</p>}
    </div>
  );
}