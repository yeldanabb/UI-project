import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/festival.css";
import { fetchEvents, fetchCategory } from "../api/api";
import type { Event } from "../types/types";
import type { Category } from "../types/types";

const formatCategoryName = (slug: string | undefined) => {
  if (!slug) return 'Category';
  
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export default function CategoryPage(){
  const { slug } = useParams<{ slug: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  

   useEffect(() => {
    if (!slug) return;
    fetchEvents(slug)
      .then((res) => setEvents(res.data))
      .catch(() => {});
    fetchCategory(slug)
      .then((res) => setCategory(res.data))
      .catch(() => {});
  }, [slug]);

  const categoryName = formatCategoryName(slug);


  return (
    <main>
      <section className="page-title">
        <h1>{categoryName}</h1>
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
