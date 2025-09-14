'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
}

export default function DashboardPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual character fetching
    // For now, show mock data
    setTimeout(() => {
      setCharacters([
        {
          id: '1',
          name: 'Aragorn',
          race: 'Human',
          class: 'Ranger',
          level: 5
        },
        {
          id: '2',
          name: 'Gandalf',
          race: 'Wizard',
          class: 'Mage',
          level: 10
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Manage your Pathfinder characters</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/characters/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                New Character
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Characters Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Characters
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : characters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No characters yet</p>
                  <Link
                    href="/characters/new"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Create your first character
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {characters.map((character) => (
                    <div
                      key={character.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h4 className="text-lg font-medium text-gray-900">
                        {character.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {character.race} {character.class} (Level {character.level})
                      </p>
                      <div className="mt-4 flex space-x-2">
                        <Link
                          href={`/characters/${character.id}`}
                          className="text-indigo-600 hover:text-indigo-500 text-sm"
                        >
                          View
                        </Link>
                        <Link
                          href={`/characters/${character.id}/edit`}
                          className="text-gray-600 hover:text-gray-500 text-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sessions</h3>
              <p className="text-gray-600 text-sm mb-4">Manage your D&D sessions</p>
              <Link
                href="/sessions"
                className="text-indigo-600 hover:text-indigo-500 text-sm"
              >
                View Sessions →
              </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dice Roller</h3>
              <p className="text-gray-600 text-sm mb-4">Roll dice for your games</p>
              <Link
                href="/dice"
                className="text-indigo-600 hover:text-indigo-500 text-sm"
              >
                Roll Dice →
              </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Resources</h3>
              <p className="text-gray-600 text-sm mb-4">Access game resources</p>
              <Link
                href="/resources"
                className="text-indigo-600 hover:text-indigo-500 text-sm"
              >
                Browse Resources →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
