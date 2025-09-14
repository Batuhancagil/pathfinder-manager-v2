'use client';

import Link from 'next/link';

export default function ResourcesPage() {
  const resources = [
    {
      category: 'Rules',
      items: [
        { name: 'Player\'s Handbook', description: 'Core rules and character creation', url: '#' },
        { name: 'Dungeon Master\'s Guide', description: 'DM tools and world building', url: '#' },
        { name: 'Monster Manual', description: 'Creatures and NPCs', url: '#' }
      ]
    },
    {
      category: 'Character Sheets',
      items: [
        { name: 'Standard Character Sheet', description: 'Official D&D 5e character sheet', url: '#' },
        { name: 'Spell Sheet', description: 'Track spells and spell slots', url: '#' },
        { name: 'Inventory Sheet', description: 'Manage equipment and items', url: '#' }
      ]
    },
    {
      category: 'Tools',
      items: [
        { name: 'Dice Roller', description: 'Roll dice online', url: '/dice' },
        { name: 'Initiative Tracker', description: 'Track combat order', url: '#' },
        { name: 'Random Generator', description: 'Generate random encounters', url: '#' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
              <p className="text-gray-600">D&D tools and references</p>
            </div>
            <Link
              href="/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {resources.map((category) => (
              <div key={category.category} className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                        <a
                          href={item.url}
                          className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          Access →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
