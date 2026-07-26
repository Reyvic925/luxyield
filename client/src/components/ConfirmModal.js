import React from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel' }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 theme-overlay">
      <div className="rounded-xl shadow-2xl p-8 max-w-full sm:max-w-sm w-full text-center border-2 mx-4 transition-all duration-300 theme-aware-bg-secondary theme-aware-border-secondary border">
        <h2 className="text-xl font-bold mb-4 transition-colors duration-300 text-red-600 dark:text-red-400">{title}</h2>
        <p className="mb-6 theme-aware-text-secondary">{message}</p>
        <div className="flex gap-4 justify-center">
          <button
            className="font-bold py-2 px-6 rounded-lg shadow transition-all duration-300 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            className="theme-aware-bg-tertiary hover:theme-aware-bg-secondary theme-aware-text font-bold py-2 px-6 rounded-lg shadow transition-colors"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

