import { useState, useEffect, useCallback } from 'react';

export function useScreenShareDetection() {
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const checkScreenShare = useCallback(() => {
    // Method 1: Check if the document is being captured
    // The Screen Capture API sets document.visibilityState and other hints
    
    // Method 2: Detect display-capture via permissions API
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'display-capture' as PermissionName })
        .then(status => {
          if (status.state === 'granted') {
            setIsScreenSharing(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Method 3: Monitor getDisplayMedia calls by overriding
    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
    
    if (navigator.mediaDevices && originalGetDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = async function(...args) {
        setIsScreenSharing(true);
        const stream = await originalGetDisplayMedia.apply(this, args);
        
        // When screen share stops
        stream.getVideoTracks().forEach(track => {
          track.addEventListener('ended', () => {
            setIsScreenSharing(false);
          });
        });
        
        return stream;
      };
    }

    // Method 4: Check for known screen share indicators
    // Monitor window focus changes that might indicate screen sharing setup
    const handleVisibility = () => {
      // When tab becomes visible after being hidden, could indicate screen share selection
      checkScreenShare();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    // Method 5: Detect via CSS media queries for forced-colors or similar
    // Some screen sharing tools modify rendering
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = () => checkScreenShare();
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      mediaQuery.removeEventListener('change', handleMediaChange);
      if (navigator.mediaDevices && originalGetDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [checkScreenShare]);

  return { isScreenSharing, setIsScreenSharing };
}
