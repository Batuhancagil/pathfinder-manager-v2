'use client';

import React, { useState, useEffect, useRef } from 'react';

interface VoiceChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  onError?: (error: string) => void;
}

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

export default function VoiceChat({ sessionId, userId, userName, onError }: VoiceChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [audioPermission, setAudioPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [connecting, setConnecting] = useState(false);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [isHoldingSpace, setIsHoldingSpace] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      cleanup();
    };
  }, []);

  // Push-to-talk keyboard listeners
  useEffect(() => {
    if (!isConnected || !pushToTalk) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isHoldingSpace) {
        e.preventDefault();
        setIsHoldingSpace(true);
        setIsMuted(false);
        
        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = true;
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isHoldingSpace) {
        e.preventDefault();
        setIsHoldingSpace(false);
        setIsMuted(true);
        
        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = false;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConnected, pushToTalk, isHoldingSpace]);

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

  const requestMicrophoneAccess = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      setAudioPermission('granted');
      return stream;
    } catch (error) {
      console.error('Microphone access denied:', error);
      setAudioPermission('denied');
      onError?.('Microphone access denied. Please allow microphone access to use voice chat.');
      return null;
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      startAudioLevelMonitoring();
    } catch (error) {
      console.error('Audio analyser setup failed:', error);
    }
  };

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      
      const isSpeaking = normalizedLevel > 0.1 && !isMuted;
      
      setParticipants(prev => 
        prev.map(p => 
          p.id === userId 
            ? { ...p, isSpeaking, audioLevel: normalizedLevel }
            : p
        )
      );
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };

  const connectToVoiceChat = async () => {
    if (connecting || isConnected) return;
    
    setConnecting(true);
    try {
      const stream = await requestMicrophoneAccess();
      if (!stream) {
        setConnecting(false);
        return;
      }
      
      localStreamRef.current = stream;
      setupAudioAnalyser(stream);
      
      setParticipants(prev => [...prev, {
        id: userId,
        name: userName,
        isMuted: true,
        isSpeaking: false,
        audioLevel: 0
      }]);
      
      setIsConnected(true);
      setIsMuted(true);
      
    } catch (error) {
      console.error('Voice chat connection failed:', error);
      onError?.('Failed to connect to voice chat');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectFromVoiceChat = () => {
    cleanup();
    setIsConnected(false);
    setParticipants(prev => prev.filter(p => p.id !== userId));
  };

  const toggleMute = () => {
    if (!localStreamRef.current || pushToTalk) return;
    
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = isMuted;
    });
    
    setIsMuted(!isMuted);
    
    setParticipants(prev => 
      prev.map(p => 
        p.id === userId ? { ...p, isMuted: !isMuted } : p
      )
    );
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    microphoneRef.current = null;
  };

  const getParticipantStyle = (participant: Participant) => {
    if (participant.isSpeaking) {
      return 'ring-2 ring-green-400 bg-green-50';
    }
    if (participant.isMuted) {
      return 'bg-gray-100';
    }
    return 'bg-blue-50';
  };

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">🎤 Voice Chat</h3>
        <div className="flex items-center space-x-2">
          {isConnected && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Connected</span>
            </div>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-6">
          {audioPermission === 'denied' ? (
            <div className="space-y-3">
              <div className="text-red-600">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              </div>
              <p className="text-red-600 font-medium">Microphone Access Denied</p>
              <p className="text-sm text-gray-600">Please allow microphone access in your browser settings to use voice chat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-gray-400">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              </div>
              <p className="text-gray-600">Ready to join voice chat</p>
              <button
                onClick={connectToVoiceChat}
                disabled={connecting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Join Voice Chat'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Push-to-Talk Toggle */}
          <div className="flex items-center justify-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={pushToTalk}
                onChange={(e) => setPushToTalk(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Push to Talk</span>
            </label>
          </div>

          {/* Voice Controls */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={toggleMute}
              disabled={pushToTalk}
              className={`p-3 rounded-full transition-colors ${
                pushToTalk 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : isMuted 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={pushToTalk ? 'Push-to-talk enabled' : isMuted ? 'Unmute' : 'Mute'}
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
              onClick={toggleDeafen}
              className={`p-3 rounded-full transition-colors ${
                isDeafened 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              {isDeafened ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 5.586A2 2 0 015 7v6a8 8 0 008 8 8 8 0 008-8V7a2 2 0 01-2-2H7a2 2 0 01-1.414.586zM17 17l-2-2m0 0l-2-2m2 2l-2 2m2-2l2-2"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                </svg>
              )}
            </button>

            <button
              onClick={disconnectFromVoiceChat}
              className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
              title="Leave Voice Chat"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12H8m0 0l4 4m-4-4l4-4m11-1a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          </div>

          {/* Participants List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Participants ({participants.length})</h4>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center space-x-3 p-2 rounded-md transition-all ${getParticipantStyle(participant)}`}
                >
                  <div className="flex-shrink-0">
                    {participant.isMuted ? (
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
                      {participant.name}
                      {participant.id === userId && ' (You)'}
                    </p>
                  </div>
                  
                  {/* Audio Level Indicator */}
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-4 rounded ${
                          participant.audioLevel > (i + 1) * 0.2
                            ? participant.isSpeaking
                              ? 'bg-green-400'
                              : 'bg-gray-300'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Info */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            {pushToTalk ? (
              <p>
                {isHoldingSpace ? (
                  <span className="text-green-600 font-medium">🎤 Speaking (Space held)</span>
                ) : (
                  <>Hold <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Space</kbd> to talk</>
                )}
              </p>
            ) : (
              <p>Voice activation mode</p>
            )}
            <p>Toggle push-to-talk mode above</p>
          </div>
        </div>
      )}
    </div>
  );
}