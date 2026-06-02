import axios from "axios";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/base";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return `${BASE_URL.slice(0, -1)}${image}`;
  return `${BASE_URL}${image}`;
};

const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

const formatPrice = (value) => {
  const price = Number(value ?? 0);
  return price.toFixed(2);
};

const Cart = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const clearSessionAndRedirect = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    navigate("/login");
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      navigate("/login");
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await axios.get(`${BASE_URL}cart/`, {
          headers: getAuthHeaders(),
        });
        setCartItems(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          clearSessionAndRedirect();
          return;
        }

        setError("Unable to load your cart. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [clearSessionAndRedirect, navigate]);

  const cartTotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        return total + Number(item.product?.product_price ?? 0) * item.qty;
      }, 0),
    [cartItems],
  );

  const handleUpdateQuantity = async (cartItem, nextQty) => {
    if (nextQty < 1) return;

    setError("");
    setUpdatingItemId(cartItem.id);

    try {
      const response = await axios.patch(
        `${BASE_URL}cart/update/${cartItem.id}/`,
        { qty: nextQty },
        { headers: getAuthHeaders() },
      );

      setCartItems((currentItems) =>
        currentItems.map((item) =>
          item.id === cartItem.id ? response.data : item,
        ),
      );
    } catch (err) {
      if (err.response?.status === 401) {
        clearSessionAndRedirect();
        return;
      }

      setError("Unable to update this item. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setError("");
    setUpdatingItemId(cartItemId);

    try {
      await axios.delete(`${BASE_URL}cart/remove/${cartItemId}/`, {
        headers: getAuthHeaders(),
      });

      setCartItems((currentItems) =>
        currentItems.filter((item) => item.id !== cartItemId),
      );
    } catch (err) {
      if (err.response?.status === 401) {
        clearSessionAndRedirect();
        return;
      }

      setError("Unable to remove this item. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <PageLayout>
      <section className="box-border min-h-[620px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div className="flex flex-col gap-3">
              <span className="inline-flex min-h-[34px] w-fit items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
                Cart
              </span>
              <h1 className="m-0 text-[48px] font-bold leading-[1.08] tracking-normal text-[#111111] max-[760px]:text-4xl max-[560px]:text-[32px]">
                Your cart
              </h1>
            </div>
            <Link
              className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-5 text-sm font-bold leading-none text-[#141414] no-underline"
              to="/products"
            >
              Continue shopping
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-8 text-left text-base font-semibold text-[#626262]">
              Loading cart...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {error}
            </div>
          ) : null}

          {!isLoading && cartItems.length === 0 ? (
            <div className="flex flex-col items-start gap-5 rounded-lg border border-[#e8e8e8] bg-white p-8 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
              <h2 className="m-0 text-2xl font-bold text-[#111111]">
                Your cart is empty.
              </h2>
              <p className="m-0 max-w-[560px] text-base leading-[1.65] text-[#626262]">
                Add products from the product details page and they will appear
                here.
              </p>
              <Link
                className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#141414] px-5 text-sm font-bold leading-none text-white no-underline"
                to="/products"
              >
                Browse products
              </Link>
            </div>
          ) : null}

          {cartItems.length > 0 ? (
            <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 max-[920px]:grid-cols-1">
              <div className="flex flex-col gap-4">
                {cartItems.map((item) => {
                  const product = item.product;
                  const unitPrice = Number(product?.product_price ?? 0);
                  const lineTotal = unitPrice * item.qty;
                  const isUpdating = updatingItemId === item.id;

                  return (
                    <article
                      className="grid grid-cols-[120px_minmax(0,1fr)_auto] gap-5 rounded-lg border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)] max-[680px]:grid-cols-1"
                      key={item.id}
                    >
                      <div className="flex min-h-[112px] items-center justify-center overflow-hidden rounded-lg bg-[#f2f2f2]">
                        {product?.image ? (
                          <img
                            className="h-full max-h-[112px] w-full object-cover"
                            src={getImageUrl(product.image)}
                            alt={product.product_name}
                          />
                        ) : (
                          <span className="text-sm font-semibold text-[#7a7a7a]">
                            No image
                          </span>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-col gap-3">
                        <div>
                          <p className="m-0 text-sm font-semibold leading-none text-[#6b6b6b]">
                            {product?.brand}
                          </p>
                          <h2 className="m-0 mt-2 text-2xl font-bold leading-[1.15] text-[#111111]">
                            {product?.product_name}
                          </h2>
                        </div>
                        <p className="m-0 text-base font-semibold text-[#626262]">
                          Unit price: {formatPrice(unitPrice)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-[#d9d9d9] bg-white text-lg font-bold text-[#141414] disabled:cursor-not-allowed disabled:text-[#9a9a9a]"
                            disabled={isUpdating || item.qty <= 1}
                            onClick={() =>
                              handleUpdateQuantity(item, item.qty - 1)
                            }
                            type="button"
                          >
                            -
                          </button>
                          <span className="inline-flex min-h-10 min-w-12 items-center justify-center rounded-lg bg-[#f7f7f7] px-3 text-base font-bold text-[#141414]">
                            {item.qty}
                          </span>
                          <button
                            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-[#d9d9d9] bg-white text-lg font-bold text-[#141414] disabled:cursor-not-allowed disabled:text-[#9a9a9a]"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateQuantity(item, item.qty + 1)
                            }
                            type="button"
                          >
                            +
                          </button>
                          <button
                            className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-[#f0c9c9] bg-white px-4 text-sm font-bold text-[#9f1d1d] disabled:cursor-not-allowed disabled:text-[#9a9a9a]"
                            disabled={isUpdating}
                            onClick={() => handleRemoveItem(item.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-4 max-[680px]:items-start">
                        <span className="text-sm font-semibold text-[#6b6b6b]">
                          Line total
                        </span>
                        <span className="text-2xl font-bold text-[#111111]">
                          {formatPrice(lineTotal)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="h-fit rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
                <h2 className="m-0 text-2xl font-bold text-[#111111]">
                  Summary
                </h2>
                <div className="mt-6 flex items-center justify-between border-t border-[#e8e8e8] pt-5">
                  <span className="text-base font-semibold text-[#626262]">
                    Total
                  </span>
                  <span className="text-3xl font-bold text-[#111111]">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </PageLayout>
  );
};

export default Cart;
