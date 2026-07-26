import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

const AIChatModal = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch { data = text; }
      if (data && data.reply) {
        setMessages(msgs => [...msgs, { from: 'ai', text: data.reply }]);
      } else {
        setError('No response from AI.');
      }
    } catch (e) {
      setError('Failed to contact AI.');
    }
    setInput('');
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${
      isDark 
        ? 'bg-black bg-opacity-60' 
        : 'bg-black bg-opacity-40'
    }`}>
      <div className={`rounded-lg shadow-lg w-full max-w-full sm:max-w-md p-4 relative mx-4 transition-colors duration-300 ${
        isDark
          ? 'bg-gray-900 border border-gray-800'
          : 'bg-white border border-gray-200'
      }`}>
        <button 
          className={`absolute top-2 right-2 transition-colors duration-300 ${
            isDark
              ? 'text-gray-500 hover:text-gray-400'
              : 'text-gray-400 hover:text-gray-600'
          }`} 
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Ask LuxHedge AI</h2>
        <div className={`h-64 overflow-y-auto border rounded p-2 mb-2 transition-colors duration-300 ${
          isDark
            ? 'bg-gray-800 border-gray-700 text-gray-300'
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          {messages.length === 0 && <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Start a conversation with LuxHedge AI.</div>}
          {messages.map((msg, i) => (
            <div key={i} className={`mb-2 flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-lg max-w-xs transition-colors duration-300 ${
                msg.from === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : isDark
                    ? 'bg-gray-700 text-gray-100'
                    : 'bg-gray-200 text-gray-800'
              }`}>{msg.text}</div>
            </div>
          ))}
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={`flex-1 border rounded px-2 py-1 transition-colors duration-300 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your question..."
            disabled={loading}
          />
          <button
            className={`w-full sm:w-auto px-4 py-1 rounded transition-colors duration-300 font-medium ${
              isDark
                ? 'bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50 disabled:hover:bg-blue-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:hover:bg-blue-600'
            }`}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;

