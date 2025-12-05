import { useState, useRef, useEffect } from "react";
import { CalendarIcon, MapPinIcon, PencilIcon, CheckIcon, XMarkIcon, LinkIcon } from "@heroicons/react/24/outline";
import type { Event } from "../types/types";

interface EventCardProps {
  ev: Event;
  onUpdate?: (updatedEvent: Event) => void;
  editMode?: boolean;
}

export default function EventCard({ ev, onUpdate, editMode = false }: EventCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Event>({ ...ev });
  const [isHovered, setIsHovered] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const img = ev.image || "/images/exhibition.jpg"; 
  const imageUrl = img.startsWith("http") ? img : img.startsWith("/") ? img : `${import.meta.env.VITE_API_BASE?.replace('/api','') || 'http://127.0.0.1:8000'}${img}`;

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

  // Focus on title input when editing starts
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleEditClick = () => {
    if (editMode && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedEvent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedEvent({ ...ev });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleCardClick = () => {
    // If edit mode is ON and we're not already editing, start editing
    if (editMode && !isEditing) {
      setIsEditing(true);
      return;
    }
    
    // If edit mode is OFF and event has external link, navigate to it
    if (!editMode && ev.external_links && !isEditing) {
      window.open(ev.external_links, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFieldChange = (field: keyof Event, value: string) => {
    setEditedEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div 
      className={`tile ${isEditing ? 'editing' : ''} ${editMode && !isEditing ? 'edit-mode-active' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        cursor: (editMode && !isEditing) || (ev.external_links && !editMode && !isEditing) ? 'pointer' : 'default' 
      }}
    >
      <div className="tile-image-wrapper">
        <img src={imageUrl} alt={ev.title} />
        <div className="tile-category-badge">{ev.category.name}</div>
        
        {/* Edit mode indicator */}
        {editMode && !isEditing && isHovered && (
          <div className="edit-mode-hint">
            <PencilIcon style={{ width: '12px', height: '12px' }} />
            <span>Click to edit</span>
          </div>
        )}
        
        {/* Normal mode link indicator */}
        {!editMode && ev.external_links && isHovered && !isEditing && (
          <div className="link-mode-hint">
            <LinkIcon style={{ width: '12px', height: '12px' }} />
            <span>Click to visit</span>
          </div>
        )}
      </div>
      
      <div className="tile-content">
        {/* Title field - editable when in edit mode */}
        {isEditing ? (
          <div className="edit-field">
            <input
              ref={titleInputRef}
              type="text"
              value={editedEvent.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              onKeyDown={handleKeyDown}
              className="edit-title-input"
              placeholder="Event title"
            />
          </div>
        ) : (
          <h3>{ev.title}</h3>
        )}

        <div className="tile-meta">
          <span className="tile-location">
            <MapPinIcon style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} /> 
            {ev.location}
          </span>
          <span className="tile-date">
            <CalendarIcon style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} /> 
            {formatDate(ev.date)}
          </span>
        </div>

        {/* Description field - editable when in edit mode */}
        {isEditing ? (
          <div className="edit-field">
            <textarea
              ref={descriptionTextareaRef}
              value={editedEvent.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onKeyDown={handleKeyDown}
              className="edit-description-textarea"
              placeholder="Event description"
              rows={3}
            />
            
            {/* External link field */}
            <div className="edit-field">
              <input
                type="text"
                value={editedEvent.external_links || ''}
                onChange={(e) => handleFieldChange('external_links', e.target.value)}
                onKeyDown={handleKeyDown}
                className="edit-link-input"
                placeholder="External link (optional)"
              />
            </div>
          </div>
        ) : (
          <>
            {ev.description && (
              <p className="tile-description">
                {ev.description.substring(0, 120)}...
              </p>
            )}
            
            {/* Show link indicator if event has external link and we're not in edit mode */}
            {ev.external_links && !editMode && (
              <div className="external-link-indicator">
                🔗 {ev.external_links.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 40)}...
              </div>
            )}
          </>
        )}

        {/* Edit mode actions */}
        {isEditing && (
          <div className="edit-actions">
            <button 
              className="edit-save-button"
              onClick={handleSave}
              title="Save (Enter)"
            >
              <CheckIcon style={{ width: '16px', height: '16px' }} />
              Save
            </button>
            <button 
              className="edit-cancel-button"
              onClick={handleCancel}
              title="Cancel (Esc)"
            >
              <XMarkIcon style={{ width: '16px', height: '16px' }} />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}