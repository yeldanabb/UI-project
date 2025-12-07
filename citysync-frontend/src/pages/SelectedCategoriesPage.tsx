// Author: Polina
// Role: SelectedCategoriesPage component
// - Fetches events and categories based on selected category slugs from URL
// - Filters and sorts events
// - Displays breadcrumb, banner, filter buttons, and festival/event cards

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../styles/festival.css";
import { fetchEvents, fetchCategories } from "../api/api";
import type { Event, Category } from "../types/types";
import { MapPinIcon } from "@heroicons/react/24/outline";

export default function SelectedCategoriesPage() {
  // State: events, categories, selectedCategorySlugs, filter
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'popular'>('all');
  // Effect: load categories and events based on selected slugs from URL
  useEffect(() => {
    const categorySlugsParam = searchParams.get('categories');
    if (categorySlugsParam) {
      const slugs = categorySlugsParam.split(',');
      setSelectedCategorySlugs(slugs);
      // Fetch categories
      fetchCategories().then((res) => {
        setCategories(res.data);
      });
      // Fetch events for selected categories
      Promise.all(
        slugs.map(slug => fetchEvents(slug))
      ).then(results => {
        const allEvents = results.flatMap(res => res.data);
        // Remove duplicates by id
        const uniqueEvents = Array.from(
          new Map(allEvents.map(event => [event.id, event])).values()
        );
        setEvents(uniqueEvents);
      }).catch(() => {});
    }
  }, [searchParams]);
  // Derived data: selected category names
  const selectedCategoryNames = categories
    .filter(c => selectedCategorySlugs.includes(c.slug))
    .map(c => c.name);
  // Filtering events by filter state
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      const eventDate = new Date(event.date);
      return eventDate >= new Date();
    }
    return true;
  });
  // Sorting events by date
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
        <span className="breadcrumb-current">Selected Categories</span>
      </nav>

      <section className="category-banner">
        <div className="banner-overlay">
          <h1>Selected Categories</h1>
          <p className="category-description">
            {selectedCategoryNames.length > 0 
              ? `Events from: ${selectedCategoryNames.join(', ')}`
              : 'Discover amazing events'}
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
            <p>No events found in selected categories.</p>
          </div>
        )}
      </section>
    </main>
  );
}

