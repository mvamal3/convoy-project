import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getCsrfToken = async (): Promise<string> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/auth/csrf-token`,
    { withCredentials: true }
  );

  if (typeof response.data?.csrfToken !== "string") {
    throw new Error("CSRF token was not returned by the server");
  }

  return response.data.csrfToken;
};