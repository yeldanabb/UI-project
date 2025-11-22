import { useState } from "react";
import { createEvent, createContactInfo } from "../api/api";
import "../styles/add_event.css";

interface AddEventModalProps {
  open: boolean;
  name: string;
  category: number;
  onClose: () => void;
}

export default function AddEventModal({ open, name, category, onClose }: AddEventModalProps) {
  const [tab, setTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: name,
    category: category,
    description: "",
    location: "",
    date: "",
    admission: "",
    external_links: "",
  });

  const [contactInfo, setContactInfo] = useState({
    address: "",
    phone: "",
    email: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const updateForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const updateContactInfo = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });

  const submit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      let contactInfoId = null;
      const hasContactInfo = contactInfo.address || contactInfo.phone || contactInfo.email;
      if (hasContactInfo) {
        try {
          const contactResponse = await createContactInfo(contactInfo);
          contactInfoId = contactResponse.data.id;
          console.log("Contact info created with ID:", contactInfoId);
        } catch (contactErr) {
          console.error("Failed to create contact info:", contactErr);
        }
      }
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v as string);
      });
      if (contactInfoId) {
        fd.append("contact_info", contactInfoId.toString());
      }
      
      if (imageFile) {
        fd.append("image", imageFile);
      }

      console.log("Submitting event with data:", {
        title: form.title,
        category: form.category,
        contact_info: contactInfoId
      });

      await createEvent(fd);
      alert("Event created successfully!");
      onClose();
    } catch (err: any) {
      console.error("Event creation failed:", err);
      const errorMessage = err.response?.data 
        ? JSON.stringify(err.response.data)
        : err.message || "Failed to create event.";
      alert(`Failed to create event: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>×</button>

        <h2>Create Event: {name}</h2>

        <div className="tabs">
          <button
            className={tab === "basic" ? "active" : ""}
            onClick={() => setTab("basic")}
          >
            Basic Info
          </button>
          <button
            className={tab === "details" ? "active" : ""}
            onClick={() => setTab("details")}
          >
            Details
          </button>
          <button
            className={tab === "contact" ? "active" : ""}
            onClick={() => setTab("contact")}
          >
            Contact Info
          </button>
          <button
            className={tab === "media" ? "active" : ""}
            onClick={() => setTab("media")}
          >
            Media
          </button>
        </div>

        {tab === "basic" && (
          <div className="tab-content">
            <label>Title *</label>
            <input 
              name="title" 
              value={form.title} 
              onChange={updateForm} 
              required 
            />

            <label>Location *</label>
            <input 
              name="location" 
              value={form.location} 
              onChange={updateForm} 
              placeholder="Enter event location..."
              required 
            />

            <label>Date *</label>
            <input 
              type="date" 
              name="date" 
              value={form.date} 
              onChange={updateForm} 
              required 
            />

            <label>Admission</label>
            <input
              name="admission"
              value={form.admission}
              onChange={updateForm}
              placeholder="e.g., Free, $20, Donation-based..."
            />
          </div>
        )}

        {tab === "details" && (
          <div className="tab-content">
            <label>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateForm}
              rows={4}
              placeholder="Describe your event..."
              required
            />

            <label>External Links</label>
            <input
              name="external_links"
              value={form.external_links}
              onChange={updateForm}
              placeholder="https://..."
            />
          </div>
        )}

        {tab === "contact" && (
          <div className="tab-content">
            <label>Address</label>
            <textarea
              name="address"
              value={contactInfo.address}
              onChange={updateContactInfo}
              rows={3}
              placeholder="Full address for the event..."
            />

            <label>Phone Number</label>
            <input
              name="phone"
              value={contactInfo.phone}
              onChange={updateContactInfo}
              placeholder="+1 (555) 123-4567"
            />

            <label>Email</label>
            <input
              type="email"
              name="email"
              value={contactInfo.email}
              onChange={updateContactInfo}
              placeholder="contact@example.com"
            />
          </div>
        )}

        {tab === "media" && (
          <div className="tab-content">
            <label>Event Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {imageFile && (
              <div className="image-preview">
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Preview" 
                />
              </div>
            )}
          </div>
        )}

        <button 
          className="save-btn" 
          onClick={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Event"}
        </button>
      </div>
    </div>
  );
}