'use client';

import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';

interface WebRTCVoiceChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  onSignal?: (signal: any) => void;
  onError?: (error: string) => void;
}

export default function WebRTCVoiceChat({ 
  sessionId, 
  userId, 
  userName, 
  onSignal,
  onError 
}: WebRTCVoiceChatProps) {
  const [isInVoiceChat, setIsInVoiceChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioPermission, setAudioPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const {
    localStream,
    peers,
    isConnected,
    error,
    startVoiceChat,
    stopVoiceChat,
    toggleMute,
    handleSignal
  } = useWebRTC({
    sessionId,
    userId,
    onSignal
  });

  // Handle WebRTC signals from other users
  useEffect(() => {
    if (onSignal) {
      // This will be called by the parent component when signals are received
    }
  }, [onSignal]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Check microphone permission
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setAudioPermission(permission.state);
      
      permission.onchange = () => {
        setAudioPermission(permission.state);
      };
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  };

  const handleJoinVoice = async () => {
    const success = await startVoiceChat();
    if (success) {
      setIsInVoiceChat(true);
    }
  };

  const handleLeaveVoice = () => {
    stopVoiceChat();
    setIsInVoiceChat(false);
    setIsMuted(false);
  };

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  // Expose handleSignal to parent component
  useEffect(() => {
    if (onSignal) {
      (window as any).handleWebRTCSignal = handleSignal;
    }
    
    return () => {
      delete (window as any).handleWebRTCSignal;
    };
  }, [handleSignal, onSignal]);

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">🎤 Voice Chat</h3>
        <div className="flex items-center space-x-2">
          {isInVoiceChat && (
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="text-sm text-green-600">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isInVoiceChat ? (
        <div className="text-center py-6">
          {audioPermission === 'denied' ? (
            <div className="space-y-3">
              <div className="text-red-600">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              </div>
              <p className="text-red-600 font-medium">Microphone Access Denied</p>
              <p className="text-sm text-gray-600">Please allow microphone access in your browser settings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-gray-400">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              </div>
              <p className="text-gray-600">Ready to join voice chat</p>
              <p className="text-sm text-gray-500">Connect with other participants for voice communication</p>
              <button
                onClick={handleJoinVoice}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Join Voice Chat
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Voice Controls */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleToggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 4.5l15 15"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              )}
            </button>

            <button
              onClick={handleLeaveVoice}
              className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
              title="Leave Voice Chat"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12H8m0 0l4 4m-4-4l4-4m11-1a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          </div>

          {/* Connected Peers */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Voice Participants ({peers.length + 1})
            </h4>
            
            <div className="space-y-2">
              {/* Local user */}
              <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-md">
                <div className="flex-shrink-0">
                  {isMuted ? (
                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 4.5l15 15"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {userName} (You)
                  </p>
                  <p className="text-xs text-gray-500">
                    {isMuted ? 'Muted' : 'Unmuted'}
                  </p>
                </div>
              </div>

              {/* Remote peers */}
              {peers.map((peer) => (
                <div key={peer.userId} className="flex items-center space-x-3 p-2 bg-green-50 rounded-md">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Participant {peer.userId.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {peer.connection.connectionState}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="text-xs text-gray-500 text-center">
            <p>WebRTC Voice Chat • {isConnected ? 'Connected' : 'Connecting...'}</p>
            {error && (
              <p className="text-red-500 mt-1">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
