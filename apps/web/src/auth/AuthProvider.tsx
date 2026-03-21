import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./context";

const STORAGE_KEY = "bruma_admin_api_key";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const signIn = useCallback((key: string) => {
    sessionStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
  }, []);

  const value = useMemo(
    () => ({ apiKey, signIn, signOut }),
    [apiKey, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
