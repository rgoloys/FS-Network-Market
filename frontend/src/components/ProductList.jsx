import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  formatProductPrice,
  getProductFilters,
  getProductImageUrl,
  getProducts,
} from "../api/products";

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Name", value: "name" },
  { label: "Price: low to high", value: "price" },
  { label: "Price: high to low", value: "price_desc" },
];

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

const ProductList = ({
  showHeader = true,
  showFilters = false,
  title = "Featured products",
}) => {
  const [products, setProducts] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    categories: [],
    min_price: "0",
    max_price: "0",
  });
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    min_price: "",
    max_price: "",
    in_stock: "",
    ordering: "featured",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(showFilters);
  const [error, setError] = useState("");

  const queryParams = useMemo(() => {
    if (!showFilters) return {};
    return filters;
  }, [filters, showFilters]);

  useEffect(() => {
    if (!showFilters) return undefined;

    let isActive = true;

    getProductFilters()
      .then((data) => {
        if (isActive) setFilterOptions(data);
      })
      .catch(() => {
        if (isActive) {
          setError("Unable to load product filters. Product browsing still works.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingFilters(false);
      });

    return () => {
      isActive = false;
    };
  }, [showFilters]);

  useEffect(() => {
    let isActive = true;
    const delay = showFilters ? 250 : 0;

    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError("");

      getProducts(queryParams)
        .then((productData) => {
          if (isActive) setProducts(productData);
        })
        .catch((err) => {
          if (isActive) {
            const apiMessage =
              err.response?.data?.min_price ??
              err.response?.data?.max_price ??
              "Unable to load products right now. Please try again.";
            setError(apiMessage);
          }
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    }, delay);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [queryParams, showFilters]);

  const handleFilterChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: type === "checkbox" ? (checked ? "true" : "") : value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "",
      brand: "",
      min_price: "",
      max_price: "",
      in_stock: "",
      ordering: "featured",
    });
  };

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
              {isLoading ? "Loading catalog" : `${products.length} products`}
            </span>
          </div>
        ) : null}

        {showFilters ? (
          <div className="rounded-lg border border-[#e8e8e8] bg-[#f8faf9] p-4 text-left">
            <div className="grid grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(150px,1fr))] gap-3 max-[1180px]:grid-cols-3 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1">
              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6d68]">
                Search
                <input
                  className="min-h-11 rounded-lg border border-[#dbe2df] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
                  name="search"
                  onChange={handleFilterChange}
                  placeholder="Search products"
                  type="search"
                  value={filters.search}
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6d68]">
                Category
                <select
                  className="min-h-11 rounded-lg border border-[#dbe2df] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
                  disabled={isLoadingFilters}
                  name="category"
                  onChange={handleFilterChange}
                  value={filters.category}
                >
                  <option value="">All categories</option>
                  {filterOptions.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6d68]">
                Brand
                <select
                  className="min-h-11 rounded-lg border border-[#dbe2df] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
                  disabled={isLoadingFilters}
                  name="brand"
                  onChange={handleFilterChange}
                  value={filters.brand}
                >
                  <option value="">All brands</option>
                  {filterOptions.brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6d68]">
                Sort
                <select
                  className="min-h-11 rounded-lg border border-[#dbe2df] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
                  name="ordering"
                  onChange={handleFilterChange}
                  value={filters.ordering}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6d68]">
                Min price
                <input
                  className="min-h-11 rounded-lg border border-[#dbe2df] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
                  min="0"
                  name="min_price"
                  onChange={handleFilterChange}
                  placeholder={filterOptions.min_price}
                  type="number"
                  value={filters.min_price}
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6d68]">
                Max price
                <input
                  className="min-h-11 rounded-lg border border-[#dbe2df] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10"
                  min="0"
                  name="max_price"
                  onChange={handleFilterChange}
                  placeholder={filterOptions.max_price}
                  type="number"
                  value={filters.max_price}
                />
              </label>

              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[#dbe2df] bg-white px-3 text-sm font-bold text-[#141414]">
                <input
                  checked={filters.in_stock === "true"}
                  className="size-4 accent-[#141414]"
                  name="in_stock"
                  onChange={handleFilterChange}
                  type="checkbox"
                />
                In stock only
              </label>

              <button
                className="min-h-11 rounded-lg border border-[#dbe2df] bg-white px-4 text-sm font-bold text-[#141414]"
                onClick={resetFilters}
                type="button"
              >
                Reset filters
              </button>
            </div>
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
            : products.map((product, index) => {
                const hasDiscount = Number(product.discount_percent) > 0;
                const salePrice = hasDiscount
                  ? product.sale_price
                  : product.product_price;

                return (
                  <article
                    className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#e8e8e8] bg-white text-left transition duration-200 hover:-translate-y-1 hover:border-[#cfd8d5] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)]"
                    key={product.id}
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f4f6f5] p-4">
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        {product.is_featured ? (
                          <span className="rounded-full bg-[#141414] px-2.5 py-1 text-[11px] font-bold uppercase leading-none text-white">
                            Featured
                          </span>
                        ) : null}
                        {hasDiscount ? (
                          <span className="rounded-full bg-[#e8fff0] px-2.5 py-1 text-[11px] font-bold uppercase leading-none text-[#146b31]">
                            Sale
                          </span>
                        ) : null}
                      </div>
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
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="block truncate text-xs font-bold uppercase tracking-[0.12em] text-[#638076]">
                          {product.brand}
                        </span>
                        <span className="truncate text-xs font-semibold text-[#7b8581]">
                          {product.category}
                        </span>
                      </div>
                      <h3 className="m-0 line-clamp-2 min-h-[42px] text-[17px] font-bold leading-[1.22] text-[#111111]">
                        {product.product_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#68716e]">
                        <span>{Number(product.average_rating).toFixed(1)} / 5</span>
                        <span>{product.review_count} reviews</span>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[17px] font-bold leading-none text-[#141414]">
                            {formatProductPrice(salePrice)}
                          </span>
                          {hasDiscount ? (
                            <span className="text-xs font-semibold text-[#8a8a8a] line-through">
                              {formatProductPrice(product.product_price)}
                            </span>
                          ) : null}
                        </div>
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
                );
              })}
        </div>

        {!isLoading && products.length === 0 ? (
          <div className="rounded-lg border border-[#e8e8e8] bg-[#f8faf9] p-8 text-left">
            <h3 className="m-0 text-2xl font-bold text-[#111111]">
              No products found.
            </h3>
            <p className="m-0 mt-2 text-base leading-[1.6] text-[#626262]">
              Try a different search, category, brand, or price range.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ProductList;
