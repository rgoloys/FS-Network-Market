import axios from "axios";
import { BASE_URL } from "./base";
import { getAuthHeaders } from "./auth";

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

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value).trim());
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const getProducts = async (params = {}) => {
  const queryString = buildQueryString(params);
  if (queryString) {
    const response = await axios.get(`${BASE_URL}products/${queryString}`);
    return response.data;
  }

  if (!queryString && productListCache) return productListCache;
  if (!queryString && productListRequest) return productListRequest;

  productListRequest = axios
    .get(`${BASE_URL}products/`)
    .then((response) => {
      if (!queryString) productListCache = response.data;
      return response.data;
    })
    .finally(() => {
      productListRequest = null;
    });

  return productListRequest;
};

export const getProductFilters = async () => {
  const response = await axios.get(`${BASE_URL}products/filters/`);
  return response.data;
};

export const getProductById = async (id) => {
  const cachedProduct = productListCache?.find(
    (product) => String(product.id) === String(id),
  );
  if (cachedProduct) return cachedProduct;

  const response = await axios.get(`${BASE_URL}products/${id}/`);
  return response.data;
};

export const getProductReviews = async (id) => {
  const response = await axios.get(`${BASE_URL}products/${id}/reviews/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const submitProductReview = async (id, review) => {
  const response = await axios.post(
    `${BASE_URL}products/${id}/reviews/`,
    review,
    { headers: getAuthHeaders() },
  );
  return response.data;
};
