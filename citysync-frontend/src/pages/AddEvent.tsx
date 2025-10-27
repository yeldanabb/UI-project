import React, { useEffect, useState } from "react";
import "../styles/add_event.css";
import { fetchCategories, createEvent } from "../api/api";
import type { Category } from "../types/types";
import { useNavigate } from "react-router-dom";

export default function AddEvent(){
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<any>({
    title: "", description: "", category: "", location: "", date: "", admission: "", external_links: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories().then(res => setCategories(res.data)).catch(()=>{});
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("location", form.location);
    fd.append("date", form.date);
    fd.append("admission", form.admission || "Free admission");
    if (form.external_links) fd.append("external_links", form.external_links);
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await createEvent(fd);
      const created = res.data;
      navigate(`/events/${created.id}`);
    } catch (err:any) {
      console.error(err);
      alert("Failed to create event. Check console.");
    }
  };

  return (
    <main>
      <section className="form-section">
        <h1>Add New Event</h1>
        <form className="event-form" onSubmit={handleSubmit}>
          <label>Event Name</label>
          <input name="title" value={form.title} onChange={onChange} required />

          <label>Choose a Category</label>
          <select name="category" value={form.category} onChange={onChange} required>
            <option value="">-- Select Category --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label>Where is it located?</label>
          <input name="location" value={form.location} onChange={onChange} required />

          <label>When will it be?</label>
          <input type="date" name="date" value={form.date} onChange={onChange} required />

          <label>Description</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={5} required />

          <label>Links</label>
          <input name="external_links" value={form.external_links} onChange={onChange} type="url" />

          <label>Image</label>
          <input type="file" accept="image/*" onChange={onFile} />

          <button type="submit">Create</button>
        </form>
      </section>
    </main>
  );
}
