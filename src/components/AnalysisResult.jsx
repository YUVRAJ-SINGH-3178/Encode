import React from "react";
import { Eye, Scale, HelpCircle } from "lucide-react";

const AnalysisResult = ({ result, onReset }) => {
  if (!result) return null;

  const { judgment, observations, tradeoff, limitations, confidence } = result;

  const getConfidenceClass = (level) => {
    return `confidence-badge ${level}`;
  };

  return (
    <div className="fade-in">
      {/* Main Judgment Card - The Mental Anchor */}
      <div className="paper-surface judgment-card delay-1">
        <h2
          style={{ marginBottom: "0.75rem", color: "var(--color-text-muted)" }}
        >
          What This Looks Like
        </h2>
        <h1 className="judgment-text">{judgment}</h1>
        <div className={getConfidenceClass(confidence)}>
          {confidence} confidence
        </div>
      </div>

      {/* Observations Section - Why the framing makes sense */}
      <div className="observations-section delay-2">
        <div className="observations-header">
          <Eye size={16} />
          <h2>Why This Framing</h2>
        </div>
        <div>
          {observations.map((obs, index) => (
            <div key={index} className="observation-item">
              <h3 style={{ marginBottom: "0.375rem" }}>{obs.observation}</h3>
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-secondary)",
                  fontSize: "0.9375rem",
                  lineHeight: "1.6",
                }}
              >
                {obs.why}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tradeoff Section - What you gain vs give up */}
      <div className="tradeoff-section delay-3">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Scale size={14} />
          The Tradeoff
        </h2>
        <p className="tradeoff-text" style={{ margin: 0 }}>
          {tradeoff}
        </p>
      </div>

      {/* Limitations Section - What can't be known */}
      <div className="limitations-box delay-3">
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <HelpCircle size={14} />
          What the Label Can't Tell You
        </h2>
        <p>{limitations}</p>
      </div>

      {/* Action */}
      <div
        style={{ marginTop: "2.5rem", textAlign: "center" }}
        className="delay-4"
      >
        <button onClick={onReset} className="btn-secondary">
          New Judgment
        </button>
      </div>
    </div>
  );
};

export default AnalysisResult;
