import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import type { Event } from "../types/types";
import { Link } from "react-router-dom";

export default function EventCard({ ev }: { ev: Event }) {
  const img = ev.image || "/images/exhibition.jpg"; 
  const imageUrl = img.startsWith("http") ? img : img.startsWith("/") ? img : `${import.meta.env.VITE_API_BASE?.replace('/api','') || 'http://127.0.0.1:8000'}${img}`;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="tile">
      <div className="tile-image-wrapper">
        <img src={imageUrl} alt={ev.title} />
        <div className="tile-category-badge">{ev.category.name}</div>
      </div>
      <div className="tile-content">
        <h3>{ev.title}</h3>
        <div className="tile-meta">
          <span className="tile-location"><MapPinIcon style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} /> {ev.location}</span>
          <span className="tile-date"><CalendarIcon style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} /> {formatDate(ev.date)}</span>
        </div>
        {ev.description && (
          <p className="tile-description">{ev.description.substring(0, 120)}...</p>
        )}
        <button><Link to={`/events/${ev.id}`}>View Details</Link></button>
      </div>
    </div>
  );
}
