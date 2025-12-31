import React from "react";
import { Lightbulb, AlertCircle, Scale } from "lucide-react";

const AnalysisResult = ({ result, onReset }) => {
  if (!result) return null;

  const { judgment, key_factors, tradeoffs, uncertainty, confidence } = result;

  const getConfidenceClass = (level) => {
    return `confidence-badge ${level}`;
  };

  return (
    <div className="fade-in">
      {/* Main Judgment Card */}
      <div className="paper-surface judgment-card delay-1">
        <h2 style={{ marginBottom: "1rem", color: "var(--color-accent)" }}>
          Co-pilot Judgment
        </h2>
        <h1 className="judgment-text">{judgment}</h1>
        <div className={getConfidenceClass(confidence)}>
          {confidence} confidence
        </div>
      </div>

      {/* Patterns Section */}
      <div className="patterns-section delay-2">
        <div className="patterns-header">
          <Lightbulb size={16} />
          <h2>Patterns Identified</h2>
        </div>
        <div>
          {key_factors.map((kf, index) => (
            <div key={index} className="pattern-item">
              <h3 style={{ marginBottom: "0.375rem" }}>{kf.factor}</h3>
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-secondary)",
                  fontSize: "0.9375rem",
                  lineHeight: "1.6",
                }}
              >
                {kf.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tradeoffs Section */}
      <div className="tradeoffs-section delay-3">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Scale size={14} />
          Tradeoffs
        </h2>
        <p className="subhead" style={{ margin: 0, fontSize: "1rem" }}>
          {tradeoffs}
        </p>
      </div>

      {/* Uncertainty Section */}
      <div className="uncertainty-box delay-3">
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <AlertCircle size={14} />
          Uncertainty & Limits
        </h2>
        <p>{uncertainty}</p>
      </div>

      {/* Action */}
      <div
        style={{ marginTop: "2.5rem", textAlign: "center" }}
        className="delay-4"
      >
        <button onClick={onReset} className="btn-secondary">
          New Analysis
        </button>
      </div>
    </div>
  );
};

export default AnalysisResult;
