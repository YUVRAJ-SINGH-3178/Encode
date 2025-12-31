import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <AlertTriangle size={48} color="var(--color-warning)" />
            <h2>Something went wrong</h2>
            <p>
              We encountered an unexpected error. This has been logged and we'll
              look into it.
            </p>
            <button
              onClick={this.handleRetry}
              className="btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: "0 auto",
              }}
            >
              <RefreshCw size={18} />
              Reload App
            </button>
          </div>
          <style>{`
                        .error-boundary {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            padding: 2rem;
                            background: var(--color-bg);
                        }
                        .error-content {
                            text-align: center;
                            max-width: 400px;
                        }
                        .error-content h2 {
                            font-family: var(--font-serif);
                            font-size: 1.5rem;
                            margin: 1.5rem 0 0.75rem;
                            color: var(--color-text-primary);
                        }
                        .error-content p {
                            color: var(--color-text-secondary);
                            margin-bottom: 2rem;
                            line-height: 1.6;
                        }
                    `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
