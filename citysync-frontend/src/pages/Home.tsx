import { useEffect, useState, useRef } from "react";
import { fetchEvents, fetchCategories, updateEvent, createEvent, deleteEvent } from "../api/api";
import type { Event, Category } from "../types/types";
import EventCard from "../components/EventCard";
import DraftEventCard from "../components/DraftEventCard";
import Map from "../components/Map";
import CategoriesNavbar from "../components/CategoriesNavbar";

// DraftEvent interface for creating new events
interface DraftEvent {
  id: string;
  title: string;
  category: number;
  categoryName?: string;
  location: string;
  date: string;
  description: string;
  admission: string;
  external_links: string;
  isDraft: boolean;
  imageFile?: File | null;
}

// LocalEvent type extends Event with additional properties
type LocalEvent = Event & { isFavorite?: boolean; isHidden?: boolean; tags?: string[]; viewsCount?: number };

export default function Home() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [draftEvent, setDraftEvent] = useState<DraftEvent>({
    id: `draft-${Date.now()}`,
    title: "",
    category: 1,
    categoryName: "",
    location: "",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    description: "",
    admission: "",
    external_links: "",
    isDraft: true,
    imageFile: null,
  });

  const [sortBy, setSortBy] = useState<'soonest' | 'latest' | 'views'>('soonest');// sorting preference
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);//filter for favorites
  const [isPastHidden, setIsPastHidden] = useState(false); //filter for past events
  const [lastDeleted, setLastDeleted] = useState<LocalEvent | null>(null); //store last deleted event for undo

  const titleInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleUpdateEvent = async (updated: LocalEvent) => {
    try {
      const payload = {
        title: updated.title,
        description: updated.description,
        location: updated.location,
        date: updated.date,
        tags: updated.tags
      };
      await updateEvent(updated.id, payload);
      //go through all events and update the changed one(for id)
      setEvents(prev => prev.map(ev => ev.id === updated.id ? { ...ev, ...updated } : ev)); 
    } catch (err) {
      console.error("Error updating event:", err);
    }
  };

  //local storage helpers, we don't know what events we chose as favorite or hidden so it will be saved by id in browser storage
  const saveToStorage = (key: string, ids: (string | number)[]) => {
    localStorage.setItem(key, JSON.stringify(ids));
  };

  const getFromStorage = (key: string): (string | number)[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  };

  //connect server and local storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsResponse = await fetchEvents();
        const savedFavorites = getFromStorage('favorite_events');
        const savedHidden = getFromStorage('hidden_events');
        
        setEvents(eventsResponse.data.map((ev: any) => ({
          //go through all events and add info about favorite and hidden from local storage
          ...ev,
          isFavorite: savedFavorites.includes(ev.id),
          isHidden: savedHidden.includes(ev.id),
          viewsCount: ev.viewsCount || 0
        })));

        const categoriesResponse = await fetchCategories();
        if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data);
          if (categoriesResponse.data.length > 0) {
            setDraftEvent(prev => ({
              ...prev,
              category: categoriesResponse.data[0].id,
              categoryName: categoriesResponse.data[0].name
            }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDraftUpdate = (updates: Partial<DraftEvent>) => {
    setDraftEvent(prev => ({ ...prev, ...updates })); //take all previous data and update with new
  }; 

  const handleAddDraft = async () => {
    if (!draftEvent.title || !draftEvent.location || !draftEvent.date) {
      alert("Please fill in mandatory fields!");
      return;
    }

    try {
      const formData = new FormData();
      const cleanDate = draftEvent.date.split('T')[0];

      formData.append("title", draftEvent.title);
      formData.append("location", draftEvent.location);
      formData.append("date", cleanDate);
      formData.append("description", draftEvent.description || "");
      formData.append("category", String(draftEvent.category)); 
      formData.append("admission", draftEvent.admission || "");
      formData.append("external_links", draftEvent.external_links || "");

      if (draftEvent.imageFile) {
        formData.append("image", draftEvent.imageFile);
      }

      const response = await createEvent(formData); 
      const createdFromServer = response.data;

      const newEvent: LocalEvent = {
        ...createdFromServer,
        isFavorite: false,
        isHidden: false,
        tags: createdFromServer.tags || [],
        viewsCount: 0
      };

      setEvents(prev => {
        const updated = [newEvent, ...prev];
        return [...updated].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (sortBy === 'soonest') return dateA - dateB;
          if (sortBy === 'latest') return dateB - dateA;
          if (sortBy === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0);
          return 0;
        });
      });

      setDraftEvent({
        id: `draft-${Date.now()}`,
        title: "",
        category: categories[0]?.id || 1,
        categoryName: categories[0]?.name || "",
        location: "",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        description: "",
        admission: "",
        external_links: "",
        isDraft: true,
        imageFile: null,
      });

    } catch (err: any) {
      console.error("Server Error:", err.response?.data || err);
      alert("Error: " + JSON.stringify(err.response?.data || "Server connection failed"));
    }
  };

  const handleDeleteEvent = async (id: number | string) => {
    const eventToDelete = events.find(ev => ev.id === id);
    if (!eventToDelete) return;

    //put deleted event in folder for undo
    setEvents(prev => prev.filter(ev => ev.id !== id));
    setLastDeleted(eventToDelete);

    //set timer to delete permanently after 5 seconds
    setTimeout(async () => {
      setLastDeleted(current => {
        if (current && current.id === id) {
          deleteEvent(id).catch(err => console.error("error with deletion:", err));
          return null;
        }
        return current;
      });
    }, 5000);
  };

  const undoDelete = () => {
    if (lastDeleted) {
      setEvents(prev => [lastDeleted, ...prev]);
      setLastDeleted(null);
    }
  };

  //go through events and find with same id, change true to false or false to true, then save new list to state and local storage
  const toggleFavorite = (id: number | string) => {
    setEvents(prev => {
      const updated = prev.map(ev => ev.id === id ? { ...ev, isFavorite: !ev.isFavorite } : ev);
      const favoriteIds = updated.filter(ev => ev.isFavorite).map(ev => ev.id);
      saveToStorage('favorite_events', favoriteIds);
      return updated;
    });
  };

  const toggleHidden = (id: number | string) => {
    setEvents(prev => {
      const updated = prev.map(ev => ev.id === id ? { ...ev, isHidden: !ev.isHidden } : ev);
      const hiddenIds = updated.filter(ev => ev.isHidden).map(ev => ev.id);
      saveToStorage('hidden_events', hiddenIds);
      return updated;
    });
  };

  //prev - use for working with actual state of events
  const incrementViews = (id: number | string) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, viewsCount: (ev.viewsCount || 0) + 1 } : ev));
  };

  if (isLoading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading events...</div>;

  //create filter copy of events based on selected criteria
  const filteredEvents = events
    .filter(ev => !ev.isHidden) 
    .filter(ev => {
      if (isPastHidden) {
        const eventDate = new Date(ev.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
      }
      return true;
    })    
    .filter(ev => showOnlyFavorites ? ev.isFavorite : true)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortBy === 'soonest') return dateA - dateB; 
      if (sortBy === 'latest') return dateB - dateA;  
      if (sortBy === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0); 
      return 0;
    });

    //we don't use "use state" -> it is derived state, we don't need to store it in other state, because React will recalculate it on each time when smth changes
    const stats = {
  total: filteredEvents.length,
  favorites: filteredEvents.filter(e => e.isFavorite).length,
  upcoming: filteredEvents.filter(e => new Date(e.date) > new Date()).length
};

  return (
    <>
      <CategoriesNavbar selectedCategoryId={null} isCreatingEvent={false} />

      <div className="banner">
        <img src="./images/brnocity.jpeg" alt="City Banner" />
        <div className="banner-content">
          <h1>City Sync</h1>
          <p>Your local events hub - Discover and create events in your city</p>
        </div>
      </div>

      <div style={{
        display: "flex", flexWrap: "wrap", gap: 12, margin: "16px 0",
        alignItems: "center", justifyContent: "center", background: "#f5f5f5",
        padding: 12, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}>
        <button 
          onClick={() => setIsPastHidden(!isPastHidden)} 
          style={{
            background: isPastHidden ? "#4CAF50" : "#ff4d4d", 
            color: "white", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600
          }}
        >
          {isPastHidden ? "Show All Events" : "Hide Past Events"}
        </button>

        

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#666' }}>Rearrange:</span>
          <button onClick={() => setSortBy('soonest')} style={{ padding: '6px 12px', borderRadius: 4, cursor: 'pointer', border: '1px solid #ddd', background: sortBy === 'soonest' ? '#ddd' : '#fff' }}>📅 Soonest</button>
          <button onClick={() => setSortBy('latest')} style={{ padding: '6px 12px', borderRadius: 4, cursor: 'pointer', border: '1px solid #ddd', background: sortBy === 'latest' ? '#ddd' : '#fff' }}>🆕 Latest</button>
          <button onClick={() => setSortBy('views')} style={{ padding: '6px 12px', borderRadius: 4, cursor: 'pointer', border: '1px solid #ddd', background: sortBy === 'views' ? '#ddd' : '#fff' }}>🔥 Popular</button>
        </div>

        <div>Overall: {stats.total} | Choosen: {stats.favorites}</div>


        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, cursor:"pointer" }}>
          <input type="checkbox" checked={showOnlyFavorites} onChange={() => setShowOnlyFavorites(prev => !prev)} style={{width:16,height:16}} />
          Favorites Only
        </label>
      </div>


      {/* EVENTS + DRAFT GRID */}
      <div className="tiles" style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
        gap: "24px", 
        padding: "20px",
        justifyItems: "center", cd
        maxWidth: "1400px",
        margin: "0 auto" 
      }}>
        
        <DraftEventCard
          draft={draftEvent}
          onUpdate={handleDraftUpdate}
          onSave={handleAddDraft}
          categories={categories}
          titleInputRef={titleInputRef}
          locationInputRef={locationInputRef}
          dateInputRef={dateInputRef}
          descriptionTextareaRef={descriptionTextareaRef}
        />

        {filteredEvents.map(ev => (
          <EventCard
            key={ev.id}
            ev={ev}
            onUpdate={handleUpdateEvent} 
            onToggleFavorite={toggleFavorite}
            onToggleHidden={toggleHidden}
            onIncrementViews={incrementViews} 
            onDelete={handleDeleteEvent}
          />
        ))}
      </div>

      <section className="home-content" style={{ marginTop: 32 }}>
        <h2>Map of events</h2>
        <Map events={filteredEvents} />
      </section>

      {/* UNDO NOTIFICATION */}
      {lastDeleted && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: '#333', color: '#fff', padding: '12px 24px', borderRadius: 12,
          display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999
        }}>
          <span>Event removed</span>
          <button onClick={undoDelete} style={{ background: 'none', border: 'none', color: '#4CAF50', fontWeight: 'bold', cursor: 'pointer' }}>
            UNDO
          </button>
        </div>
      )}
    </>
  );
}