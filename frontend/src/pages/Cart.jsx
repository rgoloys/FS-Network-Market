import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthTokens, getAccessToken, isUnauthorizedError } from "../api/auth";
import { getCart, removeCartItem, updateCartItem } from "../api/commerce";
import { formatProductPrice, getProductImageUrl } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const Cart = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to continue shopping." },
    });
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/login", {
        state: { message: "Please log in to access your cart." },
      });
      return;
    }

    let isActive = true;

    getCart()
      .then((data) => {
        if (isActive) setCartItems(data);
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }

        if (isActive) setError("Unable to load your cart. Please try again.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [clearSessionAndRedirect, navigate]);

  const cartTotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const price = Number(item.product?.sale_price ?? item.product?.product_price ?? 0);
        return total + price * item.qty;
      }, 0),
    [cartItems],
  );

  const handleUpdateQuantity = async (cartItem, nextQty) => {
    if (nextQty < 1) return;

    setError("");
    setUpdatingItemId(cartItem.id);

    try {
      const updatedItem = await updateCartItem(cartItem.id, nextQty);
      setCartItems((currentItems) =>
        currentItems.map((item) => (item.id === cartItem.id ? updatedItem : item)),
      );
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }

      setError(
        err.response?.data?.error ??
          "Unable to update this item. Please try again.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setError("");
    setUpdatingItemId(cartItemId);

    try {
      await removeCartItem(cartItemId);
      setCartItems((currentItems) =>
        currentItems.filter((item) => item.id !== cartItemId),
      );
    } catch (err) {
      if (isUnauthorizedError(err)) {
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
                  const unitPrice = Number(
                    product?.sale_price ?? product?.product_price ?? 0,
                  );
                  const lineTotal = unitPrice * item.qty;
                  const isUpdating = updatingItemId === item.id;
                  const stockCount = Number(product?.countInStock ?? 0);

                  return (
                    <article
                      className="grid grid-cols-[120px_minmax(0,1fr)_auto] gap-5 rounded-lg border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)] max-[680px]:grid-cols-1"
                      key={item.id}
                    >
                      <div className="flex min-h-[112px] items-center justify-center overflow-hidden rounded-lg bg-[#f2f2f2]">
                        {product?.image ? (
                          <img
                            className="h-full max-h-[112px] w-full object-contain p-2"
                            src={getProductImageUrl(product.image)}
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
                            {product?.brand} / {product?.category}
                          </p>
                          <h2 className="m-0 mt-2 text-2xl font-bold leading-[1.15] text-[#111111]">
                            {product?.product_name}
                          </h2>
                        </div>
                        <p className="m-0 text-base font-semibold text-[#626262]">
                          Unit price: {formatProductPrice(unitPrice)}
                        </p>
                        <p className="m-0 text-sm font-semibold text-[#6f7774]">
                          {stockCount} item(s) available
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
                            disabled={isUpdating || item.qty >= stockCount}
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
                          {formatProductPrice(lineTotal)}
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
                    Subtotal
                  </span>
                  <span className="text-3xl font-bold text-[#111111]">
                    {formatProductPrice(cartTotal)}
                  </span>
                </div>
                <Link
                  className="button-hover mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#141414] px-5 text-sm font-bold leading-none text-white no-underline"
                  to="/checkout"
                >
                  Checkout
                </Link>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </PageLayout>
  );
};

export default Cart;
