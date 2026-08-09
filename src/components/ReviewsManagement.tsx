'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2, MessageSquare, ThumbsUp, ShieldCheck } from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
}

export default function ReviewsManagement({ businessId, themeColor = '#2563eb' }: { businessId: string; themeColor?: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?businessId=${businessId}&approvedOnly=false`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchReviews();
    }
  }, [businessId]);

  const handleUpdateStatus = async (reviewId: string, isApproved: boolean) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, isApproved }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, isApproved } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update review status', err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action: 'delete' }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  const totalReviews = reviews.length;
  const approvedReviews = reviews.filter(r => r.isApproved);
  const avgRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" style={{ color: themeColor }} />
            Customer Reviews Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage, approve, or hide customer reviews before they appear on your digital menu.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
          <div>
            <span className="text-xs text-gray-500 block">Avg Rating</span>
            <span className="text-lg font-extrabold text-gray-900 flex items-center gap-1">
              {avgRating} <Star className="w-4 h-4 text-amber-400 fill-current" />
            </span>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div>
            <span className="text-xs text-gray-500 block">Total Reviews</span>
            <span className="text-lg font-extrabold text-gray-900">{totalReviews}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Pending Approval ({reviews.filter(r => !r.isApproved).length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Approved ({reviews.filter(r => r.isApproved).length})
        </button>
      </div>

      {/* Reviews Table / List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No reviews found in this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`p-5 rounded-2xl border transition-all ${
                review.isApproved ? 'bg-white border-gray-100' : 'bg-amber-50/40 border-amber-200/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {review.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      {review.customerName}
                      {review.isVerified && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-gray-700 ml-1.5">{review.rating}.0</span>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      review.isApproved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {review.isApproved ? 'Public' : 'Pending'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                "{review.comment}"
              </p>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                {review.isApproved ? (
                  <button
                    onClick={() => handleUpdateStatus(review.id, false)}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-gray-500" /> Hide from Menu
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(review.id, true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve & Publish
                  </button>
                )}

                <button
                  onClick={() => handleDeleteReview(review.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
