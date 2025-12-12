import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { MapPin, Calendar } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Event } from "../types/types";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Override default Leaflet marker icons
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface MapProps {
  events: Event[];
  cityFilter?: string; // Опційний фільтр по місту
}

interface EventLocation {
  event: Event;
  lat: number;
  lng: number;
}

const BRNO_CENTER: [number, number] = [49.1951, 16.6068];
const geocodeCache: Record<string, [number, number]> = {};

export default function Map({ events, cityFilter }: MapProps) {
  const [eventLocations, setEventLocations] = useState<EventLocation[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Геокодування адреси
  const geocodeLocation = async (location: string): Promise<[number, number]> => {
    const cacheKey = location.toLowerCase().trim();
    if (geocodeCache[cacheKey]) return geocodeCache[cacheKey];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        { headers: { "User-Agent": "CitySync/1.0" } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        geocodeCache[cacheKey] = coords;
        return coords;
      }
      return BRNO_CENTER;
    } catch {
      return BRNO_CENTER;
    }
  };

  useEffect(() => {
    const geocodeAllEvents = async () => {
      if (!events.length) {
        setEventLocations([]);
        return;
      }

      setIsGeocoding(true);

      const filteredEvents = cityFilter
        ? events.filter(ev => ev.location.toLowerCase().includes(cityFilter.toLowerCase()))
        : events;

      const locations: EventLocation[] = [];

      for (const ev of filteredEvents) {
        const coords = await geocodeLocation(ev.location);
        locations.push({ event: ev, lat: coords[0], lng: coords[1] });
      }

      setEventLocations(locations);
      setIsGeocoding(false);
    };

    geocodeAllEvents();
  }, [events, cityFilter]);

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
    <div style={{ width: "100%", height: "500px", position: "relative", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
      {isGeocoding && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "10px 20px",
          borderRadius: "5px",
          zIndex: 1000,
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
        }}>
          Loading Map...
        </div>
      )}

      <MapContainer center={BRNO_CENTER} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {eventLocations.map((loc) => (
          <Marker key={loc.event.id} position={[loc.lat, loc.lng]}>
            <Popup>
              <div style={{ minWidth: "200px" }}>
                <h3 style={{ margin: 0 }}>{loc.event.title}</h3>
                <p style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={14} /> {loc.event.location}
                </p>
                <p style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={14} /> {formatDate(loc.event.date)}
                </p>
                {loc.event.external_links && (
                  <a href={loc.event.external_links} target="_blank" rel="noopener noreferrer">
                    See event
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
