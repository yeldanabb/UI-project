import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchEvent, fetchEvents } from "../api/api";
import type { Event } from "../types/types";
import "../styles/festival_1.css";
import { ArrowLeft } from "lucide-react";

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export default function EventDetail(){
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ author: '', rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent(id)
        .then(res => {
          setEvent(res.data);
          
          const storedReviews = localStorage.getItem(`reviews_${id}`);
          if (storedReviews) {
            setReviews(JSON.parse(storedReviews));
          }
          
          if (res.data.category?.slug) {
            fetchEvents(res.data.category.slug)
              .then(eventsRes => {
                const recommended = eventsRes.data
                  .filter((e: Event) => e.id !== parseInt(id))
                  .slice(0, 4);
                setRecommendedEvents(recommended);
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [id]);

const navigate = useNavigate();
 

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.author.trim() || !newReview.comment.trim()) return;
    
    const review: Review = {
      id: Date.now().toString(),
      author: newReview.author,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toLocaleDateString()
    };
    
    const updatedReviews = [...reviews, review];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${id}`, JSON.stringify(updatedReviews));
    setNewReview({ author: '', rating: 5, comment: '' });
    setShowReviewForm(false);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  if (!event) return <div style={{padding:20}}>Loading...</div>;

  const imageUrl = event.image
    ? (event.image.startsWith("http") ? event.image : `${import.meta.env.VITE_API_BASE.replace('/api','')}${event.image}`)
    : "/images/cineklub.jpg";

  const contact = event.contact_info_details;

  return (
    <main>
      <section className="cine-banner">
        <img src={imageUrl} alt={event.title} />
        <div className="banner-overlay">
        <div className="back" onClick={()=>{navigate(-1)}}><div className="back-arrow"><ArrowLeft/></div><h1>{event.title}</h1></div>
          <h3 className="event-date">{event.date}</h3>
        </div>
      </section>

      <section className="cine-info">
        <p>{event.description}</p>
        <section className="cine-boxes">
          <div className="cine-box">
            <h3>Location</h3>
            <p>{event.location}</p>
          </div>
          <div className="cine-box">
            <h3>Admission</h3>
            <p>{event.admission}</p>
          </div>
          {contact && (
            <div className="cine-box">
              <h3>Contact Information</h3>
              <p>
                <strong>Address:</strong> {contact.address || "—"}
              </p>
              <p>
                <strong>Phone:</strong> {contact.phone || "—"}
              </p>
              <p>
                <strong>Email:</strong> {contact.email || "—"}
              </p>
            </div>
          )}
        </section>

        {event.external_links && (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <a
              href={event.external_links}
              target="_blank"
              rel="noopener noreferrer"
              className="more-info-btn"
            >
              More Info
            </a>
          </div>
        )}
      </section>

      <section className="reviews-section">
        <div className="reviews-header">
          <h2>Reviews</h2>
          <div className="rating-summary">
            <span className="average-rating">{averageRating}</span>
            <div className="stars-display">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= parseFloat(averageRating) ? 'star filled' : 'star'}>
                  ★
                </span>
              ))}
            </div>
            <span className="review-count">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
          </div>
          <button 
            className="add-review-btn"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? 'Cancel' : 'Add Review'}
          </button>
        </div>

        {showReviewForm && (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={newReview.author}
                onChange={(e) => setNewReview({...newReview, author: e.target.value})}
                required
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label>Rating</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= newReview.rating ? 'active' : ''}`}
                    onClick={() => setNewReview({...newReview, rating: star})}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Your Review</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                required
                rows={4}
                placeholder="Share your experience..."
              />
            </div>
            <button type="submit" className="submit-review-btn">Submit Review</button>
          </form>
        )}

        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-author">{review.author}</div>
                  <div className="review-date">{review.date}</div>
                </div>
                <div className="review-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= review.rating ? 'star filled' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
                <div className="review-comment">{review.comment}</div>
              </div>
            ))
          ) : (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to review this event!</p>
            </div>
          )}
        </div>
      </section>

      {recommendedEvents.length > 0 && (
        <section className="recommendations-section">
          <h2>Related Events</h2>
          <p className="recommendations-subtitle">You might also like these events</p>
          <div className="recommendations-carousel">
            {recommendedEvents.map((recEvent) => {
              const recImageUrl = recEvent.image
                ? (recEvent.image.startsWith("http") 
                    ? recEvent.image 
                    : `${import.meta.env.VITE_API_BASE.replace('/api','')}${recEvent.image}`)
                : "/images/festival2.jpg";
              
              return (
                <Link key={recEvent.id} to={`/events/${recEvent.id}`} className="recommendation-card">
                  <img src={recImageUrl} alt={recEvent.title} />
                  <div className="recommendation-content">
                    <h3>{recEvent.title}</h3>
                    <p className="rec-location">{recEvent.location}</p>
                    <p className="rec-date">{recEvent.date}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
