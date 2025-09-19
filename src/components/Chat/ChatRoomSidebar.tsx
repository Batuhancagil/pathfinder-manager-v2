'use client';

import React, { useState } from 'react';
import { IChatRoom } from '../../models/Session';

interface ChatRoomSidebarProps {
  sessionId: string;
  userId: string;
  isCreator: boolean;
  chatRooms: IChatRoom[];
  currentRoomId: string;
  onRoomChange: (roomId: string) => void;
  onCreateRoom: (name: string, description?: string, isPrivate?: boolean) => Promise<void>;
  messageCount: { [roomId: string]: number };
}

export default function ChatRoomSidebar({
  sessionId,
  userId,
  isCreator,
  chatRooms,
  currentRoomId,
  onRoomChange,
  onCreateRoom,
  messageCount
}: ChatRoomSidebarProps) {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);

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

  return (
    <div className="bg-gray-800 text-white h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Chat Rooms</h2>
        <p className="text-xs text-gray-400 mt-1">
          {chatRooms.length} room{chatRooms.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {chatRooms.map(room => (
            <button
              key={room.id}
              onClick={() => onRoomChange(room.id)}
              className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors group ${
                currentRoomId === room.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-lg">
                    {room.isPrivate ? '🔒' : '#'}
                  </span>
                  <span className="font-medium truncate">
                    {room.name}
                  </span>
                  {room.isDefault && (
                    <span className="text-xs bg-green-500 text-white px-1 rounded">
                      Main
                    </span>
                  )}
                </div>
                
                {/* Message Count Badge */}
                {messageCount[room.id] > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    currentRoomId === room.id
                      ? 'bg-white text-indigo-600'
                      : 'bg-gray-600 text-gray-200'
                  }`}>
                    {messageCount[room.id]}
                  </span>
                )}
              </div>
              
              {/* Room Description */}
              {room.description && (
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {room.description}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Create Room Button */}
      {isCreator && (
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={() => setShowCreateRoom(true)}
            className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span className="text-sm">Create Room</span>
          </button>
        </div>
      )}

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="e.g., strategy, ooc, dm-notes"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
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
                  <span className="ml-2 text-sm text-gray-700">Private room (DM only)</span>
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
