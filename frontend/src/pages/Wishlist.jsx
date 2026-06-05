import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthTokens, isUnauthorizedError } from "../api/auth";
import { getWishlist, removeWishlistItem } from "../api/commerce";
import { formatProductPrice, getProductImageUrl } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const Wishlist = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [removingProductId, setRemovingProductId] = useState(null);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to view your wishlist." },
    });
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    let isActive = true;

    getWishlist()
      .then((data) => {
        if (isActive) setItems(data);
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }
        if (isActive) setError("Unable to load your wishlist.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [clearSessionAndRedirect]);

  const handleRemove = async (productId) => {
    setError("");
    setRemovingProductId(productId);

    try {
      await removeWishlistItem(productId);
      setItems((currentItems) =>
        currentItems.filter((item) => item.product.id !== productId),
      );
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }
      setError("Unable to remove this product from your wishlist.");
    } finally {
      setRemovingProductId(null);
    }
  };

  return (
    <PageLayout>
      <section className="box-border min-h-[620px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div className="flex flex-col gap-3">
              <span className="inline-flex min-h-[34px] w-fit items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
                Wishlist
              </span>
              <h1 className="m-0 text-[48px] font-bold leading-[1.08] text-[#111111] max-[760px]:text-4xl max-[560px]:text-[32px]">
                Saved products
              </h1>
            </div>
            <Link
              className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-5 text-sm font-bold leading-none text-[#141414] no-underline"
              to="/products"
            >
              Browse products
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-8 text-left text-base font-semibold text-[#626262]">
              Loading wishlist...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {error}
            </div>
          ) : null}

          {!isLoading && items.length === 0 ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-8 text-left">
              <h2 className="m-0 text-2xl font-bold text-[#111111]">
                Your wishlist is empty.
              </h2>
              <p className="m-0 mt-2 text-base leading-[1.65] text-[#626262]">
                Save products from the details page and compare them later.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-4 gap-4 max-[1120px]:grid-cols-3 max-[820px]:grid-cols-2 max-[480px]:grid-cols-1">
            {items.map((item) => {
              const product = item.product;
              const isRemoving = removingProductId === product.id;

              return (
                <article
                  className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#e8e8e8] bg-white text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(17,17,17,0.1)]"
                  key={item.id}
                >
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f4f6f5] p-4">
                    {product.image ? (
                      <img
                        alt={product.product_name}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]"
                        src={getProductImageUrl(product.image)}
                      />
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#89928f]">
                        No image
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#638076]">
                      {product.brand}
                    </span>
                    <h2 className="m-0 line-clamp-2 min-h-[42px] text-[17px] font-bold leading-[1.22] text-[#111111]">
                      {product.product_name}
                    </h2>
                    <span className="text-[17px] font-bold leading-none text-[#141414]">
                      {formatProductPrice(product.sale_price ?? product.product_price)}
                    </span>
                    <div className="mt-auto flex flex-col gap-2">
                      <Link
                        className="button-hover inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d8dedc] bg-white px-4 text-sm font-bold leading-none text-[#141414] no-underline hover:bg-[#f1f6f4]"
                        to={`/products/${product.id}`}
                      >
                        View details
                      </Link>
                      <button
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#f0c9c9] bg-white px-4 text-sm font-bold leading-none text-[#9f1d1d] disabled:cursor-not-allowed disabled:text-[#9a9a9a]"
                        disabled={isRemoving}
                        onClick={() => handleRemove(product.id)}
                        type="button"
                      >
                        {isRemoving ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Wishlist;
