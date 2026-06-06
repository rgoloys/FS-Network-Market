import axios from "axios";
import { getAuthHeaders } from "./auth";
import { BASE_URL } from "./base";

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

const buildProductPayload = (productForm, imageFile) => {
  if (!imageFile) return productForm;

  const payload = new FormData();
  Object.entries(productForm).forEach(([key, value]) => {
    payload.append(key, value);
  });
  payload.append("image", imageFile);
  return payload;
};

export const getBusinessSummary = async () => {
  const response = await axios.get(`${BASE_URL}business/summary/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getBusinessProducts = async (params) => {
  const response = await axios.get(
    `${BASE_URL}business/products/${buildQueryString(params)}`,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const createBusinessProduct = async (productForm, imageFile) => {
  const response = await axios.post(
    `${BASE_URL}business/products/`,
    buildProductPayload(productForm, imageFile),
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const updateBusinessProduct = async (productId, productForm, imageFile) => {
  const response = await axios.patch(
    `${BASE_URL}business/products/${productId}/`,
    buildProductPayload(productForm, imageFile),
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const archiveBusinessProduct = async (productId) => {
  const response = await axios.delete(`${BASE_URL}business/products/${productId}/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getBusinessOrders = async (params) => {
  const response = await axios.get(
    `${BASE_URL}business/orders/${buildQueryString(params)}`,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const updateBusinessOrder = async (orderId, payload) => {
  const response = await axios.patch(
    `${BASE_URL}business/orders/${orderId}/`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const getBusinessCustomers = async (params) => {
  const response = await axios.get(
    `${BASE_URL}business/customers/${buildQueryString(params)}`,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const updateBusinessCustomer = async (customerId, payload) => {
  const response = await axios.patch(
    `${BASE_URL}business/customers/${customerId}/`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const getBusinessReviews = async (params) => {
  const response = await axios.get(
    `${BASE_URL}business/reviews/${buildQueryString(params)}`,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const updateBusinessReview = async (reviewId, payload) => {
  const response = await axios.patch(
    `${BASE_URL}business/reviews/${reviewId}/`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const hideBusinessReview = async (reviewId) => {
  const response = await axios.delete(`${BASE_URL}business/reviews/${reviewId}/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
