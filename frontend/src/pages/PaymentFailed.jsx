import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <PageLayout>
      <section className="box-border min-h-[560px] w-full bg-[#f7f7f7] px-16 py-20 font-sans text-[#141414] max-[760px]:px-5">
        <div className="mx-auto flex max-w-[760px] flex-col items-start gap-5 rounded-lg border border-[#ead0d0] bg-white p-8 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
          <span className="inline-flex min-h-[34px] items-center rounded-full bg-[#fff0f0] px-3 text-sm font-bold text-[#a52626]">
            Payment not completed
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="m-0 text-[40px] font-bold leading-tight text-[#111111] max-[560px]:text-[32px]">
              Your payment did not finish.
            </h1>
            <p className="m-0 text-base font-medium leading-7 text-[#5f6663]">
              The invoice may have failed, expired, or been cancelled. You can
              review the order status or return to your cart to try again.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {orderId ? (
              <Link
                className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#141414] px-5 text-sm font-bold leading-none text-white no-underline"
                to={`/orders/${orderId}`}
              >
                View order
              </Link>
            ) : null}
            <Link
              className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-5 text-sm font-bold leading-none text-[#141414] no-underline"
              to="/cart"
            >
              Back to cart
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default PaymentFailed;
