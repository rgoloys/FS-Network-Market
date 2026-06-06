import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthTokens, isUnauthorizedError } from "../api/auth";
import {
  archiveBusinessProduct,
  createBusinessProduct,
  getBusinessProducts,
  updateBusinessProduct,
} from "../api/business";
import { formatProductPrice, getProductImageUrl } from "../api/products";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";

const EMPTY_PRODUCT = {
  product_name: "",
  product_price: "",
  brand: "",
  category: "",
  description: "",
  countInStock: "",
  discount_percent: "0",
  is_featured: false,
  is_active: true,
};

const inputClass =
  "min-h-[44px] w-full rounded-lg border border-[#d9d9d9] bg-white px-3 text-sm font-semibold text-[#141414] outline-none focus:border-[#141414] focus:ring-2 focus:ring-[#141414]/10";

const BusinessProducts = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ search: "", stock: "" });
  const [formData, setFormData] = useState(EMPTY_PRODUCT);
  const [imageFile, setImageFile] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const clearSessionAndRedirect = useCallback(() => {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate("/login", {
      state: { message: "Please log in again to manage products." },
    });
  }, [navigate, setIsAuthenticated]);

  const loadProducts = useCallback(() => {
    setIsLoading(true);
    getBusinessProducts(filters)
      .then((data) => setProducts(data))
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          clearSessionAndRedirect();
          return;
        }
        setError("Unable to load products.");
      })
      .finally(() => setIsLoading(false));
  }, [clearSessionAndRedirect, filters]);

  useEffect(() => {
    const timer = window.setTimeout(loadProducts, 200);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData(EMPTY_PRODUCT);
    setImageFile(null);
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setImageFile(null);
    setFormData({
      product_name: product.product_name ?? "",
      product_price: product.product_price ?? "",
      brand: product.brand ?? "",
      category: product.category ?? "",
      description: product.description ?? "",
      countInStock: product.countInStock ?? "",
      discount_percent: product.discount_percent ?? "0",
      is_featured: Boolean(product.is_featured),
      is_active: Boolean(product.is_active),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      if (editingProduct) {
        await updateBusinessProduct(editingProduct.id, formData, imageFile);
        setMessage("Product updated.");
      } else {
        await createBusinessProduct(formData, imageFile);
        setMessage("Product created.");
      }
      resetForm();
      loadProducts();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }
      setError("Unable to save product. Check the fields and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (productId) => {
    setError("");
    setMessage("");
    try {
      await archiveBusinessProduct(productId);
      setMessage("Product archived.");
      loadProducts();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }
      setError("Unable to archive product.");
    }
  };

  const handleReactivate = async (product) => {
    setError("");
    setMessage("");
    try {
      await updateBusinessProduct(product.id, { is_active: true }, null);
      setMessage("Product reactivated.");
      loadProducts();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSessionAndRedirect();
        return;
      }
      setError("Unable to reactivate product.");
    }
  };

  return (
    <PageLayout>
      <section className="box-border min-h-[640px] w-full bg-[#f7f7f7] px-16 py-16 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[360px_minmax(0,1fr)] gap-6 max-[980px]:grid-cols-1">
          <form
            className="h-fit rounded-lg border border-[#e8e8e8] bg-white p-6 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]"
            onSubmit={handleSubmit}
          >
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              Product management
            </span>
            <h1 className="m-0 mt-4 text-3xl font-bold text-[#111111]">
              {editingProduct ? "Edit product" : "Create product"}
            </h1>

            <div className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-bold">
                Product name
                <input
                  className={inputClass}
                  name="product_name"
                  onChange={handleChange}
                  required
                  value={formData.product_name}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm font-bold">
                  Price
                  <input
                    className={inputClass}
                    min="0"
                    name="product_price"
                    onChange={handleChange}
                    required
                    step="0.01"
                    type="number"
                    value={formData.product_price}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold">
                  Stock
                  <input
                    className={inputClass}
                    min="0"
                    name="countInStock"
                    onChange={handleChange}
                    required
                    type="number"
                    value={formData.countInStock}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm font-bold">
                  Brand
                  <input
                    className={inputClass}
                    name="brand"
                    onChange={handleChange}
                    required
                    value={formData.brand}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold">
                  Category
                  <input
                    className={inputClass}
                    name="category"
                    onChange={handleChange}
                    required
                    value={formData.category}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-bold">
                Discount %
                <input
                  className={inputClass}
                  max="100"
                  min="0"
                  name="discount_percent"
                  onChange={handleChange}
                  step="0.01"
                  type="number"
                  value={formData.discount_percent}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold">
                Description
                <textarea
                  className={`${inputClass} min-h-[120px] resize-y py-3`}
                  name="description"
                  onChange={handleChange}
                  required
                  value={formData.description}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold">
                Product image
                <input
                  className={inputClass}
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  type="file"
                  accept="image/*"
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-bold">
                <input
                  checked={formData.is_featured}
                  className="size-4 accent-[#141414]"
                  name="is_featured"
                  onChange={handleChange}
                  type="checkbox"
                />
                Featured product
              </label>
              <label className="flex items-center gap-3 text-sm font-bold">
                <input
                  checked={formData.is_active}
                  className="size-4 accent-[#141414]"
                  name="is_active"
                  onChange={handleChange}
                  type="checkbox"
                />
                Active in public catalog
              </label>
            </div>

            {error ? (
              <p className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#9f1d1d]">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-lg border border-[#bfe6ca] bg-[#f2fff5] px-4 py-3 text-sm font-semibold text-[#1f7a39]">
                {message}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-[#141414] px-5 text-sm font-bold text-white disabled:bg-[#767676]"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Saving..." : editingProduct ? "Update" : "Create"}
              </button>
              <button
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-5 text-sm font-bold text-[#141414]"
                onClick={resetForm}
                type="button"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]">
              <h2 className="m-0 text-3xl font-bold text-[#111111]">
                Your products
              </h2>
              <div className="mt-5 grid grid-cols-[1fr_180px] gap-3 max-[620px]:grid-cols-1">
                <input
                  className={inputClass}
                  name="search"
                  onChange={handleFilterChange}
                  placeholder="Search product, brand, category"
                  value={filters.search}
                />
                <select
                  className={inputClass}
                  name="stock"
                  onChange={handleFilterChange}
                  value={filters.stock}
                >
                  <option value="">All products</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="low">Low stock</option>
                  <option value="out">Out of stock</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-lg border border-[#e8e8e8] bg-white p-6 text-left font-semibold text-[#626262]">
                Loading products...
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
              {products.map((product) => (
                <article
                  className="rounded-lg border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_14px_34px_rgba(17,17,17,0.06)]"
                  key={product.id}
                >
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4">
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-[#f2f4f3] p-2">
                      {product.image ? (
                        <img
                          alt={product.product_name}
                          className="h-full w-full object-contain"
                          src={getProductImageUrl(product.image)}
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#89928f]">
                          No image
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#638076]">
                        {product.brand} / {product.category}
                      </p>
                      <h3 className="m-0 mt-2 text-xl font-bold text-[#111111]">
                        {product.product_name}
                      </h3>
                      <p className="m-0 mt-2 text-sm font-semibold text-[#626262]">
                        {formatProductPrice(product.sale_price)} /{" "}
                        {product.countInStock} in stock
                      </p>
                      <p className="m-0 mt-1 text-xs font-bold text-[#6f7774]">
                        {product.is_active ? "Active" : "Archived"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="inline-flex min-h-10 items-center rounded-lg border border-[#d9d9d9] bg-white px-4 text-sm font-bold text-[#141414]"
                      onClick={() => editProduct(product)}
                      type="button"
                    >
                      Edit
                    </button>
                    {product.is_active ? (
                      <button
                        className="inline-flex min-h-10 items-center rounded-lg border border-[#f0c9c9] bg-white px-4 text-sm font-bold text-[#9f1d1d]"
                        onClick={() => handleArchive(product.id)}
                        type="button"
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        className="inline-flex min-h-10 items-center rounded-lg border border-[#bfe6ca] bg-white px-4 text-sm font-bold text-[#1f7a39]"
                        onClick={() => handleReactivate(product)}
                        type="button"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default BusinessProducts;
