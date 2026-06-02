import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import Loading from "../components/Loading";

export const PrivateRoute = ({
  children,
  message = "Please log in to access this page.",
}) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) return <Loading />;
  return isAuthenticated ? (
    children
  ) : (
    <Navigate replace state={{ message }} to="/login" />
  );
};
