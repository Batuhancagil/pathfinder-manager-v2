'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DicePage() {
  const [diceResults, setDiceResults] = useState<Array<{ dice: string; result: number; rolls: number[] }>>([]);
  const [customDice, setCustomDice] = useState('1d20');

  const rollDice = (dice: string) => {
    const [count, sides] = dice.split('d').map(Number);
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((sum, roll) => sum + roll, 0);
    
    setDiceResults(prev => [{
      dice,
      result: total,
      rolls
    }, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const rollCustomDice = () => {
    if (customDice.match(/^\d+d\d+$/)) {
      rollDice(customDice);
    }
  };

  const commonDice = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '3d6', '4d6'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dice Roller</h1>
              <p className="text-gray-600">Roll dice for your D&D games</p>
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Common Dice */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Common Dice</h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {commonDice.map((dice) => (
                    <button
                      key={dice}
                      onClick={() => rollDice(dice)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {dice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Dice */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Custom Dice</h2>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customDice}
                    onChange={(e) => setCustomDice(e.target.value)}
                    placeholder="e.g., 2d6, 1d20"
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={rollCustomDice}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Roll
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Format: [count]d[sides] (e.g., 2d6, 1d20, 4d6)
                </p>
              </div>

              {/* Results */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Rolls</h2>
                {diceResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No rolls yet. Start rolling some dice!</p>
                ) : (
                  <div className="space-y-2">
                    {diceResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-gray-900">{result.dice}</span>
                          <span className="text-sm text-gray-600">
                            {result.rolls.join(' + ')} = {result.result}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-indigo-600">
                          {result.result}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
