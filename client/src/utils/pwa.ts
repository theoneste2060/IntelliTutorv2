// PWA Installation and Service Worker utilities

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializeServiceWorker();
    this.setupInstallPrompt();
    this.checkIfInstalled();
  }

  // Register service worker
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        this.serviceWorkerRegistration = registration;

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.showUpdateAvailable();
              }
            });
          }
        });

        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Setup install prompt handling
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallButton();
      console.log('PWA was installed');
    });

    // Debug PWA installation criteria
    if ('serviceWorker' in navigator) {
      console.log('Service Worker supported');
    }
    
    // Check if running on localhost or HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('PWA requires HTTPS or localhost');
    }

    // Additional PWA criteria debugging
    console.log('PWA Debug Info:', {
      hasServiceWorker: 'serviceWorker' in navigator,
      isSecure: location.protocol === 'https:' || location.hostname === 'localhost',
      currentProtocol: location.protocol,
      hostname: location.hostname,
      userAgent: navigator.userAgent,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches
    });

    // Check PWA readiness after a delay
    setTimeout(() => {
      console.log('PWA Readiness Check:', {
        manifestExists: !!document.querySelector('link[rel="manifest"]'),
        swRegistered: !!this.serviceWorkerRegistration,
        hasPrompt: !!this.deferredPrompt
      });
    }, 2000);
  }

  // Check if app is already installed
  private checkIfInstalled() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }

    // Check for iOS Safari standalone mode
    if ((navigator as any).standalone === true) {
      this.isInstalled = true;
    }
  }

  // Show install button
  private showInstallButton() {
    const event = new CustomEvent('pwa-install-available');
    window.dispatchEvent(event);
  }

  // Hide install button
  private hideInstallButton() {
    const event = new CustomEvent('pwa-install-completed');
    window.dispatchEvent(event);
  }

  // Show update available notification
  private showUpdateAvailable() {
    const event = new CustomEvent('pwa-update-available');
    window.dispatchEvent(event);
  }

  // Public methods
  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.deferredPrompt = null;
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during app installation:', error);
      return false;
    }
  }

  public async updateServiceWorker(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.update();
        // Force refresh to use new service worker
        window.location.reload();
      } catch (error) {
        console.error('Error updating service worker:', error);
      }
    }
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // Offline detection
  public isOnline(): boolean {
    return navigator.onLine;
  }

  public setupOfflineDetection(
    onOnline: () => void,
    onOffline: () => void
  ): void {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  }

  // Background sync for offline actions
  public async scheduleBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Type assertion for background sync API
        await (registration as any).sync.register(tag);
        console.log('Background sync scheduled:', tag);
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    }
  }

  // Store data for offline use
  public storeOfflineData(key: string, data: any): void {
    try {
      localStorage.setItem(`intellitutor_offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  public getOfflineData(key: string, maxAge: number = 24 * 60 * 60 * 1000): any {
    try {
      const stored = localStorage.getItem(`intellitutor_offline_${key}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < maxAge) {
          return data;
        }
        // Remove expired data
        localStorage.removeItem(`intellitutor_offline_${key}`);
      }
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
    }
    return null;
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// React hook for PWA functionality
export function usePWA() {
  const [canInstall, setCanInstall] = useState(pwaManager.canInstall());
  const [isInstalled, setIsInstalled] = useState(pwaManager.isAppInstalled());
  const [isOnline, setIsOnline] = useState(pwaManager.isOnline());
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleInstallAvailable = () => setCanInstall(true);
    const handleInstallCompleted = () => {
      setCanInstall(false);
      setIsInstalled(true);
    };
    const handleUpdateAvailable = () => setUpdateAvailable(true);

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    pwaManager.setupOfflineDetection(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  return {
    canInstall,
    isInstalled,
    isOnline,
    updateAvailable,
    installApp: () => pwaManager.installApp(),
    updateApp: () => pwaManager.updateServiceWorker(),
    storeOfflineData: (key: string, data: any) => pwaManager.storeOfflineData(key, data),
    getOfflineData: (key: string, maxAge?: number) => pwaManager.getOfflineData(key, maxAge)
  };
}

import { useState, useEffect } from 'react';