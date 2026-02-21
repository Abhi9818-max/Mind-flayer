import { useState, useEffect } from 'react';

export function useInstallPrompt() {
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // Build listeners
        const handler = (e: any) => {
            e.preventDefault();
            (window as any).deferredPrompt = e;
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already available
        if ((window as any).deferredPrompt) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsInstallable(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const promptInstall = async () => {
        const prompt = (window as any).deferredPrompt;
        if (prompt) {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstallable(false);
                (window as any).deferredPrompt = null;
            }
        }
    };

    return { isInstallable, promptInstall };
}
