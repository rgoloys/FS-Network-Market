import { useContext } from "react";
import { Link } from "react-router-dom";
import marketLogo from "../assets/fs-network-market-logo.svg";
import { AuthContext } from "../context/AuthContext";

const socialLinks = ["X", "In", "Fb"];

const Footer = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const accountLinks = isAuthenticated
    ? [
        { label: "Profile", to: "/profile" },
        { label: "Wishlist", to: "/wishlist" },
        { label: "Orders", to: "/orders" },
        { label: "Cart", to: "/cart" },
      ]
    : [
        { label: "Log in", to: "/login" },
        { label: "Register", to: "/register" },
        { label: "Cart", to: "/cart" },
      ];

  return (
    <footer className="box-border w-full bg-[#111111] px-16 pb-8 pt-16 font-sans text-white max-[960px]:px-7 max-[960px]:pt-14 max-[560px]:px-4 max-[560px]:pb-6 max-[560px]:pt-12">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-12">
        <div className="grid grid-cols-[minmax(260px,1.2fr)_minmax(0,1.8fr)] gap-14 max-[880px]:grid-cols-1 max-[560px]:gap-10">
          <div className="flex max-w-[430px] flex-col items-start gap-6 text-left">
            <Link
              aria-label="FS Network Market home"
              className="inline-flex rounded-lg bg-white p-2 no-underline transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(0,0,0,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[4px] focus-visible:outline-white"
              to="/"
            >
              <img
                alt="FS Network Market"
                className="h-12 w-auto max-[560px]:h-10"
                src={marketLogo}
              />
            </Link>
          </div>
          <div className="flex flex-col gap-6 text-left">
            <p className="m-0 text-base font-normal leading-[1.7] text-white/65">
              Compare dependable switches, routers, firewalls, and access
              points for every network deployment.
            </p>
            <nav
              aria-label="Footer account links"
              className="flex flex-wrap items-center gap-3"
            >
              {accountLinks.map((link) => (
                <Link
                  className="button-hover inline-flex min-h-10 items-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold leading-none text-white no-underline hover:bg-white/15"
                  key={link.to}
                  to={link.to}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 border-t border-white/10 pt-7 max-[680px]:flex-col max-[680px]:items-start">
          <p className="m-0 text-sm font-medium leading-none text-white/50">
            {"\u00a9"} 2026 FS Network Market. All rights reserved.
          </p>

          <div className="flex items-center gap-3" aria-label="Social links">
            {socialLinks.map((item) => (
              <a
                className="inline-grid size-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold leading-none text-white no-underline transition-colors duration-200 hover:bg-white/15 focus-visible:bg-white/15"
                href={`#${item.toLowerCase()}`}
                key={item}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
