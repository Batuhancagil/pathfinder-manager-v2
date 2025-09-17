'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Player {
  userId: string;
  characterId?: string;
  characterName?: string;
  joinedAt: string;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'chat' | 'roll' | 'system';
}

interface Session {
  _id: string;
  title: string;
  description: string;
  sessionKey: string;
  dmId: string;
  dmName: string;
  players: Player[];
  maxPlayers: number;
  isActive: boolean;
  chatMessages: ChatMessage[];
  createdAt: string;
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  // Chat state
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setSessionId(resolvedParams.id);
      fetchSession(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const fetchSession = async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        setError('Session not found');
      }
    } catch (err) {
      setError('Failed to fetch session');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      // TODO: Implement real-time chat with Socket.io
      // For now, just add to local state
      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        userId: 'temp-user-id',
        username: 'Demo Player',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'chat'
      };

      setSession(prev => prev ? {
        ...prev,
        chatMessages: [...prev.chatMessages, message]
      } : null);

      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Details</h1>
              <div className="text-red-600">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
                <p className="text-gray-600">DM: {session.dmName}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono bg-indigo-100 text-indigo-800 px-3 py-1 rounded">
                  {session.sessionKey}
                </div>
                <p className="text-sm text-gray-500 mt-1">Session Key</p>
              </div>
            </div>
            
            {session.description && (
              <p className="text-gray-700 mb-4">{session.description}</p>
            )}

            <div className="flex justify-between items-center">
              <div className="flex space-x-4 text-sm text-gray-600">
                <span>{session.players.length}/{session.maxPlayers} players</span>
                <span>Created {new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/sessions/${sessionId}/dashboard`}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Join Session
                </Link>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg h-96 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Chat</h3>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {session.chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                ) : (
                  session.chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'system' ? 'justify-center' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'system'
                          ? 'bg-gray-100 text-gray-600 text-sm italic'
                          : message.type === 'roll'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {message.type !== 'system' && (
                          <p className="text-xs font-medium mb-1">{message.username}</p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Players & Tools */}
          <div className="space-y-6">
            {/* Players List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Players</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {session.players.map((player, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {player.characterName || `Player ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(player.joinedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {session.players.length === 0 && (
                    <p className="text-gray-500 text-sm">No players yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Tools</h3>
              </div>
              <div className="p-4 space-y-3">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  🎲 Roll Dice
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  ⚔️ Initiative Tracker
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  📝 Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
