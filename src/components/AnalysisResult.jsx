import React from "react";
import {
  Eye,
  Scale,
  HelpCircle,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";

const AnalysisResult = ({ result, onReset }) => {
  if (!result) return null;

  const { judgment, observations, tradeoff, limitations, confidence } = result;

  const getConfidenceConfig = (level) => {
    const configs = {
      high: {
        icon: CheckCircle,
        color: "var(--color-accent)",
        bg: "var(--color-accent-soft)",
        label: "High Confidence",
      },
      medium: {
        icon: Info,
        color: "#a88c4a",
        bg: "rgba(168, 140, 74, 0.1)",
        label: "Medium Confidence",
      },
      low: {
        icon: AlertTriangle,
        color: "#9a6b5a",
        bg: "rgba(154, 107, 90, 0.1)",
        label: "Low Confidence",
      },
    };
    return configs[level] || configs.medium;
  };

  const confidenceConfig = getConfidenceConfig(confidence);
  const ConfidenceIcon = confidenceConfig.icon;

  return (
    <div className="fade-in">
      {/* Main Judgment Card - The Mental Anchor */}
      <div
        className="paper-surface judgment-card delay-1"
        style={{
          background:
            "linear-gradient(135deg, var(--color-paper) 0%, var(--color-accent-soft) 100%)",
          borderLeft: "4px solid var(--color-accent)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative element */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "var(--color-accent-light)",
            opacity: 0.3,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
            color: "var(--color-text-muted)",
          }}
        >
          <Sparkles size={14} />
          <h2 style={{ margin: 0, fontSize: "0.9rem" }}>
            What This Looks Like
          </h2>
        </div>

        <h1
          className="judgment-text"
          style={{ position: "relative", zIndex: 1 }}
        >
          {judgment}
        </h1>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "100px",
            background: confidenceConfig.bg,
            color: confidenceConfig.color,
            fontSize: "0.85rem",
            fontWeight: 500,
            marginTop: "0.5rem",
          }}
        >
          <ConfidenceIcon size={14} />
          {confidenceConfig.label}
        </div>
      </div>

      {/* Observations Section - Why the framing makes sense */}
      <div
        className="observations-section delay-2"
        style={{
          background: "var(--color-paper)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          className="observations-header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "var(--color-accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Eye size={16} color="var(--color-accent)" />
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.1rem",
              color: "var(--color-text-primary)",
            }}
          >
            Why This Framing
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {observations.map((obs, index) => (
            <div
              key={index}
              className="observation-item"
              style={{
                padding: "1rem 1.25rem",
                background: "var(--color-bg)",
                borderRadius: "var(--radius-md)",
                borderLeft: "3px solid var(--color-accent-light)",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                }}
              >
                <ChevronRight
                  size={16}
                  color="var(--color-accent)"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <div>
                  <h3
                    style={{
                      marginBottom: "0.375rem",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {obs.observation}
                  </h3>
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tradeoff Section - What you gain vs give up */}
      <div
        className="tradeoff-section delay-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(107, 123, 58, 0.08) 0%, rgba(107, 123, 58, 0.03) 100%)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem 1.75rem",
          border: "1px solid var(--color-accent-light)",
        }}
      >
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "0.75rem",
            fontSize: "1rem",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "var(--color-accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Scale size={14} color="var(--color-accent)" />
          </div>
          The Tradeoff
        </h2>
        <p
          className="tradeoff-text"
          style={{
            margin: 0,
            paddingLeft: "2.4rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
          }}
        >
          {tradeoff}
        </p>
      </div>

      {/* Limitations Section - What can't be known */}
      <div
        className="limitations-box delay-3"
        style={{
          background: "rgba(154, 107, 90, 0.06)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem 1.75rem",
          border: "1px solid rgba(154, 107, 90, 0.15)",
        }}
      >
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "0.75rem",
            fontSize: "1rem",
            color: "#9a6b5a",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(154, 107, 90, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HelpCircle size={14} color="#9a6b5a" />
          </div>
          What the Label Can't Tell You
        </h2>
        <p
          style={{
            margin: 0,
            paddingLeft: "2.4rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
          }}
        >
          {limitations}
        </p>
      </div>

      {/* Action */}
      <div
        style={{ marginTop: "2.5rem", textAlign: "center" }}
        className="delay-4"
      >
        <button
          onClick={onReset}
          className="btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.875rem 1.75rem",
          }}
        >
          <RefreshCw size={16} />
          Analyze Another Product
        </button>
      </div>
    </div>
  );
};

export default AnalysisResult;
