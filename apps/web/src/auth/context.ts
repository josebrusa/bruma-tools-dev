import { createContext } from "react";

export type AuthContextValue = {
  apiKey: string | null;
  signIn: (key: string) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
