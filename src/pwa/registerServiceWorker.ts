export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting) {
        window.dispatchEvent(new Event('flowforge:pwa-update-ready'));
      }

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) {
          return;
        }

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new Event('flowforge:pwa-update-ready'));
          }
        });
      });
    }).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}