import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthTokens, isUnauthorizedError } from "../api/auth";
import { getOrders } from "../api/commerce";
import { formatProductPrice } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const labelClass =
  "rounded-full border border-[#dfe5e2] bg-[#f7faf8] px-3 py-1 text-xs font-bold uppercase leading-none text-[#52635d]";

const Orders = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to view your orders." },
    });
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    let isActive = true;

    getOrders()
      .then((data) => {
        if (isActive) setOrders(data);
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }
        if (isActive) setError("Unable to load your orders. Please try again.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [clearSessionAndRedirect]);

  return (
    <PageLayout>
      <section className="box-border min-h-[620px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div className="flex flex-col gap-3">
              <span className="inline-flex min-h-[34px] w-fit items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
                Orders
              </span>
              <h1 className="m-0 text-[48px] font-bold leading-[1.08] text-[#111111] max-[760px]:text-4xl max-[560px]:text-[32px]">
                Order history
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
              Loading orders...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {error}
            </div>
          ) : null}

          {!isLoading && orders.length === 0 ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-8 text-left">
              <h2 className="m-0 text-2xl font-bold text-[#111111]">
                No orders yet.
              </h2>
              <p className="m-0 mt-2 text-base leading-[1.65] text-[#626262]">
                Checkout from your cart and your orders will appear here.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <article
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)] max-[680px]:grid-cols-1"
                key={order.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={labelClass}>{order.status}</span>
                    <span className={labelClass}>{order.payment_status} payment</span>
                  </div>
                  <h2 className="m-0 mt-4 text-2xl font-bold text-[#111111]">
                    Order #{order.id}
                  </h2>
                  <p className="m-0 mt-2 text-sm font-semibold text-[#626262]">
                    {formatDate(order.createdAt)} / {order.items.length} item(s)
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between gap-4 max-[680px]:items-start">
                  <span className="text-2xl font-bold text-[#111111]">
                    {formatProductPrice(order.total_amount)}
                  </span>
                  <Link
                    className="button-hover inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#d8dedc] bg-white px-4 text-sm font-bold leading-none text-[#141414] no-underline"
                    to={`/orders/${order.id}`}
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Orders;
