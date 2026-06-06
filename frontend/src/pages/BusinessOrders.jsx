import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthTokens, isUnauthorizedError } from "../api/auth";
import { getBusinessOrders, updateBusinessOrder } from "../api/business";
import { formatProductPrice } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];
const FULFILLMENT_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const selectClass =
  "min-h-[42px] rounded-lg border border-[#d9d9d9] bg-white px-3 text-sm font-bold text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10";

const BusinessOrders = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ status: "", payment_status: "" });
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingItemId, setSavingItemId] = useState(null);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to manage orders." },
    });
  }, [navigate, setIsAuthenticated]);

  const loadOrders = useCallback(() => {
    setIsLoading(true);
    getBusinessOrders(filters)
      .then((data) => {
        setOrders(data);
        const nextDrafts = {};
        data.forEach((order) => {
          order.items.forEach((item) => {
            nextDrafts[item.id] = item.fulfillment_status;
          });
        });
        setDrafts(nextDrafts);
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }
        setError("Unable to load orders.");
      })
      .finally(() => setIsLoading(false));
  }, [clearSessionAndRedirect, filters]);

  useEffect(() => {
    const timer = window.setTimeout(loadOrders, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const handleDraftChange = (itemId, value) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [itemId]: value,
    }));
  };

  const handleSave = async (orderId, itemId) => {
    setError("");
    setMessage("");
    setSavingItemId(itemId);

    try {
      const updatedOrder = await updateBusinessOrder(orderId, {
        item_id: itemId,
        fulfillment_status: drafts[itemId],
      });
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? updatedOrder : order,
        ),
      );
      setMessage(`Order #${orderId} item updated.`);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }
      setError("Unable to update this order.");
    } finally {
      setSavingItemId(null);
    }
  };

  return (
    <PageLayout>
      <section className="box-border min-h-[640px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
          <div className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              Order management
            </span>
            <h1 className="m-0 mt-4 text-[42px] font-bold leading-tight text-[#111111] max-[560px]:text-[32px]">
              Manage orders containing your products
            </h1>
            <div className="mt-5 flex flex-wrap gap-3">
              <select
                className={selectClass}
                name="status"
                onChange={handleFilterChange}
                value={filters.status}
              >
                <option value="">All order statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                name="payment_status"
                onChange={handleFilterChange}
                value={filters.payment_status}
              >
                <option value="">All payment statuses</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
              Loading orders...
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <article
                className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]"
                key={order.id}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 max-[760px]:grid-cols-1">
                  <div>
                    <p className="m-0 text-sm font-bold text-[#638076]">
                      Order #{order.id} / {order.user.username}
                    </p>
                    <h2 className="m-0 mt-2 text-2xl font-bold text-[#111111]">
                      {order.shipping_full_name}
                    </h2>
                    <p className="m-0 mt-2 text-sm leading-[1.6] text-[#626262]">
                      {order.shipping_address}, {order.shipping_city_province},{" "}
                      {order.shipping_country} {order.shipping_postal_code}
                    </p>
                    <p className="m-0 mt-2 text-sm font-semibold text-[#626262]">
                      {order.shipping_email} / {order.shipping_phone_number}
                    </p>
                  </div>
                  <div className="text-right max-[760px]:text-left">
                    <span className="text-3xl font-bold text-[#111111]">
                      {formatProductPrice(order.total_amount)}
                    </span>
                    <p className="m-0 mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#6f7774]">
                      Order total
                    </p>
                    <p className="m-0 mt-2 text-sm font-semibold text-[#626262]">
                      {order.items.length} owned item(s)
                    </p>
                    <p className="m-0 mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#6f7774]">
                      Your subtotal: {formatProductPrice(order.owned_subtotal)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.08em]">
                  <span className="rounded-full bg-[#eef4f2] px-3 py-2 text-[#31564d]">
                    Order: {order.status}
                  </span>
                  <span className="rounded-full bg-[#f3f0e7] px-3 py-2 text-[#6a572f]">
                    Payment: {order.payment_status}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-2 border-t border-[#eeeeee] pt-4">
                  {order.items.map((item) => (
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm max-[760px]:grid-cols-1"
                      key={item.id}
                    >
                      <div>
                        <span className="block font-semibold text-[#111111]">
                          {item.product_name} x {item.qty}
                        </span>
                        <span className="block text-xs font-bold uppercase tracking-[0.08em] text-[#6f7774]">
                          {formatProductPrice(item.line_total)}
                        </span>
                      </div>
                      <select
                        className={selectClass}
                        onChange={(event) =>
                          handleDraftChange(item.id, event.target.value)
                        }
                        value={drafts[item.id] ?? item.fulfillment_status}
                      >
                        {FULFILLMENT_STATUSES.map((fulfillmentStatus) => (
                          <option key={fulfillmentStatus} value={fulfillmentStatus}>
                            {fulfillmentStatus}
                          </option>
                        ))}
                      </select>
                      <button
                        className="button-hover inline-flex min-h-[42px] items-center justify-center rounded-lg bg-[#141414] px-5 text-sm font-bold text-white disabled:bg-[#767676]"
                        disabled={savingItemId === item.id}
                        onClick={() => handleSave(order.id, item.id)}
                        type="button"
                      >
                        {savingItemId === item.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default BusinessOrders;
