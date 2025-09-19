'use client';

import React, { useState, useEffect } from 'react';
import InitiativeRollModal from './InitiativeRollModal';
import { DiceRoll, formatDiceResult } from '../../utils/diceParser';

interface InitiativeEntry {
  id: string;
  characterName: string;
  initiative: number;
  rollDetails: string;
  userId: string;
  userName: string;
  isActive: boolean;
  isDead: boolean;
  addedAt: string;
}

interface InitiativeTrackerProps {
  sessionId: string;
  userId: string;
  isDM: boolean;
  isCreator: boolean;
  session?: any;
  onSendMessage?: (message: string, type: 'roll' | 'system') => void;
}

export default function InitiativeTracker({ 
  sessionId, 
  userId, 
  isDM, 
  isCreator,
  session,
  onSendMessage 
}: InitiativeTrackerProps) {
  const [initiatives, setInitiatives] = useState<InitiativeEntry[]>([]);
  const [showRollModal, setShowRollModal] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [combatStarted, setCombatStarted] = useState(false);
  const [initiativePhase, setInitiativePhase] = useState(false); // DM started initiative rolling

  // Load initiatives from session
  useEffect(() => {
    if (session?.initiativeOrder) {
      setInitiatives(session.initiativeOrder);
    }
  }, [session]);

  const handleInitiativeRoll = async (characterName: string, roll: DiceRoll) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/initiative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterName,
          initiative: roll.total,
          rollDetails: formatDiceResult(roll)
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInitiatives(data.initiativeOrder);

        // Send roll result to chat
        if (onSendMessage) {
          const message = `⚔️ Initiative: ${characterName} rolled ${roll.total} (${roll.breakdown})`;
          onSendMessage(message, 'roll');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add initiative');
      }
    } catch (error) {
      console.error('Failed to add initiative:', error);
      alert('Failed to add initiative');
    }
  };

  const removeInitiative = async (initiativeId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/initiative`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initiativeId }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInitiatives(data.initiativeOrder);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to remove initiative');
      }
    } catch (error) {
      console.error('Failed to remove initiative:', error);
      alert('Failed to remove initiative');
    }
  };

  const toggleDead = async (initiativeId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/initiative/toggle-dead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initiativeId }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInitiatives(data.initiativeOrder);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to toggle death status');
      }
    } catch (error) {
      console.error('Failed to toggle death status:', error);
      alert('Failed to toggle death status');
    }
  };

  const startInitiativePhase = () => {
    setInitiativePhase(true);
    
    if (onSendMessage) {
      onSendMessage('⚔️ Initiative phase started! Everyone roll initiative for your characters.', 'system');
    }
  };

  const startCombat = () => {
    if (initiatives.length === 0) {
      alert('No initiative rolls yet. Start initiative phase first.');
      return;
    }

    setCombatStarted(true);
    setInitiativePhase(false);
    setCurrentTurn(initiatives[0]?.id || null);

    if (onSendMessage) {
      onSendMessage('⚔️ Combat has started! Initiative order established.', 'system');
    }
  };

  const nextTurn = () => {
    if (!currentTurn || initiatives.length === 0) return;

    const currentIndex = initiatives.findIndex(init => init.id === currentTurn);
    
    // Find next alive character
    let nextIndex = (currentIndex + 1) % initiatives.length;
    let attempts = 0;
    
    while (initiatives[nextIndex]?.isDead && attempts < initiatives.length) {
      nextIndex = (nextIndex + 1) % initiatives.length;
      attempts++;
    }
    
    if (attempts >= initiatives.length) {
      // All characters are dead
      if (onSendMessage) {
        onSendMessage('💀 All characters are dead! Combat ends.', 'system');
      }
      endCombat();
      return;
    }
    
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

  const clearInitiatives = async () => {
    if (!confirm('Clear all initiative rolls?')) return;

    try {
      // Remove all initiatives one by one
      for (const init of initiatives) {
        await removeInitiative(init.id);
      }
      
      setInitiatives([]);
      setCombatStarted(false);
      setCurrentTurn(null);
      setInitiativePhase(false);
      
      if (onSendMessage) {
        onSendMessage('⚔️ Initiative tracker cleared.', 'system');
      }
    } catch (error) {
      console.error('Failed to clear initiatives:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* DM Controls */}
      {(isDM || isCreator) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-indigo-900 mb-3">👑 DM Controls</h3>
          <div className="flex flex-wrap gap-2">
            {!initiativePhase && !combatStarted && (
              <button
                onClick={startInitiativePhase}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                🎯 Start Initiative
              </button>
            )}
            
            <button
              onClick={() => setShowRollModal(true)}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              🎲 Roll Initiative
            </button>
            
            {!combatStarted && initiatives.length > 0 ? (
              <button
                onClick={startCombat}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                ⚔️ Start Combat
              </button>
            ) : combatStarted ? (
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
            ) : null}
            
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
      {(!isDM && !isCreator) || initiativePhase ? (
        <div className="text-center">
          <button
            onClick={() => setShowRollModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            🎲 Roll Initiative
          </button>
          {initiativePhase && (
            <p className="text-sm text-gray-600 mt-2">
              Initiative phase active - roll for all your characters
            </p>
          )}
        </div>
      ) : null}

      {/* Initiative Order */}
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              ⚔️ Initiative Order
            </h3>
            <div className="flex items-center space-x-2">
              {initiativePhase && (
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Rolling Phase
                </span>
              )}
              {combatStarted && (
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  Combat Active
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {initiatives.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No initiative rolls yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {isDM || isCreator ? 'Click "Start Initiative" to begin' : 'Wait for DM to start initiative'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {initiatives.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    currentTurn === entry.id
                      ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200'
                      : entry.isDead
                      ? 'bg-gray-100 border-gray-300 opacity-60'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        currentTurn === entry.id
                          ? 'bg-yellow-200 text-yellow-800'
                          : entry.isDead
                          ? 'bg-gray-300 text-gray-600'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className={entry.isDead ? 'opacity-50' : ''}>
                      <p className={`text-sm font-medium ${entry.isDead ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {entry.characterName}
                        {entry.isDead && ' 💀'}
                        {currentTurn === entry.id && !entry.isDead && ' 👈 Current Turn'}
                        {entry.userId === userId && ' (You)'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.rollDetails} • by {entry.userName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${entry.isDead ? 'text-gray-400' : 'text-indigo-600'}`}>
                        {entry.initiative}
                      </div>
                      <div className="text-xs text-gray-500">Initiative</div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {/* Death Toggle (DM/Creator only) */}
                      {(isDM || isCreator) && (
                        <button
                          onClick={() => toggleDead(entry.id)}
                          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                            entry.isDead ? 'text-red-600' : 'text-gray-400 hover:text-red-600'
                          }`}
                          title={entry.isDead ? 'Revive character' : 'Mark as dead'}
                        >
                          💀
                        </button>
                      )}
                      
                      {/* Remove Button */}
                      {(entry.userId === userId || isDM || isCreator) && (
                        <button
                          onClick={() => removeInitiative(entry.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove initiative"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Initiative System:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>DM:</strong> Start initiative phase for everyone to roll</li>
          <li>• <strong>Players:</strong> Roll initiative for each of your characters</li>
          <li>• <strong>Complex Rolls:</strong> Use expressions like 1d20+4, 2d6+1d4+2</li>
          <li>• <strong>Combat:</strong> DM starts combat and manages turns</li>
          <li>• <strong>Death:</strong> {isDM || isCreator ? 'Click 💀 to mark characters as dead/alive' : 'DM can mark characters as dead'}</li>
          <li>• <strong>Remove:</strong> {isDM || isCreator ? 'Click ✕ to remove incorrect rolls' : 'You can remove your own rolls'}</li>
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