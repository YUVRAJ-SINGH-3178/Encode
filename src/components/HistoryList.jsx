import React from "react";
import { Trash2, RefreshCw, Clock, ChevronRight } from "lucide-react";

const HistoryList = ({ history, onSelect, onClear, onRefresh }) => {
  if (!history || history.length === 0) {
    return (
      <div className="empty-state fade-in delay-1">
        <Clock
          size={40}
          color="var(--color-text-muted)"
          style={{ marginBottom: "1rem" }}
        />
        <p className="subhead">No previous analyses found.</p>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
          }}
        >
          Your analysis history will appear here after you analyze some
          ingredients.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-secondary"
            style={{
              marginTop: "1.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )}
      </div>
    );
  }

  const getConfidenceClass = (level) =>
    `history-confidence ${level || "medium"}`;

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Analysis History</h2>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
            }}
          >
            {history.length} {history.length === 1 ? "analysis" : "analyses"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn-ghost"
              title="Refresh history"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.75rem",
              }}
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            onClick={onClear}
            className="btn-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.75rem",
              color: "var(--color-low)",
            }}
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {history.map((entry, index) => (
          <div
            key={entry.id || index}
            className="paper-surface history-card fade-in"
            style={{
              padding: "1.25rem 1.5rem",
              animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
            }}
            onClick={() => onSelect(entry)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(entry)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="history-meta">
                <span>{formatDate(entry.created_at)}</span>
                <span className={getConfidenceClass(entry.confidence)}>
                  {entry.confidence || "medium"} confidence
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.0625rem",
                  lineHeight: "1.5",
                  margin: "0.5rem 0 0",
                  color: "var(--color-text-primary)",
                }}
              >
                {truncateText(entry.judgment)}
              </p>
              {entry.input_text && (
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    margin: "0.5rem 0 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {truncateText(entry.input_text, 60)}
                </p>
              )}
            </div>
            <ChevronRight
              size={20}
              color="var(--color-text-muted)"
              style={{ flexShrink: 0, marginTop: "0.25rem" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
