'use client';

import { useEffect, useRef } from 'react';

interface UseOnlineStatusProps {
  sessionId: string;
  userId: string;
  enabled: boolean;
}

export function useOnlineStatus({ sessionId, userId, enabled }: UseOnlineStatusProps) {
  const statusIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isOnlineRef = useRef(true);
  const lastActivityRef = useRef(Date.now());

  const updateStatus = async (isOnline: boolean) => {
    if (!enabled || !sessionId || !userId) return;

    try {
      await fetch(`/api/sessions/${sessionId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline }),
        credentials: 'include'
      });
      
      isOnlineRef.current = isOnline;
      console.log(`Status updated to: ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.warn('Failed to update status:', error);
    }
  };

  const setOnline = () => {
    lastActivityRef.current = Date.now();
    if (!isOnlineRef.current) {
      updateStatus(true);
    }
  };

  const setOffline = () => {
    if (isOnlineRef.current) {
      updateStatus(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    console.log('Setting up online status tracking for session:', sessionId);

    // Set initial online status
    updateStatus(true);

    // Update status every 30 seconds
    statusIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      // If no activity for 5 minutes, consider offline (more lenient for tab switching)
      if (timeSinceActivity > 300000) { // 5 minutes
        console.log('No activity for 5 minutes, setting offline');
        setOffline();
      } else {
        updateStatus(true);
      }
    }, 30000);

    // Handle page visibility changes (but don't immediately go offline on tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden - but staying online (might be tab switch)');
        // Don't immediately set offline - user might just switch tabs
        // Only set offline if they don't come back within a reasonable time
      } else {
        console.log('Page visible, ensuring online status');
        setOnline();
      }
    };

    // Handle page unload (user navigates away or closes tab)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('Page unloading (navigation or close), setting offline');
      
      // Use sendBeacon for reliable delivery during page unload
      if (navigator.sendBeacon) {
        const data = new FormData();
        data.append('isOnline', 'false');
        navigator.sendBeacon(`/api/sessions/${sessionId}/status`, data);
      } else {
        // Fallback for browsers without sendBeacon
        updateStatus(false);
      }
    };

    // Handle navigation within the app (Next.js router)
    const handleRouteChange = () => {
      console.log('Route changing, setting offline');
      updateStatus(false);
    };

    // Handle focus/blur events (more conservative approach)
    const handleFocus = () => {
      console.log('Window focused, ensuring online status');
      setOnline();
    };

    const handleBlur = () => {
      console.log('Window blurred - staying online (might be alt-tab)');
      // Don't set offline on blur - user might just be alt-tabbing
    };

    // Mouse/keyboard activity tracking
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isOnlineRef.current) {
        setOnline();
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('click', handleActivity);
    
    // Listen for route changes (Next.js specific)
    if (typeof window !== 'undefined' && (window as any).next?.router) {
      (window as any).next.router.events.on('routeChangeStart', handleRouteChange);
    }

    // Cleanup
    return () => {
      console.log('Cleaning up online status tracking');
      
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }

      // Set offline when component unmounts
      updateStatus(false);

      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('click', handleActivity);
      
      // Remove Next.js route listeners
      if (typeof window !== 'undefined' && (window as any).next?.router) {
        (window as any).next.router.events.off('routeChangeStart', handleRouteChange);
      }
    };
  }, [sessionId, userId, enabled]);

  return {
    setOnline,
    setOffline,
    updateStatus
  };
}
