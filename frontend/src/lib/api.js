const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    const message = data?.errors?.[0] || "Something went wrong. Please try again.";
    const err = new Error(message);
    err.errors = data?.errors || [message];
    err.status = res.status;
    throw err;
  }
  return data;
}

export function submitTestimonial(formData) {
  return request("/api/testimonials", { method: "POST", body: formData });
}

export function listTestimonials(status = "all") {
  const q = status && status !== "all" ? `?status=${status}` : "";
  return request(`/api/testimonials${q}`);
}

export function setTestimonialStatus(id, status) {
  return request(`/api/testimonials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function listApproved({ page = 1, limit = 9 } = {}) {
  return request(`/api/testimonials/approved?page=${page}&limit=${limit}`);
}

export { API_BASE };
