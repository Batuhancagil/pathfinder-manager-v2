'use client';

import React, { useState } from 'react';
import { parseDiceExpression, formatDiceResult, DiceRoll } from '../../utils/diceParser';

interface DiceRollerProps {
  onRoll?: (roll: DiceRoll) => void;
}

const COMMON_DICE = [
  { name: 'd4', sides: 4 },
  { name: 'd6', sides: 6 },
  { name: 'd8', sides: 8 },
  { name: 'd10', sides: 10 },
  { name: 'd12', sides: 12 },
  { name: 'd20', sides: 20 },
  { name: 'd100', sides: 100 }
];

export default function DiceRoller({ onRoll }: DiceRollerProps) {
  const [diceExpression, setDiceExpression] = useState('1d20+4');
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [rolling, setRolling] = useState(false);

  // Removed old parsing logic - now using utility function

  const handleRoll = async () => {
    try {
      setRolling(true);
      
      const rollResult = parseDiceExpression(diceExpression);
      setLastRoll(rollResult);
      
      // Call callback if provided
      if (onRoll) {
        onRoll(rollResult);
      }
      
      // Add some animation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Dice roll error:', error);
      alert('Invalid dice expression. Use format like: 1d20+4, 2d6+1d4+2, 3d8-1');
    } finally {
      setRolling(false);
    }
  };

  const handleQuickRoll = (diceType: string) => {
    const expression = `1${diceType}`;
    setDiceExpression(expression);
    
    setTimeout(() => {
      try {
        const rollResult = parseDiceExpression(expression);
        setLastRoll(rollResult);
        
        if (onRoll) {
          onRoll(rollResult);
        }
      } catch (error) {
        console.error('Quick roll error:', error);
      }
    }, 100);
  };

  // Use the utility function for formatting
  const formatRollResult = formatDiceResult;

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">🎲 Dice Roller</h3>
        {lastRoll && (
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">
              {lastRoll.total}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        )}
      </div>

      {/* Quick Roll Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {COMMON_DICE.map((dice) => (
          <button
            key={dice.name}
            onClick={() => handleQuickRoll(dice.name)}
            disabled={rolling}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            {dice.name}
          </button>
        ))}
      </div>

      {/* Custom Roll */}
      <div className="space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dice Expression
            </label>
            <input
              type="text"
              value={diceExpression}
              onChange={(e) => setDiceExpression(e.target.value)}
              placeholder="1d20+4, 2d6+1d4+2, 3d8-1..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Advanced: 1d20+4, 2d6+1d4+2, 3d8-1
            </p>
          </div>
        </div>

        <button
          onClick={handleRoll}
          disabled={rolling}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {rolling ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Rolling...
            </span>
          ) : (
            'Roll Dice'
          )}
        </button>
      </div>

      {/* Last Roll Result */}
      {lastRoll && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
          <div className="text-sm font-medium text-indigo-900">
            {formatRollResult(lastRoll)}
          </div>
          <div className="text-xs text-indigo-700 mt-1">
            Breakdown: {lastRoll.breakdown}
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="text-xs text-gray-500">
        <p><strong>Advanced Examples:</strong> 1d20+4, 2d6+1d4+2, 3d8-1, 1d12+1d6+3</p>
      </div>
    </div>
  );
}
