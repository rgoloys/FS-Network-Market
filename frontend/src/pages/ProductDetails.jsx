import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  clearAuthTokens,
  getAccessToken,
  isUnauthorizedError,
} from "../api/auth";
import {
  addCartItem,
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
} from "../api/commerce";
import {
  formatProductPrice,
  getProductById,
  getProductImageUrl,
  getProductReviews,
  submitProductReview,
} from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const EMPTY_REVIEWS = {
  reviews: [],
  average_rating: 0,
  review_count: 0,
  can_review: false,
  has_reviewed: false,
};

const ProductDetails = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState(EMPTY_REVIEWS);
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [productError, setProductError] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to continue shopping." },
    });
  }, [navigate, setIsAuthenticated]);

  const redirectForLogin = (loginMessage) => {
    navigate("/login", {
      state: { from: location.pathname, message: loginMessage },
    });
  };

  const loadReviews = useCallback(() => {
    setIsLoadingReviews(true);
    getProductReviews(id)
      .then((data) => setReviews(data))
      .catch(() => setReviews(EMPTY_REVIEWS))
      .finally(() => setIsLoadingReviews(false));
  }, [id]);

  useEffect(() => {
    let isActive = true;

    getProductById(id)
      .then((productData) => {
        if (isActive) setProduct(productData);
      })
      .catch(() => {
        if (isActive) setProductError("Product not found");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    let isActive = true;

    getProductReviews(id)
      .then((data) => {
        if (isActive) setReviews(data);
      })
      .catch(() => {
        if (isActive) setReviews(EMPTY_REVIEWS);
      })
      .finally(() => {
        if (isActive) setIsLoadingReviews(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!getAccessToken()) return undefined;

    let isActive = true;

    getWishlist()
      .then((items) => {
        if (isActive) {
          setIsWishlisted(
            items.some((item) => String(item.product.id) === String(id)),
          );
        }
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) clearSessionAndRedirect();
      });

    return () => {
      isActive = false;
    };
  }, [clearSessionAndRedirect, id]);

  const handleAddToCart = async () => {
    if (!getAccessToken()) {
      redirectForLogin("Please log in to add products to your cart.");
      return;
    }

    setCartMessage("");
    setError("");
    setIsAddingToCart(true);

    try {
      await addCartItem(product.id, 1);
      setCartMessage("Product added to cart.");
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }

      setError(
        err.response?.data?.error ??
          "Unable to add this product to your cart. Please try again.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!getAccessToken()) {
      redirectForLogin("Please log in to save products to your wishlist.");
      return;
    }

    setMessage("");
    setError("");
    setIsUpdatingWishlist(true);

    try {
      if (isWishlisted) {
        await removeWishlistItem(product.id);
        setIsWishlisted(false);
        setMessage("Product removed from wishlist.");
      } else {
        await addWishlistItem(product.id);
        setIsWishlisted(true);
        setMessage("Product saved to wishlist.");
      }
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }

      setError("Unable to update your wishlist. Please try again.");
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!getAccessToken()) {
      redirectForLogin("Please log in to review this product.");
      return;
    }

    setMessage("");
    setError("");
    setIsSubmittingReview(true);

    try {
      await submitProductReview(id, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviewForm({ rating: "5", comment: "" });
      setMessage("Review submitted.");
      loadReviews();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }

      setError(
        err.response?.data?.error ??
          err.response?.data?.rating ??
          "Unable to submit your review.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <section className="box-border min-h-[520px] w-full bg-white px-16 py-20 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
          <div className="mx-auto flex max-w-[760px] flex-col items-start gap-5 text-left">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              Loading
            </span>
            <h1 className="m-0 text-[44px] font-bold leading-[1.1] text-[#111111] max-[560px]:text-[32px]">
              Loading product details...
            </h1>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (!product || productError) {
    return (
      <PageLayout>
        <section className="box-border min-h-[520px] w-full bg-white px-16 py-20 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
          <div className="mx-auto flex max-w-[760px] flex-col items-start gap-5 text-left">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              Product not found
            </span>
            <h1 className="m-0 text-[44px] font-bold leading-[1.1] text-[#111111] max-[560px]:text-[32px]">
              We could not find that product.
            </h1>
            <p className="m-0 text-lg leading-[1.65] text-[#626262] max-[560px]:text-base">
              The product may have moved or the link may be incorrect.
            </p>
            <Link
              className="button-hover inline-flex min-h-[52px] items-center justify-center rounded-lg bg-[#141414] px-6 text-base font-bold leading-none text-white no-underline"
              to="/products"
            >
              Back to products
            </Link>
          </div>
        </section>
      </PageLayout>
    );
  }

  const productName = product.product_name ?? product.name;
  const hasDiscount = Number(product.discount_percent) > 0;
  const productPrice = formatProductPrice(
    hasDiscount ? product.sale_price : product.product_price,
  );
  const productImage = getProductImageUrl(product.image);
  const isOutOfStock = Number(product.countInStock) <= 0;

  return (
    <PageLayout>
      <section className="box-border grid w-full grid-cols-[minmax(0,1fr)_minmax(320px,520px)] items-center gap-14 bg-white px-16 py-20 font-sans text-[#141414] max-[960px]:grid-cols-1 max-[960px]:px-7 max-[560px]:px-4">
        <div className="flex flex-col items-start gap-6 text-left">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              {product.brand}
            </span>
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              {product.category}
            </span>
          </div>
          <h1 className="m-0 max-w-[620px] text-[56px] font-bold leading-[1.05] tracking-normal text-[#111111] max-[960px]:text-[44px] max-[560px]:text-[34px]">
            {productName}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-[46px] items-center rounded-lg bg-[#141414] px-5 text-xl font-bold leading-none text-white">
              {productPrice}
            </span>
            {hasDiscount ? (
              <span className="text-base font-semibold text-[#8a8a8a] line-through">
                {formatProductPrice(product.product_price)}
              </span>
            ) : null}
            <span className="text-sm font-bold text-[#68716e]">
              {Number(reviews.average_rating).toFixed(1)} / 5 from{" "}
              {reviews.review_count} reviews
            </span>
          </div>
          <p className="m-0 max-w-[620px] text-lg font-normal leading-[1.65] text-[#626262] max-[560px]:text-base">
            {product.description}
          </p>
          <p className="m-0 text-sm font-bold text-[#6f7774]">
            {product.countInStock} item(s) available
          </p>
          {cartMessage ? (
            <div className="rounded-lg border border-[#bfe6ca] bg-[#f2fff5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#1f7a39]">
              {cartMessage}{" "}
              <Link className="font-bold text-[#145c29]" to="/cart">
                View cart
              </Link>
            </div>
          ) : null}
          {message ? (
            <div className="rounded-lg border border-[#bfe6ca] bg-[#f2fff5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#1f7a39]">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {error}
            </div>
          ) : null}
          <div className="flex items-center gap-4 max-[560px]:w-full max-[560px]:flex-col max-[560px]:items-stretch">
            <button
              className="inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-lg border border-transparent bg-[#141414] px-6 text-base font-bold leading-none text-white shadow-[0_14px_28px_rgba(20,20,20,0.16)] disabled:cursor-not-allowed disabled:bg-[#767676]"
              disabled={isAddingToCart || isOutOfStock}
              onClick={handleAddToCart}
              type="button"
            >
              {isAddingToCart
                ? "Adding..."
                : isOutOfStock
                  ? "Out of stock"
                  : "Add to cart"}
            </button>
            <button
              className="inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-6 text-base font-bold leading-none text-[#141414] disabled:cursor-not-allowed disabled:text-[#8a8a8a]"
              disabled={isUpdatingWishlist}
              onClick={handleWishlistToggle}
              type="button"
            >
              {isUpdatingWishlist
                ? "Saving..."
                : isWishlisted
                  ? "Remove from wishlist"
                  : "Save to wishlist"}
            </button>
            <Link
              className="button-hover inline-flex min-h-[52px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-6 text-base font-bold leading-none text-[#141414] no-underline"
              to="/products"
            >
              Back to products
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-lg bg-[#f2f4f3] p-8 shadow-[0_28px_60px_rgba(17,17,17,0.12)] max-[560px]:min-h-[360px] max-[560px]:p-5">
          <img
            className="block max-h-[460px] w-full object-contain"
            decoding="async"
            src={productImage}
            alt={productName}
          />
        </div>
      </section>

      <section className="box-border w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-[minmax(0,1fr)_360px] gap-6 max-[920px]:grid-cols-1">
          <div className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]">
            <h2 className="m-0 text-2xl font-bold text-[#111111]">
              Customer reviews
            </h2>
            {isLoadingReviews ? (
              <p className="m-0 mt-4 text-sm font-semibold text-[#626262]">
                Loading reviews...
              </p>
            ) : null}
            {!isLoadingReviews && reviews.reviews.length === 0 ? (
              <p className="m-0 mt-4 text-sm font-semibold text-[#626262]">
                No reviews yet.
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-4">
              {reviews.reviews.map((review) => (
                <article
                  className="rounded-lg border border-[#eeeeee] bg-[#fbfbfb] p-4"
                  key={review.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#111111]">
                      {review.user_display_name}
                    </span>
                    <span className="text-sm font-bold text-[#52635d]">
                      {review.rating} / 5
                    </span>
                  </div>
                  {review.comment ? (
                    <p className="m-0 mt-3 text-sm leading-[1.65] text-[#626262]">
                      {review.comment}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
            <h2 className="m-0 text-2xl font-bold text-[#111111]">
              Write a review
            </h2>
            {reviews.can_review ? (
              <form className="mt-5 flex flex-col gap-4" onSubmit={handleReviewSubmit}>
                <label className="flex flex-col gap-2 text-sm font-bold text-[#333333]">
                  Rating
                  <select
                    className="min-h-[46px] rounded-lg border border-[#d9d9d9] bg-white px-3.5 text-sm font-medium text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
                    name="rating"
                    onChange={handleReviewChange}
                    value={reviewForm.rating}
                  >
                    <option value="5">5 / 5</option>
                    <option value="4">4 / 5</option>
                    <option value="3">3 / 5</option>
                    <option value="2">2 / 5</option>
                    <option value="1">1 / 5</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-[#333333]">
                  Comment
                  <textarea
                    className="min-h-[120px] resize-y rounded-lg border border-[#d9d9d9] bg-white px-3.5 py-3 text-sm font-medium text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
                    name="comment"
                    onChange={handleReviewChange}
                    value={reviewForm.comment}
                  />
                </label>
                <button
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#141414] px-5 text-sm font-bold leading-none text-white disabled:cursor-not-allowed disabled:bg-[#767676]"
                  disabled={isSubmittingReview}
                  type="submit"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit review"}
                </button>
              </form>
            ) : (
              <p className="m-0 mt-4 text-sm leading-[1.65] text-[#626262]">
                {reviews.has_reviewed
                  ? "You already reviewed this product."
                  : "Reviews unlock after a delivered order."}
              </p>
            )}
          </aside>
        </div>
      </section>
    </PageLayout>
  );
};

export default ProductDetails;
