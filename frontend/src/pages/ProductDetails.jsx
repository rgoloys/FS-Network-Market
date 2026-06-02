import { Link, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import axios from "axios";
import { BASE_URL } from "../api/base";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  formatProductPrice,
  getProductById,
  getProductImageUrl,
} from "../api/products";

const ProductDetails = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  const { id } = useParams();

  useEffect(() => {
    let isActive = true;

    getProductById(id)
      .then((productData) => {
        if (isActive) setProduct(productData);
      })
      .catch(() => {
        if (isActive) setProductError("Product not found");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      navigate("/login", {
        state: { message: "Please log in to add products to your cart." },
      });
      return;
    }

    setCartMessage("");
    setCartError("");
    setIsAddingToCart(true);

    try {
      await axios.post(
        `${BASE_URL}cart/add/`,
        { product_id: product.id, qty: 1 },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setCartMessage("Product added to cart.");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsAuthenticated(false);
        navigate("/login");
        return;
      }

      setCartError(
        err.response?.data?.error ??
          "Unable to add this product to your cart. Please try again.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <section className="box-border min-h-[520px] w-full bg-white px-16 py-20 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
          <div className="mx-auto flex max-w-[760px] flex-col items-start gap-5 text-left">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              Loading
            </span>
            <h1 className="m-0 text-[44px] font-bold leading-[1.1] text-[#111111] max-[560px]:text-[32px]">
              Loading product details...
            </h1>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (!product || productError) {
    return (
      <PageLayout>
        <section className="box-border min-h-[520px] w-full bg-white px-16 py-20 font-sans text-[#141414] max-[960px]:px-7 max-[560px]:px-4">
          <div className="mx-auto flex max-w-[760px] flex-col items-start gap-5 text-left">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
              Product not found
            </span>
            <h1 className="m-0 text-[44px] font-bold leading-[1.1] text-[#111111] max-[560px]:text-[32px]">
              We could not find that product.
            </h1>
            <p className="m-0 text-lg leading-[1.65] text-[#626262] max-[560px]:text-base">
              The product may have moved or the link may be incorrect.
            </p>
            <Link
              className="button-hover inline-flex min-h-[52px] items-center justify-center rounded-lg bg-[#141414] px-6 text-base font-bold leading-none text-white no-underline"
              to="/products"
            >
              Back to products
            </Link>
          </div>
        </section>
      </PageLayout>
    );
  }

  const productName = product.product_name ?? product.name;
  const productPrice = formatProductPrice(
    product.product_price ?? product.price,
  );
  const productImage = getProductImageUrl(product.image);

  return (
    <PageLayout>
      <section className="box-border grid w-full grid-cols-[minmax(0,1fr)_minmax(320px,520px)] items-center gap-14 bg-white px-16 py-20 font-sans text-[#141414] max-[960px]:grid-cols-1 max-[960px]:px-7 max-[560px]:px-4">
        <div className="flex flex-col items-start gap-6 text-left">
          <span className="inline-flex min-h-[34px] items-center rounded-full border border-[#dedede] px-3.5 text-sm font-semibold leading-none text-[#5b5b5b]">
            {product.brand}
          </span>
          <h1 className="m-0 max-w-[620px] text-[56px] font-bold leading-[1.05] tracking-normal text-[#111111] max-[960px]:text-[44px] max-[560px]:text-[34px]">
            {productName}
          </h1>
          <span className="inline-flex min-h-[46px] items-center rounded-lg bg-[#141414] px-5 text-xl font-bold leading-none text-white">
            {productPrice}
          </span>
          <p className="m-0 max-w-[620px] text-lg font-normal leading-[1.65] text-[#626262] max-[560px]:text-base">
            {product.description}
          </p>
          {cartMessage ? (
            <div className="rounded-lg border border-[#bfe6ca] bg-[#f2fff5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#1f7a39]">
              {cartMessage}{" "}
              <Link className="font-bold text-[#145c29]" to="/cart">
                View cart
              </Link>
            </div>
          ) : null}
          {cartError ? (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff5f5] px-4 py-3 text-sm font-semibold leading-[1.45] text-[#9f1d1d]">
              {cartError}
            </div>
          ) : null}
          <div className="flex items-center gap-4 max-[560px]:w-full max-[560px]:flex-col max-[560px]:items-stretch">
            <button
              className="inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-lg border border-transparent bg-[#141414] px-6 text-base font-bold leading-none text-white shadow-[0_14px_28px_rgba(20,20,20,0.16)] disabled:cursor-not-allowed disabled:bg-[#767676]"
              disabled={isAddingToCart}
              onClick={handleAddToCart}
              type="button"
            >
              {isAddingToCart ? "Adding..." : "Add to cart"}
            </button>
            <Link
              className="button-hover inline-flex min-h-[52px] items-center justify-center rounded-lg border border-[#d9d9d9] bg-white px-6 text-base font-bold leading-none text-[#141414] no-underline"
              to="/products"
            >
              Back to products
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-lg bg-[#f2f4f3] p-8 shadow-[0_28px_60px_rgba(17,17,17,0.12)] max-[560px]:min-h-[360px] max-[560px]:p-5">
          <img
            className="block max-h-[460px] w-full object-contain"
            decoding="async"
            src={productImage}
            alt={productName}
          />
        </div>
      </section>
    </PageLayout>
  );
};

export default ProductDetails;
