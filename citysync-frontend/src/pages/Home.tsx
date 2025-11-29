import { useEffect, useState } from "react";
import "../styles/style_index.css";
import { fetchEvents } from "../api/api";
import type { Event } from "../types/types";
import EventCard from "../components/EventCard";
import AddEventModal from "../components/AddEventModal";
import EventNamePopup from "../components/EventNamePopup";
import CategoriesNavbar from "../components/CategoriesNavbar";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [dragName, setDragName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchEvents()
      .then((res) => setEvents(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    (window as any).completeDropToCategory = (categoryId: number) => {
      const name = (window as any).pendingDragName || dragName;
      if (name && categoryId) {
        setSelectedCategory(categoryId);
        setDragName(name);
        setIsDragging(false);
        setDragPosition({ x: 0, y: 0 });
        setHoveredCategoryId(null);
        console.log(`Category ${categoryId} assigned to event "${name}"`);
      }
    };
  }, [dragName]);

  useEffect(() => {
    if (dragName && hoveredCategoryId) {
      setSelectedCategory(hoveredCategoryId);
    }
  }, [hoveredCategoryId, dragName]);

  useEffect(() => {
    if (dragName && !selectedCategory) {
      document.body.classList.add('has-drag-box');
    } else {
      document.body.classList.remove('has-drag-box');
    }
    
    return () => {
      document.body.classList.remove('has-drag-box');
    };
  }, [dragName, selectedCategory]);

  const handleAddEventClick = () => {
    setShowNamePopup(true);
  };

  const handleNameSubmit = (name: string) => {
    setDragName(name);
    setShowNamePopup(false);
    (window as any).pendingDragName = name;
    setDragPosition({ x: 0, y: 0 });
  };

  const handleCategoryClick = (categoryId: number) => {
    if (dragName) {
      setSelectedCategory(categoryId);
      setHoveredCategoryId(categoryId);
    }
  };

  const handleCategoryDrop = (categoryId: number) => {
    if ((window as any).completeDropToCategory) {
      (window as any).completeDropToCategory(categoryId);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragPosition({
      x: touch.clientX - 200,
      y: touch.clientY - 50
    });
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    setDragPosition({
      x: touch.clientX - 200,
      y: touch.clientY - 50
    });
    
    checkMobileDropTarget(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    checkMobileDropTarget(dragPosition.x + 200, dragPosition.y + 50, true);
    setIsDragging(false);
    setTimeout(() => setDragPosition({ x: 0, y: 0 }), 300);
  };

  const checkMobileDropTarget = (x: number, y: number, isFinal = false) => {
    if (isFinal) {
      const categoryElements = document.querySelectorAll('.drop-target');
      categoryElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          const categoryId = element.getAttribute('data-category-id');
          if (categoryId && (window as any).completeDropToCategory) {
            (window as any).completeDropToCategory(parseInt(categoryId));
          }
        }
      });
    } else {
      const categoryElements = document.querySelectorAll('.drop-target');
      categoryElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          element.classList.add("drag-over");
        } else {
          element.classList.remove("drag-over");
        }
      });
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("eventName", dragName);
    (window as any).pendingDragName = dragName;
    e.dataTransfer.setDragImage(e.currentTarget, 200, 50);
  };

  return (
    <>
      <CategoriesNavbar 
        onCategoryHover={setHoveredCategoryId}
        onCategoryClick={handleCategoryClick}
        onCategoryDrop={handleCategoryDrop}
        selectedCategoryId={dragName ? (selectedCategory || hoveredCategoryId) : null}
        isCreatingEvent={!!dragName}
      />

      <div className="banner">
        <img src="./images/brnocity.jpeg" alt="City Banner" />
        <h1>City Sync</h1>

        <button
          className="banner-button"
          onClick={handleAddEventClick}
        >
          Add Event
        </button>
      </div>

      {showNamePopup && (
        <EventNamePopup
          onClose={() => setShowNamePopup(false)}
          onSubmit={handleNameSubmit}
        />
      )}

      {dragName && !selectedCategory && (
        <div
          className={`drag-box ${isDragging ? 'dragging' : ''}`}
          draggable
          onDragStart={handleDragStart}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: dragPosition.x || dragPosition.y 
              ? `translate(${dragPosition.x}px, ${dragPosition.y}px)`
              : 'translateX(-50%)',
            transition: isDragging ? 'none' : 'transform 0.2s ease'
          }}
        >
          <div className="drag-box-header">
            <h3>{isDragging ? 'Dragging...' : 'Ready to Drag'}</h3>
            <button 
              className="close-btn"
              onClick={() => {
                setDragName("");
                (window as any).pendingDragName = "";
                setIsDragging(false);
                setDragPosition({ x: 0, y: 0 });
              }}
            >
              ×
            </button>
          </div>
          <div className="drag-box-content">
            <div className="event-name">{dragName}</div>
            <div className="drag-instructions">
              {isDragging 
                ? "Drag to a category above ↑" 
                : window.innerWidth < 768 
                  ? "Touch & hold, then drag to any category above"
                  : "Click and drag to any category above"}
            </div>
          </div>
        </div>
      )}

      {selectedCategory && dragName && (
        <AddEventModal
          open={true}
          name={dragName}
          category={selectedCategory}
          onClose={() => {
            setSelectedCategory(null);
            setDragName("");
            (window as any).pendingDragName = "";
          }}
        />
      )}

      <main>
        <section className="home-content">
          <div className="section-header">
            <h2>Featured Events</h2>
            <p>Discover the best events happening in your city</p>
          </div>
          <div className="tiles">
            {events.slice(0, 3).map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
          {events.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h3>No events yet</h3>
              <p>Be the first to add an event to CitySync!</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}