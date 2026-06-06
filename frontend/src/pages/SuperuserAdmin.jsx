import { BASE_URL } from "../api/base";
import PageLayout from "../components/PageLayout";

const SuperuserAdmin = () => {
  return (
    <PageLayout>
      <section className="box-border flex min-h-[620px] w-full items-center bg-[#f7f7f7] px-16 py-20 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[760px] flex-col items-start gap-5 rounded-lg border border-[#e8e8e8] bg-white p-8 text-left shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
          <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
            Superuser dashboard
          </span>
          <h1 className="m-0 text-[44px] font-bold leading-[1.1] text-[#111111] max-[560px]:text-[32px]">
            Use Django admin for superuser controls.
          </h1>
          <p className="m-0 text-base leading-[1.65] text-[#626262]">
            Superusers manage system-level data, business accounts, roles,
            products, orders, and maintenance tools from Django admin.
          </p>
          <a
            className="button-hover inline-flex min-h-[52px] items-center justify-center rounded-lg bg-[#141414] px-6 text-base font-bold leading-none text-white no-underline"
            href={`${BASE_URL}admin/`}
          >
            Open Django admin
          </a>
        </div>
      </section>
    </PageLayout>
  );
};

export default SuperuserAdmin;
