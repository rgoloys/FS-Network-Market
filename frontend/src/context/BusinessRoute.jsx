import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import Loading from "../components/Loading";

export const BusinessRoute = ({
  children,
  message = "Please log in with a business account to access the dashboard.",
}) => {
  const { isAuthenticated, isBusinessUser, isLoading, isSuperuser } =
    useContext(AuthContext);
  const location = useLocation();

  if (isLoading) return <Loading />;

  if (!isAuthenticated) {
    return (
      <Navigate replace state={{ from: location.pathname, message }} to="/login" />
    );
  }

  if (isSuperuser) {
    return <Navigate replace to="/superuser-admin" />;
  }

  if (!isBusinessUser) {
    return (
      <Navigate
        replace
        state={{ message: "Business dashboard access is required." }}
        to="/products"
      />
    );
  }

  return children;
};
