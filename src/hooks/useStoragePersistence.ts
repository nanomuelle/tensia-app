import { useState, useEffect, useCallback } from 'react';

export interface PersistenceMessage {
  text: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

export function useStoragePersistence() {
  const [isPersistent, setIsPersistent] = useState<boolean | null>(null);
  const [isRequestingPersistence, setIsRequestingPersistence] = useState(false);
  const [persistenceMessage, setPersistenceMessage] = useState<PersistenceMessage | null>(null);
  const [isStorageDismissed, setIsStorageDismissed] = useState<boolean>(() => {
    return localStorage.getItem('tensia_dismiss_persistence_banner') === 'true';
  });

  useEffect(() => {
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setIsPersistent).catch(() => {});
    }
  }, []);

  const handleRequestPersistence = useCallback(async () => {
    setIsRequestingPersistence(true);
    setPersistenceMessage(null);
    try {
      if (!navigator.storage?.persist) {
        setPersistenceMessage({
          text: 'La función de almacenamiento persistente no es compatible con este navegador.',
          type: 'info',
        });
        setIsRequestingPersistence(false);
        return;
      }
      const granted = await navigator.storage.persist();
      setIsPersistent(granted);
      if (granted) {
        setPersistenceMessage({
          text: 'El almacenamiento persistente está activado correctamente.',
          type: 'success',
        });
      } else {
        setPersistenceMessage({
          text: 'El navegador rechazó la solicitud de almacenamiento persistente. Sus lecturas siguen guardándose localmente, pero podrían eliminarse si el navegador necesita liberar espacio.',
          type: 'warning',
        });
      }
    } catch (err) {
      setPersistenceMessage({
        text: 'No se pudo completar la solicitud de almacenamiento persistente.',
        type: 'error',
      });
    } finally {
      setIsRequestingPersistence(false);
    }
  }, []);

  const dismissBanner = useCallback(() => {
    setIsStorageDismissed(true);
    localStorage.setItem('tensia_dismiss_persistence_banner', 'true');
  }, []);

  return {
    isPersistent,
    setIsPersistent,
    isRequestingPersistence,
    persistenceMessage,
    setPersistenceMessage,
    isStorageDismissed,
    setIsStorageDismissed,
    handleRequestPersistence,
    dismissBanner,
  };
}

export default useStoragePersistence;
