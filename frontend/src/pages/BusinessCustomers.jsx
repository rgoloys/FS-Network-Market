import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthTokens, isUnauthorizedError } from "../api/auth";
import { getBusinessCustomers, updateBusinessCustomer } from "../api/business";
import { formatProductPrice } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const BusinessCustomers = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingCustomerId, setUpdatingCustomerId] = useState(null);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to manage customers." },
    });
  }, [navigate, setIsAuthenticated]);

  const loadCustomers = useCallback(() => {
    setIsLoading(true);
    getBusinessCustomers({ search })
      .then((data) => setCustomers(data))
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }
        setError("Unable to load customers.");
      })
      .finally(() => setIsLoading(false));
  }, [clearSessionAndRedirect, search]);

  useEffect(() => {
    const timer = window.setTimeout(loadCustomers, 200);
    return () => window.clearTimeout(timer);
  }, [loadCustomers]);

  const handleStatusToggle = async (customer) => {
    setError("");
    setMessage("");
    setUpdatingCustomerId(customer.id);

    try {
      const updatedCustomer = await updateBusinessCustomer(customer.id, {
        is_active: !customer.is_active,
      });
      setCustomers((currentCustomers) =>
        currentCustomers.map((item) =>
          item.id === customer.id ? updatedCustomer : item,
        ),
      );
      setMessage(
        `${customer.username} ${updatedCustomer.is_active ? "activated" : "deactivated"}.`,
      );
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }
      setError("Unable to update customer status.");
    } finally {
      setUpdatingCustomerId(null);
    }
  };

  return (
    <PageLayout>
      <section className="box-border min-h-[640px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
          <div className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              Customer management
            </span>
            <h1 className="m-0 mt-4 text-[42px] font-bold leading-tight text-[#111111] max-[560px]:text-[32px]">
              Buyers of your products
            </h1>
            <input
              className="mt-5 min-h-[44px] w-full rounded-lg border border-[#d9d9d9] bg-white px-3 text-sm font-semibold text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search username, email, or name"
              value={search}
            />
          </div>

          {message ? (
            <div className="rounded-lg border border-[#bfe6ca] bg-[#f2fff5] px-4 py-3 text-sm font-semibold text-[#1f7a39]">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#9f1d1d]">
              {error}
            </div>
          ) : null}
          {isLoading ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left font-semibold text-[#626262]">
              Loading customers...
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
            {customers.map((customer) => (
              <article
                className="rounded-lg border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]"
                key={customer.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-sm font-bold text-[#638076]">
                      {customer.display_name || customer.full_name || customer.username}
                    </p>
                    <h2 className="m-0 mt-2 text-2xl font-bold text-[#111111]">
                      {customer.username}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase leading-none ${
                      customer.is_active
                        ? "bg-[#e8fff0] text-[#146b31]"
                        : "bg-[#fff5f5] text-[#9f1d1d]"
                    }`}
                  >
                    {customer.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-[#626262]">
                  <span>{customer.email}</span>
                  <span>
                    {customer.city_province || "No city"} /{" "}
                    {customer.country || "No country"}
                  </span>
                  <span>{customer.phone_number || "No phone number"}</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg bg-[#f7f7f7] p-3 text-center">
                  <div>
                    <strong className="block text-lg text-[#111111]">
                      {customer.order_count}
                    </strong>
                    <span className="text-xs font-bold text-[#6f7774]">Orders</span>
                  </div>
                  <div>
                    <strong className="block text-lg text-[#111111]">
                      {customer.review_count}
                    </strong>
                    <span className="text-xs font-bold text-[#6f7774]">Reviews</span>
                  </div>
                  <div>
                    <strong className="block text-lg text-[#111111]">
                      {formatProductPrice(customer.total_spent)}
                    </strong>
                    <span className="text-xs font-bold text-[#6f7774]">
                      Your sales
                    </span>
                  </div>
                </div>
                <button
                  className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-[#d9d9d9] bg-white px-4 text-sm font-bold text-[#141414] disabled:text-[#9a9a9a]"
                  disabled={updatingCustomerId === customer.id}
                  onClick={() => handleStatusToggle(customer)}
                  type="button"
                >
                  {updatingCustomerId === customer.id
                    ? "Updating..."
                    : customer.is_active
                      ? "Deactivate"
                      : "Activate"}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default BusinessCustomers;
