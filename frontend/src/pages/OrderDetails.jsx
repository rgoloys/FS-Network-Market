import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { clearAuthTokens, isUnauthorizedError } from "../api/auth";
import { getOrderById } from "../api/commerce";
import { formatProductPrice, getProductImageUrl } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const successMessage = location.state?.message;

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to view your order." },
    });
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    let isActive = true;

    getOrderById(id)
      .then((data) => {
        if (isActive) setOrder(data);
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }
        if (isActive) setError("Unable to load this order.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [clearSessionAndRedirect, id]);

  return (
    <PageLayout>
      <section className="box-border min-h-[620px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div className="flex flex-col gap-3">
              <span className="inline-flex min-h-[34px] w-fit items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
                Order details
              </span>
              <h1 className="m-0 text-[48px] font-bold leading-[1.08] text-[#111111] max-[760px]:text-4xl max-[560px]:text-[32px]">
                {order ? `Order #${order.id}` : "Order"}
              </h1>
            </div>
            <Link
              className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-5 text-sm font-bold leading-none text-[#141414] no-underline"
              to="/orders"
            >
              Back to orders
            </Link>
          </div>

          {successMessage ? (
            <div className="rounded-lg border border-[#bfe6ca] bg-[#f2fff5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#1f7a39]">
              {successMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-8 text-left text-base font-semibold text-[#626262]">
              Loading order...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {error}
            </div>
          ) : null}

          {order ? (
            <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6 max-[920px]:grid-cols-1">
              <div className="flex flex-col gap-4">
                {order.items.map((item) => (
                  <article
                    className="grid grid-cols-[110px_minmax(0,1fr)_auto] gap-5 rounded-lg border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)] max-[680px]:grid-cols-1"
                    key={item.id}
                  >
                    <div className="flex min-h-[104px] items-center justify-center overflow-hidden rounded-lg bg-[#f2f2f2]">
                      {item.product?.image ? (
                        <img
                          alt={item.product_name}
                          className="h-full max-h-[104px] w-full object-contain p-2"
                          src={getProductImageUrl(item.product.image)}
                        />
                      ) : (
                        <span className="text-sm font-semibold text-[#7a7a7a]">
                          No image
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="m-0 text-sm font-semibold leading-none text-[#6b6b6b]">
                        {item.brand}
                      </p>
                      <h2 className="m-0 mt-2 text-2xl font-bold leading-[1.15] text-[#111111]">
                        {item.product_name}
                      </h2>
                      <p className="m-0 mt-3 text-sm font-semibold text-[#626262]">
                        {formatProductPrice(item.unit_price)} x {item.qty}
                      </p>
                    </div>
                    <span className="text-right text-2xl font-bold text-[#111111] max-[680px]:text-left">
                      {formatProductPrice(item.line_total)}
                    </span>
                  </article>
                ))}
              </div>

              <aside className="h-fit rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
                <h2 className="m-0 text-2xl font-bold text-[#111111]">
                  Summary
                </h2>
                <div className="mt-5 flex flex-col gap-3 text-sm font-semibold text-[#626262]">
                  <div className="flex justify-between gap-4">
                    <span>Status</span>
                    <span className="text-[#111111]">{order.status}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Payment</span>
                    <span className="text-[#111111]">{order.payment_status}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Placed</span>
                    <span className="text-right text-[#111111]">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Subtotal</span>
                    <span className="text-[#111111]">
                      {formatProductPrice(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Shipping</span>
                    <span className="text-[#111111]">
                      {formatProductPrice(order.shipping_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Tax</span>
                    <span className="text-[#111111]">
                      {formatProductPrice(order.tax_amount)}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-[#e8e8e8] pt-5">
                  <span className="text-base font-semibold text-[#626262]">
                    Total
                  </span>
                  <span className="text-3xl font-bold text-[#111111]">
                    {formatProductPrice(order.total_amount)}
                  </span>
                </div>
                <div className="mt-6 border-t border-[#e8e8e8] pt-5">
                  <h3 className="m-0 text-base font-bold text-[#111111]">
                    Ship to
                  </h3>
                  <p className="m-0 mt-2 text-sm leading-[1.6] text-[#626262]">
                    {order.shipping_full_name}
                    <br />
                    {order.shipping_address}
                    <br />
                    {order.shipping_city_province}, {order.shipping_country}{" "}
                    {order.shipping_postal_code}
                    <br />
                    {order.shipping_email}
                    <br />
                    {order.shipping_phone_number}
                  </p>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </PageLayout>
  );
};

export default OrderDetails;
