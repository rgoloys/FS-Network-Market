import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    title: "Browse products",
    copy: "Explore practical tools for teams, operations, and customer workflows.",
  },
  {
    number: "02",
    title: "Review details",
    copy: "Open any product to compare features, pricing, and fit before choosing.",
  },
  {
    number: "03",
    title: "Start quickly",
    copy: "Create an account and keep your shop experience connected across pages.",
  },
];

const ShopGuide = () => {
  return (
    <section className="box-border w-full bg-[#f7f7f7] px-16 py-20 font-sans text-[#141414] max-[960px]:px-7 max-[960px]:py-16 max-[560px]:px-4 max-[560px]:py-12">
      <div className="mx-auto grid w-full max-w-[1180px] grid-cols-[minmax(260px,0.85fr)_minmax(0,1.35fr)] gap-12 max-[900px]:grid-cols-1">
        <div className="flex flex-col items-start gap-5 text-left">
          <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
            Shopping guide
          </span>
          <h2 className="m-0 text-[44px] font-bold leading-[1.1] tracking-normal text-[#111111] max-[760px]:text-4xl max-[560px]:text-[32px]">
            A simple path from browsing to checkout.
          </h2>
          <Link
            className="button-hover inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#141414] px-5 text-[15px] font-bold leading-none text-white no-underline"
            to="/products"
          >
            Browse products
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-5 max-[760px]:grid-cols-1">
          {steps.map((step) => (
            <article
              className="flex min-h-[230px] flex-col justify-between rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_18px_40px_rgba(17,17,17,0.06)]"
              key={step.number}
            >
              <span className="text-sm font-bold leading-none text-[#6b6b6b]">{step.number}</span>
              <div className="flex flex-col gap-3">
                <h3 className="m-0 text-2xl font-bold leading-[1.15] text-[#111111]">
                  {step.title}
                </h3>
                <p className="m-0 text-base font-normal leading-[1.6] text-[#626262]">
                  {step.copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopGuide;
