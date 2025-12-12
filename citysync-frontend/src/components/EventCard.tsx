import { useState, useRef, useEffect } from "react";
import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import type { Event } from "../types/types";

interface EventCardProps {
  ev: Event & { isFavorite?: boolean; isHidden?: boolean; tags?: string[]; isDraft?: boolean };
  onUpdate?: (updatedEvent: Event & { tags?: string[] }) => Promise<void> | void;
  onToggleFavorite?: (id: string | number) => void;
  onToggleHidden?: (id: string | number) => void;
}

export default function EventCard({ ev, onUpdate, onToggleFavorite, onToggleHidden }: EventCardProps) {
  const [local, setLocal] = useState<Event & { isFavorite?: boolean; isHidden?: boolean; tags?: string[] }>({ ...ev });
  const [editingField, setEditingField] = useState<null | 'title' | 'description' | 'location' | 'date' | 'external_links'>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(ev.image);

  const [localTags, setLocalTags] = useState<string[]>(ev.tags || []);
  const [newTag, setNewTag] = useState("");

  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const locationRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const linkRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { 
    setLocal({ ...ev }); 
    setImagePreview(ev.image); 
    setLocalTags(ev.tags || []); 
  }, [ev]);

  useEffect(() => {
    if (!editingField) return;
    const map: Record<string, any> = { title: titleRef, description: descRef, location: locationRef, date: dateRef, external_links: linkRef };
    map[editingField]?.current?.focus();
    if(editingField==='title'||editingField==='location') map[editingField]?.current?.select();
  }, [editingField]);

  const img = imagePreview || "/images/exhibition.jpg";
  const imageUrl = img.startsWith("http") ? img : img.startsWith("/") ? img : `${import.meta.env.VITE_API_BASE?.replace('/api','') || ''}${img}`;
  const stop = (e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); };

  const formatDate = (dateString="") => { try { return new Date(dateString).toLocaleDateString(undefined, {month:"short",day:"numeric",year:"numeric"}); } catch { return dateString; } };

  const persist = async (patch: Partial<Event> & { tags?: string[] }) => {
    setSaving(true); setError(null);
    const updated = { ...local, ...patch } as typeof local;
    if(!local.isDraft) {
      if(!updated.title?.trim()){ setError("Title is required"); setSaving(false); return; }
      if(!updated.location?.trim()){ setError("Location is required"); setSaving(false); return; }
      if(!updated.date?.trim()){ setError("Date is required"); setSaving(false); return; }
    }
    setLocal(updated);
    if(onUpdate){ 
      try { 
        const maybe = onUpdate(updated); 
        if(maybe && typeof(maybe as Promise<void>).then==="function"){ await maybe as Promise<void>; } 
      } catch(err:any){ console.error(err); setError(err?.message||"Failed to save"); setLocal({...ev}); } 
    }
    setSaving(false);
  };

  const handleFieldBlur = (field:keyof Event,value:string)=>{ setEditingField(null); if((ev as any)[field]!==value) persist({[field]:value}); };
  const handleKey = (e:React.KeyboardEvent,field:keyof Event)=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){ e.preventDefault(); (e.target as HTMLElement).blur(); } else if(e.key==="Escape"){ setLocal(prev=>({...prev,[field]:(ev as any)[field]} as Event)); setEditingField(null); } };
  const handleImageClick=(e:React.MouseEvent)=>{ e.stopPropagation(); fileInputRef.current?.click(); };
  const handleFileChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{ 
    e.stopPropagation(); 
    const f=e.target.files?.[0]; 
    if(!f) return; 
    const url=URL.createObjectURL(f); 
    setImagePreview(url); 
    const reader=new FileReader(); 
    reader.onload=async()=>{ 
      const base64=reader.result as string; 
      setLocal(prev=>({...prev,image:base64})); 
      await persist({...local,image:base64}); 
    }; 
    reader.readAsDataURL(f); 
  };

  const addTag = async ()=>{ 
    const t = newTag.trim(); 
    if(!t) return; 
    if(localTags.includes(t)) return; 
    const updatedTags=[...localTags,t]; 
    setLocalTags(updatedTags); 
    setNewTag("");   
    persist({ tags: updatedTags }); 
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = localTags.filter(t => t !== tagToRemove);
    setLocalTags(updatedTags);
    persist({ tags: updatedTags });
  };

  if(local.isHidden && !local.isDraft) return null;

  const invisibleInputStyle:React.CSSProperties={ border:"none",background:"transparent",padding:0,margin:0,font:"inherit",color:"inherit",outline:"none",width:"100%",boxSizing:"border-box",lineHeight:"inherit" };

  return (
    <article className="tile" role="article" aria-label={`Event ${local.title}`} style={{cursor:"default"}}>
      <div className="tile-image-wrapper" style={{position:"relative"}}>
        <img src={imageUrl} alt={local.title} style={{display:"block",width:"100%",height:"auto",objectFit:"cover"}} onClick={handleImageClick}/>
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileChange}/>
        <div className="tile-category-badge">{local.category?.name}</div>
      </div>

      <div className="tile-content">
        {editingField==='title'?<input ref={titleRef} value={local.title||""} onChange={e=>setLocal(prev=>({...prev,title:e.target.value}))} onBlur={e=>handleFieldBlur('title',e.target.value)} onKeyDown={e=>handleKey(e,'title')} style={{...invisibleInputStyle,fontWeight:600}} onClick={stop}/>:
        <h3 onClick={()=>setEditingField('title')} style={{cursor:"text",margin:0}}>{local.title}</h3>}

        {editingField==='description'?<textarea ref={descRef} value={local.description||""} onChange={e=>setLocal(prev=>({...prev,description:e.target.value}))} onBlur={e=>handleFieldBlur('description',e.target.value)} onKeyDown={e=>handleKey(e,'description')} rows={3} style={{...invisibleInputStyle,resize:"vertical"}} onClick={stop}/>:
        local.description&&<p onClick={()=>setEditingField('description')} style={{cursor:"text",marginTop:8}}>{local.description.substring(0,300)}</p>}

        <div className="tile-meta" style={{display:"flex",gap:12,alignItems:"center",marginTop:8}}>
          <span style={{display:"flex",alignItems:"center",gap:6}}>
            <MapPinIcon style={{width:14,height:14}}/>
            {editingField==='location'?<input ref={locationRef} value={local.location||""} onChange={e=>setLocal(prev=>({...prev,location:e.target.value}))} onBlur={e=>handleFieldBlur('location',e.target.value)} onKeyDown={e=>handleKey(e,'location')} style={invisibleInputStyle} onClick={stop}/>:
            <span onClick={()=>setEditingField('location')} style={{cursor:"text"}}>{local.location}</span>}
          </span>

          <span style={{display:"flex",alignItems:"center",gap:6}}>
            <CalendarIcon style={{width:14,height:14}}/>
            {editingField==='date'?<input ref={dateRef} type="date" value={local.date?.split("T")[0]||""} onChange={e=>setLocal(prev=>({...prev,date:e.target.value}))} onBlur={e=>handleFieldBlur('date',e.target.value)} onKeyDown={e=>handleKey(e,'date')} style={invisibleInputStyle} onClick={stop}/>:
            <span onClick={()=>setEditingField('date')} style={{cursor:"text"}}>{formatDate(local.date)}</span>}
          </span>
        </div>

        <div style={{marginTop:6}}>
          {editingField==='external_links'?<input ref={linkRef} value={local.external_links||""} onChange={e=>setLocal(prev=>({...prev,external_links:e.target.value}))} onBlur={e=>handleFieldBlur('external_links',e.target.value)} onKeyDown={e=>handleKey(e,'external_links')} style={invisibleInputStyle}/>:
          local.external_links&&<a href={local.external_links} target="_blank" rel="noopener noreferrer" onClick={stop} style={{color:"#0066cc",textDecoration:"underline",fontSize:14}}>Event Link</a>}
        </div>

        {/* TAGS */}
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {localTags.map(tag => (
            <span key={tag} style={{ background:"#eee", padding:"4px 8px", borderRadius:4, fontSize:12, display:"inline-flex", alignItems:"center", gap:4 }}>
              {tag}
              <span onClick={() => removeTag(tag)} style={{ cursor:"pointer", color:"#000", fontWeight:600, lineHeight:1 }}>✕</span>
            </span>
          ))}
          <input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTag()}
            placeholder="Add tag"
            style={{ border:"1px solid #ccc", borderRadius:4, padding:"2px 6px", fontSize:12, width:80 }}
          />
        </div>

        <div style={{marginTop:10,display:"flex",gap:8}} onClick={stop}>
          <button type="button" onClick={()=>onToggleFavorite?.(local.id)} title={local.isFavorite?"Remove favorite":"Mark favorite"} style={{width:32,height:32,border:"2px solid red",borderRadius:6,background:local.isFavorite?"red":"transparent",color:local.isFavorite?"white":"red",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>{local.isFavorite?"♥":"♡"}</button>
          <button type="button" onClick={()=>onToggleHidden?.(local.id)} title={local.isHidden?"Unhide event":"Hide event"} style={{width:32,height:32,border:"2px solid red",borderRadius:6,background:local.isHidden?"red":"transparent",color:local.isHidden?"white":"red",fontWeight:600,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>Hide</button>
        </div>
      </div>
    </article>
  );
}
