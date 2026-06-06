import { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/base";
import marketLogo from "../assets/fs-network-market-logo.svg";
import { AuthContext } from "../context/AuthContext";

const guestNavItems = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Cart", to: "/cart" },
];

const signedInNavItems = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Cart", to: "/cart" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Orders", to: "/orders" },
];

const businessNavItems = [
  { label: "Dashboard", to: "/business-dashboard" },
  { label: "Products", to: "/business-dashboard/products" },
  { label: "Orders", to: "/business-dashboard/orders" },
  { label: "Customers", to: "/business-dashboard/customers" },
  { label: "Reviews", to: "/business-dashboard/reviews" },
];

const superuserNavItems = [
  { external: true, label: "Django admin", to: `${BASE_URL}admin/` },
];

const Header = () => {
  const { isAuthenticated, isBusinessUser, isSuperuser, setIsAuthenticated } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const navItems = isSuperuser
    ? superuserNavItems
    : isBusinessUser
      ? businessNavItems
      : isAuthenticated
        ? signedInNavItems
        : guestNavItems;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <header
      className="box-border flex w-full items-center justify-between gap-8 border-b border-[#ececec] bg-white px-10 py-4 font-sans text-[#141414] max-[1080px]:flex-wrap max-[1080px]:gap-4 max-[960px]:px-7 max-[560px]:px-4 max-[560px]:py-3.5"
      aria-label="Primary navigation"
    >
      <Link
        aria-label="FS Network Market home"
        className="inline-flex shrink-0 items-center no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[4px] focus-visible:outline-[#141414]"
        to="/"
      >
        <img
          alt="FS Network Market"
          className="h-12 w-auto max-[560px]:h-10"
          src={marketLogo}
        />
      </Link>

      <nav
        className="flex flex-1 items-center justify-center gap-8 max-[1080px]:order-3 max-[1080px]:w-full max-[1080px]:justify-start max-[1080px]:gap-6 max-[1080px]:overflow-x-auto max-[1080px]:pb-0.5"
        aria-label="Main menu"
      >
        {navItems.map((item) => (
          item.external ? (
            <a
              className="relative py-1 text-base font-medium leading-[1.2] text-[#5f5f5f] no-underline transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#141414] after:transition-transform after:duration-200 hover:text-[#141414] hover:after:scale-x-100 focus-visible:text-[#141414] focus-visible:after:scale-x-100"
              href={item.to}
              key={item.to}
            >
              {item.label}
            </a>
          ) : (
            <NavLink
              className={({ isActive }) =>
                `relative py-1 text-base font-medium leading-[1.2] no-underline transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:bg-[#141414] after:transition-transform after:duration-200 hover:text-[#141414] hover:after:scale-x-100 focus-visible:text-[#141414] focus-visible:after:scale-x-100 ${
                  isActive
                    ? "text-[#141414] after:scale-x-100"
                    : "text-[#5f5f5f] after:scale-x-0"
                }`
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          )
        ))}
      </nav>

      <div className="flex items-center justify-end gap-3.5 max-[1080px]:ml-auto max-[520px]:gap-3">
        {isAuthenticated ? (
          <>
            {isSuperuser ? (
              <a
                className="whitespace-nowrap px-0.5 py-3 text-[15px] font-semibold leading-none text-[#141414] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#141414] max-[520px]:flex-1"
                href={`${BASE_URL}admin/`}
              >
                Admin
              </a>
            ) : isBusinessUser ? (
              <Link
                className="whitespace-nowrap px-0.5 py-3 text-[15px] font-semibold leading-none text-[#141414] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#141414] max-[520px]:flex-1"
                to="/business-dashboard"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                className="whitespace-nowrap px-0.5 py-3 text-[15px] font-semibold leading-none text-[#141414] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#141414] max-[520px]:flex-1"
                to="/profile"
              >
                Profile
              </Link>
            )}
            <button
              className="whitespace-nowrap rounded-lg border-0 bg-[#141414] px-[22px] py-[15px] text-[15px] font-semibold leading-none text-white shadow-[0_12px_24px_rgba(20,20,20,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#141414] max-[520px]:flex-1"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              className="whitespace-nowrap px-0.5 py-3 text-[15px] font-semibold leading-none text-[#141414] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#141414] max-[520px]:flex-1"
              to="/login"
            >
              Log in
            </Link>
            <Link
              className="button-hover whitespace-nowrap rounded-lg bg-[#141414] px-[22px] py-[15px] text-[15px] font-semibold leading-none text-white no-underline shadow-[0_12px_24px_rgba(20,20,20,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#141414] max-[520px]:flex-1"
              to="/register"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
