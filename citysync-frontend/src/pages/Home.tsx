import { useEffect, useState, useRef } from "react";
import { fetchEvents, fetchCategories, updateEvent } from "../api/api";
import type { Event, Category } from "../types/types";
import EventCard from "../components/EventCard";
import DraftEventCard from "../components/DraftEventCard";
import Map from "../components/Map";
import CategoriesNavbar from "../components/CategoriesNavbar";

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
  tags?: string[];
}

type LocalEvent = Event & { isFavorite?: boolean; isHidden?: boolean; tags?: string[] };

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
    tags: []
  });

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("asc");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsResponse = await fetchEvents();
        const sortedEvents = [...eventsResponse.data]
          .map(ev => ({ ...ev, isFavorite: false, isHidden: false, tags: ev.tags || [] }))
          .sort((a, b) => b.id - a.id);
        setEvents(sortedEvents);

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
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDraftUpdate = (updates: Partial<DraftEvent>) => {
    setDraftEvent(prev => ({ ...prev, ...updates }));
  };

  const handleAddDraft = async () => {
    if (!draftEvent.title || !draftEvent.location || !draftEvent.date) return;

    const newEvent: Event & { tags?: string[] } = {
      id: Date.now(),
      title: draftEvent.title,
      category: { id: draftEvent.category, name: draftEvent.categoryName || "" },
      location: draftEvent.location,
      date: draftEvent.date,
      description: draftEvent.description,
      admission: draftEvent.admission,
      external_links: draftEvent.external_links,
      image: draftEvent.imageFile ? URL.createObjectURL(draftEvent.imageFile) : "",
      tags: draftEvent.tags || []
    };

    setEvents(prev => [newEvent, ...prev]);

    setDraftEvent({
      ...draftEvent,
      id: `draft-${Date.now()}`,
      title: "",
      location: "",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      description: "",
      admission: "",
      external_links: "",
      imageFile: null,
      tags: []
    });
  };

  const toggleFavorite = (id: number | string) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isFavorite: !ev.isFavorite } : ev));
  };

  const toggleHidden = (id: number | string) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isHidden: !ev.isHidden } : ev));
  };

  const hidePastEvents = () => {
    const today = new Date();
    setEvents(prev => prev.map(ev => new Date(ev.date) < today ? { ...ev, isHidden: true } : ev));
  };

  if (isLoading) return <div>Loading...</div>;

  // **Фільтрація подій**
  const filteredEvents = events
    .filter(ev => !ev.isHidden)
    .filter(ev => selectedCategory ? ev.category?.id === selectedCategory : true)
    .filter(ev => showOnlyFavorites ? ev.isFavorite : true)
    .filter(ev => {
      if (!tagSearch.trim()) return true;
      // Шукаємо тег по введеному тексту
      return ev.tags?.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()));
    })
    .sort((a, b) => {
      if (sortOrder === "none") return 0;
      return sortOrder === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    });

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

      {/* FILTERS */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        margin: "16px 0",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}>
        <button onClick={hidePastEvents} style={{background:"red", color:"white", border:"none", padding:"8px 16px", borderRadius:6, cursor:"pointer", fontWeight:600}}>Hide Past Events</button>

        <select value={selectedCategory ?? ""} onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
          style={{ padding:"8px 10px", borderRadius:6, border:"1px solid #ccc", fontSize:14, cursor:"pointer", minWidth:140 }}>
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>

        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as "asc" | "desc" | "none")}
          style={{ padding:"8px 10px", borderRadius:6, border:"1px solid #ccc", fontSize:14, cursor:"pointer", minWidth:140 }}>
          <option value="none">No date sorting</option>
          <option value="asc">Date: Earliest First</option>
          <option value="desc">Date: Latest First</option>
        </select>

        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, cursor:"pointer" }}>
          <input type="checkbox" checked={showOnlyFavorites} onChange={() => setShowOnlyFavorites(prev => !prev)} style={{width:16,height:16}} />
          Favorites Only
        </label>

      </div>

      {/* EVENTS + DRAFT */}
      <div className="tiles" style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"flex-start" }}>
        <DraftEventCard
          draft={draftEvent}
          onUpdate={handleDraftUpdate}
          onSave={handleAddDraft}
          categories={categories}
          titleInputRef={titleInputRef}
          locationInputRef={locationInputRef}
          dateInputRef={dateInputRef}
          descriptionTextareaRef={descriptionTextareaRef}
          style={{ flex: "0 0 320px" }}
        />

        {filteredEvents.map(ev => (
          <div key={ev.id} style={{ flex: "0 0 320px" }}>
            <EventCard
              ev={ev}
              onUpdate={updateEvent}
              onToggleFavorite={toggleFavorite}
              onToggleHidden={toggleHidden}
            />
          </div>
        ))}
      </div>

      {/* MAP */}
      <section className="home-content" style={{ marginTop: 32 }}>
        <h2>Map of events</h2>
        <Map events={filteredEvents} />
      </section>
    </>
  );
}
