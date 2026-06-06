import { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import BusinessCustomers from "./pages/BusinessCustomers";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessOrders from "./pages/BusinessOrders";
import BusinessProducts from "./pages/BusinessProducts";
import BusinessReviews from "./pages/BusinessReviews";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import OrderDetails from "./pages/OrderDetails";
import Orders from "./pages/Orders";
import PaymentFailed from "./pages/PaymentFailed";
import PaymentSuccess from "./pages/PaymentSuccess";
import ProductDetails from "./pages/ProductDetails";
import Products from "./pages/Products";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import SuperuserAdmin from "./pages/SuperuserAdmin";
import Wishlist from "./pages/Wishlist";
import Loading from "./components/Loading";
import { AuthContext } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthProvider";
import { BusinessRoute } from "./context/BusinessRoute";
import { PrivateRoute } from "./context/PrivateRoute";

const HomeRoute = () => {
  const { isAuthenticated, isBusinessUser, isLoading, isSuperuser } =
    useContext(AuthContext);

  if (isLoading) return <Loading />;
  if (isSuperuser) return <SuperuserAdmin />;
  if (isBusinessUser) return <BusinessDashboard />;
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
        <Route
          path="/checkout"
          element={
            <PrivateRoute message="Please log in to complete checkout.">
              <Checkout />
            </PrivateRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateRoute message="Please log in to view your orders.">
              <Orders />
            </PrivateRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <PrivateRoute message="Please log in to view your order.">
              <OrderDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <PrivateRoute message="Please log in to view your wishlist.">
              <Wishlist />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/superuser-admin" element={<SuperuserAdmin />} />
        <Route
          path="/business-dashboard"
          element={
            <BusinessRoute>
              <BusinessDashboard />
            </BusinessRoute>
          }
        />
        <Route
          path="/business-dashboard/products"
          element={
            <BusinessRoute>
              <BusinessProducts />
            </BusinessRoute>
          }
        />
        <Route
          path="/business-dashboard/orders"
          element={
            <BusinessRoute>
              <BusinessOrders />
            </BusinessRoute>
          }
        />
        <Route
          path="/business-dashboard/customers"
          element={
            <BusinessRoute>
              <BusinessCustomers />
            </BusinessRoute>
          }
        />
        <Route
          path="/business-dashboard/reviews"
          element={
            <BusinessRoute>
              <BusinessReviews />
            </BusinessRoute>
          }
        />
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
