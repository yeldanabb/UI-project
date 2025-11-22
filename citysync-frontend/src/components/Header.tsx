import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../api/api";
import type { Category } from "../types/types";
import "../styles/style_index.css";

export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then((res) => setCategories(res.data));
  }, []);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add("drag-over");
  }

  function handleDragLeave(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).classList.remove("drag-over");
  }

  function handleDrop(e: React.DragEvent, categoryId: number) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("drag-over");

    const name = e.dataTransfer.getData("eventName");
    if (!name) return;

    if ((window as any).completeDropToCategory) {
      (window as any).completeDropToCategory(categoryId);
    }
  }

  return (
    <header>
      <nav>
        <ul>
          <li className="nav-item">
            <Link to="/">Main</Link>
          </li>

          {categories.map((c) => (
            <li
              key={c.id}
              className="nav-item drop-target"
              data-category-id={c.id} 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, c.id)}
            >
              <Link to={`/category/${c.slug}`}>{c.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}