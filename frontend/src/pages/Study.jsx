import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useParams } from "react-router-dom";

export default function Study() {
  const { deckId } = useParams();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const query = deckId ? `?deckId=${deckId}` : "";
    const r = await api(`/reviews/due${query}`);
    setCards(r.cards || []);
    setIndex(0);
    setShowAnswer(false);
    setLoading(false);
  }
  useEffect(()=>{ load(); }, [deckId]);

  async function grade(label) {
    const current = cards[index];
    await api(`/reviews`, { method: "POST", body: { cardId: current.id, gradeLabel: label } });
    if (index + 1 < cards.length) {
      setIndex(index + 1);
      setShowAnswer(false);
    } else {
      await load();
    }
  }

  if (loading) return <p>Loading…</p>;
  if (!cards.length) return <p>No cards due. 🎉</p>;

  const c = cards[index];
  return (
    <div>
      <h2>Study</h2>
      <div className="muted">Card {index+1} of {cards.length}</div>
      <div className="card">
        <div><b>Q:</b> {c.question}</div>
        {showAnswer && <div className="space"/>}
        {showAnswer && <div><b>A:</b> {c.answer}</div>}
        {!showAnswer ? (
          <button onClick={()=>setShowAnswer(true)}>Show answer</button>
        ) : (
          <div className="row">
            <button className="secondary" onClick={()=>grade("hard")}>Hard</button>
            <button className="secondary" onClick={()=>grade("medium")}>Medium</button>
            <button onClick={()=>grade("easy")}>Easy</button>
          </div>
        )}
      </div>
    </div>
  );
}

