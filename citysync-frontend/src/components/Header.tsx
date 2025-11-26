import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../api/api";
import type { Category } from "../types/types";
import "../styles/style_index.css";

export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth > 768;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [categoryStatuses, setCategoryStatuses] = useState<Record<number, boolean>>({});

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

          {categories.map((c) => {
            const isEnabled = categoryStatuses[c.id] || false;
            
            return (
            <li
              key={c.id}
                className={`nav-item drop-target ${!isEnabled ? 'disabled' : ''}`}
              data-category-id={c.id} 
                onDragOver={(e) => handleDragOver(e, c.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, c.id)}
            >
                <div className="nav-item-content">
                  <Link 
                    to={`/category/${c.slug}`} 
                    onClick={(e) => closeMenu(e)}
                    className={!isEnabled ? 'disabled-link' : ''}
                  >
                    {c.name}
                  </Link>
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
                  </label>
                </div>
            </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}