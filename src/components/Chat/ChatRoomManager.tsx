'use client';

import React, { useState, useEffect } from 'react';
import { IChatRoom, IChatMessage } from '../../models/Session';

// Extend IChatMessage to handle both string and Date timestamps
interface ChatMessageExtended extends Omit<IChatMessage, 'timestamp'> {
  timestamp: string | Date;
}

interface ChatRoomManagerProps {
  sessionId: string;
  userId: string;
  isCreator: boolean;
  messages: ChatMessageExtended[];
  chatRooms: IChatRoom[];
  currentRoomId: string;
  onRoomChange: (roomId: string) => void;
  onSendMessage: (message: string, type?: 'chat' | 'roll' | 'system', roomId?: string) => Promise<void>;
  onCreateRoom: (name: string, description?: string, isPrivate?: boolean) => Promise<void>;
}

export default function ChatRoomManager({
  sessionId,
  userId,
  isCreator,
  messages,
  chatRooms,
  currentRoomId,
  onRoomChange,
  onSendMessage,
  onCreateRoom
}: ChatRoomManagerProps) {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Filter messages for current room
  const currentRoomMessages = messages.filter(msg => 
    (msg.roomId || 'general') === currentRoomId
  );

  const currentRoom = chatRooms.find(room => room.id === currentRoomId) || chatRooms[0];

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      await onCreateRoom(
        newRoomName.trim(),
        newRoomDescription.trim() || undefined,
        newRoomPrivate
      );
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomPrivate(false);
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await onSendMessage(messageInput.trim(), 'chat', currentRoomId);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
      {/* Room Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex space-x-2 overflow-x-auto">
            {chatRooms.map(room => (
              <button
                key={room.id}
                onClick={() => onRoomChange(room.id)}
                className={`px-3 py-1 text-sm rounded-t-lg whitespace-nowrap transition-colors ${
                  currentRoomId === room.id
                    ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {room.isPrivate && '🔒'} {room.name}
                {room.isDefault && ' 📍'}
              </button>
            ))}
          </div>
          
          {isCreator && (
            <button
              onClick={() => setShowCreateRoom(true)}
              className="ml-2 p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
              title="Create new room"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Current Room Info */}
      {currentRoom && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {currentRoom.isPrivate && '🔒'} {currentRoom.name}
                {currentRoom.isDefault && ' 📍'}
              </h3>
              {currentRoom.description && (
                <p className="text-xs text-gray-500">{currentRoom.description}</p>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {currentRoomMessages.length} messages
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {currentRoomMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages in this room yet</p>
            <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
          </div>
        ) : (
          currentRoomMessages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-600">
                    {message.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">{message.username}</p>
                  {message.userId === userId && (
                    <span className="text-xs text-gray-500">(You)</span>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                  {message.type !== 'chat' && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      message.type === 'roll' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {message.type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1">{message.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={`Message #${currentRoom?.name || 'general'}`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Chat Room</h3>
            
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Strategy, OOC, DM Notes"
                  required
                />
              </div>

              <div>
                <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="roomDescription"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="What's this room for?"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRoomPrivate}
                    onChange={(e) => setNewRoomPrivate(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Private room (DM only for now)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
