import { useState, useRef, useEffect } from "react";
import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import type { Event } from "../types/types";

// description what we should have
interface EventCardProps {
  ev: Event & { isFavorite?: boolean; isHidden?: boolean; viewsCount?: number };
  onUpdate?: (updatedEvent: Event) => Promise<void>; //promise - we wait from server confirmation
  onToggleFavorite?: (id: string | number) => void;
  onToggleHidden?: (id: string | number) => void;
  onIncrementViews?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
}
// use state - make some memory
//local - copy of event for local edits
//setLocal - function to update local state
//editingField - which field is being edited
//setEditingField - function to update editingField state
//saving - when data is being saved to server
//setSaving - function to update saving state
export default function EventCard({ ev, onUpdate, onToggleFavorite, onToggleHidden, onIncrementViews, onDelete }: EventCardProps) {
  const [local, setLocal] = useState({ ...ev }); //copy of event for local edits
  const [editingField, setEditingField] = useState<null | 'title' | 'description' | 'location' | 'date' | 'external_links'>(null); // which field is being edited
  const [saving, setSaving] = useState(false); // when data is being saved to server

  //useRefs for input fields(we can't see them until we click to edit)
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const locationRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const linkRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const persist = async (patch: Partial<Event> & { tags?: string[] }) => {
    setSaving(true);
    try {
      if (onUpdate) {
        const updated = { ...local, ...patch }; //make changes before server confirmation
        setLocal(updated);
        await onUpdate(updated); // wait for server confirmation
      }
    } catch (err) {
      console.error("Failed to save:", err);
      setLocal({ ...ev });
    } finally {
      setSaving(false);
    }
  };

  //save changes without button, when field loses focus
  const handleFieldBlur = (field: keyof Event, value: string) => {
    setEditingField(null);
    if ((ev as any)[field] !== value) {
      persist({ [field]: value });
    }
  };

  // Sync local state when ev prop changes, unless we're editing or saving
  useEffect(() => {
    if (!saving && !editingField) {
      setLocal({ ...ev });
    }
  }, [ev, saving, editingField]);

  // Focus the input when editingField changes
  useEffect(() => {
    const map: any = { title: titleRef, description: descRef, location: locationRef, date: dateRef, external_links: linkRef };
    map[editingField]?.current?.focus();
    if (editingField === 'title' || editingField === 'location') map[editingField]?.current?.select();
  }, [editingField]);

  //for invisible input styles
  const invisibleInputStyle: React.CSSProperties = { border: "none", background: "transparent", padding: 0, margin: 0, font: "inherit", color: "inherit", outline: "none", width: "100%", boxSizing: "border-box", lineHeight: "inherit" };

  //image upload handlers
  const handleImageClick = () => fileInputRef.current?.click();
  //when file is selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    //preview image immediately
    const url = URL.createObjectURL(f);
    setLocal(prev => ({ ...prev, image: url }));
    //read file as base64 to send to server
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setLocal(prev => ({ ...prev, image: base64 }));
      await persist({ image: base64 });
    };
    reader.readAsDataURL(f);
  };

  const img = local.image || "/images/exhibition.jpg";

  return (
    <article className="tile" style={{ cursor: 'pointer' }} onClick={() => onIncrementViews?.(local.id)}>
      <div className="tile-image-wrapper" style={{ position: 'relative' }}>
        <img src={img} alt={local.title} style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'cover' }} onClick={handleImageClick} />
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <div className="tile-category-badge">{local.category?.name}</div>
      </div>

      <div className="tile-content">
        {editingField === 'title' ? (
          <input ref={titleRef} value={local.title || ""} onChange={e => setLocal({ ...local, title: e.target.value })} onBlur={e => handleFieldBlur('title', e.target.value)} style={invisibleInputStyle} />
        ) : (
          <h3 onClick={() => setEditingField('title')} style={{ minHeight: '24px' }}>
            {local.title || "Without name"}
          </h3>
        )}

        {editingField === 'description' ? (
          <textarea ref={descRef} value={local.description || ""} onChange={e => setLocal({ ...local, description: e.target.value })} onBlur={e => handleFieldBlur('description', e.target.value)} rows={3} style={invisibleInputStyle} />
        ) : (
          <p onClick={() => setEditingField('description')} style={{ minHeight: '1.5em', cursor: 'pointer', color: local.description ? 'inherit' : '#999' }}>
            {local.description || "Add description..."}
          </p>
        )}

        <div className="tile-meta" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPinIcon width={14} />
            {editingField === 'location' ? (
              <input ref={locationRef} value={local.location || ""} onChange={e => setLocal({ ...local, location: e.target.value })} onBlur={e => handleFieldBlur('location', e.target.value)} style={invisibleInputStyle} />
            ) : (
              <span onClick={() => setEditingField('location')} style={{ minWidth: '50px', display: 'inline-block', cursor: 'pointer' }}>
                {local.location || "Set location"}
              </span>
            )}
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarIcon width={14} />
            {editingField === 'date' ? (
              <input ref={dateRef} type="date" value={local.date?.split("T")[0] || ""} onChange={e => setLocal({ ...local, date: e.target.value })} onBlur={e => handleFieldBlur('date', e.target.value)} style={invisibleInputStyle} />
            ) : (
              <span onClick={() => setEditingField('date')} style={{ minWidth: '50px', display: 'inline-block', cursor: 'pointer' }}>
                {local.date || "Set date"}
              </span>
            )}
          </span>
        </div>

        <div style={{ 
          marginTop: 'auto', 
          paddingTop: 10,
          display: 'flex', 
          gap: 8, 
          alignItems: 'center', 
          justifyContent: 'flex-start'
        }}>
          <button 
            type='button' 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(local.id); }} 
            style={{ 
              width: 32, 
              height: 32, 
              minWidth: 32, 
              border: '2px solid red', 
              borderRadius: 6, 
              background: local.isFavorite ? 'red' : 'transparent', 
              color: local.isFavorite ? 'white' : 'red', 
              fontSize: 18, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            {local.isFavorite ? '♥' : '♡'}
          </button>

          <button 
            type='button' 
            onClick={(e) => { e.stopPropagation(); onToggleHidden?.(local.id); }} 
            style={{ 
              height: 32, 
              padding: '0 10px', 
              border: '2px solid red', 
              borderRadius: 6, 
              background: local.isHidden ? 'red' : 'transparent', 
              color: local.isHidden ? 'white' : 'red', 
              fontWeight: 600, 
              fontSize: 12, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap' 
            }}
          >
            {local.isHidden ? 'Unhide' : 'Hide'}
          </button>
          <button 
          type='button' 
          onClick={(e) => { 
            e.stopPropagation(); 
            onDelete?.(local.id); 
          }} 
          style={{ 
            height: 32, 
            padding: '0 10px', 
            border: '2px solid black', 
            borderRadius: 6, 
            background: 'transparent', 
            color: 'black', 
            fontWeight: 600, 
            fontSize: 12, 
            cursor: 'pointer' 
          }}
        >
          Delete
        </button>
          <span style={{ 
            marginLeft: 'auto', 
            fontSize: 14, 
            color: '#666',
            whiteSpace: 'nowrap'
          }}>
            👁️ {local.viewsCount || 0}
          </span>
        </div>
      </div>
    </article>
  );
}