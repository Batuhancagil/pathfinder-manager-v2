'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IChatRoom } from '../../models/Session';
import { parseDiceExpression, formatDiceResult, DiceRoll } from '../../utils/diceParser';

// Extended message interface to handle both string and Date timestamps
interface ChatMessageExtended {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string | Date;
  type: 'chat' | 'roll' | 'system';
  roomId?: string;
}

interface DiceChannelInterfaceProps {
  sessionId: string;
  userId: string;
  currentRoom: IChatRoom;
  messages: ChatMessageExtended[];
  onSendMessage: (message: string, type?: 'chat' | 'roll' | 'system', roomId?: string) => Promise<void>;
  onMarkAsRead?: (roomId: string) => Promise<void>;
}

const QUICK_DICE = ['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '2d6', '3d6'];

export default function DiceChannelInterface({
  sessionId,
  userId,
  currentRoom,
  messages,
  onSendMessage,
  onMarkAsRead
}: DiceChannelInterfaceProps) {
  const [diceInput, setDiceInput] = useState('1d20');
  const [characterName, setCharacterName] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for dice room
  const diceMessages = messages.filter(msg => 
    (msg.roomId || 'general') === currentRoom.id
  );

  // Auto-scroll to bottom when new messages arrive (not on initial load)
  const prevMessageCountRef = useRef(0);
  
  useEffect(() => {
    const currentMessageCount = diceMessages.length;
    
    // Only scroll if messages increased (new message arrived)
    if (currentMessageCount > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    prevMessageCountRef.current = currentMessageCount;
  }, [diceMessages.length]);

  // Mark room as read only when user actively views it (not on component mount)
  // This prevents automatic mark-read on page refresh or tab switching

  const handleDiceRoll = async (diceExpression?: string) => {
    const expression = diceExpression || diceInput;
    if (!expression.trim() || isRolling) return;

    setIsRolling(true);
    try {
      const rollResult: DiceRoll = parseDiceExpression(expression);
      const characterPrefix = characterName.trim() ? `${characterName.trim()}: ` : '';
      const rollMessage = `${characterPrefix}${formatDiceResult(rollResult)}`;
      
      await onSendMessage(rollMessage, 'roll', currentRoom.id);
      
      // Clear input after successful roll
      if (!diceExpression) {
        setDiceInput('1d20');
      }
    } catch (error) {
      console.error('Dice roll error:', error);
      await onSendMessage(`❌ Invalid dice expression: ${expression}`, 'system', currentRoom.id);
    } finally {
      setIsRolling(false);
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserInitials = (username: string) => {
    return username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'roll': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-blue-100 text-blue-800';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Dice Room Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎲</span>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                #{currentRoom.name}
                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  Dice Channel
                </span>
              </h1>
              <p className="text-sm text-gray-600">Roll dice and see everyone's results</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {diceMessages.length} roll{diceMessages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Quick Dice Buttons */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Quick Roll:</span>
          <div className="flex flex-wrap gap-2">
            {QUICK_DICE.map(dice => (
              <button
                key={dice}
                onClick={() => handleDiceRoll(dice)}
                disabled={isRolling}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {dice}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {diceMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to the Dice Channel!
            </h3>
            <p className="text-gray-500 max-w-md mb-4">
              This is where all dice rolls are displayed. Use the quick buttons above or enter custom expressions below.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-blue-800 font-medium mb-2">Examples:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• <code>1d20+4</code> - Attack roll with modifier</li>
                <li>• <code>2d6+3</code> - Damage roll</li>
                <li>• <code>1d4+1d6+2</code> - Complex damage</li>
                <li>• <code>4d6</code> - Ability score generation</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {diceMessages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    message.type === 'roll' ? 'bg-green-100' : 
                    message.type === 'system' ? 'bg-blue-100' : 'bg-indigo-100'
                  }`}>
                    <span className={`text-sm font-medium ${
                      message.type === 'roll' ? 'text-green-600' : 
                      message.type === 'system' ? 'text-blue-600' : 'text-indigo-600'
                    }`}>
                      {message.type === 'roll' ? '🎲' : 
                       message.type === 'system' ? '⚙️' : 
                       getUserInitials(message.username)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {message.username}
                    </p>
                    {message.userId === userId && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${getMessageTypeColor(message.type)}`}>
                      {message.type}
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    <p className={`text-sm whitespace-pre-wrap break-words ${
                      message.type === 'roll' ? 'font-mono bg-gray-50 p-2 rounded border-l-4 border-green-400' : 
                      message.type === 'system' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {message.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Dice Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          {/* Character Name Input */}
          <div>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Character name (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Dice Expression Input */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={diceInput}
                onChange={(e) => setDiceInput(e.target.value)}
                placeholder="Enter dice expression (e.g., 1d20+4, 2d6+3)"
                disabled={isRolling}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDiceRoll();
                  }
                }}
              />
            </div>
            <button
              onClick={() => handleDiceRoll()}
              disabled={!diceInput.trim() || isRolling}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isRolling ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Rolling...</span>
                </>
              ) : (
                <>
                  <span>🎲</span>
                  <span>Roll</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
