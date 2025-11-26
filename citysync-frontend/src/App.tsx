import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import CategoryPage from "./pages/CategoryPage";
import EventDetail from "./pages/EventDetail";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";

function App() {
  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const preventDrag = (e: DragEvent) => {
      if (e.dataTransfer && e.dataTransfer.effectAllowed === 'copy') {
        e.preventDefault();
        return false;
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    const preventSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('selectstart', preventSelectStart);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventSelectStart);
    };
  }, []);

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
      <ChatBot />
    </>
  );
}

export default App;
