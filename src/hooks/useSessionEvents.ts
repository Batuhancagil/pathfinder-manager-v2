'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../components/Chat/ChatInterface';

interface SessionEvent {
  type: 'connected' | 'session_update' | 'new_message' | 'participant_joined' | 'participant_left' | 'participant_status_update' | 'initiative_update' | 'webrtc_signal';
  sessionId?: string;
  userId?: string;
  isOnline?: boolean;
  message?: ChatMessage;
  session?: {
    id: string;
    title: string;
    players: any[];
    chatMessages: ChatMessage[];
    isActive: boolean;
  };
  initiativeOrder?: any[];
  signalType?: string;
  data?: any;
  fromUserId?: string;
  targetUserId?: string;
  timestamp: string;
}

interface UseSessionEventsProps {
  sessionId: string;
  onSessionUpdate?: (session: any) => void;
  onNewMessage?: (message: ChatMessage) => void;
  onParticipantChange?: () => void;
  onInitiativeUpdate?: (initiativeOrder: any[]) => void;
  onWebRTCSignal?: (signal: any) => void;
}

export function useSessionEvents({ 
  sessionId, 
  onSessionUpdate, 
  onNewMessage, 
  onParticipantChange,
  onInitiativeUpdate,
  onWebRTCSignal
}: UseSessionEventsProps) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!sessionId) {
      console.log('No sessionId provided, skipping connection');
      return;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log(`Connecting to session events: ${sessionId}`);
    
    const eventSource = new EventSource(`/api/sessions/${sessionId}/events`, {
      withCredentials: true
    });

    eventSource.onopen = () => {
      console.log('Session events connected');
      setConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SessionEvent = JSON.parse(event.data);
        console.log('Session event received:', data.type, data);

        switch (data.type) {
          case 'connected':
            console.log('Successfully connected to session events');
            break;

          case 'session_update':
            if (data.session && onSessionUpdate) {
              onSessionUpdate(data.session);
            }
            break;

          case 'new_message':
            if (data.message && onNewMessage) {
              onNewMessage(data.message);
            }
            break;

          case 'participant_joined':
          case 'participant_left':
          case 'participant_status_update':
            if (onParticipantChange) {
              onParticipantChange();
            }
            break;

          case 'initiative_update':
            if (data.initiativeOrder && onInitiativeUpdate) {
              onInitiativeUpdate(data.initiativeOrder);
            }
            break;

          case 'webrtc_signal':
            if (onWebRTCSignal) {
              onWebRTCSignal(data);
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing session event:', error);
      }
    };

    eventSource.onerror = (event) => {
      console.error('Session events error:', event);
      setConnected(false);
      
      if (eventSource.readyState === EventSource.CLOSED) {
        setError('Connection closed');
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          setError('Failed to connect after multiple attempts');
        }
      }
    };

    eventSourceRef.current = eventSource;
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setConnected(false);
    setError(null);
  };

  const sendMessage = async (message: string, type: 'chat' | 'roll' | 'system' = 'chat') => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, type }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connected,
    error,
    connect,
    disconnect,
    sendMessage
  };
}
