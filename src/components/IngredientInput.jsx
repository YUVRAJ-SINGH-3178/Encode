import React, { useState } from "react";
import { Send, AlertCircle, HelpCircle } from "lucide-react";

const MIN_LENGTH = 10;
const MAX_LENGTH = 5000;

const IngredientInput = ({ onAnalyze, isLoading }) => {
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <h2 className="delay-1" style={{ margin: 0 }}>
          Input Label Data
        </h2>
        <button
          type="button"
          onClick={() => setShowTip(!showTip)}
          className="btn-ghost"
          style={{ padding: "0.25rem" }}
          title="Tips"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {showTip && (
        <div
          className="fade-in"
          style={{
            background: "var(--color-accent-light)",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <strong style={{ color: "var(--color-accent)" }}>
            Tips for best results:
          </strong>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
            <li>Copy the complete ingredient list from the packaging</li>
            <li>Include all ingredients, even if unfamiliar</li>
            <li>Keep the original order (most prominent first)</li>
            <li>Don't worry about formatting - just paste as-is</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="paper-surface delay-2">
        <p
          className="subhead"
          style={{ marginBottom: "1.25rem", fontSize: "1rem" }}
        >
          Paste the full ingredient list exactly as it appears on the packaging.
        </p>

        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="e.g. Water, Sugar, Corn Syrup, Citric Acid, Natural Flavors, Sodium Citrate..."
          disabled={isLoading}
          style={error ? { borderColor: "#dc2626" } : {}}
          aria-invalid={!!error}
          aria-describedby={error ? "input-error" : undefined}
        />

        {/* Error message */}
        {error && (
          <div
            id="input-error"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              marginTop: "0.5rem",
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
            marginTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: isOverLimit ? "#dc2626" : "var(--color-text-muted)",
              }}
            >
              {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
            </span>

            {charCount === 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {examples.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => handleUseExample(ex.text)}
                    className="btn-link"
                    style={{ fontSize: "0.8125rem", padding: 0 }}
                  >
                    Use {ex.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {isLoading ? (
              "Analyzing..."
            ) : (
              <>
                Produce Judgment
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
        }}
        className="delay-3"
      >
        Analysis typically takes 5-15 seconds depending on complexity.
      </p>
    </div>
  );
};

export default IngredientInput;
