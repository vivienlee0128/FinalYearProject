// "use client";

import { createContext, ReactNode, useContext, useState } from "react";
interface AuthUser {
  name?: string;
  email?: string;
  student?: string;
  method?: "microsoft" | "credentials";
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (userInfo: AuthUser) => void;
  signOut: () => void;
}

const Auth = createContext<AuthContextType | null>(null);

const AuthProviderComponent = ({ children }: { children: ReactNode }) => {
  console.log("HELLLLLLOOOOOOOOOOOOOOOOOOOOOOOOOO PLEASEEE WORKKKK");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  function signIn(userInfo: AuthUser) {
    setUser(userInfo);
    setIsAuthenticated(true);
  }

  function signOut() {
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <Auth.Provider value={{ isAuthenticated, user, signIn, signOut }}>
      {children}
    </Auth.Provider>
  );
};

export { AuthProviderComponent as AuthProvider };

export function useAuth() {
  const context = useContext(Auth);
  console.log("hello user auth context",context);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}