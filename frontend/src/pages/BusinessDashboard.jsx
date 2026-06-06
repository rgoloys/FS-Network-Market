import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthTokens, isUnauthorizedError } from "../api/auth";
import { getBusinessSummary } from "../api/business";
import { BASE_URL } from "../api/base";
import { formatProductPrice } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const metricClass =
  "rounded-lg border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]";

const BusinessDashboard = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to access the dashboard." },
    });
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    let isActive = true;

    getBusinessSummary()
      .then((data) => {
        if (isActive) setSummary(data);
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }
        if (isActive) setError("Unable to load dashboard data.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [clearSessionAndRedirect]);

  const metrics = summary
    ? [
        ["Your sales", formatProductPrice(summary.total_sales)],
        ["Your orders", summary.total_orders],
        ["Pending orders", summary.pending_orders],
        ["Delivered orders", summary.delivered_orders],
        ["Your buyers", summary.active_buyers],
        ["Low stock", summary.low_stock_count],
      ]
    : [];

  return (
    <PageLayout>
      <section className="box-border min-h-[640px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div className="flex flex-col gap-3">
              <span className="inline-flex min-h-[34px] w-fit items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
                Business dashboard
              </span>
              <h1 className="m-0 text-[48px] font-bold leading-[1.08] text-[#111111] max-[760px]:text-4xl max-[560px]:text-[32px]">
                Operations overview
              </h1>
            </div>
            <a
              className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-5 text-sm font-bold leading-none text-[#141414] no-underline"
              href={`${BASE_URL}admin/`}
            >
              Django admin
            </a>
          </div>

          {isLoading ? (
            <div className={metricClass}>Loading dashboard...</div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {error}
            </div>
          ) : null}

          {summary ? (
            <>
              <div className="grid grid-cols-6 gap-4 max-[1180px]:grid-cols-3 max-[700px]:grid-cols-2 max-[430px]:grid-cols-1">
                {metrics.map(([label, value]) => (
                  <article className={metricClass} key={label}>
                    <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#6f7774]">
                      {label}
                    </p>
                    <strong className="mt-3 block text-2xl font-bold text-[#111111]">
                      {value}
                    </strong>
                  </article>
                ))}
              </div>

              <div className="grid grid-cols-[1.2fr_0.8fr] gap-6 max-[920px]:grid-cols-1">
                <section className={metricClass}>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="m-0 text-2xl font-bold text-[#111111]">
                      Orders containing your products
                    </h2>
                    <Link
                      className="text-sm font-bold text-[#141414] no-underline"
                      to="/business-dashboard/orders"
                    >
                      Manage orders
                    </Link>
                  </div>
                  <div className="mt-5 flex flex-col gap-3">
                    {summary.recent_orders.map((order) => (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeeee] pb-3 last:border-b-0"
                        key={order.id}
                      >
                        <div>
                          <p className="m-0 text-sm font-bold text-[#111111]">
                            Order #{order.id} / {order.user.username}
                          </p>
                          <p className="m-0 mt-1 text-xs font-semibold text-[#6f7774]">
                            {order.status} / {order.payment_status}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#111111]">
                          {formatProductPrice(order.owned_subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={metricClass}>
                  <h2 className="m-0 text-2xl font-bold text-[#111111]">
                    Your top products
                  </h2>
                  <div className="mt-5 flex flex-col gap-3">
                    {summary.top_products.map((product) => (
                      <div
                        className="flex items-center justify-between gap-3 border-b border-[#eeeeee] pb-3 last:border-b-0"
                        key={product.product_id}
                      >
                        <div>
                          <p className="m-0 text-sm font-bold text-[#111111]">
                            {product.product_name}
                          </p>
                          <p className="m-0 mt-1 text-xs font-semibold text-[#6f7774]">
                            {product.brand} / {product.total_qty} sold
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#111111]">
                          {formatProductPrice(product.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-2 gap-6 max-[920px]:grid-cols-1">
                <section className={metricClass}>
                  <h2 className="m-0 text-2xl font-bold text-[#111111]">
                    Your inventory alerts
                  </h2>
                  <div className="mt-5 flex flex-col gap-3">
                    {summary.inventory_alerts.map((product) => (
                      <div
                        className="flex items-center justify-between gap-3"
                        key={product.id}
                      >
                        <span className="text-sm font-bold text-[#111111]">
                          {product.product_name}
                        </span>
                        <span className="text-sm font-semibold text-[#9f1d1d]">
                          {product.countInStock} left
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={metricClass}>
                  <h2 className="m-0 text-2xl font-bold text-[#111111]">
                    Recent reviews on your products
                  </h2>
                  <div className="mt-5 flex flex-col gap-3">
                    {summary.recent_reviews.map((review) => (
                      <div
                        className="border-b border-[#eeeeee] pb-3 last:border-b-0"
                        key={review.id}
                      >
                        <p className="m-0 text-sm font-bold text-[#111111]">
                          {review.product.product_name}
                        </p>
                        <p className="m-0 mt-1 text-xs font-semibold text-[#6f7774]">
                          {review.rating} / 5 by {review.user_display_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </PageLayout>
  );
};

export default BusinessDashboard;
