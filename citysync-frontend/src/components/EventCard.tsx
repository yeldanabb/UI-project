import type { Event } from "../types/types";
import { Link } from "react-router-dom";

export default function EventCard({ ev }: { ev: Event }) {
  const img = ev.image || "/images/exhibition.jpg"; 
  const imageUrl = img.startsWith("http") ? img : img.startsWith("/") ? img : `${import.meta.env.VITE_API_BASE.replace('/api','')}${img}`;

  return (
    <div className="tile">
      <img src={imageUrl} alt={ev.title} />
      <h3>{ev.title}</h3>
      <p>{ev.location}</p>
      <button><Link to={`/events/${ev.id}`}>View More</Link></button>
    </div>
  );
}
