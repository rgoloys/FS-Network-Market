import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import Loading from "../components/Loading";

export const PrivateRoute = ({
  children,
  message = "Please log in to access this page.",
}) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) return <Loading />;
  return isAuthenticated ? (
    children
  ) : (
    <Navigate replace state={{ from: location.pathname, message }} to="/login" />
  );
};
