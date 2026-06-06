import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthTokens, isUnauthorizedError } from "../api/auth";
import {
  getBusinessReviews,
  hideBusinessReview,
  updateBusinessReview,
} from "../api/business";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const inputClass =
  "min-h-[44px] rounded-lg border border-[#d9d9d9] bg-white px-3 text-sm font-semibold text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10";

const BusinessReviews = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [filters, setFilters] = useState({ search: "", visible: "", rating: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingReviewId, setUpdatingReviewId] = useState(null);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to moderate reviews." },
    });
  }, [navigate, setIsAuthenticated]);

  const loadReviews = useCallback(() => {
    setIsLoading(true);
    getBusinessReviews(filters)
      .then((data) => setReviews(data))
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }
        setError("Unable to load reviews.");
      })
      .finally(() => setIsLoading(false));
  }, [clearSessionAndRedirect, filters]);

  useEffect(() => {
    const timer = window.setTimeout(loadReviews, 200);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const applyReviewUpdate = (updatedReview) => {
    setReviews((currentReviews) =>
      currentReviews.map((review) =>
        review.id === updatedReview.id ? updatedReview : review,
      ),
    );
  };

  const handleVisibilityToggle = async (review) => {
    setError("");
    setMessage("");
    setUpdatingReviewId(review.id);

    try {
      const updatedReview = await updateBusinessReview(review.id, {
        is_visible: !review.is_visible,
      });
      applyReviewUpdate(updatedReview);
      setMessage(`Review #${review.id} updated.`);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }
      setError("Unable to update review visibility.");
    } finally {
      setUpdatingReviewId(null);
    }
  };

  const handleHide = async (reviewId) => {
    setError("");
    setMessage("");
    setUpdatingReviewId(reviewId);

    try {
      const updatedReview = await hideBusinessReview(reviewId);
      applyReviewUpdate(updatedReview);
      setMessage(`Review #${reviewId} hidden.`);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }
      setError("Unable to hide review.");
    } finally {
      setUpdatingReviewId(null);
    }
  };

  return (
    <PageLayout>
      <section className="box-border min-h-[640px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
          <div className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              Review moderation
            </span>
            <h1 className="m-0 mt-4 text-[42px] font-bold leading-tight text-[#111111] max-[560px]:text-[32px]">
              Reviews for your products
            </h1>
            <div className="mt-5 grid grid-cols-[1fr_160px_140px] gap-3 max-[760px]:grid-cols-1">
              <input
                className={inputClass}
                name="search"
                onChange={handleFilterChange}
                placeholder="Search product, buyer, comment"
                value={filters.search}
              />
              <select
                className={inputClass}
                name="visible"
                onChange={handleFilterChange}
                value={filters.visible}
              >
                <option value="">All visibility</option>
                <option value="true">Visible</option>
                <option value="false">Hidden</option>
              </select>
              <select
                className={inputClass}
                name="rating"
                onChange={handleFilterChange}
                value={filters.rating}
              >
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} / 5
                  </option>
                ))}
              </select>
            </div>
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
              Loading reviews...
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
            {reviews.map((review) => (
              <article
                className="rounded-lg border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]"
                key={review.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-sm font-bold text-[#638076]">
                      {review.product.product_name}
                    </p>
                    <h2 className="m-0 mt-2 text-2xl font-bold text-[#111111]">
                      {review.rating} / 5
                    </h2>
                    <p className="m-0 mt-2 text-sm font-semibold text-[#626262]">
                      {review.user_display_name} / {review.user.username}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase leading-none ${
                      review.is_visible
                        ? "bg-[#e8fff0] text-[#146b31]"
                        : "bg-[#fff5f5] text-[#9f1d1d]"
                    }`}
                  >
                    {review.is_visible ? "Visible" : "Hidden"}
                  </span>
                </div>
                <p className="m-0 mt-4 text-sm leading-[1.65] text-[#626262]">
                  {review.comment || "No comment provided."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="inline-flex min-h-10 items-center rounded-lg border border-[#d9d9d9] bg-white px-4 text-sm font-bold text-[#141414] disabled:text-[#9a9a9a]"
                    disabled={updatingReviewId === review.id}
                    onClick={() => handleVisibilityToggle(review)}
                    type="button"
                  >
                    {review.is_visible ? "Hide" : "Show"}
                  </button>
                  {review.is_visible ? (
                    <button
                      className="inline-flex min-h-10 items-center rounded-lg border border-[#f0c9c9] bg-white px-4 text-sm font-bold text-[#9f1d1d] disabled:text-[#9a9a9a]"
                      disabled={updatingReviewId === review.id}
                      onClick={() => handleHide(review.id)}
                      type="button"
                    >
                      Hide review
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default BusinessReviews;
