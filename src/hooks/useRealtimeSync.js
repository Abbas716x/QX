import { useState, useEffect, useRef, useCallback } from 'react';
import { loadTenantState, saveTenantState } from '../lib/db/turso';

/**
 * Real-Time Cloud Synchronization Hook (Zero-LocalStorage)
 * Keeps POS state synchronized with Turso Cloud via HTTP pipeline
 */
export function useRealtimeSync(tenantId, initialState, onRemoteUpdate) {
  const [syncStatus, setSyncStatus] = useState('connected'); // 'connected' | 'syncing' | 'saving' | 'error'
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const lastCloudTimestampRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const pendingSaveDataRef = useRef(null);

  // Push updates to cloud with debounce
  const pushState = useCallback((stateData, immediate = false) => {
    if (!tenantId || !stateData) return;

    if (immediate) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      executePush(stateData);
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      executePush(stateData);
    }, 400); // 400ms debounce
  }, [tenantId]);

  const executePush = async (stateData) => {
    if (!tenantId) return;

    if (isSavingRef.current) {
      pendingSaveDataRef.current = stateData;
      return;
    }

    isSavingRef.current = true;
    setSyncStatus('saving');

    try {
      const ts = await saveTenantState(tenantId, stateData);
      lastCloudTimestampRef.current = ts;
      setSyncStatus('connected');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("[Sync Push Error]", err);
      setSyncStatus('error');
    } finally {
      isSavingRef.current = false;
      if (pendingSaveDataRef.current) {
        const next = pendingSaveDataRef.current;
        pendingSaveDataRef.current = null;
        executePush(next);
      }
    }
  };

  // Poll for remote cloud updates
  const pollCloud = useCallback(async () => {
    if (!tenantId || isSavingRef.current || pendingSaveDataRef.current) return;

    try {
      const { data, updatedAt } = await loadTenantState(tenantId);
      if (data && updatedAt > lastCloudTimestampRef.current) {
        lastCloudTimestampRef.current = updatedAt;
        if (onRemoteUpdate) {
          onRemoteUpdate(data);
        }
        setSyncStatus('connected');
        setLastSyncedAt(new Date());
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, [tenantId, onRemoteUpdate]);

  // Periodic polling interval & window focus sync
  useEffect(() => {
    if (!tenantId) return;

    // Initial load
    pollCloud();

    const interval = setInterval(pollCloud, 5000);

    const onFocus = () => pollCloud();
    const onVisibility = () => {
      if (!document.hidden) pollCloud();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [tenantId, pollCloud]);

  return {
    syncStatus,
    lastSyncedAt,
    pushState,
    manualSync: pollCloud
  };
}
