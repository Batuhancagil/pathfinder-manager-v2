'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../../hooks/useAuth';
import { useSessionEvents } from '../../../../hooks/useSessionEvents';
import { ChatMessage } from '../../../../components/Chat/ChatInterface';

const ChatInterface = dynamic(() => import('../../../../components/Chat/ChatInterface'), {
  ssr: false
});

const DiceRoller = dynamic(() => import('../../../../components/Dice/DiceRoller'), {
  ssr: false
});

const VoiceChat = dynamic(() => import('../../../../components/Voice/VoiceChat'), {
  ssr: false
});

interface Player {
  userId: string;
  characterId?: string;
  characterName?: string;
  joinedAt: string;
  isOnline: boolean;
}

interface Session {
  _id: string;
  title: string;
  description: string;
  sessionKey: string;
  dmId: string;
  dmName: string;
  players: Player[];
  maxPlayers: number;
  isActive: boolean;
  chatMessages: ChatMessage[];
  createdAt: string;
}

export default function SessionDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'chat' | 'dice' | 'voice' | 'initiative' | 'notes'>('chat');

  // Real-time session events
  const { connected, sendMessage } = useSessionEvents({
    sessionId,
    onSessionUpdate: (updatedSession) => {
      console.log('Session updated:', updatedSession);
      setSession(updatedSession);
    },
    onNewMessage: (message) => {
      console.log('New message received:', message);
      setSession(prev => prev ? {
        ...prev,
        chatMessages: [...prev.chatMessages, message]
      } : null);
    },
    onParticipantChange: () => {
      console.log('Participant list changed, refetching session');
      if (sessionId) {
        fetchSession(sessionId);
      }
    }
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const getParams = async () => {
      const resolvedParams = await params;
      setSessionId(resolvedParams.id);
      fetchSession(resolvedParams.id);
    };
    getParams();
  }, [params, user, authLoading, router]);

  const fetchSession = async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        setError('Session not found');
      }
    } catch (err) {
      setError('Failed to fetch session');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!session || !sendMessage) return;

    try {
      await sendMessage(message, 'chat');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  const handleSendRoll = async (rollResult: string) => {
    if (!session || !sendMessage) return;

    try {
      await sendMessage(rollResult, 'roll');
    } catch (error) {
      console.error('Failed to send roll:', error);
      setError('Failed to send roll');
    }
  };

  const handleDiceRoll = (roll: any) => {
    const rollText = `🎲 ${roll.dice} → ${roll.individual.length > 1 ? `[${roll.individual.join(', ')}] = ${roll.result}` : roll.result}${roll.modifier !== 0 ? ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier} = ${roll.total}` : ''}`;
    handleSendRoll(rollText);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Dashboard</h1>
              <div className="text-red-600">{error}</div>
              <button
                onClick={() => router.push('/sessions')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Back to Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'chat', name: '💬 Chat', icon: '💬' },
    { id: 'dice', name: '🎲 Dice', icon: '🎲' },
    { id: 'voice', name: '🎤 Voice', icon: '🎤' },
    { id: 'initiative', name: '⚔️ Initiative', icon: '⚔️' },
    { id: 'notes', name: '📝 Notes', icon: '📝' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/sessions')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
                <p className="text-sm text-gray-600">DM: {session.dmName} • Key: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{session.sessionKey}</span></p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {session.players.filter(p => p.isOnline).length}/{session.players.length} online
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-500">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Panel */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'chat' && (
                  <div style={{ height: '500px' }}>
                    <ChatInterface
                      messages={session.chatMessages || []}
                      onSendMessage={handleSendMessage}
                      onSendRoll={handleSendRoll}
                      currentUserId={user!.id}
                    />
                  </div>
                )}

                {activeTab === 'dice' && (
                  <div className="max-w-md mx-auto">
                    <DiceRoller onRoll={handleDiceRoll} />
                  </div>
                )}

                {activeTab === 'voice' && (
                  <div className="max-w-md mx-auto">
                    <VoiceChat
                      sessionId={sessionId}
                      userId={user!.id}
                      userName={user!.name}
                      onError={(error) => setError(error)}
                    />
                  </div>
                )}

                {activeTab === 'initiative' && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">⚔️ Initiative Tracker</h3>
                    <p className="text-gray-600 mb-4">Track turn order and combat initiatives</p>
                    <p className="text-sm text-gray-500">Coming soon...</p>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">📝 Session Notes</h3>
                    <p className="text-gray-600 mb-4">Keep track of important events and information</p>
                    <p className="text-sm text-gray-500">Coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Players List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">👥 Players</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {/* DM */}
                  <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        👑 {session.dmName}
                      </p>
                      <p className="text-xs text-gray-500">Dungeon Master</p>
                    </div>
                  </div>
                  
                  {/* Players */}
                  {session.players.map((player, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {player.characterName || `Player ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {player.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {session.players.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No other players yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">⚡ Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <button 
                  onClick={() => setActiveTab('voice')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  🎤 Join Voice Chat
                </button>
                <button 
                  onClick={() => setActiveTab('dice')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  🎲 Quick Roll d20
                </button>
                <button 
                  onClick={() => setActiveTab('initiative')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  ⚔️ Roll Initiative
                </button>
                <button 
                  onClick={() => setActiveTab('notes')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  📝 Add Note
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  🎵 Play Music
                </button>
              </div>
            </div>

            {/* Session Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">ℹ️ Session Info</h3>
              </div>
              <div className="p-4 text-sm text-gray-600 space-y-2">
                <div>
                  <span className="font-medium">Created:</span> {new Date(session.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Max Players:</span> {session.maxPlayers}
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className="ml-1 text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
