import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Accept": "application/json",
  },
  withCredentials: false,
});


export const fetchCategories = () => api.get("/categories/");
export const fetchEvents = (categorySlug?: string) =>
  api.get("/events/", { params: categorySlug ? { category: categorySlug } : {} });
export const fetchEvent = (id: number | string) => api.get(`/events/${id}/`);
export const fetchContact = () => api.get("/contact/");
export const fetchCategory = (slug: string) => api.get(`/categories/${slug}/`);
export const createEvent = (formData: FormData) =>
  api.post("/events/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
