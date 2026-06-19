import React, { useState } from "react";
import { Star, MessageSquare, Flame, Shield, Check, Loader2, Award } from "lucide-react";
import { Review, BeautyService } from "../types";
import { DEFAULT_SERVICES } from "../services";

interface ReviewSectionProps {
  reviews: Review[];
  services: BeautyService[];
  onSubmitReview: (reviewData: Omit<Review, "id" | "date">) => void;
  currentUser: { uid: string; displayName?: string; email?: string } | null;
}

export default function ReviewSection({ reviews, services, onSubmitReview, currentUser }: ReviewSectionProps) {
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subMessage, setSubMessage] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || isSubmitting) return;

    if (!currentUser) {
      setSubMessage("⚠ You must sign in to leave a styling review.");
      return;
    }

    setIsSubmitting(true);
    setSubMessage("");

    await new Promise(resolve => setTimeout(resolve, 800));

    const srv = services.find(s => s.id === selectedServiceId) || services[0];

    onSubmitReview({
      serviceId: srv.id,
      serviceName: srv.name,
      userId: currentUser.uid,
      userName: currentUser.displayName || "Luxe Guest",
      rating,
      comment,
      photoUrl: photoUrl || undefined,
    });

    // Reset Form
    setComment("");
    setPhotoUrl("");
    setSubMessage("✓ Testimonial published! Thank you for sharing your beauty journey.");
    setIsSubmitting(false);

    setTimeout(() => setSubMessage(""), 4000);
  };

  return (
    <div id="ratings-and-reviews-section" className="space-y-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Testimonials Stream (READ) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div>
              <h4 className="font-serif text-xl font-medium tracking-wide text-zinc-900 dark:text-zinc-100">Guest Testimonials</h4>
              <p className="text-xs text-zinc-500">Unfiltered remarks shared by our verified elite salon guests.</p>
            </div>
            {/* Simple stats */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-amber-500" />
                <span className="font-bold text-base">4.9</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{reviews.length} Verified Reviews</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white/80 dark:bg-zinc-900 border border-natural-border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-semibold text-xs text-[#4A3F3B] dark:text-white">{r.userName}</h5>
                    <p className="text-[10px] text-natural-muted mt-0.5">Rating: <span className="font-bold text-natural-gold">{r.serviceName}</span> • Verified Guest</p>
                  </div>
                  {/* Star rating drawing */}
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed italic">
                  "{r.comment}"
                </p>

                {r.photoUrl && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800">
                    <img src={r.photoUrl} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-bold tracking-widest uppercase">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Verified Purchase Booking</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Review Sheet (WRITE / CREATE) */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-800/60 p-6 rounded-3xl border border-natural-border space-y-4">
            <div>
              <h4 className="font-serif text-lg font-medium text-[#4A3F3B] dark:text-zinc-100 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-natural-gold" />
                Share My Experience
              </h4>
              <p className="text-[11px] text-natural-muted mt-1">Provide feedback on our artists and services to claim extra points.</p>
            </div>

            {subMessage && (
              <div className={`p-3 rounded-lg text-xs leading-tight font-semibold sm:text-[11px] ${subMessage.startsWith("✓") ? "bg-emerald-50 text-emerald-800 font-bold" : "bg-red-50 text-red-800 border border-red-100"}`}>
                {subMessage}
              </div>
            )}

            {/* Select Treatment */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-zinc-600">Select Treatment Experienced</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-850 dark:text-zinc-150 outline-none"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Star Rating picker */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-zinc-600">Lounge Rating Score</label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const val = i + 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(val)}
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 focus:outline-none hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 stroke-amber-500 cursor-pointer ${
                          val <= (hoverRating ?? rating) ? "fill-amber-400 text-amber-500" : "text-gray-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attachment */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-zinc-600">Attach Glow Selfie Link (Optional)</label>
              <input
                type="url"
                placeholder="https://example.com/selfie.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>

            {/* Comment */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-zinc-600">Treatment Comment</label>
              <textarea
                required
                placeholder="Write your beautiful feedback..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-800 dark:text-zinc-150 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold tracking-widest text-[11px] uppercase py-3 rounded-xl transition-all cursor-pointer shadow disabled:opacity-50 border border-natural-gold/15"
            >
              {isSubmitting ? (
                <div className="flex justify-center items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Feedback...</span>
                </div>
              ) : (
                "Publish Review Testimonial"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
