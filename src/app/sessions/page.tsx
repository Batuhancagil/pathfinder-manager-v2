'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Session {
  id: string;
  name: string;
  description: string;
  date: string;
  status: 'planned' | 'active' | 'completed';
  players: string[];
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual session fetching
    setTimeout(() => {
      setSessions([
        {
          id: '1',
          name: 'The Lost Mines of Phandelver',
          description: 'A classic D&D adventure',
          date: '2024-01-15',
          status: 'completed',
          players: ['Aragorn', 'Gandalf', 'Legolas']
        },
        {
          id: '2',
          name: 'Curse of Strahd',
          description: 'A gothic horror adventure',
          date: '2024-01-22',
          status: 'active',
          players: ['Aragorn', 'Gandalf']
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
              <p className="text-gray-600">Manage your D&D sessions</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/sessions/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                New Session
              </Link>
              <Link
                href="/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new session.</p>
              <div className="mt-6">
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  New Session
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {session.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'active' ? 'bg-green-100 text-green-800' :
                        session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-600">
                      {session.description}
                    </p>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Date: {new Date(session.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Players: {session.players.join(', ')}
                      </p>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Link
                        href={`/sessions/${session.id}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm"
                      >
                        View
                      </Link>
                      <Link
                        href={`/sessions/${session.id}/edit`}
                        className="text-gray-600 hover:text-gray-500 text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
