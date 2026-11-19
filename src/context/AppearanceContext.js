import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@oktreat/appearance-mode';
const AppearanceContext = createContext({ dark: false, setDark: async () => {} });

export function AppearanceProvider({ children }) {
  const [dark, setDarkState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => setDarkState(value === 'dark'))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setDark = useCallback(async value => {
    const next = Boolean(value);
    setDarkState(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light'); } catch {}
  }, []);

  const value = useMemo(() => ({ dark, setDark, ready }), [dark, setDark, ready]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
