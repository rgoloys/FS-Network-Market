import PageLayout from "../components/PageLayout";
import ProductList from "../components/ProductList";

const Products = () => {
  return (
    <PageLayout>
      <section className="box-border w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start gap-4 text-left">
          <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] bg-white px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
            Products
          </span>
          <h5 className="m-0 text-[52px] font-bold leading-[1.08] tracking-normal text-[#111111] max-[760px]:text-4xl max-[560px]:text-[32px]">
            Dare to Compare Our Best Network Solution.
          </h5>
          <p className="m-0 max-w-[620px] text-lg leading-[1.65] text-[#626262] max-[560px]:text-base">
            Compare shop tools, open product details, and choose the option that
            fits your team.
          </p>
        </div>
      </section>
      <ProductList title="All products" showFilters />
    </PageLayout>
  );
};

export default Products;
