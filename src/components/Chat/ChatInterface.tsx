'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'chat' | 'roll' | 'system';
  roomId?: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSendRoll: (rollResult: string) => void;
  currentUserId?: string;
  loading?: boolean;
}

export default function ChatInterface({ 
  messages, 
  onSendMessage, 
  onSendRoll,
  currentUserId = 'temp-user-id',
  loading = false 
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStyle = (message: ChatMessage) => {
    const isOwnMessage = message.userId === currentUserId;
    
    switch (message.type) {
      case 'system':
        return 'bg-gray-100 text-gray-600 text-center italic';
      case 'roll':
        return isOwnMessage 
          ? 'bg-green-600 text-white ml-auto' 
          : 'bg-green-100 text-green-800';
      case 'chat':
      default:
        return isOwnMessage 
          ? 'bg-indigo-600 text-white ml-auto' 
          : 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageAlignment = (message: ChatMessage) => {
    if (message.type === 'system') return 'justify-center';
    return message.userId === currentUserId ? 'justify-end' : 'justify-start';
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">💬 Session Chat</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {messages.filter(m => m.type !== 'system').length} messages
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '400px' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet.</p>
            <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${getMessageAlignment(message)}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageStyle(message)}`}>
                {/* Username and timestamp for non-system messages */}
                {message.type !== 'system' && (
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium opacity-90">
                      {message.username}
                    </p>
                    <p className="text-xs opacity-75">
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                )}
                
                {/* Message content */}
                <div className="text-sm">
                  {message.type === 'roll' ? (
                    <div className="font-mono">
                      {message.message}
                    </div>
                  ) : (
                    <p className={message.type === 'system' ? 'text-center' : ''}>
                      {message.message}
                    </p>
                  )}
                </div>
                
                {/* Timestamp for system messages */}
                {message.type === 'system' && (
                  <p className="text-xs opacity-75 text-center mt-1">
                    {formatTimestamp(message.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Enter to send)"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={sending}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            )}
          </button>
        </div>
        
        {/* Character counter */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> to send
          </div>
          <div>
            {newMessage.length}/500
          </div>
        </div>
      </form>
    </div>
  );
}
