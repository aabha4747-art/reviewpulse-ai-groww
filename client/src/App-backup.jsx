
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import ReviewUpload from "./ReviewUpload";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    axios.get(`${API_URL}/api/health`)
      .then((response) => {
        setBackendStatus(response.data.message);
      })
      .catch(() => {
        setBackendStatus("Backend connection failed");
      });
  }, []);

  return (
    <main className="dashboard">
      <header>
        <div className="brand">ReviewPulse AI</div>
        <span className="tag">Groww Intelligence</span>
      </header>

      <section className="hero">
        <h1>Customer Feedback Intelligence</h1>
        <p>
          Transform raw Groww customer reviews into actionable
          product insights and support communication.
        </p>
        <div className="status">
          Backend: {backendStatus}
        </div>
      </section>

      <section className="features">
        <article>
          <h3>Review Intelligence</h3>
          <p>Analyze customer reviews and discover recurring themes.</p>
        </article>
        <article>
          <h3>Weekly Product Pulse</h3>
          <p>Generate concise product insights and action ideas.</p>
        </article>
        <article>
          <h3>Fee Explainer</h3>
          <p>Clarify confusing fees using verified official sources.</p>
        </article>
        <article>
          <h3>MCP Approval</h3>
          <p>Review outputs before creating notes and email drafts.</p>
        </article>
      </section>
      <ReviewUpload />
    </main>
  );
}

export default App;
