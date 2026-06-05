export const getAccessToken = () => localStorage.getItem("accessToken");

export const getAuthHeaders = () => {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

export const clearAuthTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const isUnauthorizedError = (error) => error.response?.status === 401;
