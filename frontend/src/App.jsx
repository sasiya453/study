import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Deck from "./pages/Deck.jsx";
import Study from "./pages/Study.jsx";
import { getToken } from "./api.js";

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <NavBar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Protected><Dashboard/></Protected>} />
          <Route path="/deck/:id" element={<Protected><Deck/></Protected>} />
          <Route path="/study/:deckId" element={<Protected><Study/></Protected>} />
          <Route path="/study" element={<Protected><Study/></Protected>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </>
  );
}