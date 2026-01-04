import React, { useState, useEffect, useCallback } from "react";
import {
  LogOut,
  History,
  PlusSquare,
  Leaf,
  WifiOff,
  Sparkles,
  ShieldCheck,
  Activity,
  Clock3,
  Target,
  ScanLine,
} from "lucide-react";

import * as authService from "./services/auth";
import * as analysisService from "./services/analysis";
import * as historyService from "./services/history";
import { isConfigured } from "./lib/supabase";

import IngredientInput from "./components/IngredientInput";
import AnalysisResult from "./components/AnalysisResult";
import LoadingState from "./components/LoadingState";
import HistoryList from "./components/HistoryList";
import BarcodeScanner from "./components/BarcodeScanner";
import { ToastProvider, useToast } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";

// Main App Content (wrapped with Toast context)
function AppContent() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("input");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [history, setHistory] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastAnalysisAt, setLastAnalysisAt] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const toast = useToast();
  const supabaseConfigured = isConfigured();
  const latestEntry = history?.[0];

  const formatDateTime = (value) => {
    if (!value) return "Not yet";
    try {
      return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Not yet";
    }
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Some features may not work.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  // Initialize user session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();

    const unsubscribe = authService.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT") {
        setHistory([]);
        setAnalysisResult(null);
        setView("input");
      }
    });

    return () => unsubscribe();
  }, []);

  // Load history when user changes
  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLastAnalysisAt(null);
      return;
    }

    try {
      const result = await historyService.getHistory();
      const hasData = Array.isArray(result.data) && result.data.length > 0;

      if (result.error) {
        console.warn("History warning:", result.error);
        if (!hasData) {
          setHistory([]);
          setLastAnalysisAt(null);
          return;
        }
        // Only show warning for real errors, not missing table (silent fallback)
        if (
          !result.error.includes("table") &&
          !result.error.includes("42P01")
        ) {
          toast.warning(result.error);
        }
      }

      setHistory(result.data || []);
      if (hasData) {
        setLastAnalysisAt(result.data[0].created_at || null);
      } else {
        setLastAnalysisAt(null);
      }
    } catch (err) {
      console.error("Load history error:", err);
      setHistory([]);
      setLastAnalysisAt(null);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auth handler
  const handleAuth = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      toast.error("You are offline. Please check your connection.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const result = await authService.signUp(email, password);
        if (result.error) {
          toast.error(result.error);
        } else {
          if (result.needsConfirmation) {
            toast.success(
              "Account created! Check your email to verify your account."
            );
          } else {
            toast.success("Account created successfully!");
          }
          setIsSignUp(false);
          setPassword("");
        }
      } else {
        const result = await authService.signIn(email, password);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Welcome back!");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setView("input");
      setAnalysisResult(null);
      setHistory([]);
      toast.info("You have been signed out.");
    } catch (err) {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  // Analysis handler
  const handleAnalyze = async (ingredients) => {
    if (!isOnline) {
      toast.error("You are offline. Please check your connection.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await analysisService.analyzeIngredients(ingredients);
      setAnalysisResult(result);
      await loadHistory();
      setView("result");
      toast.success("Analysis complete!");
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear history handler
  const handleClearHistory = async () => {
    if (
      !window.confirm("Clear all previous analyses? This cannot be undone.")
    ) {
      return;
    }

    try {
      await historyService.clearHistory();
      setHistory([]);
      setLastAnalysisAt(null);
      toast.success("History cleared.");
    } catch (err) {
      toast.error(err.message || "Failed to clear history.");
    }
  };

  // Select history item
  const handleSelectHistory = (entry) => {
    const result = {
      judgment: entry.judgment,
      key_factors: entry.key_factors,
      tradeoffs: entry.tradeoffs,
      uncertainty: entry.uncertainty,
      confidence: entry.confidence,
    };
    setAnalysisResult(result);
    setView("result");
  };

  // Handle barcode scan ingredients
  const handleBarcodeIngredients = (ingredients) => {
    setShowBarcodeScanner(false);
    handleAnalyze(ingredients);
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: "center" }}>
          <Leaf size={40} color="var(--color-accent)" className="spin" />
          <p
            style={{ marginTop: "1rem", color: "var(--color-text-secondary)" }}
          >
            Loading...
          </p>
        </div>
        <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .spin { animation: spin 2s linear infinite; }
                `}</style>
      </div>
    );
  }

  // Show config error if Supabase not configured
  if (!supabaseConfigured) {
    return (
      <div className="auth-container">
        <div
          className="paper-surface"
          style={{ padding: "2.5rem", textAlign: "center", maxWidth: "450px" }}
        >
          <WifiOff size={40} color="var(--color-medium)" />
          <h2 style={{ marginTop: "1rem", fontFamily: "var(--font-serif)" }}>
            Configuration Required
          </h2>
          <p
            style={{
              color: "var(--color-text-secondary)",
              marginTop: "0.75rem",
            }}
          >
            The app is not properly configured. Please ensure VITE_SUPABASE_URL
            and VITE_SUPABASE_ANON_KEY are set in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  // Auth Screen
  if (!user) {
    return (
      <div className="auth-container">
        <div
          className="paper-surface auth-card fade-in"
          style={{ padding: "2.5rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <Leaf size={28} color="var(--color-accent)" />
            <h1 style={{ fontSize: "2.25rem" }}>EnCode</h1>
          </div>
          <p className="subhead" style={{ marginBottom: "2rem" }}>
            Your food interpretation co-pilot
          </p>

          {!isOnline && (
            <div
              style={{
                background: "var(--color-medium-bg)",
                padding: "0.75rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--color-medium)",
              }}
            >
              <WifiOff size={16} />
              You are offline
            </div>
          )}

          <form onSubmit={handleAuth} className="auth-form">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <button
              type="submit"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={isLoading || !isOnline}
            >
              {isLoading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <p
            style={{
              marginTop: "1.5rem",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="btn-link"
              disabled={isLoading}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          <p
            style={{
              marginTop: "2rem",
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
            }}
          >
            This is an interpretation aid, not medical or nutritional advice.
          </p>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="container">
      <header className="app-header">
        <div
          className="logo"
          onClick={() => {
            setView("input");
            setAnalysisResult(null);
          }}
        >
          <Leaf size={20} color="var(--color-accent)" />
          <h1 style={{ fontSize: "1.375rem" }}>EnCode</h1>
        </div>

        <nav style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          {!isOnline && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                color: "var(--color-medium)",
                fontSize: "0.75rem",
                marginRight: "0.5rem",
              }}
            >
              <WifiOff size={14} />
              Offline
            </span>
          )}
          <div className="user-pill" title={user?.email || "Signed in"}>
            <Sparkles size={14} />
            <span>{user?.email || "Signed in"}</span>
          </div>

          <button
            onClick={() => setView("history")}
            className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <History size={18} />
            <span style={{ fontSize: "0.8125rem" }}>History</span>
            {history.length > 0 && (
              <span
                style={{
                  background: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "10px",
                  fontWeight: "600",
                }}
              >
                {history.length}
              </span>
            )}
          </button>

          {view !== "input" && (
            <button
              onClick={() => {
                setView("input");
                setAnalysisResult(null);
              }}
              className="btn-ghost"
              style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              <PlusSquare size={18} />
              <span style={{ fontSize: "0.8125rem" }}>New</span>
            </button>
          )}

          <button onClick={handleLogout} className="btn-ghost" title="Sign out">
            <LogOut size={18} />
          </button>
        </nav>
      </header>

      <section className="hero-grid">
        <div className="hero-card">
          <div
            className="eyebrow"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Leaf size={14} />
            Food label co-pilot
          </div>
          <h1 className="hero-title">
            Interpret ingredients with calm, human context.
          </h1>
          <p className="hero-body">
            EnCode spots structural patterns in ingredient lists and translates
            what they suggest — with measured, responsible commentary and zero
            scare tactics.
          </p>
          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setView("input");
                setAnalysisResult(null);
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Sparkles size={16} />
              Start a new analysis
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowBarcodeScanner(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ScanLine size={16} />
              Scan Barcode
            </button>
            <button
              className="btn-ghost"
              onClick={() => setView("history")}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <History size={16} />
              Browse history
            </button>
          </div>
        </div>
        <div className="status-panel">
          <div className={`status-chip ${isOnline ? "success" : "warn"}`}>
            <Activity size={16} />
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>
          <div
            className={`status-chip ${supabaseConfigured ? "success" : "warn"}`}
          >
            <ShieldCheck size={16} />
            <span>
              {supabaseConfigured ? "Supabase connected" : "Configure Supabase"}
            </span>
          </div>
          <div className="status-meta">
            <div>
              <p className="meta-label">Saved analyses</p>
              <p className="meta-value">{history.length}</p>
            </div>
            <div>
              <p className="meta-label">Last analysis</p>
              <p className="meta-value">{formatDateTime(lastAnalysisAt)}</p>
            </div>
          </div>
          <div className="status-note">
            <p>
              We avoid medical advice and stick to pattern-based interpretations
              for clarity and safety.
            </p>
          </div>
        </div>
      </section>

      <section className="status-ribbon">
        <div className="status-card">
          <div className="pill pill-primary">
            <Activity size={14} />
            Live session
          </div>
          <p className="status-value">
            {isOnline ? "Online & ready" : "Offline"}
          </p>
          <p className="status-hint">Connection state for real-time analysis</p>
        </div>
        <div className="status-card">
          <div className="pill pill-secondary">
            <History size={14} />
            Saved runs
          </div>
          <p className="status-value">{history.length}</p>
          <p className="status-hint">Analyses stored securely in Supabase</p>
        </div>
        <div className="status-card">
          <div className="pill pill-ghost">
            <Clock3 size={14} />
            Last analysis
          </div>
          <p className="status-value">{formatDateTime(lastAnalysisAt)}</p>
          <p className="status-hint">
            Time the most recent label was interpreted
          </p>
        </div>
      </section>

      <main className="main-grid">
        <div className="primary-panel">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              {showBarcodeScanner && (
                <BarcodeScanner
                  onIngredientsFound={handleBarcodeIngredients}
                  onClose={() => setShowBarcodeScanner(false)}
                  isLoading={isLoading}
                />
              )}
              {view === "input" && !showBarcodeScanner && (
                <IngredientInput
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  onOpenScanner={() => setShowBarcodeScanner(true)}
                />
              )}
              {view === "result" && analysisResult && (
                <AnalysisResult
                  result={analysisResult}
                  onReset={() => {
                    setView("input");
                    setAnalysisResult(null);
                  }}
                />
              )}
              {view === "history" && (
                <HistoryList
                  history={history}
                  onSelect={handleSelectHistory}
                  onClear={handleClearHistory}
                  onRefresh={loadHistory}
                />
              )}
            </>
          )}
        </div>

        <aside className="side-rail">
          <div className="glow-card">
            <div className="card-title">
              <Target size={16} /> Latest snapshot
            </div>
            {latestEntry ? (
              <>
                <p className="snapshot-judgment">{latestEntry.judgment}</p>
                <div className="snapshot-meta">
                  <span>{formatDateTime(latestEntry.created_at)}</span>
                  <span
                    className={`pill pill-${
                      latestEntry.confidence || "secondary"
                    }`}
                  >
                    {latestEntry.confidence || "medium"} confidence
                  </span>
                </div>
                {latestEntry.key_factors?.[0] && (
                  <p className="snapshot-detail">
                    {latestEntry.key_factors[0].explanation}
                  </p>
                )}
                <button
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => setView("history")}
                >
                  Open history
                </button>
              </>
            ) : (
              <p className="snapshot-empty">
                Run an analysis to see a summary here.
              </p>
            )}
          </div>

          <div className="glow-card">
            <div className="card-title">
              <ShieldCheck size={16} /> Trust charter
            </div>
            <ul className="charter-list">
              <li>No medical or nutritional claims</li>
              <li>Focus on structural patterns and context</li>
              <li>Language stays measured and conditional</li>
              <li>Data stored securely with Supabase</li>
            </ul>
          </div>

          <div className="glow-card">
            <div className="card-title">
              <Sparkles size={16} /> Pro tips
            </div>
            <ul className="tips-list">
              <li>Paste the full ingredient order for best signal.</li>
              <li>Short lists often mean simpler processing.</li>
              <li>Multiple sweeteners together hint at heavy balancing.</li>
              <li>Preservatives and stabilizers suggest shelf-life goals.</li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <p>
          EnCode provides pattern-based orientation, not definitive judgments.
          <br />
          Always consult professionals for health decisions.
        </p>
      </footer>
    </div>
  );
}

// Main App with providers
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
