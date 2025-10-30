import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchEvent } from "../api/api";
import type { Event } from "../types/types";
import "../styles/festival_1.css";

export default function EventDetail(){
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
  if (id)
    fetchEvent(id)
      .then(res => {
        console.log(res.data); 
        setEvent(res.data);
      })
      .catch(() => {});
}, [id]);


  if (!event) return <div style={{padding:20}}>Loading...</div>;

  const imageUrl = event.image
    ? (event.image.startsWith("http") ? event.image : `${import.meta.env.VITE_API_BASE.replace('/api','')}${event.image}`)
    : "/images/cineklub.jpg";

  const contact = event.contact_info_details;

  return (
    <main>
      <section className="cine-banner">
        <img src={imageUrl} alt={event.title} />
        <div className="banner-overlay">
          <h1>{event.title}</h1>
          <h3 className="event-date">{event.date}</h3>
        </div>
      </section>

      <section className="cine-info">
        <p>{event.description}</p>
        <section className="cine-boxes">
          <div className="cine-box">
            <h3>Location</h3>
            <p>{event.location}</p>
          </div>
          <div className="cine-box">
            <h3>Admission</h3>
            <p>{event.admission}</p>
          </div>
          {contact && (
            <div className="cine-box">
              <h3>Contact Information</h3>
              <p>
                <strong>Address:</strong> {contact.address || "—"}
              </p>
              <p>
                <strong>Phone:</strong> {contact.phone || "—"}
              </p>
              <p>
                <strong>Email:</strong> {contact.email || "—"}
              </p>
            </div>
          )}
        </section>

        {event.external_links && (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <a
              href={event.external_links}
              target="_blank"
              rel="noopener noreferrer"
              className="more-info-btn"
            >
              More Info
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
