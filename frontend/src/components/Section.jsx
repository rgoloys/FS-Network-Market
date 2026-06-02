import heroImage from "../assets/hero.png";
import { Link } from "react-router-dom";

const stats = [
  { value: "30+", label: "Network products" },
  { value: "10+", label: "Trusted brands" },
  { value: "24/7", label: "Catalog access" },
];

const Section = ({
  primaryCta = { label: "Get started", to: "/products" },
  secondaryCta = { label: "Explore products", to: "/products" },
}) => {
  return (
    <section
      className="box-border grid w-full grid-cols-[minmax(0,1fr)_minmax(320px,520px)] items-center gap-14 bg-white px-16 py-[86px] font-sans text-[#141414] max-[960px]:grid-cols-1 max-[960px]:gap-[42px] max-[960px]:px-7 max-[960px]:py-16 max-[560px]:px-4 max-[560px]:py-12"
      aria-labelledby="feature-section-title"
    >
      <div className="flex max-w-[650px] flex-col items-start gap-6 text-left max-[960px]:max-w-none max-[560px]:gap-5">
        <h1
          className="m-0 max-w-[620px] text-[58px] font-bold leading-[1.05] tracking-normal text-[#111111] max-[960px]:text-[44px] max-[560px]:text-[34px] max-[560px]:leading-[1.1]"
          id="feature-section-title"
        >
          Equip your network with confidence.
        </h1>
        <p className="m-0 max-w-[560px] text-lg font-normal leading-[1.65] text-[#626262] max-[560px]:text-base">
          Compare enterprise switches, routers, firewalls, and access points
          from trusted brands in one focused catalog.
        </p>

        <div className="flex items-center gap-4 pt-1 max-[560px]:w-full max-[560px]:flex-col max-[560px]:items-stretch">
          <Link
            className="button-hover inline-flex min-h-[52px] items-center justify-center rounded-lg border border-transparent bg-[#141414] px-6 text-base font-bold leading-none text-white no-underline shadow-[0_14px_28px_rgba(20,20,20,0.16)] max-[560px]:box-border max-[560px]:w-full"
            to={primaryCta.to}
          >
            {primaryCta.label}
          </Link>
          <Link
            className="button-hover inline-flex min-h-[52px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-6 text-base font-bold leading-none text-[#141414] no-underline max-[560px]:box-border max-[560px]:w-full"
            to={secondaryCta.to}
          >
            {secondaryCta.label}
          </Link>
        </div>

        <div
          className="grid w-full grid-cols-3 gap-[18px] pt-5 max-[560px]:grid-cols-1 max-[560px]:gap-3"
          aria-label="Company statistics"
        >
          {stats.map((stat) => (
            <div
              className="border-t border-[#e8e8e8] pt-[18px]"
              key={stat.label}
            >
              <span className="block text-[28px] font-bold leading-none text-[#111111]">
                {stat.value}
              </span>
              <span className="mt-2 block text-sm font-medium leading-[1.35] text-[#6b6b6b]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-[500px] overflow-hidden rounded-lg bg-[#f2f2f2] shadow-[0_28px_60px_rgba(17,17,17,0.12)] max-[960px]:min-h-[420px] max-[560px]:min-h-[360px]">
        <img
          className="block h-full min-h-[500px] w-full object-cover max-[960px]:min-h-[420px] max-[560px]:min-h-[360px]"
          src={heroImage}
          alt=""
        />
        <div className="absolute bottom-[22px] left-[22px] right-[22px] flex items-center justify-between gap-[18px] rounded-lg bg-white/95 p-[18px] shadow-[0_16px_36px_rgba(20,20,20,0.16)] backdrop-blur-[10px] max-[560px]:w-full max-[560px]:flex-col max-[560px]:items-stretch">
          <div>
            <span className="block text-base font-bold leading-[1.2] text-[#141414]">
              Network-ready shopping
            </span>
            <span className="mt-[5px] block text-sm font-medium leading-[1.35] text-[#6a6a6a]">
              Find reliable equipment for every deployment.
            </span>
          </div>
          <span className="inline-flex min-h-10 min-w-[78px] items-center justify-center rounded-lg bg-[#141414] text-[15px] font-bold leading-none text-white max-[560px]:w-full">
            30+
          </span>
        </div>
      </div>
    </section>
  );
};

export default Section;
