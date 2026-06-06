import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../api/base";
import { clearAuthTokens, getAccessToken, getAuthHeaders } from "../api/auth";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const hasStoredToken = Boolean(getAccessToken());
  const [isAuthenticated, setIsAuthenticatedState] = useState(hasStoredToken);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(hasStoredToken);

  const resetAuth = useCallback(() => {
    clearAuthTokens();
    setCurrentUser(null);
    setIsAuthenticatedState(false);
    setIsLoading(false);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      resetAuth();
      return null;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}me/`, {
        headers: getAuthHeaders(),
      });
      setCurrentUser(response.data);
      setIsAuthenticatedState(true);
      return response.data;
    } catch (error) {
      resetAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [resetAuth]);

  const setIsAuthenticated = useCallback(
    (nextValue) => {
      if (!nextValue) {
        resetAuth();
        return;
      }
      setIsAuthenticatedState(true);
    },
    [resetAuth],
  );

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) return undefined;

    let isActive = true;

    axios
      .get(`${BASE_URL}me/`, { headers: getAuthHeaders() })
      .then((response) => {
        if (!isActive) return;
        setCurrentUser(response.data);
        setIsAuthenticatedState(true);
      })
      .catch(() => {
        if (!isActive) return;
        clearAuthTokens();
        setCurrentUser(null);
        setIsAuthenticatedState(false);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo(() => {
    const role = currentUser?.role ?? null;
    const isSuperuser = Boolean(currentUser?.is_superuser);
    const isBusinessUser = role === "business_admin";
    const isBuyer = role === "buyer";

    return {
      currentUser,
      isAuthenticated,
      isBusinessUser,
      isBuyer,
      isLoading,
      isSuperuser,
      refreshCurrentUser,
      role,
      setIsAuthenticated,
    };
  }, [
    currentUser,
    isAuthenticated,
    isLoading,
    refreshCurrentUser,
    setIsAuthenticated,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
