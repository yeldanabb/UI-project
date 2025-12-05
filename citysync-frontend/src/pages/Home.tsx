// One of the authors: Balseit Yeldana
// Role: Inline event creation in Featured Events list
// Notes:
//   This file shows an editable draft event card as first item in Featured Events

import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import "../styles/style_index.css";
import { fetchEvents, createEvent, createContactInfo, fetchCategories } from "../api/api";
import type { Event, Category } from "../types/types";
import EventCard from "../components/EventCard";
import CategoriesNavbar from "../components/CategoriesNavbar";
import DraftEventCard from "../components/DraftEventCard";

// Draft event type
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
  contactInfo?: {
    address: string;
    phone: string;
    email: string;
  };
}

export default function Home() {
  // States
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false); // Add edit mode state
  
  // Draft event state - ALWAYS SHOW DRAFT IN FEATURED EVENTS
  const [draftEvent, setDraftEvent] = useState<DraftEvent>({
    id: `draft-${Date.now()}`,
    title: "",
    category: 1, // Default to first category
    categoryName: "",
    location: "",
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    description: "",
    admission: "",
    external_links: "",
    isDraft: true,
    imageFile: null,
    contactInfo: {
      address: "",
      phone: "",
      email: ""
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeField, setActiveField] = useState<'title' | 'location' | 'date' | 'description'>('title');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Fix: Use proper ref types that accept null
  const titleInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Starting to fetch data...");
        
        // Fetch events
        const eventsResponse = await fetchEvents();
        console.log("Events fetched:", eventsResponse.data);
        
        // Sort events by creation date (most recent first)
        const sortedEvents = [...eventsResponse.data].sort((a, b) => {
          // Use created_at if available, otherwise use id as fallback
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          // Fallback: sort by ID (assuming higher IDs are newer)
          return b.id - a.id;
        });
        
        setEvents(sortedEvents);
        
        // Fetch categories using the API function
        try {
          const categoriesResponse = await fetchCategories();
          console.log("Categories fetched successfully:", categoriesResponse.data);
          console.log("Number of categories:", categoriesResponse.data?.length);
          
          if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
            setCategories(categoriesResponse.data);
            
            // Set default category name if categories exist
            if (categoriesResponse.data.length > 0) {
              console.log("Setting default category to:", categoriesResponse.data[0]);
              setDraftEvent(prev => ({
                ...prev,
                category: categoriesResponse.data[0].id,
                categoryName: categoriesResponse.data[0].name
              }));
            } else {
              console.warn("Categories array is empty!");
              // Use fallback categories if empty
              useFallbackCategories();
            }
          } else {
            console.error("Invalid categories response structure:", categoriesResponse);
            useFallbackCategories();
          }
        } catch (categoriesError) {
          console.error("Error fetching categories via API:", categoriesError);
          console.error("Error details:", categoriesError);
          useFallbackCategories();
        }
        
      } catch (error) {
        console.error("Error loading data:", error);
        // Still use fallback categories on overall error
        useFallbackCategories();
      } finally {
        setIsLoading(false);
      }
    };

    // Fallback categories function
    const useFallbackCategories = () => {
      const fallbackCategories: Category[] = [
        { id: 1, name: "Sports", slug: "sports" },
        { id: 2, name: "Music", slug: "music" },
        { id: 3, name: "Art", slug: "art" },
        { id: 4, name: "Food", slug: "food" },
        { id: 5, name: "Tech", slug: "tech" },
      ];
      console.log("Using fallback categories:", fallbackCategories);
      setCategories(fallbackCategories);
      setDraftEvent(prev => ({
        ...prev,
        category: fallbackCategories[0].id,
        categoryName: fallbackCategories[0].name
      }));
    };

    loadData();
  }, []);

  // Focus on title input when component loads
  useEffect(() => {
    if (!isLoading && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isLoading]);

  // Handle draft updates
  const handleDraftUpdate = (updates: Partial<DraftEvent>) => {
    setDraftEvent({ ...draftEvent, ...updates });
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: KeyboardEvent, fieldName: string) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      
      // Simple navigation logic
      switch (fieldName) {
        case 'title':
          // Move to location field
          setActiveField('location');
          setTimeout(() => locationInputRef.current?.focus(), 10);
          break;
          
        case 'location':
          // Move to date field
          setActiveField('date');
          setTimeout(() => dateInputRef.current?.focus(), 10);
          break;
          
        case 'date':
          // Move to description field
          setActiveField('description');
          setTimeout(() => descriptionTextareaRef.current?.focus(), 10);
          break;
          
        case 'description':
          // In description field, Enter saves the event
          handleSaveDraft();
          break;
      }
    }
    
    // Ctrl+Enter to save from any field
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSaveDraft();
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!draftEvent.title.trim()) {
      setValidationError("Please enter a title");
      setActiveField('title');
      setTimeout(() => titleInputRef.current?.focus(), 10);
      return false;
    }
    if (!draftEvent.location.trim()) {
      setValidationError("Please enter a location");
      setActiveField('location');
      setTimeout(() => locationInputRef.current?.focus(), 10);
      return false;
    }
    if (!draftEvent.date.trim()) {
      setValidationError("Please select a date");
      setActiveField('date');
      setTimeout(() => dateInputRef.current?.focus(), 10);
      return false;
    }
    return true;
  };

  // Save draft as actual event
  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    
    // Validate required fields
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setValidationError(null);
    
    try {
      let contactInfoId = null;
      
      // Create contact info if provided
      const hasContactInfo = draftEvent.contactInfo && 
        (draftEvent.contactInfo.address || 
         draftEvent.contactInfo.phone || 
         draftEvent.contactInfo.email);
      
      if (hasContactInfo && draftEvent.contactInfo) {
        try {
          const contactResponse = await createContactInfo(draftEvent.contactInfo);
          contactInfoId = contactResponse.data.id;
        } catch (contactErr) {
          console.error("Failed to create contact info:", contactErr);
        }
      }

      // Prepare form data
      const fd = new FormData();
      fd.append("title", draftEvent.title);
      fd.append("category", draftEvent.category.toString());
      fd.append("location", draftEvent.location);
      fd.append("date", draftEvent.date);
      
      if (draftEvent.description) fd.append("description", draftEvent.description);
      if (draftEvent.admission) fd.append("admission", draftEvent.admission);
      if (draftEvent.external_links) fd.append("external_links", draftEvent.external_links);
      if (contactInfoId) fd.append("contact_info", contactInfoId.toString());
      
      // Handle image file
      if (draftEvent.imageFile) {
        fd.append("image", draftEvent.imageFile);
      }

      // Create event
      const response = await createEvent(fd);
      
      // Add the new event to the BEGINNING of the list (most recent first)
      setEvents(prev => {
        // Create new array with new event first, then existing events
        const newEvents = [response.data, ...prev];
        // Keep only the most recent events (first 5 after the new one will be shown)
        return newEvents;
      });
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Reset draft to empty
      setDraftEvent({
        id: `draft-${Date.now()}`,
        title: "",
        category: categories[0]?.id || 1,
        categoryName: categories[0]?.name || "",
        location: "",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: "",
        admission: "",
        external_links: "",
        isDraft: true,
        imageFile: null,
        contactInfo: {
          address: "",
          phone: "",
          email: ""
        }
      });
      
      // Reset to title field
      setActiveField('title');
      
      console.log("Event created successfully:", response.data);
      
      // Focus back on title input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      
    } catch (err: any) {
      console.error("Event creation failed:", err);
      const errorMessage = err.response?.data 
        ? JSON.stringify(err.response.data)
        : err.message || "Failed to create event.";
      setValidationError(`Failed to create event: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDraft = () => {
    setDraftEvent({
      id: `draft-${Date.now()}`,
      title: "",
      category: categories[0]?.id || 1,
      categoryName: categories[0]?.name || "",
      location: "",
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      description: "",
      admission: "",
      external_links: "",
      isDraft: true,
      imageFile: null,
      contactInfo: {
        address: "",
        phone: "",
        email: ""
      }
    });
    
    // Reset to title field
    setActiveField('title');
    
    // Clear validation error
    setValidationError(null);
    
    // Focus back on title input
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  // Handle event update
  const handleEventUpdate = async (updatedEvent: Event) => {
    try {
      // Update the event in the local state
      setEvents(prev => prev.map(ev => 
        ev.id === updatedEvent.id ? updatedEvent : ev
      ));
      
      console.log("Event updated locally:", updatedEvent);
      
      // TODO: Add API call to save changes to backend
      // Example:
      // const response = await updateEvent(updatedEvent.id, updatedEvent);
      // console.log("Event updated on server:", response.data);
      
    } catch (error) {
      console.error("Failed to update event:", error);
      // Optionally show error to user
    }
  };

  // Get LAST 5 created events (most recent first)
  const featuredEvents = events.slice(0, 5);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <>
      <CategoriesNavbar 
        onCategoryHover={() => {}} // Not used anymore
        onCategoryClick={() => {}} // Not used anymore
        onCategoryDrop={() => {}} // Not used anymore
        selectedCategoryId={null}
        isCreatingEvent={false}
      />

      {/* SMALLER BANNER - just title and description */}
      <div className="banner">
        <img src="./images/brnocity.jpeg" alt="City Banner" />
        <div className="banner-content">
          <h1>City Sync</h1>
          <p className="banner-description">Your local events hub - Discover and create events in your city</p>
        </div>
      </div>

      <main>
        <section className="home-content">
          <div className="section-header">
            <div className="header-row">
              <div>
                <h2>Featured Events</h2>
                <p>Discover the most recent events happening in your city</p>
              </div>
              
              <button 
                className={`edit-mode-toggle ${editMode ? 'active' : ''}`}
                onClick={() => setEditMode(!editMode)}
                title={editMode ? "Exit edit mode" : "Enable edit mode"}
              >
                {editMode ? (
                  <>
                    <span className="edit-icon">✏️</span>
                    Editing Mode • Click events to edit
                  </>
                ) : (
                  <>
                    <span className="edit-icon">✏️</span>
                    Enable Editing
                  </>
                )}
              </button>
            </div>
            
            {showSuccessMessage && (
              <div className="success-message">
                ✅ Event created successfully! Start typing to create another...
              </div>
            )}
          
          </div>
          
          <div className="tiles">
            {/* DRAFT EVENT CARD appears as first item (1st of 6) */}
            <DraftEventCard
              draft={draftEvent}
              onUpdate={handleDraftUpdate}
              onSave={handleSaveDraft}
              onCancel={handleCancelDraft}
              isSubmitting={isSubmitting}
              categories={categories}
              activeField={activeField}
              onKeyPress={handleKeyPress}
              validationError={validationError}
              // Pass refs - cast them to the expected type
              titleInputRef={titleInputRef as React.RefObject<HTMLInputElement | null>}
              locationInputRef={locationInputRef as React.RefObject<HTMLInputElement | null>}
              dateInputRef={dateInputRef as React.RefObject<HTMLInputElement | null>}
              descriptionTextareaRef={descriptionTextareaRef as React.RefObject<HTMLTextAreaElement | null>}
            />
            
            {/* Show LAST 5 featured events (most recent first) */}
            {featuredEvents.map((ev) => (
              <EventCard 
                key={ev.id} 
                ev={ev} 
                onUpdate={handleEventUpdate}
                editMode={editMode}
              />
            ))}
          </div>
          
          {/* Show if no events exist yet (except draft) */}
          {events.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h3>No existing events yet</h3>
              <p>Create the first event by typing in the form above!</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}