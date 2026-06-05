import axios from "axios";
import { BASE_URL } from "./base";
import { getAuthHeaders } from "./auth";

export const getCart = async () => {
  const response = await axios.get(`${BASE_URL}cart/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const addCartItem = async (productId, qty = 1) => {
  const response = await axios.post(
    `${BASE_URL}cart/add/`,
    { product_id: productId, qty },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const updateCartItem = async (cartItemId, qty) => {
  const response = await axios.patch(
    `${BASE_URL}cart/update/${cartItemId}/`,
    { qty },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const removeCartItem = async (cartItemId) => {
  const response = await axios.delete(`${BASE_URL}cart/remove/${cartItemId}/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createOrder = async (shipping) => {
  const response = await axios.post(
    `${BASE_URL}orders/`,
    { shipping },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const getOrders = async () => {
  const response = await axios.get(`${BASE_URL}orders/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await axios.get(`${BASE_URL}orders/${id}/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getWishlist = async () => {
  const response = await axios.get(`${BASE_URL}wishlist/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const addWishlistItem = async (productId) => {
  const response = await axios.post(
    `${BASE_URL}wishlist/`,
    { product_id: productId },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const removeWishlistItem = async (productId) => {
  const response = await axios.delete(`${BASE_URL}wishlist/${productId}/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
