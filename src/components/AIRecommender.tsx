import React, { useState } from "react";
import { Sparkles, HelpCircle, Loader2, Heart, Calendar } from "lucide-react";
import { BeautyService } from "../types";
import { DEFAULT_SERVICES } from "../services";

interface AIRecommenderProps {
  onSelectService: (service: BeautyService) => void;
}

export default function AIRecommender({ onSelectService }: AIRecommenderProps) {
  const [skinType, setSkinType] = useState("combination");
  const [skinTone, setSkinTone] = useState("medium_warm");
  const [concerns, setConcerns] = useState("");
  const [preferences, setPreferences] = useState("natural_glow");
  
  const [result, setResult] = useState<string | null>(null);
  const [suggestedServices, setSuggestedServices] = useState<BeautyService[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const resp = await fetch("/api/ai/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinType,
          skinTone,
          concerns: concerns || "Gentle glow booster",
          preferences
        })
      });
      const data = await resp.json();
      setResult(data.recommendation);

      // Match suggested service ids (or default to skin care + bridal/party based on type)
      let matches: BeautyService[] = [];
      if (skinType === "dry" || concerns.toLowerCase().includes("hydration") || concerns.toLowerCase().includes("dry")) {
        matches = DEFAULT_SERVICES.filter(s => s.id === "skin_care_facial" || s.id === "luxury_spa_therapy");
      } else if (preferences === "bridal" || concerns.toLowerCase().includes("wedding")) {
        matches = DEFAULT_SERVICES.filter(s => s.id === "bridal_makeup" || s.id === "traditional_bridal_mehendi");
      } else {
        matches = DEFAULT_SERVICES.filter(s => s.id === "party_makeup" || s.id === "skin_care_facial" || s.id === "hair_styling");
      }
      setSuggestedServices(matches);
    } catch (err) {
      console.error(err);
      setResult("### Forgive Us, Something Went Awry.\nOur virtual beauty scanner is currently adjusting its lenses. Enjoy these recommended menu pairings: Organic Hydrating Facial or Bridal Paisley Mehendi! Our beauty artists will tailor the formula when you arrive.");
      setSuggestedServices([DEFAULT_SERVICES[3], DEFAULT_SERVICES[0]]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-recommender-card" className="bg-white/90 dark:bg-zinc-900 border border-amber-100 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-tr from-pink-500 to-amber-500 p-2.5 rounded-full text-white">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="font-serif text-2xl text-zinc-900 dark:text-amber-50 tracking-wide font-medium">AI Beauty Counselor</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-sans tracking-widest uppercase">Skin Tonality & Routine Advisor</p>
        </div>
      </div>

      <form onSubmit={handleGetRecommendation} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">My Skin Type</label>
          <select
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-100 outline-none focus:border-pink-300"
          >
            <option value="dry">Dry & Dehydrated (Requires hydration lock)</option>
            <option value="oily">Oily & Acne-prone (Requires matte oil-control)</option>
            <option value="combination">Combination Skin (Hybrid satin finish)</option>
            <option value="sensitive">Sensitive (Requires hypoallergenic soothing care)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">Skin Undertone</label>
          <select
            value={skinTone}
            onChange={(e) => setSkinTone(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-100 outline-none focus:border-pink-300"
          >
            <option value="cool_pink">Cool (Pink/Rosy Undertones, looks best in silver)</option>
            <option value="warm_gold">Warm (Golden/Peach Undertones, looks best in gold)</option>
            <option value="neutral_olive">Neutral / Olive (Balanced beige, versatile styling)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">Preferred Aesthetics</label>
          <select
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-100 outline-none focus:border-pink-300"
          >
            <option value="natural_glow">Satin Dewy Glow (Lightweight & luminous)</option>
            <option value="glamour_matte">High Definition Velvet Matte (Chic & glamorous)</option>
            <option value="bridal">Signature Royal Bridal (Couture jewel-rich contour)</option>
            <option value="sunwashed">Golden Shimmer (Sun-kissed bronze highlights)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">Skin Concerns / Wedding Themes</label>
          <input
            type="text"
            placeholder="e.g. redness, dark circles, hydration-need, summer outdoor wedding"
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-150 outline-none focus:border-pink-300"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 font-bold tracking-widest text-white text-xs uppercase px-6 py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.99] transition-all duration-300 cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running Skincare Scanner...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Consult My AI Counselor</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Recommendation Result Block */}
      {result && (
        <div id="ai-recommender-response" className="bg-amber-50/40 dark:bg-zinc-800/50 border border-amber-100 dark:border-zinc-700/60 rounded-2xl p-6 mb-6">
          <h4 className="font-serif text-lg text-amber-900 dark:text-amber-300 font-medium tracking-wide mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Luxe Recommendation Report
          </h4>
          <div className="text-zinc-800 dark:text-zinc-350 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans space-y-2">
            {result}
          </div>

          {/* Quick Recommendations Booking */}
          {suggestedServices.length > 0 && (
            <div className="mt-6 pt-6 border-t border-amber-200/50">
              <h5 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider mb-3">Matching Premium Menu Offerings</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestedServices.map((s) => (
                  <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center shadow-sm">
                    <div>
                      <h6 className="font-semibold text-xs text-zinc-900 dark:text-white">{s.name}</h6>
                      <p className="text-[11px] text-zinc-500 mt-1">{s.duration} • <span className="text-rose-500 font-bold">₹{s.discountPrice}</span></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectService(s)}
                      className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 hover:bg-rose-100 hover:text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200/50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trust Badge Disclaimer */}
      <div className="flex gap-2.5 items-start mt-2">
        <HelpCircle className="w-5 h-5 text-amber-500/80 shrink-0" />
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
          Our recommendation report utilizes Gemini 3.5 deep-learning beauty modeling. We sanitize skincare records and respect our guests' details. Formula customized on-site during checkout.
        </p>
      </div>
    </div>
  );
}
