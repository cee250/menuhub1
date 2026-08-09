'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, MessageSquare, Plus, X } from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  breakdown: Record<number, number>;
}

interface CustomerReviewsProps {
  businessId: string;
  themeColor?: string;
}

export default function CustomerReviews({ businessId, themeColor = '#2563eb' }: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?businessId=${businessId}&approvedOnly=true`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchReviews();
    }
  }, [businessId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) {
      setErrorMsg('Please enter your name and review.');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please agree that your review can be displayed publicly.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          customerName: formName,
          rating: formRating,
          comment: formComment,
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setFormName('');
        setFormComment('');
        setFormRating(5);
        setAgreed(false);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(false);
        }, 2500);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 mb-16 px-4 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
        {/* Header & Rating Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" style={{ color: themeColor }} />
              Customer Reviews
            </h2>
            <p className="text-sm text-gray-500 mt-1">Real experiences from verified visitors and customers</p>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100">
            <div className="text-3xl font-extrabold text-gray-900">{stats.averageRating}</div>
            <div>
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(stats.averageRating) ? 'fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Based on {stats.totalReviews} reviews</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="my-6 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            {stats.totalReviews === 0 ? 'Be the first to review!' : `${stats.totalReviews} public reviews`}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{ backgroundColor: themeColor }}
            className="text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Leave a Review
          </button>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No reviews yet for this business.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Leave a Review" above to share your experience!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50/70 p-5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{review.customerName}</span>
                    {review.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Verified Customer
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-amber-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">"{review.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {submitSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Review Submitted!</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Thank you for your feedback. Your review is pending approval by the restaurant.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">How was your experience?</h3>
                <p className="text-xs text-gray-500">Share your feedback to help others and improve service.</p>

                {errorMsg && (
                  <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Diane M."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': themeColor } as any}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rate your experience</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${star <= formRating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                    <span className="text-sm font-bold text-gray-700 ml-2">{formRating} / 5</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mmb-1">Your Review</label>
                  <textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={4}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                    style={{ '--tw-ring-color': themeColor } as any}
                    required
                  />
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="agree" className="text-xs text-gray-600 leading-normal">
                    I agree that my review can be displayed publicly on MenuHub.
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: themeColor }}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
