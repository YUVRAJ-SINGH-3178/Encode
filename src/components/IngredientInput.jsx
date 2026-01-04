import React, { useState } from "react";
import {
  Send,
  AlertCircle,
  HelpCircle,
  ScanLine,
  Sparkles,
  FileText,
  Lightbulb,
} from "lucide-react";

const MIN_LENGTH = 10;
const MAX_LENGTH = 5000;

const IngredientInput = ({ onAnalyze, isLoading, onOpenScanner }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [showTip, setShowTip] = useState(false);

  const charCount = text.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;
  const isOverLimit = charCount > MAX_LENGTH;

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmed = text.trim();

    if (trimmed.length < MIN_LENGTH) {
      setError(`Please enter at least ${MIN_LENGTH} characters`);
      return;
    }

    if (trimmed.length > MAX_LENGTH) {
      setError(`Please limit to ${MAX_LENGTH} characters`);
      return;
    }

    if (!isLoading) {
      setError("");
      onAnalyze(trimmed);
    }
  };

  const examples = [
    {
      label: "Sports drink",
      text: "Water, High Fructose Corn Syrup, Citric Acid, Natural Flavors, Sodium Citrate, Sodium Chloride, Monopotassium Phosphate, Modified Food Starch, Red 40, Glycerol Ester of Rosin",
    },
    {
      label: "Granola bar",
      text: "Whole grain oats, Brown rice syrup, Roasted almonds, Honey, Cane sugar, Sunflower oil, Rice flour, Sea salt, Natural flavor, Tocopherols (vitamin E) to maintain freshness",
    },
    {
      label: "Frozen meal",
      text: "Cooked pasta (water, semolina), Tomato puree, Grilled chicken (chicken breast, water, salt), Cream, Parmesan cheese, Mushrooms, Onion, Garlic, Modified corn starch, Salt, Sugar, Spices, Yeast extract, Natural flavors",
    },
  ];

  const handleUseExample = (text) => {
    setText(text);
    setError("");
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "var(--color-accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h2 className="delay-1" style={{ margin: 0, fontSize: "1.25rem" }}>
              Input Label Data
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
              }}
            >
              Paste or scan ingredient list
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="btn-secondary"
              style={{
                padding: "0.5rem 0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8125rem",
                borderRadius: "10px",
              }}
              title="Scan barcode"
            >
              <ScanLine size={16} />
              Scan
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowTip(!showTip)}
            className="btn-ghost"
            style={{
              padding: "0.5rem",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
            }}
            title="Tips"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Tips Panel */}
      {showTip && (
        <div
          className="fade-in"
          style={{
            background:
              "linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-paper) 100%)",
            padding: "1.25rem 1.5rem",
            borderRadius: "var(--radius-lg)",
            marginBottom: "1.25rem",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-accent-light)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <Lightbulb size={16} color="var(--color-accent)" />
            <strong style={{ color: "var(--color-accent)" }}>
              Tips for best results
            </strong>
          </div>
          <ul style={{ margin: "0", paddingLeft: "1.25rem", lineHeight: 1.7 }}>
            <li>Copy the complete ingredient list from the packaging</li>
            <li>Include all ingredients, even if unfamiliar</li>
            <li>Keep the original order (most prominent first)</li>
            <li>Don't worry about formatting - just paste as-is</li>
          </ul>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="paper-surface delay-2"
        style={{
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
        }}
      >
        <p
          className="subhead"
          style={{
            marginBottom: "1.25rem",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Sparkles size={14} color="var(--color-accent)" />
          Paste the full ingredient list exactly as it appears on the packaging.
        </p>

        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="e.g. Water, Sugar, Corn Syrup, Citric Acid, Natural Flavors, Sodium Citrate..."
          disabled={isLoading}
          style={{
            ...(error ? { borderColor: "#dc2626" } : {}),
            borderRadius: "var(--radius-md)",
            minHeight: "140px",
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "input-error" : undefined}
        />

        {/* Error message */}
        {error && (
          <div
            id="input-error"
            className="fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(220, 38, 38, 0.08)",
              color: "#dc2626",
              fontSize: "0.875rem",
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Character count and actions */}
        <div
          style={{
            marginTop: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "100px",
                background: isOverLimit
                  ? "rgba(220, 38, 38, 0.1)"
                  : "var(--color-bg)",
                color: isOverLimit ? "#dc2626" : "var(--color-text-muted)",
              }}
            >
              {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
            </span>

            {charCount === 0 && (
              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                {examples.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => handleUseExample(ex.text)}
                    className="btn-link"
                    style={{
                      fontSize: "0.8125rem",
                      padding: "0.25rem 0",
                      borderBottom: "1px dashed var(--color-accent-light)",
                    }}
                  >
                    Try {ex.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius-md)",
            }}
          >
            {isLoading ? (
              "Analyzing..."
            ) : (
              <>
                Analyze
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.35rem",
        }}
        className="delay-3"
      >
        <Sparkles size={12} />
        Analysis typically takes 5-15 seconds depending on complexity.
      </p>
    </div>
  );
};

export default IngredientInput;
