// Author: Balseit Yeldana
// Role: Small popup component to capture the new event name before dragging

// Notes:
// - This component collects the event name and passes it back to Home via onSubmit.
// - Implemented entirely by the author.
import { useState } from "react";
import "../styles/style_index.css";

interface EventNamePopupProps {
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function EventNamePopup({ onClose, onSubmit }: EventNamePopupProps) {
  const [eventName, setEventName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventName.trim()) {
      onSubmit(eventName.trim());
    }
  };

  return (
    <div className="popup-overlay">
      <div className="name-popup">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>Create New Event</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="eventName">Event Name</label>
          <input
            id="eventName"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Enter event name..."
            autoFocus
          />
          <div className="popup-hint">
             After submitting, drag the badge to a category
          </div>
          <div className="popup-buttons">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={!eventName.trim()}>
              Create & Drag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}