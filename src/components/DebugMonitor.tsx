import { useEffect } from 'react';

const DebugMonitor = () => {
  useEffect(() => {
    // Monitor de Performance API para detectar navegação lenta
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const nav = entry as PerformanceNavigationTiming;
          console.log('🚀 Performance Navigation:', {
            loadTime: nav.loadEventEnd - nav.loadEventStart,
            domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });

    // Monitor de conexão de rede
    const handleOnline = () => console.log('🌐 Conexão online:', new Date().toISOString());
    const handleOffline = () => console.log('📶 Conexão offline:', new Date().toISOString());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor de mudanças de URL
    let currentUrl = window.location.href;
    const urlChangeObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        console.log('🧭 URL mudou:', {
          from: currentUrl,
          to: window.location.href,
          timestamp: new Date().toISOString()
        });
        currentUrl = window.location.href;
      }
    });

    urlChangeObserver.observe(document, { subtree: true, childList: true });

    // Monitor de erros globais
    const handleError = (event: ErrorEvent) => {
      console.error('💥 Erro global capturado:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚫 Promise rejeitada não tratada:', {
        reason: event.reason,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      observer.disconnect();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      urlChangeObserver.disconnect();
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // Componente invisível apenas para debug
};

export default DebugMonitor;