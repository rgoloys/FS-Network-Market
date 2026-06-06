import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <PageLayout>
      <section className="box-border min-h-[560px] w-full bg-[#f7f7f7] px-16 py-20 font-sans text-[#141414] max-[760px]:px-5">
        <div className="mx-auto flex max-w-[760px] flex-col items-start gap-5 rounded-lg border border-[#e4e4e4] bg-white p-8 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
          <span className="inline-flex min-h-[34px] items-center rounded-full bg-[#e9f8ef] px-3 text-sm font-bold text-[#196c35]">
            Payment submitted
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="m-0 text-[40px] font-bold leading-tight text-[#111111] max-[560px]:text-[32px]">
              Thanks for your payment.
            </h1>
            <p className="m-0 text-base font-medium leading-7 text-[#5f6663]">
              Xendit is confirming the transaction. Your order status will update
              automatically after the payment webhook reaches our backend.
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
              to="/orders"
            >
              View orders
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default PaymentSuccess;
