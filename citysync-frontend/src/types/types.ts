export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ContactInfo {
  id: number;
  address: string;
  phone: string;
  email: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  admission?: string;
  external_links?: string | null;
  category: Category;
  image?: string | null; 
  contact_info?: number | null; 
  contact_info_details?: ContactInfo | null;
  created_at?: string;
}
