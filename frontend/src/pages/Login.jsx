import axios from "axios";
import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/base";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const { refreshCurrentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const successMessage = location.state?.message;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username").trim();
    const password = formData.get("password");

    try {
      setIsLoading(true);
      const response = await axios.post(`${BASE_URL}api/token/`, {
        username,
        password,
      });

      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      const currentUser = await refreshCurrentUser();

      if (currentUser?.is_superuser) {
        window.location.assign(`${BASE_URL}admin/`);
        return;
      }

      if (currentUser?.role === "business_admin") {
        const destination = location.state?.from?.startsWith(
          "/business-dashboard",
        )
          ? location.state.from
          : "/business-dashboard";
        navigate(destination);
        return;
      }

      const destination = location.state?.from?.startsWith("/business-dashboard")
        ? "/products"
        : location.state?.from ?? "/products";
      navigate(destination);
    } catch (err) {
      const apiMessage =
        err.response?.data?.detail || "Invalid username or password.";
      setError(apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl justify-center px-5 py-14 lg:px-8">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#061947]">
            Sign in
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Welcome back
          </h1>
          {successMessage ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700"
              >
                Email or username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#061947] focus:ring-2 focus:ring-[#061947]/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#061947] focus:ring-2 focus:ring-[#061947]/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#061947] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b255f]"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Need an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#061947] hover:underline"
            >
              Register
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
