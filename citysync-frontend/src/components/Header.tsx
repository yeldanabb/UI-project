// One of the authors: Orynbassar Abylaikhan (xorynba00)
// Notes: There was a suggested idea of creating a filter where you can choose one or more categories,
//        so you will be redirected to new page, which will consist all of the events of those categories
//        Interesting detail: initially, even selecting a single category triggered the multi-category URL,
//        causing a mismatch between the navigation bar url and the filter’s url state.
//        This was later fixed so that selecting one category redirects to its proper category page,
//        while selecting multiple categories uses the combined category url.

import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { fetchCategories } from "../api/api";
import type { Category } from "../types/types";
import "../styles/style_index.css";

export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth > 768;
  });
  const [isMobile, setIsMobile] = useState(false);
  // Tracks which categories are selected (checkbox states)
  const [categoryStatuses, setCategoryStatuses] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCategories().then((res) => setCategories(res.data));
    
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Synchronizes selected checkboxes with the URL
  useEffect(() => {
    // Checks if we are on a single-category page: /category/:slug
    const categoryMatch = location.pathname.match(/^\/category\/([^/]+)$/);
    
    if (categoryMatch) {
      const categorySlug = categoryMatch[1];
      const category = categories.find(c => c.slug === categorySlug);
      
      if (category) {
        // When ONE category is selected, ONLY that category should be active
        const newStatuses: Record<number, boolean> = {};
        newStatuses[category.id] = true;
        setCategoryStatuses(newStatuses);
      }
    } else {
      // If not on category page, reset unless on multi-category selection page
      if (!location.pathname.startsWith('/selected-categories')) {
        setCategoryStatuses({});
      }
    }
  }, [location.pathname, categories]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-is-open');
    } else {
      document.body.classList.remove('menu-is-open');
    }
    
    return () => {
      document.body.classList.remove('menu-is-open');
    };
  }, [isMenuOpen]);

  function handleDragOver(e: React.DragEvent, categoryId: number) {
    const isEnabled = categoryStatuses[categoryId];
    if (!isEnabled) {
      return;
    }
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add("drag-over");
  }

  function handleDragLeave(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).classList.remove("drag-over");
  }

  function handleDrop(e: React.DragEvent, categoryId: number) {
    const isEnabled = categoryStatuses[categoryId];
    if (!isEnabled) {
      return;
    }
    
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("drag-over");

    const name = e.dataTransfer.getData("eventName");
    if (!name) return;

    if ((window as any).completeDropToCategory) {
      (window as any).completeDropToCategory(categoryId);
    }
    
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      console.log(`Event "${name}" assigned to category: ${category.name}`);
    }
  }

  const handleStatusChange = (categoryId: number, checked: boolean) => {
    setCategoryStatuses(prev => ({
      ...prev,
      [categoryId]: checked
    }));
  };

  const toggleMenu = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    const hasModal = document.querySelector('.modal-overlay') || document.querySelector('.popup-overlay');
    if (!hasModal) {
    setIsMenuOpen(false);
    }
  };

  const handleShowClick = () => {
    const selectedCategoryIds = Object.keys(categoryStatuses)
      .filter(key => categoryStatuses[Number(key)])
      .map(key => Number(key));
    
    if (selectedCategoryIds.length > 0) {
      // Single category → redirect to /category/:slug
      if (selectedCategoryIds.length === 1) {
        const category = categories.find(c => c.id === selectedCategoryIds[0]);
        if (category) {
          navigate(`/category/${category.slug}`);
          setIsMenuOpen(false);
          return;
        }
      }
      
      // Multiple categories → redirect to /selected-categories?categories=
      const selectedSlugs = categories
        .filter(c => selectedCategoryIds.includes(c.id))
        .map(c => c.slug)
        .join(',');
      
      navigate(`/selected-categories?categories=${selectedSlugs}`);
      setIsMenuOpen(false);
    }
  };


  return (
    <header>
      <div 
        className={`burger-menu-container ${isMenuOpen || !isMobile ? 'visible' : ''}`}
      >
        <button 
          className={`burger-button ${isMenuOpen ? 'close' : ''}`}
          onClick={(e) => toggleMenu(e)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <span className={`burger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`burger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`burger-line ${isMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>
      
      {isMenuOpen && (
        <div 
          className="nav-overlay" 
          onClick={(e) => {
            if (!document.body.classList.contains('has-drag-box') && 
                !document.querySelector('.modal-overlay') && 
                !document.querySelector('.popup-overlay')) {
              closeMenu(e);
            }
          }}
          onTouchStart={(e) => {
            if (!document.body.classList.contains('has-drag-box') && 
                !document.querySelector('.modal-overlay') && 
                !document.querySelector('.popup-overlay')) {
              closeMenu(e);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        ></div>
      )}
      
      <nav 
        className={`main-nav ${isMenuOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="nav-list">
          <li className="nav-item">
            <Link to="/" onClick={(e) => closeMenu(e)}>Main</Link>
          </li>

          <li className="nav-item nav-filter-container">
            <div className="nav-filter-label">Select Categories:</div>
            <div className="nav-filter-checkboxes">
              {categories.map((c) => {
                const isEnabled = categoryStatuses[c.id] || false;
                
                return (
                  <div
                    key={c.id}
                    className={`nav-item drop-target ${!isEnabled ? 'disabled' : ''}`}
                    data-category-id={c.id} 
                    onDragOver={(e) => handleDragOver(e, c.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, c.id)}
                  >
                    <label 
                      className="category-checkbox-label"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="category-status-checkbox"
                        checked={isEnabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(c.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                      <span>{c.name}</span>
                    </label>
                  </div>
                );
              })}
            </div>
            <button 
              className="show-categories-button"
              onClick={handleShowClick}
              disabled={Object.values(categoryStatuses).filter(Boolean).length === 0}
            >
              Apply
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}