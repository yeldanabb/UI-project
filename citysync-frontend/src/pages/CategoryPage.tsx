import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/festival.css";
import { fetchEvents, fetchCategory } from "../api/api";
import type { Event } from "../types/types";
import type { Category } from "../types/types";
import { MapPinIcon } from "@heroicons/react/24/outline";

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
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'popular'>('all');
  

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

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      const eventDate = new Date(event.date);
      return eventDate >= new Date();
    }
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  return (
    <main>
      <nav className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-separator"> / </span>
        <span className="breadcrumb-current">{categoryName}</span>
      </nav>

      <section className="category-banner">
        <div className="banner-overlay">
          <h1>{categoryName}</h1>
          <p className="category-description">
            {category?.name ? `Explore all ${category.name.toLowerCase()} events in the city` : 'Discover amazing events'}
          </p>
        </div>
      </section>

      <section className="category-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>
        <button 
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`filter-btn ${filter === 'popular' ? 'active' : ''}`}
          onClick={() => setFilter('popular')}
        >
          Popular
        </button>
      </section>

      <section className="festival-grid">
        {sortedEvents.length > 0 ? (
          sortedEvents.map(ev => {
            const imageUrl = ev.image 
              ? (ev.image.startsWith('http') 
                  ? ev.image 
                  : `${import.meta.env.VITE_API_BASE.replace('/api','')}${ev.image}`)
              : "/images/festival2.jpg";
            
            return (
              <div className="festival-card" key={ev.id}>
                <div className="card-image-container">
                  <img src={imageUrl} alt={ev.title}/>
                  <div className="card-date-badge">{ev.date}</div>
                </div>
                <div className="card-content">
                  <h2>{ev.title}</h2>
                  <p className="card-location"><MapPinIcon style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} /> {ev.location}</p>
                  {ev.description && (
                    <p className="card-description">
                      {ev.description.length > 100 
                        ? `${ev.description.substring(0, 100)}...` 
                        : ev.description}
                    </p>
                  )}
                  <Link className="info-button" to={`/events/${ev.id}`}>
                    View Details
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-events">
            <p>No events found in this category.</p>
          </div>
        )}
      </section>
    </main>
  );
}
