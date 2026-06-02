import { useState } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("accessToken")),
  );

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, isLoading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
};
