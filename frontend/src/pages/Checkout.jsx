import axios from "axios";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/base";
import { clearAuthTokens, getAuthHeaders, isUnauthorizedError } from "../api/auth";
import { createOrder, getCart } from "../api/commerce";
import { formatProductPrice } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const EMPTY_SHIPPING = {
  shipping_full_name: "",
  shipping_email: "",
  shipping_phone_number: "",
  shipping_country: "",
  shipping_city_province: "",
  shipping_address: "",
  shipping_postal_code: "",
};

const inputClass =
  "min-h-[46px] w-full rounded-lg border border-[#d9d9d9] bg-white px-3.5 text-sm font-medium text-[#141414] outline-none transition focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10";

const getErrorText = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return getErrorText(data[0], fallback);
  if (data.error) return data.error;
  if (data.stock) return Object.values(data.stock).join(" ");
  if (typeof data === "object") return Object.values(data).flat().join(" ");
  return fallback;
};

const Checkout = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [shipping, setShipping] = useState(EMPTY_SHIPPING);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to complete checkout." },
    });
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      getCart(),
      axios.get(`${BASE_URL}user-profile/`, { headers: getAuthHeaders() }),
    ])
      .then(([cartData, profileResponse]) => {
        if (!isActive) return;

        const profile = profileResponse.data;
        setCartItems(cartData);
        setShipping({
          shipping_full_name:
            profile.full_name || profile.display_name || profile.username || "",
          shipping_email: profile.email || "",
          shipping_phone_number: profile.phone_number || "",
          shipping_country: profile.country || "",
          shipping_city_province: profile.city_province || "",
          shipping_address: profile.address || "",
          shipping_postal_code: profile.postal_code || "",
        });
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }

        if (isActive) setError("Unable to prepare checkout. Please try again.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [clearSessionAndRedirect]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const price = Number(item.product?.sale_price ?? item.product?.product_price ?? 0);
        return total + price * item.qty;
      }, 0),
    [cartItems],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setShipping((currentShipping) => ({
      ...currentShipping,
      [name]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const order = await createOrder(shipping);
      navigate(`/orders/${order.id}`, {
        state: { message: "Order placed successfully." },
      });
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }

      if (err.response?.data && typeof err.response.data === "object") {
        setFieldErrors(err.response.data);
      }
      setError(getErrorText(err.response?.data, "Unable to place this order."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <section className="box-border min-h-[620px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div className="flex flex-col gap-3">
              <span className="inline-flex min-h-[34px] w-fit items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
                Checkout
              </span>
              <h1 className="m-0 text-[48px] font-bold leading-[1.08] text-[#111111] max-[760px]:text-4xl max-[560px]:text-[32px]">
                Confirm your order
              </h1>
            </div>
            <Link
              className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-5 text-sm font-bold leading-none text-[#141414] no-underline"
              to="/cart"
            >
              Back to cart
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-8 text-left text-base font-semibold text-[#626262]">
              Loading checkout...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {error}
            </div>
          ) : null}

          {!isLoading && cartItems.length === 0 ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-8 text-left">
              <h2 className="m-0 text-2xl font-bold text-[#111111]">
                Your cart is empty.
              </h2>
              <Link
                className="button-hover mt-5 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#141414] px-5 text-sm font-bold leading-none text-white no-underline"
                to="/products"
              >
                Browse products
              </Link>
            </div>
          ) : null}

          {!isLoading && cartItems.length > 0 ? (
            <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6 max-[920px]:grid-cols-1">
              <form
                className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]"
                onSubmit={handleSubmit}
              >
                <h2 className="m-0 text-2xl font-bold text-[#111111]">
                  Shipping details
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-4 max-[680px]:grid-cols-1">
                  {[
                    ["shipping_full_name", "Full name", "text"],
                    ["shipping_email", "Email address", "email"],
                    ["shipping_phone_number", "Phone number", "text"],
                    ["shipping_country", "Country", "text"],
                    ["shipping_city_province", "City / province", "text"],
                    ["shipping_postal_code", "ZIP / postal code", "text"],
                  ].map(([name, label, type]) => (
                    <label
                      className="flex flex-col gap-2 text-sm font-bold text-[#333333]"
                      key={name}
                    >
                      {label}
                      <input
                        className={inputClass}
                        name={name}
                        onChange={handleChange}
                        required
                        type={type}
                        value={shipping[name]}
                      />
                      {fieldErrors[name] ? (
                        <span className="text-xs font-semibold text-[#9f1d1d]">
                          {fieldErrors[name]}
                        </span>
                      ) : null}
                    </label>
                  ))}
                  <label className="col-span-2 flex flex-col gap-2 text-sm font-bold text-[#333333] max-[680px]:col-span-1">
                    Address
                    <textarea
                      className={`${inputClass} min-h-[120px] resize-y py-3`}
                      name="shipping_address"
                      onChange={handleChange}
                      required
                      value={shipping.shipping_address}
                    />
                    {fieldErrors.shipping_address ? (
                      <span className="text-xs font-semibold text-[#9f1d1d]">
                        {fieldErrors.shipping_address}
                      </span>
                    ) : null}
                  </label>
                </div>
                <button
                  className="mt-6 inline-flex min-h-[50px] items-center justify-center rounded-lg bg-[#141414] px-6 text-sm font-bold leading-none text-white disabled:cursor-not-allowed disabled:bg-[#767676]"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Placing order..." : "Place order"}
                </button>
              </form>

              <aside className="h-fit rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
                <h2 className="m-0 text-2xl font-bold text-[#111111]">
                  Order summary
                </h2>
                <div className="mt-5 flex flex-col gap-4">
                  {cartItems.map((item) => (
                    <div
                      className="flex items-start justify-between gap-4 border-b border-[#eeeeee] pb-4 last:border-b-0"
                      key={item.id}
                    >
                      <div>
                        <p className="m-0 text-sm font-bold leading-[1.35] text-[#111111]">
                          {item.product?.product_name}
                        </p>
                        <p className="m-0 mt-1 text-xs font-semibold text-[#6f7774]">
                          Qty {item.qty}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[#111111]">
                        {formatProductPrice(
                          Number(
                            item.product?.sale_price ??
                              item.product?.product_price ??
                              0,
                          ) * item.qty,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-[#e8e8e8] pt-5">
                  <span className="text-base font-semibold text-[#626262]">
                    Estimated total
                  </span>
                  <span className="text-3xl font-bold text-[#111111]">
                    {formatProductPrice(subtotal)}
                  </span>
                </div>
                <p className="m-0 mt-3 text-sm leading-[1.55] text-[#626262]">
                  Shipping and tax are calculated by the server when the order is placed.
                </p>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </PageLayout>
  );
};

export default Checkout;
