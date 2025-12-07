// Author: Orynbassar Abylaikhan (xorynba00)
// Role: Display upcoming events on an interactive map so users can quickly understand how far each event is from them.
// Notes: It shows how this component convertes text addresses into coordinates to show events on the map which was quite interesting
// All logic in this component was implemented solely by the author.

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { MapPin, Calendar } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Event } from "../types/types";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Override default Leaflet marker icons with imported image URLs
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface MapProps {
  events: Event[];
}

interface EventLocation {
  event: Event;
  lat: number;
  lng: number;
}

const BRNO_CENTER: [number, number] = [49.1951, 16.6068];
const geocodeCache: Record<string, [number, number]> = {};

// Main function which recieves a list of events
export default function Map({ events }: MapProps) {
  // Stores geocoded event locations 
  const [eventLocations, setEventLocations] = useState<EventLocation[]>([]);
  // Loading indicator while geocoding
  const [isGeocoding, setIsGeocoding] = useState(false);

  // recieves a location string and returns coordinates
  const geocodeLocation = async (location: string): Promise<[number, number] | null> => {
    // convertes location and ensures consistent caching
    // if it was already geocoded it returnes cached coordinates
    const cacheKey = location.toLowerCase().trim();
    if (geocodeCache[cacheKey]) {
      return geocodeCache[cacheKey];
    }

    try {
      // request is being sent to Nominatim search endpoint and returns the best match
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ", Brno, Czech Republic")}&limit=1`,
        {
          headers: {
            //required by Nominatim to identify app
            "User-Agent": "CitySync/1.0"
          }
        }
      );

      // Converts JSON responce to an object, returned API extracts coordinates and stores them in cache
      const data = await response.json();
      if (data && data.length > 0) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        geocodeCache[cacheKey] = coords;
        return coords;
      }

      // Fallback if API returns no results
      const fallback = BRNO_CENTER;
      geocodeCache[cacheKey] = fallback;
      return fallback;
    } catch (error) {
      console.error("Geocoding error:", error);
      const fallback = BRNO_CENTER;
      geocodeCache[cacheKey] = fallback;
      return fallback;
    }
  };

  useEffect(() => {
    // Main async function that handles geocoding workflow
    const geocodeEvents = async () => {
      if (events.length === 0) {
        setEventLocations([]);
        return;
      }

      setIsGeocoding(true);

      // Group events by unique normalized location
      const uniqueLocations: Record<string, Event[]> = {};
      events.forEach(event => {
        const key = event.location.toLowerCase().trim();
        if (!uniqueLocations[key]) {
          uniqueLocations[key] = [];
        }
        uniqueLocations[key].push(event);
      });

      // Storing coordinates
      const locationCoords: Record<string, [number, number]> = {};
      const locationKeys = Object.keys(uniqueLocations);

      // Geocode each unique location one-by-one 
      for (let i = 0; i < locationKeys.length; i++) {
        const locationKey = locationKeys[i];
        // Take any event from the group and get location text
        const coords = await geocodeLocation(uniqueLocations[locationKey][0].location);

        // Save coordinates 
        if (coords) {
          locationCoords[locationKey] = coords;
        }

        // If location wasn't in cache wait 1 second to avoid API rate limits
        if (i < locationKeys.length - 1 && !geocodeCache[locationKey]) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Convert geocoded results back to event entries
      const geocodedLocations: EventLocation[] = [];
      events.forEach(event => {
        const key = event.location.toLowerCase().trim();
        const coords = locationCoords[key];

        // Add coordinates and event info to final array
        if (coords) {
          geocodedLocations.push({
            event,
            lat: coords[0],
            lng: coords[1],
          });
        }
      });

      setEventLocations(geocodedLocations);
      setIsGeocoding(false);
    };

    geocodeEvents();
  }, [events]);


  // Helper to format event dates in a readable style
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

    // Map wrapper and loading indicator
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

      {/* Core leaflet map instance */}
      <MapContainer
        center={BRNO_CENTER}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        scrollWheelZoom={true}
      >
        {/* Base OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render a marker for each event and popup event details */}
        {eventLocations.map((eventLocation) => (
          <Marker
            key={eventLocation.event.id}
            position={[eventLocation.lat, eventLocation.lng]}
          >
            <Popup>
              <div style={{ minWidth: "200px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>
                  {eventLocation.event.title}
                </h3>
                <p style={{ margin: "4px 0", fontSize: "14px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={14} />
                  {eventLocation.event.location}
                </p>
                <p style={{ margin: "4px 0", fontSize: "14px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} />
                  {formatDate(eventLocation.event.date)}
                </p>
                {eventLocation.event.category && (
                  <p style={{ margin: "4px 0", fontSize: "12px", color: "#888" }}>
                    {eventLocation.event.category.name}
                  </p>
                )}
                {eventLocation.event.external_links && (
                  <a
                    href={eventLocation.event.external_links}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "4px",
                      color: "#0066cc",
                      textDecoration: "underline",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Click to see the event!
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

