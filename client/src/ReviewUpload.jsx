
import { useState } from "react";
import axios from "axios";
import { Upload, FileSpreadsheet } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || 
"https://reviewpulse-ai-groww-api.onrender.com";

export default function ReviewUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [generatingPulse, setGeneratingPulse] = useState(false);
  const [pulse, setPulse] = useState(null);
  const [pulseError, setPulseError] = useState("");

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);
    setAnalysis(null);
    setPulse(null);
    setPulseError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_URL}/api/reviews/upload`,
        formData
      );

      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not upload the CSV."
      );
    } finally {
      setLoading(false);
    }
  }

  
async function handleAnalyze() {
  if (!result?.reviews?.length) return;

  setAnalyzing(true);
  setError("");
  setAnalysis(null);

  try {
    const response = await axios.post(
      `${API_URL}/api/reviews/analyze`,
      { reviews: result.reviews }
    );

    setAnalysis(response.data.analysis);
  } catch (err) {
    setError(
      err.response?.data?.message ||
      "AI analysis failed. Please try again."
    );
  } finally {
    setAnalyzing(false);
  }
}



async function handleGeneratePulse() {
  if (!result?.reviews?.length || !analysis) {
    setPulseError("Please analyze the reviews first.");
    return;
  }

  setGeneratingPulse(true);
  setPulseError("");
  setPulse(null);

  try {
    const response = await axios.post(
      `${API_URL}/api/reviews/pulse`,
      {
        reviews: result.reviews,
        analysis: analysis
      }
    );

    setPulse(response.data.pulse);

  } catch (error) {
    console.error("Pulse generation error:", error);

    setPulseError(
      error.response?.data?.message ||
      "Unable to generate Weekly Product Pulse."
    );
  } finally {
    setGeneratingPulse(false);
  }
}


  return (
    <section className="upload-section">
      <h2>Upload Groww Customer Reviews</h2>
      <p>Select your CSV file to view review statistics.</p>

      <div className="upload-box">
        <FileSpreadsheet size={36} color="#5146d8" />

        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            setFile(e.target.files[0] || null);
            setResult(null);
            setError("");
          }}
        />

        <button
          onClick={handleUpload}
          disabled={!file || loading}
        >
          <Upload size={18} />
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>

      {error && <p className="upload-error">{error}</p>}

      {result && (
        <div className="review-results">
          <h3>Dataset Overview</h3>

          <div className="stats">
            <div>
              <h2>{result.totalReviews}</h2>
              <p>Total Reviews</p>
            </div>

            <div>
              <h2>{result.averageRating}/5</h2>
              <p>Average Rating</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rating</th>
                  <th>Customer Review</th>
                  <th>Source</th>
                </tr>
              </thead>

              <tbody>
                {result.reviews.map((review) => (
                  <tr key={review.review_id}>
                    <td>{review.date}</td>
                    <td>{review.rating}/5</td>
                    <td>{review.review_text}</td>
                    <td>{review.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      
{result && (
  <div className="ai-section">
    <h2>AI Review Intelligence</h2>
    <p>
      Discover recurring themes, customer sentiment,
      and confusing fees using Google Gemini AI.
    </p>

    <button
      className="analyze-button"
      onClick={handleAnalyze}
      disabled={analyzing}
    >
      {analyzing ? "Analyzing Reviews..." : "Analyze with AI"}
    </button>

    {analysis && (
      <div className="analysis-results">
        <h3>Top Product Themes</h3>

        {analysis.themes.map((theme, index) => (
          <div className="theme-card" key={index}>
            <h4>{theme.name}</h4>
            <p>{theme.description}</p>
            <strong>{theme.count} review(s)</strong>
          </div>
        ))}

        <h3>Top 3 Themes</h3>
        <ol>
          {analysis.top_themes.map((theme, index) => (
            <li key={index}>{theme}</li>
          ))}
        </ol>

        <h3>Customer Quotes</h3>
        {analysis.quotes.map((item, index) => (
          <blockquote key={index}>
            "{item.quote}"
            <small> — {item.review_id}</small>
          </blockquote>
        ))}

        <h3>Recurring Fee Confusion</h3>
        <div className="fee-card">
          <h4>{analysis.fee_issue.name}</h4>
          <p>{analysis.fee_issue.description}</p>
          <p>
            Recurring:{" "}
            {analysis.fee_issue.recurring ? "Yes" : "Not confirmed"}
          </p>
          <p>
            Supporting reviews:{" "}
            {analysis.fee_issue.review_ids.join(", ") || "None"}
          </p>
        </div>

        <h3>Sentiment Breakdown</h3>
        <div className="sentiment-grid">
          <div>Positive: {analysis.sentiment.positive}</div>
          <div>Neutral: {analysis.sentiment.neutral}</div>
          <div>Negative: {analysis.sentiment.negative}</div>
        </div>

        <h3>Key Observation</h3>
        <p>{analysis.observation}</p>
      </div>
    )}

    
{analysis && (
  <div className="pulse-section">
    <h2>Weekly Product Pulse</h2>

    <p>
      Generate a concise product insights report from
      the analyzed customer reviews.
    </p>

    <button
      className="analyze-button"
      onClick={handleGeneratePulse}
      disabled={generatingPulse}
    >
      {generatingPulse
        ? "Generating Weekly Pulse..."
        : "Generate Weekly Pulse"}
    </button>

    {pulseError && (
      <p className="pulse-error">{pulseError}</p>
    )}

    {pulse && (
      <div className="pulse-report">
        <div className="pulse-report-header">
          <h3>{pulse.title}</h3>
          <span>{pulse.wordCount}/250 words</span>
        </div>

        {pulse.datasetType === "synthetic_test" && (
          <p className="pulse-test-label">
            Synthetic test data — not real Groww reviews
          </p>
        )}

        <pre className="pulse-content">
          {pulse.content}
        </pre>

        <button
          className="pulse-copy-button"
          onClick={() =>
            navigator.clipboard.writeText(pulse.content)
          }
        >
          Copy Report
        </button>
      </div>
    )}
  </div>
)}


    
  </div>
)}

    </section>
  );
}
