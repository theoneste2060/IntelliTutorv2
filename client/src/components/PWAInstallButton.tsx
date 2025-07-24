import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Smartphone, Monitor, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { usePWA } from "@/utils/pwa";
import { useToast } from "@/hooks/use-toast";

export function PWAInstallButton() {
  const { canInstall, installApp, isOnline } = usePWA();
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  // Debug: log PWA installation state
  console.log('PWA Install Button - canInstall:', canInstall, 'isOnline:', isOnline);

  // Alternative installation method for browsers that don't support beforeinstallprompt
  const handleManualInstall = () => {
    toast({
      title: "Manual Installation",
      description: "In Chrome: Menu > More Tools > Create Shortcut. In Safari: Share > Add to Home Screen.",
    });
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast({
        title: "App Installed!",
        description: "IntelliTutor has been added to your home screen.",
      });
      setShowDialog(false);
    } else {
      toast({
        title: "Installation Failed",
        description: "Please try again or install manually from your browser menu.",
        variant: "destructive",
      });
    }
  };

  // Show button for testing even if canInstall is false
  if (!canInstall) {
    return (
      <Button
        onClick={handleManualInstall}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Install IntelliTutor</span>
            </DialogTitle>
            <DialogDescription>
              Get the full app experience with offline access and faster loading.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-primary" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>Home screen access</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Offline</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Maybe Later
              </Button>
              <Button onClick={handleInstall} className="flex-1">
                Install Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PWAUpdateNotification() {
  const { updateAvailable, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    await updateApp();
    toast({
      title: "Update Applied",
      description: "The app will reload with the latest version.",
    });
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg max-w-sm z-50">
      <div className="flex items-start space-x-3">
        <Download className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-sm">Update Available</p>
          <p className="text-xs opacity-90">A new version of IntelliTutor is ready.</p>
        </div>
      </div>
      <div className="flex space-x-2 mt-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setDismissed(true)}
          className="flex-1 text-xs"
        >
          Later
        </Button>
        <Button
          size="sm"
          onClick={handleUpdate}
          className="flex-1 text-xs bg-white text-primary hover:bg-gray-100"
        >
          Update
        </Button>
      </div>
    </div>
  );
}