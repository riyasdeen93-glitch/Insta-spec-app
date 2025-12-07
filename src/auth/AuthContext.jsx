import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getBetaUser, recordSuccessfulLogin } from "./betaAccess";

const STORAGE_KEY = "instaspec:user";

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const logoutTimerRef = useRef(null);
  const toUserState = useCallback((record) => {
    if (!record?.email) return null;
    const normalizedEmail = record.email.trim().toLowerCase();
    if (!normalizedEmail) return null;
    const plan = record.plan || (record.isAdmin ? "beta_admin" : "beta_tester");
    return {
      email: normalizedEmail,
      plan,
      isAdmin:
        typeof record.isAdmin === "boolean" ? record.isAdmin : plan === "beta_admin",
      expiresAt: typeof record.expiresAt === "number" ? record.expiresAt : null
    };
  }, []);

  const refreshFromServer = useCallback(
    async (email) => {
      const normalized = (email || "").trim().toLowerCase();
      if (!normalized) return null;
      try {
        const latest = await getBetaUser(normalized);
        if (!latest || (latest.expiresAt && latest.expiresAt <= Date.now())) {
          setUser(null);
          return null;
        }
        const mapped = toUserState({ ...latest, email: normalized });
        if (!mapped) {
          setUser(null);
          return null;
        }
        setUser((prev) => {
          if (
            prev &&
            prev.email === mapped.email &&
            prev.plan === mapped.plan &&
            prev.isAdmin === mapped.isAdmin &&
            prev.expiresAt === mapped.expiresAt
          ) {
            return prev;
          }
          return mapped;
        });
        return mapped;
      } catch (err) {
        console.warn("Failed to verify beta session", err);
        return null;
      }
    },
    [toUserState]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (!user || !user.expiresAt) return;

    const msLeft = user.expiresAt - Date.now();
    if (msLeft <= 0) {
      setUser(null);
      return;
    }
    logoutTimerRef.current = setTimeout(() => {
      setUser(null);
    }, msLeft);

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (!user?.email) return undefined;
    refreshFromServer(user.email);
  }, [user?.email, refreshFromServer]);

  const login = useCallback(
    (userRecord) => {
      const mapped = toUserState(userRecord);
      if (!mapped) return;
      setUser(mapped);
      recordSuccessfulLogin(mapped.email, mapped.isAdmin);
    },
    [toUserState]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
