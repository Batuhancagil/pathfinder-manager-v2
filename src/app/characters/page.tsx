'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  hitPoints: number;
  armorClass: number;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          level: 5,
          background: 'Folk Hero',
          alignment: 'Lawful Good',
          hitPoints: 45,
          armorClass: 16
        },
        {
          id: '2',
          name: 'Gandalf',
          race: 'Wizard',
          class: 'Mage',
          level: 10,
          background: 'Sage',
          alignment: 'Neutral Good',
          hitPoints: 78,
          armorClass: 12
        },
        {
          id: '3',
          name: 'Legolas',
          race: 'Elf',
          class: 'Ranger',
          level: 7,
          background: 'Noble',
          alignment: 'Chaotic Good',
          hitPoints: 52,
          armorClass: 15
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this character?')) {
      return;
    }

    try {
      // TODO: Implement actual character deletion
      console.log('Deleting character:', id);
      setCharacters(prev => prev.filter(char => char.id !== id));
    } catch (err) {
      setError('Failed to delete character');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Characters</h1>
              <p className="text-gray-600">Manage your Pathfinder characters</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/characters/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                New Character
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {characters.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No characters</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new character.</p>
              <div className="mt-6">
                <Link
                  href="/characters/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  New Character
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {character.name}
                      </h3>
                      <div className="flex space-x-2">
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
                        <button
                          onClick={() => handleDelete(character.id)}
                          className="text-red-600 hover:text-red-500 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {character.race} {character.class} (Level {character.level})
                      </p>
                      <p className="text-sm text-gray-500">
                        {character.background} • {character.alignment}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Hit Points</dt>
                        <dd className="text-sm text-gray-900">{character.hitPoints}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Armor Class</dt>
                        <dd className="text-sm text-gray-900">{character.armorClass}</dd>
                      </div>
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
