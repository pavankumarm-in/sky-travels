const API_BASE = "/api";

const getToken = () => localStorage.getItem("token");

const buildQuery = (query = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  return new URLSearchParams(filtered).toString();
};

const request = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const raw = await res.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      data = { message: raw };
    }
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const uploadRequest = async (path, formData) => {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  const raw = await res.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      data = { message: raw };
    }
  }
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
};

export const api = {
  signup: (payload) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listPackages: (query) => request(`/packages?${buildQuery(query)}`),
  getPackageById: (id) => request(`/packages/${id}`),
  createPackage: (payload) =>
    request("/packages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePackage: (id, payload) =>
    request(`/packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePackage: (id) =>
    request(`/packages/${id}`, {
      method: "DELETE",
    }),
  createBooking: (payload) =>
    request("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  myBookings: (query) => request(`/bookings/my-history?${buildQuery(query)}`),
  getPaymentPreference: () => request("/bookings/payment-preference"),
  payBooking: (bookingId, payload) =>
    request(`/bookings/${bookingId}/pay`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminUsers: (query) => request(`/admin/users?${buildQuery(query)}`),
  updateUserRole: (userId, role) =>
    request(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  deleteUser: (userId) =>
    request(`/admin/users/${userId}`, {
      method: "DELETE",
    }),
  adminAnalytics: () => request("/admin/analytics"),
  auditLogs: (query) => request(`/admin/audit-logs?${buildQuery(query)}`),
  adminBookings: (query) => request(`/admin/bookings?${buildQuery(query)}`),
  adminBookingById: (bookingId) => request(`/admin/bookings/${bookingId}`),
  confirmBooking: (bookingId) =>
    request(`/admin/bookings/${bookingId}/confirm`, {
      method: "PATCH",
    }),
  uploadPackageImages: (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));
    return uploadRequest("/admin/uploads/package-images", formData);
  },
};
