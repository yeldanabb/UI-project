// Author: Sevastianova Polina

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../api/api";
import type { Category } from "../types/types";
import "../styles/style_index.css";

interface CategoriesNavbarProps {
  // Optional callback functions triggered by user actions
  onCategoryHover?: (categoryId: number | null) => void; // when hovering over a category
  onCategoryClick?: (categoryId: number) => void; // when clicking a category
  onCategoryDrop?: (categoryId: number) => void; // when dropping an event onto a category
  selectedCategoryId?: number | null;  // ID of the currently selected category
  isCreatingEvent?: boolean;  // whether the user is creating an event
}

export default function CategoriesNavbar({ onCategoryHover, onCategoryClick, onCategoryDrop, selectedCategoryId, isCreatingEvent = false }: CategoriesNavbarProps) {
  // Local state storing fetched categories
  const [categories, setCategories] = useState<Category[]>([]);
  // Load categories once when the component mounts
  useEffect(() => {
    fetchCategories().then((res) => setCategories(res.data));
  }, []);

 // Handles mouse enter (hover)
  const handleMouseEnter = (categoryId: number) => {
    if (onCategoryHover) {
      onCategoryHover(categoryId);
    }
  };
  // Handles mouse leave — resets hover to null
  const handleMouseLeave = () => {
    if (onCategoryHover) {
      onCategoryHover(null);
    }
  };
  // Handles category click
  const handleClick = (categoryId: number) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };
  // Allows drag-over and visually highlights the category
  const handleDragOver = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };
  // Removes highlight when drag leaves the category area
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("drag-over");
  };
  // Handles dropping an event onto a category
  const handleDrop = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    
    const name = e.dataTransfer.getData("eventName"); // name of dragged event
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
           // If creating an event, do not navigate — only trigger callback
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

