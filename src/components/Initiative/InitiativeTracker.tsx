'use client';

import React, { useState } from 'react';
import InitiativeRollModal from './InitiativeRollModal';
import { DiceRoll, formatDiceResult } from '../../utils/diceParser';

interface InitiativeEntry {
  id: string;
  characterName: string;
  initiative: number;
  rollDetails: string;
  userId: string;
  isActive: boolean;
}

interface InitiativeTrackerProps {
  sessionId: string;
  userId: string;
  isDM: boolean;
  isCreator: boolean;
  onSendMessage?: (message: string, type: 'roll' | 'system') => void;
}

export default function InitiativeTracker({ 
  sessionId, 
  userId, 
  isDM, 
  isCreator,
  onSendMessage 
}: InitiativeTrackerProps) {
  const [initiatives, setInitiatives] = useState<InitiativeEntry[]>([]);
  const [showRollModal, setShowRollModal] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [combatStarted, setCombatStarted] = useState(false);

  const handleInitiativeRoll = (characterName: string, roll: DiceRoll) => {
    const entry: InitiativeEntry = {
      id: `init_${Date.now()}_${userId}`,
      characterName,
      initiative: roll.total,
      rollDetails: formatDiceResult(roll),
      userId,
      isActive: true
    };

    setInitiatives(prev => {
      // Remove existing entry for same character
      const filtered = prev.filter(init => 
        !(init.characterName === characterName && init.userId === userId)
      );
      
      // Add new entry and sort by initiative (highest first)
      const updated = [...filtered, entry].sort((a, b) => b.initiative - a.initiative);
      
      return updated;
    });

    // Send roll result to chat
    if (onSendMessage) {
      const message = `⚔️ Initiative: ${characterName} rolled ${roll.total} (${roll.breakdown})`;
      onSendMessage(message, 'roll');
    }
  };

  const startCombat = () => {
    if (initiatives.length === 0) {
      alert('No initiative rolls yet. Players need to roll initiative first.');
      return;
    }

    setCombatStarted(true);
    setCurrentTurn(initiatives[0]?.id || null);

    if (onSendMessage) {
      onSendMessage('⚔️ Combat has started! Initiative order established.', 'system');
    }
  };

  const nextTurn = () => {
    if (!currentTurn || initiatives.length === 0) return;

    const currentIndex = initiatives.findIndex(init => init.id === currentTurn);
    const nextIndex = (currentIndex + 1) % initiatives.length;
    const nextInitiative = initiatives[nextIndex];
    
    setCurrentTurn(nextInitiative.id);

    if (onSendMessage) {
      onSendMessage(`⚔️ It's ${nextInitiative.characterName}'s turn!`, 'system');
    }
  };

  const endCombat = () => {
    setCombatStarted(false);
    setCurrentTurn(null);
    
    if (onSendMessage) {
      onSendMessage('⚔️ Combat has ended.', 'system');
    }
  };

  const clearInitiatives = () => {
    if (confirm('Clear all initiative rolls?')) {
      setInitiatives([]);
      setCombatStarted(false);
      setCurrentTurn(null);
      
      if (onSendMessage) {
        onSendMessage('⚔️ Initiative tracker cleared.', 'system');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* DM Controls */}
      {(isDM || isCreator) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-indigo-900 mb-3">👑 DM Controls</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRollModal(true)}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              🎲 Roll Initiative
            </button>
            
            {!combatStarted ? (
              <button
                onClick={startCombat}
                disabled={initiatives.length === 0}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                ⚔️ Start Combat
              </button>
            ) : (
              <>
                <button
                  onClick={nextTurn}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  ➡️ Next Turn
                </button>
                <button
                  onClick={endCombat}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  🛑 End Combat
                </button>
              </>
            )}
            
            <button
              onClick={clearInitiatives}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      )}

      {/* Player Roll Button */}
      {!isDM && !isCreator && (
        <div className="text-center">
          <button
            onClick={() => setShowRollModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            🎲 Roll Initiative
          </button>
        </div>
      )}

      {/* Initiative Order */}
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              ⚔️ Initiative Order
            </h3>
            {combatStarted && (
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                Combat Active
              </span>
            )}
          </div>
        </div>
        
        <div className="p-4">
          {initiatives.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No initiative rolls yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {isDM || isCreator ? 'Start by rolling initiative for NPCs' : 'Wait for DM to start initiative'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {initiatives.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    currentTurn === entry.id
                      ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        currentTurn === entry.id
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entry.characterName}
                        {currentTurn === entry.id && ' 👈 Current Turn'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.rollDetails}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">
                      {entry.initiative}
                    </div>
                    <div className="text-xs text-gray-500">Initiative</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Each player can roll initiative for multiple characters</li>
          <li>• Use complex dice expressions: 1d20+4, 2d6+1d4+2</li>
          <li>• {isDM || isCreator ? 'As DM, you can start/end combat and manage turns' : 'Wait for DM to start combat'}</li>
          <li>• Initiative order is automatically sorted (highest first)</li>
        </ul>
      </div>

      {/* Initiative Roll Modal */}
      <InitiativeRollModal
        isOpen={showRollModal}
        onClose={() => setShowRollModal(false)}
        onRoll={handleInitiativeRoll}
      />
    </div>
  );
}
