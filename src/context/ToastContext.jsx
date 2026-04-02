import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_STYLES = {
  success: { bg: 'bg-emerald-600', icon: 'check_circle' },
  error: { bg: 'bg-red-600', icon: 'error' },
  warning: { bg: 'bg-amber-500', icon: 'warning' },
  info: { bg: 'bg-indigo-600', icon: 'info' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(toast => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          return (
            <div
              key={toast.id}
              className={`${style.bg} text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[420px] animate-slide-in`}
            >
              <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="text-white/70 hover:text-white">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
