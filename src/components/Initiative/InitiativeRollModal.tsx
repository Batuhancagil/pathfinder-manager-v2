'use client';

import React, { useState } from 'react';
import { parseDiceExpression, formatDiceResult, DiceRoll } from '../../utils/diceParser';

interface InitiativeRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoll: (characterName: string, roll: DiceRoll) => void;
}

export default function InitiativeRollModal({ isOpen, onClose, onRoll }: InitiativeRollModalProps) {
  const [characterName, setCharacterName] = useState('');
  const [diceExpression, setDiceExpression] = useState('1d20+4');
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState('');

  const handleRoll = async () => {
    if (!characterName.trim()) {
      setError('Character name is required');
      return;
    }

    if (!diceExpression.trim()) {
      setError('Dice expression is required');
      return;
    }

    setRolling(true);
    setError('');

    try {
      const roll = parseDiceExpression(diceExpression);
      
      // Add some roll animation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onRoll(characterName.trim(), roll);
      
      // Reset form
      setCharacterName('');
      setDiceExpression('1d20+4');
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid dice expression');
    } finally {
      setRolling(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !rolling) {
      handleRoll();
    }
  };

  const quickExpressions = [
    '1d20',
    '1d20+1',
    '1d20+2',
    '1d20+3',
    '1d20+4',
    '1d20+5',
    '2d6+4',
    '1d4+1d20+2'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            🎲 Roll Initiative
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Character Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Character Name
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter character name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={rolling}
            />
          </div>

          {/* Dice Expression */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dice Expression
            </label>
            <input
              type="text"
              value={diceExpression}
              onChange={(e) => setDiceExpression(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="1d20+4, 2d6+1d4+2, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={rolling}
            />
            <p className="mt-1 text-xs text-gray-500">
              Examples: 1d20+4, 2d6+1d4+2, 3d8-1
            </p>
          </div>

          {/* Quick Expressions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Expressions
            </label>
            <div className="grid grid-cols-4 gap-2">
              {quickExpressions.map((expr) => (
                <button
                  key={expr}
                  onClick={() => setDiceExpression(expr)}
                  disabled={rolling}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                >
                  {expr}
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={rolling}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRoll}
            disabled={rolling || !characterName.trim() || !diceExpression.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {rolling ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Rolling...
              </span>
            ) : (
              'Roll Initiative'
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Dice Format:</strong> Use expressions like 1d20+4, 2d6+1d4+2, or 3d8-1
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <strong>Multiple Characters:</strong> Roll separately for each character you control
          </p>
        </div>
      </div>
    </div>
  );
}
