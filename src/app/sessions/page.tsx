'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Session {
  _id: string;
  title: string;
  description: string;
  sessionKey: string;
  dmName: string;
  maxPlayers: number;
  playerCount: number;
  isPublic: boolean;
  createdAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  // Create session form
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    maxPlayers: 6,
    isPublic: false
  });

  // Join session form
  const [joinForm, setJoinForm] = useState({
    sessionKey: '',
    characterName: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions?public=true');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          dmId: 'temp-user-id', // TODO: Get from auth
          dmName: 'Demo DM' // TODO: Get from auth
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Session created! Session Key: ${data.session.sessionKey}`);
        setCreateForm({ title: '', description: '', maxPlayers: 6, isPublic: false });
        setShowCreateForm(false);
        fetchSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create session');
      }
    } catch (err) {
      setError('Failed to create session');
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionKey: joinForm.sessionKey,
          userId: 'temp-user-id', // TODO: Get from auth
          username: 'Demo Player', // TODO: Get from auth
          characterName: joinForm.characterName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Successfully joined session: ${data.session.title}`);
        setJoinForm({ sessionKey: '', characterName: '' });
        setShowJoinForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join session');
      }
    } catch (err) {
      setError('Failed to join session');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">D&D Sessions</h1>
                <p className="text-gray-600">Create or join gaming sessions</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowJoinForm(!showJoinForm)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  Join Session
                </button>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                >
                  Create Session
                </button>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Create Session Form */}
            {showCreateForm && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Session</h3>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session Title</label>
                      <input
                        type="text"
                        required
                        value={createForm.title}
                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Epic Adventure Session"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Players</label>
                      <input
                        type="number"
                        min="2"
                        max="8"
                        value={createForm.maxPlayers}
                        onChange={(e) => setCreateForm({ ...createForm, maxPlayers: parseInt(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe your session..."
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createForm.isPublic}
                      onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Make session public</label>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Create Session
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Join Session Form */}
            {showJoinForm && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Join Session</h3>
                <form onSubmit={handleJoinSession} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session Key</label>
                      <input
                        type="text"
                        required
                        value={joinForm.sessionKey}
                        onChange={(e) => setJoinForm({ ...joinForm, sessionKey: e.target.value.toUpperCase() })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="ABC123"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Character Name (Optional)</label>
                      <input
                        type="text"
                        value={joinForm.characterName}
                        onChange={(e) => setJoinForm({ ...joinForm, characterName: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Aragorn"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowJoinForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Join Session
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Public Sessions
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No public sessions available</p>
                <p className="text-sm text-gray-400">Create a session to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{session.title}</h4>
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                        {session.sessionKey}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>DM: {session.dmName}</span>
                      <span>{session.playerCount}/{session.maxPlayers} players</span>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/sessions/${session._id}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}