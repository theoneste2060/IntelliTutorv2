import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/utils/pwa';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
    } else {
      // Hide the indicator after a brief delay when coming back online
      const timer = setTimeout(() => setShowOffline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOffline) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You're offline</span>
          </>
        )}
      </div>
    </div>
  );
}