import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../api/api";
import type { Category } from "../types/types";
import "../styles/style_index.css"; 

export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(res => setCategories(res.data)).catch(()=>{});
  }, []);

  return (
    <header>
      <nav>
        <ul>
          <li><Link to="/">Main</Link></li>
          {categories.map(c => (
            <li key={c.id}><Link to={`/category/${c.slug}`}>{c.name}</Link></li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
