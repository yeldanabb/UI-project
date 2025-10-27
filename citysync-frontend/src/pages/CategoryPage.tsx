import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/festival.css";
import { fetchEvents } from "../api/api";
import type { Event } from "../types/types";

export default function CategoryPage(){
  const { slug } = useParams<{ slug: string }>();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchEvents(slug).then(res => setEvents(res.data)).catch(()=>{});
  }, [slug]);

  return (
    <main>
      <section className="page-title">
        <h1>{slug?.replace('-', ' ') ?? 'Category'}</h1>
      </section>

      <section className="festival-grid">
        {events.map(ev => (
          <div className="festival-card" key={ev.id}>
            <img src={ev.image ? (ev.image.startsWith('http') ? ev.image : `${import.meta.env.VITE_API_BASE.replace('/api','')}${ev.image}`) : "/images/festival2.jpg"} alt={ev.title}/>
            <h2>{ev.title}</h2>
            <a className="info-button" href={`/events/${ev.id}`}>Information</a>
          </div>
        ))}
      </section>
    </main>
  );
}
