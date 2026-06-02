import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  formatProductPrice,
  getProductImageUrl,
  getProducts,
} from "../api/products";

const ProductSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-[#ececec] bg-white">
    <div className="aspect-[4/3] animate-pulse bg-[#f1f3f2]" />
    <div className="flex flex-col gap-3 p-4">
      <div className="h-3 w-20 animate-pulse rounded bg-[#eceeed]" />
      <div className="h-5 w-full animate-pulse rounded bg-[#e6e8e7]" />
      <div className="h-4 w-24 animate-pulse rounded bg-[#eceeed]" />
      <div className="mt-2 h-10 w-full animate-pulse rounded-lg bg-[#e6e8e7]" />
    </div>
  </div>
);

const ProductList = ({ showHeader = true, title = "Featured products" }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    getProducts()
      .then((productData) => {
        if (isActive) setProducts(productData);
      })
      .catch(() => {
        if (isActive) {
          setError("Unable to load products right now. Please try again.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section
      className="box-border w-full bg-white px-10 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4 max-[560px]:py-12"
      aria-labelledby={showHeader ? "product-list-title" : undefined}
      aria-label={showHeader ? undefined : "Product collection"}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        {showHeader ? (
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-[#638076]">
                Network essentials
              </span>
              <h2
                className="m-0 mt-2 text-[34px] font-bold leading-tight text-[#111111] max-[560px]:text-[28px]"
                id="product-list-title"
              >
                {title}
              </h2>
            </div>
            <span className="text-sm font-semibold text-[#717171]">
              {products.length ? `${products.length} products` : "Curated catalog"}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-5 gap-4 max-[1180px]:grid-cols-4 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[360px]:grid-cols-1">
          {isLoading
            ? Array.from({ length: 10 }, (_, index) => (
                <ProductSkeleton key={index} />
              ))
            : products.map((product, index) => (
                <article
                  className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#e8e8e8] bg-white text-left transition duration-200 hover:-translate-y-1 hover:border-[#cfd8d5] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)]"
                  key={product.id}
                >
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f4f6f5] p-4">
                    {product.image ? (
                      <img
                        alt={product.product_name}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]"
                        decoding="async"
                        loading={index < 5 ? "eager" : "lazy"}
                        src={getProductImageUrl(product.image)}
                      />
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#89928f]">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <span className="block truncate text-xs font-bold uppercase tracking-[0.12em] text-[#638076]">
                      {product.brand}
                    </span>
                    <h3 className="m-0 line-clamp-2 min-h-[42px] text-[17px] font-bold leading-[1.22] text-[#111111]">
                      {product.product_name}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[17px] font-bold leading-none text-[#141414]">
                        {formatProductPrice(product.product_price)}
                      </span>
                      <span className="text-xs font-semibold text-[#6f7774]">
                        {product.countInStock} in stock
                      </span>
                    </div>
                    <Link
                      className="button-hover mt-auto inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d8dedc] bg-white px-4 text-sm font-bold leading-none text-[#141414] no-underline hover:bg-[#f1f6f4]"
                      to={`/products/${product.id}`}
                    >
                      View details
                    </Link>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  );
};

export default ProductList;
