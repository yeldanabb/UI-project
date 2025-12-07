import { useState, useEffect, useRef, type KeyboardEvent, forwardRef } from "react";
import { CalendarIcon, MapPinIcon, ChevronDownIcon, LinkIcon } from "@heroicons/react/24/outline"; // Added LinkIcon
import type { Category } from "../types/types";
import "../styles/style_index.css";

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

interface DraftEventCardProps {
  draft: DraftEvent;
  onUpdate: (updates: Partial<DraftEvent>) => void;
  onSave: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  categories: Category[];
  activeField?: string | null;
  onKeyPress?: (e: KeyboardEvent, fieldName: string) => void;
  validationError?: string | null;
  titleInputRef?: React.RefObject<HTMLInputElement | null>;
  locationInputRef?: React.RefObject<HTMLInputElement | null>;
  dateInputRef?: React.RefObject<HTMLInputElement | null>;
  descriptionTextareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const DraftEventCard = forwardRef<HTMLDivElement, DraftEventCardProps>(({
  draft,
  onUpdate,
  onSave,
  onCancel,
  isSubmitting,
  categories,
  activeField,
  onKeyPress,
  validationError,
  titleInputRef,
  locationInputRef,
  dateInputRef,
  descriptionTextareaRef
}, ref) => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const internalTitleRef = useRef<HTMLInputElement>(null);
  const internalLocationRef = useRef<HTMLInputElement>(null);
  const internalDateRef = useRef<HTMLInputElement>(null);
  const internalDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const internalLinkRef = useRef<HTMLInputElement>(null); // Added link ref
  
  const titleRef = titleInputRef || internalTitleRef;
  const locationRef = locationInputRef || internalLocationRef;
  const dateRef = dateInputRef || internalDateRef;
  const descriptionRef = descriptionTextareaRef || internalDescriptionRef;
  const linkRef = internalLinkRef; // Link ref doesn't come from props
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFieldChange = (field: keyof Omit<DraftEvent, 'imageFile' | 'contactInfo'>, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onUpdate({ imageFile: file });
    }
  };

  const handleCategorySelect = (categoryId: number, categoryName: string) => {
    onUpdate({ 
      category: categoryId,
      categoryName: categoryName 
    });
    setShowCategoryDropdown(false);
  };

  const getCategoryName = () => {
    if (draft.categoryName) return draft.categoryName;
    const foundCategory = categories.find(c => c.id === draft.category);
    return foundCategory?.name || `Category ${draft.category}`;
  };

  const isFormValid = draft.title.trim() !== "" && 
                      draft.location.trim() !== "" && 
                      draft.date.trim() !== "";

  const handleFieldKeyPress = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, fieldName: string) => {
    if (onKeyPress) {
      onKeyPress(e, fieldName);
    }
  };

  return (
    <div className="tile draft-tile" ref={ref}>
      <div 
        className="tile-image-wrapper draft-image-wrapper"
        onClick={() => document.getElementById('draft-image-upload')?.click()}
      >
        <div className="draft-image-preview">
          {draft.imageFile ? (
            <img src={URL.createObjectURL(draft.imageFile)} alt="Preview" />
          ) : (
            <div className="draft-image-placeholder">
              <span className="upload-hint">📷 Click to add image</span>
              <span className="upload-subhint">(Optional)</span>
            </div>
          )}
        </div>
        
        <div ref={dropdownRef} className="draft-category-wrapper">
          <div 
            className={`tile-category-badge draft-category-badge ${showCategoryDropdown ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowCategoryDropdown(!showCategoryDropdown);
            }}
          >
            <span>{getCategoryName()}</span>
            <ChevronDownIcon className="category-dropdown-icon" />
          </div>
          
          {showCategoryDropdown && categories.length > 0 && (
            <div className="category-dropdown-menu">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="category-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategorySelect(category.id, category.name);
                  }}
                >
                  {category.name}
                </div>
              ))}
            </div>
          )}

          {showCategoryDropdown && categories.length === 0 && (
            <div className="category-dropdown-menu">
              <div className="category-dropdown-item category-dropdown-empty">
                No categories available
              </div>
            </div>
          )}
        </div>
        
        <input
          id="draft-image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="draft-file-input"
        />
      </div>

      <div className="tile-content draft-tile-content">
        <div className={`draft-field-group ${activeField === 'title' ? 'active' : ''}`}>
          <input
            ref={titleRef as React.RefObject<HTMLInputElement>}
            className="draft-title-input"
            type="text"
            value={draft.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            onKeyDown={(e) => handleFieldKeyPress(e, 'title')}
            placeholder="Event title *"
            disabled={isSubmitting}
          />
        </div>

        <div className="tile-meta draft-tile-meta">
          <div className={`draft-field-group ${activeField === 'location' ? 'active' : ''}`}>
            <div className="tile-location draft-location-input">
              <MapPinIcon />
              <input
                ref={locationRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={draft.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                onKeyDown={(e) => handleFieldKeyPress(e, 'location')}
                placeholder="Location *"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className={`draft-field-group ${activeField === 'date' ? 'active' : ''}`}>
            <div className="tile-date draft-date-input">
              <CalendarIcon />
              <input
                ref={dateRef as React.RefObject<HTMLInputElement>}
                type="date"
                value={draft.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                onKeyDown={(e) => handleFieldKeyPress(e, 'date')}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="draft-field-group">
          <textarea
            ref={descriptionRef as React.RefObject<HTMLTextAreaElement>}
            className="tile-description draft-description-textarea"
            value={draft.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            onKeyDown={(e) => handleFieldKeyPress(e, 'description')}
            placeholder="Describe your event (Optional)..."
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        {/* Added external link field */}
        <div className="draft-field-group">
          <div className="tile-link draft-link-input">
            <LinkIcon />
            <input
              ref={linkRef}
              type="text"
              value={draft.external_links}
              onChange={(e) => handleFieldChange('external_links', e.target.value)}
              onKeyDown={(e) => handleFieldKeyPress(e, 'link')}
              placeholder="Event website link (Optional)..."
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="draft-status">
          {isSubmitting ? (
            <div className="submitting-status">
              <div className="spinner"></div>
              <span>Creating event...</span>
            </div>
          ) : isFormValid ? (
            <div className="ready-status">
              <span className="ready-icon">✓</span>
              <span>All required fields filled • Press Enter in description or Ctrl+Enter to save</span>
            </div>
          ) : (
            <div className="incomplete-status">
              <span className="incomplete-icon">!</span>
              <span>Fill required fields (*) to save event</span>
            </div>
          )}
        </div>

        {validationError && (
          <div className="draft-validation-error">
            ⚠️ {validationError}
          </div>
        )}

        <div className="draft-action-buttons">
          <button
            className="draft-cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
            type="button"
          >
            Clear
          </button>
          
          <button
            className="draft-save-button"
            onClick={onSave}
            disabled={isSubmitting || !isFormValid}
            type="button"
          >
            {isSubmitting ? 'Creating...' : 'Save Event'}
          </button>
        </div>
      </div>
    </div>
  );
});

DraftEventCard.displayName = 'DraftEventCard';

export default DraftEventCard;