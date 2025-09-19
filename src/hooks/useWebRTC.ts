'use client';

import { useRef, useState, useEffect } from 'react';

interface UseWebRTCProps {
  sessionId: string;
  userId: string;
  onSignal?: (signal: any) => void;
}

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export function useWebRTC({ sessionId, userId, onSignal }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  // ICE servers configuration
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const createPeerConnection = (targetUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers });
    
    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming stream
    pc.ontrack = (event) => {
      console.log('Received remote stream from:', targetUserId);
      const [remoteStream] = event.streams;
      
      setPeers(prev => {
        const newPeers = new Map(prev);
        const peer = newPeers.get(targetUserId);
        if (peer) {
          peer.stream = remoteStream;
          newPeers.set(targetUserId, peer);
        }
        return newPeers;
      });

      // Play remote audio
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play().catch(console.error);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to:', targetUserId);
        sendSignal('ice-candidate', {
          candidate: event.candidate
        }, targetUserId);
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log('Connection state with', targetUserId, ':', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setIsConnected(false);
      }
    };

    return pc;
  };

  const sendSignal = async (type: string, data: any, targetUserId?: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}/webrtc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          targetUserId
        }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Failed to send signal:', error);
    }
  };

  const handleSignal = async (signal: any) => {
    const { signalType, data, fromUserId, targetUserId } = signal;
    
    // Only process signals meant for this user
    if (targetUserId && targetUserId !== userId) {
      return;
    }

    console.log('Received WebRTC signal:', signalType, 'from:', fromUserId);

    let peer = peersRef.current.get(fromUserId);
    
    if (!peer) {
      console.log('Creating new peer connection for:', fromUserId);
      const pc = createPeerConnection(fromUserId);
      peer = { userId: fromUserId, connection: pc };
      peersRef.current.set(fromUserId, peer);
      setPeers(new Map(peersRef.current));
    }

    try {
      switch (signalType) {
        case 'offer':
          await peer.connection.setRemoteDescription(data);
          const answer = await peer.connection.createAnswer();
          await peer.connection.setLocalDescription(answer);
          sendSignal('answer', answer, fromUserId);
          break;

        case 'answer':
          await peer.connection.setRemoteDescription(data);
          break;

        case 'ice-candidate':
          await peer.connection.addIceCandidate(data.candidate);
          break;

        case 'user-joined':
          // Create offer for new user
          if (fromUserId !== userId) {
            const offer = await peer.connection.createOffer();
            await peer.connection.setLocalDescription(offer);
            sendSignal('offer', offer, fromUserId);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebRTC signal:', error);
      setError(`WebRTC error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startVoiceChat = async (): Promise<boolean> => {
    try {
      console.log('Starting voice chat...');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      
      // Notify other users that we joined
      sendSignal('user-joined', { userId }, null);
      
      console.log('Voice chat started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      setError('Failed to access microphone. Please check permissions.');
      return false;
    }
  };

  const stopVoiceChat = () => {
    console.log('Stopping voice chat...');
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close all peer connections
    peersRef.current.forEach(peer => {
      peer.connection.close();
    });
    
    peersRef.current.clear();
    setPeers(new Map());
    setIsConnected(false);
    setError(null);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, []);

  return {
    localStream,
    peers: Array.from(peers.values()),
    isConnected,
    error,
    startVoiceChat,
    stopVoiceChat,
    toggleMute,
    handleSignal
  };
}
