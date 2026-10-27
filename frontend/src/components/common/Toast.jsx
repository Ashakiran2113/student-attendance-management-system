import React, { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-navy-700 text-white'
  };

  return (
    <div 
      data-testid="toast-notification"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl transition-all duration-300 animate-bounce-short"
      style={{ minWidth: '280px' }}
    >
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-md ${bgColors[toast.type || 'info']}`}>
        <span className="text-sm font-medium">{toast.message}</span>
        <button 
          onClick={onClose} 
          className="ml-auto text-white/80 hover:text-white font-bold text-lg leading-none"
          aria-label="Close Notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
