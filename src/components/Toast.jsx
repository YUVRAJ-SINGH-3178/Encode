import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Toast context
const ToastContext = createContext(null);

// Toast types
const TOAST_TYPES = {
  success: { icon: CheckCircle, color: "var(--color-high)" },
  error: { icon: AlertCircle, color: "#dc2626" },
  warning: { icon: AlertTriangle, color: "var(--color-medium)" },
  info: { icon: Info, color: "var(--color-accent)" },
};

// Individual Toast component
function Toast({ id, type, message, onDismiss }) {
  const { icon: Icon, color } = TOAST_TYPES[type] || TOAST_TYPES.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div className="toast" style={{ "--toast-color": color }}>
      <Icon size={18} color={color} />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => onDismiss(id)}>
        <X size={16} />
      </button>
    </div>
  );
}

// Toast container component
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onDismiss={onDismiss}
        />
      ))}
      <style>{`
                .toast-container {
                    position: fixed;
                    bottom: 1.5rem;
                    right: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    z-index: 1000;
                    max-width: 400px;
                }
                
                @media (max-width: 480px) {
                    .toast-container {
                        left: 1rem;
                        right: 1rem;
                        bottom: 1rem;
                        max-width: none;
                    }
                }
                
                .toast {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: var(--color-paper);
                    border: 1px solid var(--color-divider);
                    border-left: 3px solid var(--toast-color);
                    border-radius: 8px;
                    padding: 0.875rem 1rem;
                    box-shadow: var(--shadow-lg);
                    animation: slideIn 0.3s ease-out;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .toast-message {
                    flex: 1;
                    font-size: 0.875rem;
                    color: var(--color-text-primary);
                    line-height: 1.4;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    padding: 0.25rem;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .toast-close:hover {
                    background: var(--color-bg-warm);
                    color: var(--color-text-secondary);
                }
            `}</style>
    </div>
  );
}

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message) => addToast("success", message),
    error: (message) => addToast("error", message),
    warning: (message) => addToast("warning", message),
    info: (message) => addToast("info", message),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastProvider;
