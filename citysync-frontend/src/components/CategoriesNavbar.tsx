import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../api/api";
import type { Category } from "../types/types";
import "../styles/style_index.css";

interface CategoriesNavbarProps {
  onCategoryHover?: (categoryId: number | null) => void;
  onCategoryClick?: (categoryId: number) => void;
  onCategoryDrop?: (categoryId: number) => void;
  selectedCategoryId?: number | null;
  isCreatingEvent?: boolean;
}

export default function CategoriesNavbar({ onCategoryHover, onCategoryClick, onCategoryDrop, selectedCategoryId, isCreatingEvent = false }: CategoriesNavbarProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then((res) => setCategories(res.data));
  }, []);

  const handleMouseEnter = (categoryId: number) => {
    if (onCategoryHover) {
      onCategoryHover(categoryId);
    }
  };

  const handleMouseLeave = () => {
    if (onCategoryHover) {
      onCategoryHover(null);
    }
  };

  const handleClick = (categoryId: number) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };

  const handleDragOver = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    
    const name = e.dataTransfer.getData("eventName");
    if (name && onCategoryDrop) {
      onCategoryDrop(categoryId);
    }
  };

  return (
    <nav className="categories-navbar">
      <div className="categories-navbar-container">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className={`category-nav-item drop-target ${selectedCategoryId === category.id ? 'selected' : ''}`}
            onMouseEnter={() => handleMouseEnter(category.id)}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
              if (isCreatingEvent && onCategoryClick) {
                e.preventDefault();
                handleClick(category.id);
              }
            }}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(e, category.id);
            }}
            data-category-id={category.id}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

