import React from "react";
import {
  Trash2,
  RefreshCw,
  Clock,
  ChevronRight,
  History,
  Sparkles,
  FileText,
} from "lucide-react";

const HistoryList = ({ history, onSelect, onClear, onRefresh }) => {
  if (!history || history.length === 0) {
    return (
      <div
        className="empty-state fade-in delay-1"
        style={{
          background:
            "linear-gradient(135deg, var(--color-paper) 0%, var(--color-accent-soft) 100%)",
          borderRadius: "var(--radius-lg)",
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 1.5rem",
            borderRadius: "50%",
            background: "var(--color-accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Clock size={36} color="var(--color-accent)" />
        </div>
        <p
          className="subhead"
          style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}
        >
          No previous analyses found
        </p>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.9rem",
            color: "var(--color-text-muted)",
            maxWidth: "280px",
            margin: "0 auto",
            lineHeight: 1.6,
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
              marginTop: "1.75rem",
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

  const getConfidenceStyle = (level) => {
    const styles = {
      high: { bg: "var(--color-accent-soft)", color: "var(--color-accent)" },
      medium: { bg: "rgba(168, 140, 74, 0.1)", color: "#a88c4a" },
      low: { bg: "rgba(154, 107, 90, 0.1)", color: "#9a6b5a" },
    };
    return styles[level] || styles.medium;
  };

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
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.75rem",
          padding: "0 0.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--color-accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <History size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Analysis History</h2>
            <p
              style={{
                margin: "0.125rem 0 0",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              {history.length} {history.length === 1 ? "analysis" : "analyses"}{" "}
              saved
            </p>
          </div>
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
                justifyContent: "center",
                width: "36px",
                height: "36px",
                padding: 0,
                borderRadius: "10px",
              }}
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button
            onClick={onClear}
            className="btn-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.8125rem",
              color: "#9a6b5a",
              padding: "0.5rem 0.875rem",
              borderRadius: "10px",
            }}
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>

      {/* History Cards */}
      <div style={{ display: "grid", gap: "0.875rem" }}>
        {history.map((entry, index) => {
          const confidenceStyle = getConfidenceStyle(entry.confidence);
          return (
            <div
              key={entry.id || index}
              className="paper-surface history-card fade-in"
              style={{
                padding: "1.25rem 1.5rem",
                animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                transition: "all 0.25s ease",
                border: "1px solid transparent",
              }}
              onClick={() => onSelect(entry)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(entry)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent-light)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "var(--color-accent-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={18} color="var(--color-accent)" />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.375rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Clock size={11} />
                    {formatDate(entry.created_at)}
                  </span>
                  <span
                    style={{
                      padding: "0.25rem 0.625rem",
                      borderRadius: "100px",
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      textTransform: "capitalize",
                      background: confidenceStyle.bg,
                      color: confidenceStyle.color,
                    }}
                  >
                    {entry.confidence || "medium"}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.0625rem",
                    lineHeight: "1.5",
                    margin: "0",
                    color: "var(--color-text-primary)",
                    fontWeight: 500,
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

              {/* Arrow */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "var(--color-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                <ChevronRight size={18} color="var(--color-text-muted)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryList;
