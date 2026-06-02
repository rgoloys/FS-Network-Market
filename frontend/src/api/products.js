import axios from "axios";
import { BASE_URL } from "./base";

let productListCache = null;
let productListRequest = null;
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatProductPrice = (value) =>
  priceFormatter.format(Number(value ?? 0));

export const getProductImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return `${BASE_URL.slice(0, -1)}${image}`;
  return `${BASE_URL}${image}`;
};

export const getProducts = async () => {
  if (productListCache) return productListCache;
  if (productListRequest) return productListRequest;

  productListRequest = axios
    .get(`${BASE_URL}products/`)
    .then((response) => {
      productListCache = response.data;
      return productListCache;
    })
    .finally(() => {
      productListRequest = null;
    });

  return productListRequest;
};

export const getProductById = async (id) => {
  const cachedProduct = productListCache?.find(
    (product) => String(product.id) === String(id),
  );
  if (cachedProduct) return cachedProduct;

  const response = await axios.get(`${BASE_URL}products/${id}/`);
  return response.data;
};
