"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface UserData {
  id?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  title?: string;
  role?: string;
  profile_completed?: boolean;
  release_seen?: boolean;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isReady: boolean;
  setUser: (user: UserData | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsReady: (ready: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: UserData | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(!!initialUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isReady,
        setUser,
        setIsLoading,
        setIsReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
