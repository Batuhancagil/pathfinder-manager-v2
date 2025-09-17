'use client';

import React, { useState } from 'react';

interface DiceRoll {
  dice: string;
  result: number;
  individual: number[];
  modifier: number;
  total: number;
}

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
  const [diceExpression, setDiceExpression] = useState('1d20');
  const [modifier, setModifier] = useState(0);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [rolling, setRolling] = useState(false);

  const rollDice = (sides: number): number => {
    return Math.floor(Math.random() * sides) + 1;
  };

  const parseDiceExpression = (expression: string): { count: number; sides: number } => {
    const match = expression.match(/^(\d+)?d(\d+)$/i);
    if (!match) {
      throw new Error('Invalid dice expression');
    }
    
    const count = parseInt(match[1] || '1');
    const sides = parseInt(match[2]);
    
    if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
      throw new Error('Invalid dice parameters');
    }
    
    return { count, sides };
  };

  const handleRoll = async () => {
    try {
      setRolling(true);
      
      const { count, sides } = parseDiceExpression(diceExpression);
      const individual: number[] = [];
      let sum = 0;
      
      for (let i = 0; i < count; i++) {
        const roll = rollDice(sides);
        individual.push(roll);
        sum += roll;
      }
      
      const total = sum + modifier;
      
      const rollResult: DiceRoll = {
        dice: diceExpression,
        result: sum,
        individual,
        modifier,
        total
      };
      
      setLastRoll(rollResult);
      
      // Call callback if provided
      if (onRoll) {
        onRoll(rollResult);
      }
      
      // Add some animation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Dice roll error:', error);
      alert('Invalid dice expression. Use format like: 1d20, 2d6, 3d8+2');
    } finally {
      setRolling(false);
    }
  };

  const handleQuickRoll = (diceType: string) => {
    setDiceExpression(`1${diceType}`);
    setTimeout(() => {
      const expression = `1${diceType}`;
      setDiceExpression(expression);
      // Trigger roll after setting expression
      const { count, sides } = parseDiceExpression(expression);
      const individual: number[] = [];
      let sum = 0;
      
      for (let i = 0; i < count; i++) {
        const roll = rollDice(sides);
        individual.push(roll);
        sum += roll;
      }
      
      const total = sum + modifier;
      
      const rollResult: DiceRoll = {
        dice: expression,
        result: sum,
        individual,
        modifier,
        total
      };
      
      setLastRoll(rollResult);
      
      if (onRoll) {
        onRoll(rollResult);
      }
    }, 100);
  };

  const formatRollResult = (roll: DiceRoll): string => {
    let result = `🎲 ${roll.dice}`;
    
    if (roll.individual.length > 1) {
      result += ` → [${roll.individual.join(', ')}] = ${roll.result}`;
    } else {
      result += ` → ${roll.result}`;
    }
    
    if (roll.modifier !== 0) {
      result += ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier} = ${roll.total}`;
    }
    
    return result;
  };

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
              placeholder="1d20, 2d6, 3d8..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modifier
            </label>
            <input
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
          {lastRoll.individual.length > 1 && (
            <div className="text-xs text-indigo-700 mt-1">
              Individual rolls: {lastRoll.individual.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Examples */}
      <div className="text-xs text-gray-500">
        <p><strong>Examples:</strong> 1d20, 2d6+3, 4d8-2, 1d100</p>
      </div>
    </div>
  );
}
