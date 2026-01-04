import React from "react";
import { Sparkles, Brain, Leaf } from "lucide-react";

const LoadingState = () => {
  const tips = [
    "Analyzing ingredient order and prominence...",
    "Identifying processing indicators...",
    "Evaluating additive patterns...",
    "Checking for common formulation signals...",
  ];

  const [tipIndex, setTipIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="paper-surface fade-in"
      style={{
        textAlign: "center",
        padding: "3.5rem 2rem",
        background:
          "linear-gradient(135deg, var(--color-paper) 0%, var(--color-accent-soft) 100%)",
      }}
    >
      {/* Animated Icon */}
      <div
        style={{
          width: "90px",
          height: "90px",
          margin: "0 auto 1.75rem",
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, var(--color-accent-light) 0%, var(--color-accent-soft) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: "0 8px 32px rgba(107, 123, 58, 0.2)",
        }}
      >
        {/* Rotating ring */}
        <div
          style={{
            position: "absolute",
            inset: "-6px",
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "var(--color-accent)",
            borderRightColor: "var(--color-accent)",
            animation: "spin 1.5s linear infinite",
          }}
        />
        {/* Pulsing inner ring */}
        <div
          style={{
            position: "absolute",
            inset: "4px",
            borderRadius: "50%",
            border: "2px solid var(--color-accent-light)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <Leaf size={36} color="var(--color-accent)" />
      </div>

      <h3
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.5rem",
          fontWeight: 500,
          color: "var(--color-text-primary)",
          margin: "0 0 0.5rem",
        }}
      >
        Analyzing your ingredients
      </h3>

      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: "1.1rem",
          color: "var(--color-text-secondary)",
          margin: "0 0 2rem",
          minHeight: "1.5em",
          transition: "opacity 0.3s ease",
        }}
        key={tipIndex}
        className="fade-in"
      >
        {tips[tipIndex]}
      </p>

      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.6rem",
          marginBottom: "1.5rem",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background:
                i === tipIndex
                  ? "var(--color-accent)"
                  : "var(--color-accent-light)",
              transition: "all 0.3s ease",
              transform: i === tipIndex ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
        }}
      >
        <Sparkles size={12} />
        This typically takes 5-15 seconds
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
