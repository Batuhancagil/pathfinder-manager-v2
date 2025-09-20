'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../../hooks/useAuth';
import { useSessionEvents } from '../../../../hooks/useSessionEvents';
import { useOnlineStatus } from '../../../../hooks/useOnlineStatus';
import { ChatMessage } from '../../../../components/Chat/ChatInterface';
import { IChatRoom, IInitiativeEntry } from '../../../../models/Session';

const ChatInterface = dynamic(() => import('../../../../components/Chat/ChatInterface'), {
  ssr: false
});

const ChatRoomSidebar = dynamic(() => import('../../../../components/Chat/ChatRoomSidebar'), {
  ssr: false
});

const ChatRoomInterface = dynamic(() => import('../../../../components/Chat/ChatRoomInterface'), {
  ssr: false
});

const DiceRoller = dynamic(() => import('../../../../components/Dice/DiceRoller'), {
  ssr: false
});

const DiceChannelInterface = dynamic(() => import('../../../../components/Chat/DiceChannelInterface'), {
  ssr: false
});

const VoiceChat = dynamic(() => import('../../../../components/Voice/VoiceChat'), {
  ssr: false
});

const WebRTCVoiceChat = dynamic(() => import('../../../../components/Voice/WebRTCVoiceChat'), {
  ssr: false
});

const InitiativeTracker = dynamic(() => import('../../../../components/Initiative/InitiativeTracker'), {
  ssr: false
});

interface Player {
  userId: string;
  characterId?: string;
  characterName?: string;
  joinedAt: string;
  isOnline: boolean;
  lastSeen: string;
  roomLastSeen?: { [roomId: string]: string };
}

interface Session {
  _id: string;
  title: string;
  description: string;
  sessionKey: string;
  creatorId: string;
  creatorName: string;
  dmId?: string;
  dmName?: string;
  players: Player[];
  maxPlayers: number;
  isActive: boolean;
  chatMessages: ChatMessage[];
  chatRooms: IChatRoom[];
  initiativeOrder: IInitiativeEntry[];
  currentTurn?: string;
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
  
  // Chat room state
  const [currentRoomId, setCurrentRoomId] = useState('general');
  
  // DM assignment state
  const [showDMAssignment, setShowDMAssignment] = useState(false);
  const [selectedDMUserId, setSelectedDMUserId] = useState('');
  const [dmCharacterName, setDMCharacterName] = useState('');

  // Handle WebRTC signals from session events
  const handleWebRTCSignal = (signal: any) => {
    console.log('Received WebRTC signal in dashboard:', signal);
    if ((window as any).handleWebRTCSignal) {
      (window as any).handleWebRTCSignal(signal);
    }
  };

  // Real-time session events (only when sessionId is available)
  const { connected, sendMessage } = useSessionEvents({
    sessionId: sessionId || '',
    onSessionUpdate: (updatedSession) => {
      console.log('Session updated:', updatedSession);
      console.log('Players in updated session:', updatedSession.players);
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
    },
      onInitiativeUpdate: (initiativeOrder) => {
        console.log('Initiative order updated:', initiativeOrder);
        setSession(prev => prev ? {
          ...prev,
          initiativeOrder
        } : null);
      },
      onChatRoomsUpdate: (chatRooms) => {
        console.log('Chat rooms updated:', chatRooms);
        setSession(prev => prev ? {
          ...prev,
          chatRooms
        } : null);
      },
    onWebRTCSignal: handleWebRTCSignal
  });

  // Online status tracking
  useOnlineStatus({
    sessionId,
    userId: user?.id || '',
    enabled: !!sessionId && !!user
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
      
      // First try to auto-join the session
      try {
        const autoJoinResponse = await fetch(`/api/sessions/${resolvedParams.id}/auto-join`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (autoJoinResponse.ok) {
          const autoJoinData = await autoJoinResponse.json();
          console.log('Auto-join result:', autoJoinData);
        }
      } catch (error) {
        console.warn('Auto-join failed:', error);
      }
      
      // Then fetch session data
      fetchSession(resolvedParams.id);
    };
    getParams();
  }, [params, user, authLoading, router]);

  const fetchSession = async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched session data:', data.session);
        console.log('Players in session:', data.session.players);
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

  const handleSendMessage = async (message: string, type: 'chat' | 'roll' | 'system' = 'chat', roomId: string = currentRoomId) => {
    if (!session || !sendMessage) return;

    try {
      await sendMessage(message, type, roomId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  const handleCreateRoom = async (name: string, description?: string, isPrivate?: boolean) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/chat-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          isPrivate
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      // Room will be updated via real-time events
    } catch (error) {
      console.error('Failed to create room:', error);
      setError(error instanceof Error ? error.message : 'Failed to create room');
    }
  };

  const markRoomAsRead = async (roomId: string) => {
    if (!sessionId || !user) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId }),
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('Failed to mark room as read');
      }
    } catch (error) {
      console.warn('Failed to mark room as read:', error);
    }
  };

  const getUnreadCount = (roomId: string): number => {
    if (!session || !user) return 0;

    // Get current user from players array
    const currentPlayer = session.players.find(p => p.userId === user.id);
    if (!currentPlayer) {
      console.log('Current player not found for unread count');
      return 0;
    }

    // Get last seen message ID for this room
    const lastSeenMessageId = currentPlayer.roomLastSeen?.[roomId];
    console.log(`Room ${roomId} last seen:`, lastSeenMessageId);
    
    // Get all messages for this room
    const roomMessages = session.chatMessages.filter(msg => 
      (msg.roomId || 'general') === roomId
    );

    console.log(`Room ${roomId} total messages:`, roomMessages.length);

    if (!lastSeenMessageId) {
      // If never seen any message, all are unread
      console.log(`Room ${roomId} never seen, unread:`, roomMessages.length);
      return roomMessages.length;
    }

    // Find the index of last seen message
    const lastSeenIndex = roomMessages.findIndex(msg => msg.id === lastSeenMessageId);
    
    if (lastSeenIndex === -1) {
      // Last seen message not found, assume all are unread
      console.log(`Room ${roomId} last seen not found, unread:`, roomMessages.length);
      return roomMessages.length;
    }

    // Count messages after the last seen one
    const unreadCount = roomMessages.length - (lastSeenIndex + 1);
    console.log(`Room ${roomId} calculated unread:`, unreadCount);
    return unreadCount;
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

  const handleAssignDM = async () => {
    if (!selectedDMUserId || !session) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/assign-dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dmUserId: selectedDMUserId,
          dmCharacterName: dmCharacterName
        }),
        credentials: 'include'
      });

      if (response.ok) {
        setShowDMAssignment(false);
        setSelectedDMUserId('');
        setDMCharacterName('');
        // Session will be updated via real-time events
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to assign DM');
      }
    } catch (err) {
      setError('Failed to assign DM');
    }
  };

  const handleKickPlayer = async (targetUserId: string, targetName: string) => {
    const reason = prompt(`Why are you kicking ${targetName}? (Optional)`);
    if (reason === null) return; // User cancelled

    try {
      const response = await fetch(`/api/sessions/${sessionId}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          reason: reason.trim() || undefined
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to kick player');
      }

      // Success message will be shown via system message in chat
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to kick player');
    }
  };

  const handleLeaveSession = async () => {
    if (!confirm('Are you sure you want to leave this session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/leave`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sessionEnded) {
          router.push('/sessions?message=Session ended');
        } else {
          router.push('/sessions?message=Left session successfully');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to leave session');
      }
    } catch (err) {
      setError('Failed to leave session');
    }
  };

  // Handle route changes for offline status
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('Route changing from dashboard, setting offline');
      // Set offline when leaving the session dashboard
      if (sessionId && user?.id) {
        fetch(`/api/sessions/${sessionId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: false }),
          credentials: 'include'
        }).catch(console.warn);
      }
    };

    // Listen for Next.js App Router navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      handleRouteChange();
      return originalPushState.apply(window.history, args);
    };

    window.history.replaceState = function(...args) {
      handleRouteChange();
      return originalReplaceState.apply(window.history, args);
    };

    // Listen for browser back/forward
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      // Restore original methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [sessionId, user?.id]);

  // Online status tracking is now handled by useOnlineStatus hook

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
                <p className="text-sm text-gray-600">
                  Creator: {session.creatorName} • 
                  DM: {session.dmName || 'Not assigned'} • 
                  Key: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{session.sessionKey}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {(() => {
                  const now = new Date();
                  const onlinePlayers = session.players.filter(p => {
                    if (p.userId === session.dmId) return false; // Exclude DM from player count
                    const timeDiff = now.getTime() - new Date(p.lastSeen).getTime();
                    return p.isOnline && timeDiff < 360000; // 6 minutes
                  }).length;
                  const totalPlayers = session.players.filter(p => p.userId !== session.dmId).length;
                  return `${onlinePlayers + 1}/${totalPlayers + 1} online`;
                })()}
                <span className="text-xs text-gray-400 ml-1">
                  (DM + {session.players.filter(p => p.userId !== session.dmId).length} players)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-500">
                  {connected ? 'Real-time Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Panel - Chat Room Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-lg shadow-sm" style={{ height: '600px' }}>
              <ChatRoomSidebar
                sessionId={sessionId}
                userId={user!.id}
                isCreator={session?.creatorId === user!.id}
                chatRooms={session?.chatRooms || []}
                currentRoomId={currentRoomId}
                onRoomChange={(roomId) => {
                  setCurrentRoomId(roomId);
                  setActiveTab('chat'); // Auto-switch to chat tab when room is selected
                  markRoomAsRead(roomId); // Mark room as read when switching
                }}
                onCreateRoom={handleCreateRoom}
                messageCount={(() => {
                  const counts: { [roomId: string]: number } = {};
                  (session?.chatRooms || []).forEach(room => {
                    counts[room.id] = getUnreadCount(room.id);
                  });
                  return counts;
                })()}
              />
            </div>
          </div>

          {/* Main Panel */}
          <div className="lg:col-span-2">
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
              <div className={activeTab === 'chat' ? 'h-full' : 'p-6'}>
                {activeTab === 'chat' && (
                  <div style={{ height: '600px' }}>
                    {session?.chatRooms && session.chatRooms.length > 0 && (() => {
                      const currentRoom = session.chatRooms.find(room => room.id === currentRoomId) || session.chatRooms[0];
                      
                      // Use DiceChannelInterface for dice room
                      if (currentRoom.id === 'dice') {
                        return (
                          <DiceChannelInterface
                            sessionId={sessionId}
                            userId={user!.id}
                            currentRoom={currentRoom}
                            messages={session?.chatMessages || []}
                            onSendMessage={handleSendMessage}
                            onMarkAsRead={markRoomAsRead}
                          />
                        );
                      }
                      
                      // Use regular ChatRoomInterface for other rooms
                      return (
                        <ChatRoomInterface
                          sessionId={sessionId}
                          userId={user!.id}
                          currentRoom={currentRoom}
                          messages={session?.chatMessages || []}
                          onSendMessage={handleSendMessage}
                          onMarkAsRead={markRoomAsRead}
                        />
                      );
                    })()}
                  </div>
                )}

                {activeTab === 'dice' && (
                  <div className="max-w-md mx-auto">
                    <DiceRoller onRoll={handleDiceRoll} />
                  </div>
                )}

                {activeTab === 'voice' && (
                  <div className="max-w-md mx-auto">
                    <WebRTCVoiceChat
                      sessionId={sessionId}
                      userId={user!.id}
                      userName={user!.name}
                      characterName={session?.players.find(p => p.userId === user!.id)?.characterName}
                      sessionPlayers={session?.players || []}
                      onSignal={handleWebRTCSignal}
                      onError={(error) => setError(error)}
                    />
                  </div>
                )}

                {activeTab === 'initiative' && (
                  <InitiativeTracker
                    sessionId={sessionId}
                    userId={user!.id}
                    isDM={session?.dmId === user!.id}
                    isCreator={session?.creatorId === user!.id}
                    session={session}
                    onSendMessage={async (message, type) => {
                      try {
                        await sendMessage(message, type);
                      } catch (error) {
                        console.error('Failed to send initiative message:', error);
                      }
                    }}
                  />
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
                <h3 className="text-lg font-medium text-gray-900">
                  👥 Participants ({session.players.filter(p => p.userId !== session.dmId).length + 1})
                </h3>
                <p className="text-xs text-gray-500">DM + {session.players.filter(p => p.userId !== session.dmId).length} players</p>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {/* Creator */}
                  {(() => {
                    const creatorPlayer = session.players.find(p => p.userId === session.creatorId);
                    const now = new Date();
                    const isCreatorOnline = creatorPlayer ? 
                      (creatorPlayer.isOnline && (now.getTime() - new Date(creatorPlayer.lastSeen).getTime()) < 360000) : 
                      (user?.id === session.creatorId); // Current user is always considered online
                    
                    return (
                      <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
                        <div className={`w-3 h-3 rounded-full transition-colors ${
                          isCreatorOnline ? 'bg-blue-400 animate-pulse' : 'bg-red-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            ⚙️ {session.creatorName}
                            {user?.id === session.creatorId && ' (You)'}
                          </p>
                          <p className={`text-xs ${isCreatorOnline ? 'text-blue-600' : 'text-red-500'}`}>
                            Session Creator • {isCreatorOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded ${
                            isCreatorOnline ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isCreatorOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* DM */}
                  {session.dmName && (() => {
                    const dmPlayer = session.players.find(p => p.userId === session.dmId);
                    const now = new Date();
                    const isDMOnline = dmPlayer ? 
                      (dmPlayer.isOnline && (now.getTime() - new Date(dmPlayer.lastSeen).getTime()) < 360000) : 
                      (user?.id === session.dmId); // Current user is always considered online
                    
                    return (
                      <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
                        <div className={`w-3 h-3 rounded-full transition-colors ${
                          isDMOnline ? 'bg-purple-400 animate-pulse' : 'bg-red-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            👑 {session.dmName}
                            {user?.id === session.dmId && ' (You)'}
                          </p>
                          <p className={`text-xs ${isDMOnline ? 'text-purple-600' : 'text-red-500'}`}>
                            Dungeon Master • {isDMOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded ${
                            isDMOnline ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isDMOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  
                       {/* Players */}
                       {session.players
                         .filter(player => player.userId !== session.dmId) // DM'i players listesinden çıkar
                         .map((player, index) => {
                           const lastSeenDate = new Date(player.lastSeen);
                           const now = new Date();
                           const timeDiff = now.getTime() - lastSeenDate.getTime();
                           const isRecentlyOnline = timeDiff < 360000; // 6 minutes (more lenient)
                           const isOnline = player.isOnline && isRecentlyOnline;
                           const isCurrentUserCreator = user?.id === session.creatorId;
                           const isNotCurrentUser = player.userId !== user?.id;
                           
                           return (
                             <div key={player.userId || index} className="flex items-center space-x-3">
                               <div className={`w-3 h-3 rounded-full transition-colors ${
                                 isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                               }`}></div>
                               <div className="flex-1">
                                 <p className="text-sm font-medium text-gray-900">
                                   {player.characterName || `Player ${index + 1}`}
                                   {player.userId === user?.id && ' (You)'}
                                 </p>
                                 <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                                   {isOnline ? 'Online' : `Offline • Last seen ${lastSeenDate.toLocaleTimeString()}`}
                                 </p>
                               </div>
                               
                               {/* Status and Actions */}
                               <div className="flex items-center space-x-2">
                                 {/* Status indicator */}
                                 <div className="flex-shrink-0">
                                   {isOnline ? (
                                     <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                       Online
                                     </span>
                                   ) : (
                                     <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                       Offline
                                     </span>
                                   )}
                                 </div>
                                 
                                 {/* Kick button for session creator */}
                                 {isCurrentUserCreator && isNotCurrentUser && (
                                   <button
                                     onClick={() => handleKickPlayer(player.userId, player.characterName || 'Unknown Player')}
                                     className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                     title="Kick player from session"
                                   >
                                     <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                     </svg>
                                   </button>
                                 )}
                               </div>
                             </div>
                           );
                         })}
                  
                  {session.players.filter(p => p.userId !== session.dmId).length === 0 && (
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
                {/* Creator Actions */}
                {user?.id === session.creatorId && (
                  <button 
                    onClick={() => setShowDMAssignment(!showDMAssignment)}
                    className="w-full text-left px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200"
                  >
                    ⚙️ {session.dmName ? 'Change DM' : 'Assign DM'}
                  </button>
                )}
                
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
                
                {/* Leave Session Button */}
                <button 
                  onClick={handleLeaveSession}
                  className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded border border-red-200"
                >
                  🚪 Leave Session
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

      {/* DM Assignment Modal */}
      {showDMAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {session.dmName ? 'Change Dungeon Master' : 'Assign Dungeon Master'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Player to be DM:
                </label>
                <select
                  value={selectedDMUserId}
                  onChange={(e) => setSelectedDMUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a participant...</option>
                  {/* Creator can be DM */}
                  <option value={session.creatorId}>
                    {session.creatorName} (Creator)
                  </option>
                  {/* Other players */}
                  {session.players.map((player) => (
                    <option key={player.userId} value={player.userId}>
                      {player.characterName || `Player ${player.userId.slice(-4)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DM Character Name (Optional):
                </label>
                <input
                  type="text"
                  value={dmCharacterName}
                  onChange={(e) => setDMCharacterName(e.target.value)}
                  placeholder="Enter DM character name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDMAssignment(false);
                  setSelectedDMUserId('');
                  setDMCharacterName('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDM}
                disabled={!selectedDMUserId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {session.dmName ? 'Change DM' : 'Assign DM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
