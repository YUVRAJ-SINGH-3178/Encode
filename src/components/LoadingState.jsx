import React from "react";

const LoadingState = () => {
  return (
    <div
      className="paper-surface fade-in"
      style={{ textAlign: "center", padding: "4rem 2rem" }}
    >
      <p
        className="judgment-text"
        style={{
          fontSize: "1.5rem",
          fontStyle: "italic",
          color: "var(--color-text-secondary)",
        }}
      >
        Considering patterns...
      </p>
      <p
        style={{
          marginTop: "0.75rem",
          fontFamily: "var(--font-sans)",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)",
        }}
      >
        The co-pilot is interpreting the structural composition of the label.
      </p>
      <div className="loading-dots" style={{ marginTop: "2rem" }}>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
    </div>
  );
};

export default LoadingState;
