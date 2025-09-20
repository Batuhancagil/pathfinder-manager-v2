'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IChatRoom } from '../../models/Session';

// Extended message interface to handle both string and Date timestamps
interface ChatMessageExtended {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string | Date;
  type: 'chat' | 'roll' | 'system';
  roomId?: string;
}

interface ChatRoomInterfaceProps {
  sessionId: string;
  userId: string;
  currentRoom: IChatRoom;
  messages: ChatMessageExtended[];
  onSendMessage: (message: string, type?: 'chat' | 'roll' | 'system', roomId?: string) => Promise<void>;
  onMarkAsRead?: (roomId: string) => Promise<void>;
}

export default function ChatRoomInterface({
  sessionId,
  userId,
  currentRoom,
  messages,
  onSendMessage,
  onMarkAsRead
}: ChatRoomInterfaceProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark room as read when component mounts or room changes
  useEffect(() => {
    if (onMarkAsRead && currentRoom.id) {
      onMarkAsRead(currentRoom.id);
    }
  }, [currentRoom.id, onMarkAsRead]);

  // Filter messages for current room
  const roomMessages = messages.filter(msg => 
    (msg.roomId || 'general') === currentRoom.id
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSendMessage(messageInput.trim(), 'chat', currentRoom.id);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserInitials = (username: string) => {
    return username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'roll': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-blue-100 text-blue-800';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Room Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl text-gray-600">
              {currentRoom.isPrivate ? '🔒' : '#'}
            </span>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentRoom.name}
                {currentRoom.isDefault && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Main
                  </span>
                )}
              </h1>
              {currentRoom.description && (
                <p className="text-sm text-gray-500">{currentRoom.description}</p>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {roomMessages.length} message{roomMessages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {roomMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">
              {currentRoom.isPrivate ? '🔒' : '💬'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to #{currentRoom.name}
            </h3>
            <p className="text-gray-500 max-w-md">
              {currentRoom.description || 'This is the beginning of your conversation in this room.'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Start the conversation by sending a message below!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {roomMessages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {getUserInitials(message.username)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {message.username}
                    </p>
                    {message.userId === userId && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </p>
                    {message.type !== 'chat' && (
                      <span className={`text-xs px-2 py-1 rounded ${getMessageTypeColor(message.type)}`}>
                        {message.type}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSendMessage}>
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message #${currentRoom.name}`}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={!messageInput.trim() || isLoading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
