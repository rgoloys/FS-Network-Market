import { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ProductDetails from "./pages/ProductDetails";
import Products from "./pages/Products";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Loading from "./components/Loading";
import { AuthContext } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthProvider";
import { PrivateRoute } from "./context/PrivateRoute";

const HomeRoute = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) return <Loading />;
  return isAuthenticated ? <Home /> : <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route
          path="/cart"
          element={
            <PrivateRoute message="Please log in to access your cart.">
              <Cart />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<HomeRoute />} />
      </Routes>
    </AuthProvider>
  );
}
export default App;
