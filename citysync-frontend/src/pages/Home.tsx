import { useEffect, useState } from "react";
import "../styles/style_index.css";
import { fetchEvents } from "../api/api";
import type { Event } from "../types/types";
import EventCard from "../components/EventCard";
import { Link } from "react-router-dom";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchEvents().then(res => setEvents(res.data)).catch(()=>{});
  }, []);

  return (
    <>
      <div className="banner">
        <img src="/images/brno_city.jpg" alt="City Banner" />
        <h1>City Sync</h1>
        <Link to="/add-event" className="banner-button">Add Event</Link>
      </div>

      <main>
        <section className="tiles">
          {events.slice(0,3).map(ev => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </section>
      </main>
    </>
  );
}
